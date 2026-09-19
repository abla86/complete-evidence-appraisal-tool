import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  validateOutboundUrl,
  validateCandidateName,
  formatSafeError,
  apiRateLimiter,
} from '../../server/security/index.js';

describe('Security & OWASP Controls Tests', () => {
  it('allows approved outbound registry domains', () => {
    assert.equal(validateOutboundUrl('https://data.brreg.no/enhetsregisteret/api/enheter').isValid, true);
    assert.equal(validateOutboundUrl('https://cloudflare-dns.com/dns-query').isValid, true);
    assert.equal(validateOutboundUrl('https://registry.npmjs.org/express').isValid, true);
    assert.equal(validateOutboundUrl('https://itunes.apple.com/search').isValid, true);
    assert.equal(validateOutboundUrl('https://branddb.wipo.int/en/similarname/search').isValid, true);
  });

  it('blocks SSRF attempts to private or local loopback IPs', () => {
    assert.equal(validateOutboundUrl('http://127.0.0.1:8080/admin').isValid, false);
    assert.equal(validateOutboundUrl('http://localhost:3000/api').isValid, false);
    assert.equal(validateOutboundUrl('http://169.254.169.254/latest/meta-data/').isValid, false); // AWS/Cloud metadata
    assert.equal(validateOutboundUrl('http://10.0.0.1/internal').isValid, false);
    assert.equal(validateOutboundUrl('http://192.168.1.1/router').isValid, false);
    assert.equal(validateOutboundUrl('https://malicious-attacker.com/steal').isValid, false);
  });

  it('validates candidate name input boundaries', () => {
    // Empty
    assert.equal(validateCandidateName('').isValid, false);
    // Too long
    assert.equal(validateCandidateName('a'.repeat(65)).isValid, false);
    // Valid name
    const valid = validateCandidateName('  Nodex  ');
    assert.equal(valid.isValid, true);
    assert.equal(valid.sanitized, 'Nodex');
  });

  it('suppresses internal stack traces and secrets in error output', () => {
    const sensitiveError = new Error('Database password failed: SECRET_KEY_12345 at /internal/db.ts:42');
    const safe = formatSafeError(sensitiveError);

    assert.ok(!safe.error.includes('SECRET_KEY_12345'));
    assert.ok(!safe.error.includes('/internal/db.ts'));
    assert.equal(safe.code, 'INTERNAL_ERROR');
  });

  it('enforces sliding-window rate limits', () => {
    const testIp = '198.51.100.42';
    // Consume limit (max 120 per minute)
    for (let i = 0; i < 125; i++) {
      apiRateLimiter.check(testIp);
    }
    const check = apiRateLimiter.check(testIp);
    assert.equal(check.allowed, false);
  });
});
