/**
 * Security & OWASP Controls Module
 * Implements SSRF protection, input validation, rate limiting, audit logging,
 * and external content sanitization.
 */

import { URL } from 'url';

// Allowed external host domains for provider lookups
const ALLOWED_OUTBOUND_DOMAINS = new Set([
  'data.brreg.no',
  'registry.npmjs.org',
  'pypi.org',
  'itunes.apple.com',
  'api.github.com',
  'cloudflare-dns.com',
  'dns.google',
  'api.duckduckgo.com',
  'html.duckduckgo.com',
  'euipo.europa.eu',
  'branddb.wipo.int',
  'tsdrapi.uspto.gov',
  'rdap.org',
  'rdap.verisign.com',
]);

// Blocked private and internal IP ranges
const BLOCKED_IP_PATTERNS = [
  /^127\./,                 // Loopback
  /^10\./,                  // Class A private
  /^172\.(1[6-9]|2[0-9]|3[0-1])\./, // Class B private
  /^192\.168\./,            // Class C private
  /^169\.254\./,            // Link-local / Cloud metadata (AWS, GCP)
  /^0\./,                   // Current network
  /^fc00:/i,                // IPv6 ULA
  /^fe80:/i,                // IPv6 Link-local
  /^::1$/,                  // IPv6 Loopback
  /^localhost$/i,
];

/**
 * Validates outgoing URLs to strictly prevent SSRF attacks.
 */
export function validateOutboundUrl(rawUrl: string): { isValid: boolean; error?: string } {
  try {
    const parsed = new URL(rawUrl);

    // Only allow HTTP/HTTPS
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return { isValid: false, error: `Disallowed protocol: ${parsed.protocol}` };
    }

    const hostname = parsed.hostname.toLowerCase();

    // Check for IP literal or localhost
    for (const pattern of BLOCKED_IP_PATTERNS) {
      if (pattern.test(hostname)) {
        return { isValid: false, error: `Blocked private or internal host: ${hostname}` };
      }
    }

    // Check against allowed domains or subdomains
    const isAllowed = Array.from(ALLOWED_OUTBOUND_DOMAINS).some(
      domain => hostname === domain || hostname.endsWith(`.${domain}`)
    );

    if (!isAllowed) {
      return { isValid: false, error: `Host '${hostname}' is not in the outbound allowlist` };
    }

    return { isValid: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Invalid URL format';
    return { isValid: false, error: message };
  }
}

/**
 * Validates candidate name input (length, character sets, no control characters).
 */
export function validateCandidateName(name: string): { isValid: boolean; sanitized: string; error?: string } {
  if (!name || typeof name !== 'string') {
    return { isValid: false, sanitized: '', error: 'Name must be a non-empty string' };
  }

  const trimmed = name.trim();
  if (trimmed.length < 2) {
    return { isValid: false, sanitized: '', error: 'Name must be at least 2 characters' };
  }
  if (trimmed.length > 50) {
    return { isValid: false, sanitized: '', error: 'Name must not exceed 50 characters' };
  }

  // Prevent null bytes or control characters
  if (/[\x00-\x1F\x7F]/.test(trimmed)) {
    return { isValid: false, sanitized: '', error: 'Name contains invalid control characters' };
  }

  // Allow letters, numbers, spaces, hyphens, and apostrophes
  const sanitized = trimmed.replace(/[^\p{L}\p{N}\s'-]/gu, '').replace(/\s+/g, ' ');

  if (!sanitized) {
    return { isValid: false, sanitized: '', error: 'Name contains no valid characters' };
  }

  return { isValid: true, sanitized };
}

/**
 * Sanitizes external HTML / text to prevent XSS injection when storing or displaying
 */
export function sanitizeExternalText(text: string, maxLength = 1000): string {
  if (!text || typeof text !== 'string') return '';
  return text
    .replace(/<[^>]*>/g, '') // Strip HTML tags
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Strip control chars
    .trim()
    .slice(0, maxLength);
}

/**
 * In-memory sliding-window rate limiter
 */
class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private maxRequests: number;
  private windowMs: number;

  constructor(maxRequests = 60, windowMs = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  public check(identifier: string): { allowed: boolean; remaining: number; resetMs: number } {
    const now = Date.now();
    const timestamps = this.requests.get(identifier) || [];

    // Filter out expired timestamps
    const active = timestamps.filter(t => now - t < this.windowMs);

    if (active.length >= this.maxRequests) {
      const oldest = active[0];
      const resetMs = this.windowMs - (now - oldest);
      return { allowed: false, remaining: 0, resetMs };
    }

    active.push(now);
    this.requests.set(identifier, active);

    return {
      allowed: true,
      remaining: this.maxRequests - active.length,
      resetMs: this.windowMs,
    };
  }

  public cleanup(): void {
    const now = Date.now();
    for (const [id, timestamps] of this.requests.entries()) {
      const active = timestamps.filter(t => now - t < this.windowMs);
      if (active.length === 0) {
        this.requests.delete(id);
      } else {
        this.requests.set(id, active);
      }
    }
  }
}

export const apiRateLimiter = new RateLimiter(120, 60000); // 120 reqs / min
export const verificationRateLimiter = new RateLimiter(30, 60000); // 30 deep verifications / min

// Run cleanup every 5 minutes
const cleanupTimer = setInterval(() => {
  apiRateLimiter.cleanup();
  verificationRateLimiter.cleanup();
}, 300000);
if (typeof cleanupTimer.unref === 'function') {
  cleanupTimer.unref();
}

/**
 * Format safe API errors (never leak stack traces or internal secrets)
 */
export function formatSafeError(err: unknown): { error: string; code: string } {
  if (err instanceof Error) {
    // Whitelist specific expected business errors
    const safePrefixes = ['Validation', 'Rate limit', 'Not found', 'Budget exceeded', 'Invalid'];
    const isSafe = safePrefixes.some(p => err.message.startsWith(p));
    return {
      error: isSafe ? err.message : 'An internal processing error occurred while verifying the candidate.',
      code: isSafe ? 'CLIENT_ERROR' : 'INTERNAL_ERROR',
    };
  }
  return {
    error: 'An unexpected system error occurred.',
    code: 'UNKNOWN_ERROR',
  };
}
