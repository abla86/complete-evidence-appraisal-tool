/**
 * GDPR & Privacy Center Service
 * 
 * Provides:
 * 1. Data Minimization & PII Sanitization for AI and Export
 * 2. GDPR Data Subject Rights (Access, Portability, Rectification, Right to Erasure / Purge)
 * 3. Security Classification (OPEN_PUBLIC, RESTRICTED_RESEARCH, SENSITIVE_SPECIAL_CATEGORY)
 * 4. Audit Log Integrity Export
 */

import { ArticleAppraisal } from '../types';
import { CryptoSecurityService } from './cryptoSecurityService';

export interface PiiDetectionResult {
  hasPotentialPii: boolean;
  detectedPiiTypes: ('EMAIL' | 'PHONE' | 'NORWEGIAN_SSN' | 'DIRECT_NAME')[];
  sanitizedText: string;
  originalCharLength: number;
  sanitizedCharLength: number;
}

export class PrivacyAndSecurityService {
  /**
   * Sanitizes text before sending to AI or external APIs.
   * Strips emails, phone numbers, person numbers, and replaces with pseudonymized tokens.
   */
  public static sanitizeForAI(rawText: string): PiiDetectionResult {
    if (!rawText) {
      return {
        hasPotentialPii: false,
        detectedPiiTypes: [],
        sanitizedText: '',
        originalCharLength: 0,
        sanitizedCharLength: 0
      };
    }

    let sanitized = rawText;
    const detected: ('EMAIL' | 'PHONE' | 'NORWEGIAN_SSN' | 'DIRECT_NAME')[] = [];

    // Norwegian Social Security Number (11 digits: DDMMYYXXXXX)
    const ssnRegex = /\b\d{6}\s?\d{5}\b/g;
    if (ssnRegex.test(sanitized)) {
      detected.push('NORWEGIAN_SSN');
      sanitized = sanitized.replace(ssnRegex, '[SKJERMET_FNR]');
    }

    // Email addresses
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    if (emailRegex.test(sanitized)) {
      detected.push('EMAIL');
      sanitized = sanitized.replace(emailRegex, '[SKJERMET_EPOST]');
    }

    // Norwegian & International phone numbers
    const phoneRegex = /(?:\+47\s?)?(?:[2-9]\d{1}\s?\d{2}\s?\d{2}\s?\d{2}|\b[49]\d{7}\b)/g;
    if (phoneRegex.test(sanitized)) {
      detected.push('PHONE');
      sanitized = sanitized.replace(phoneRegex, '[SKJERMET_TLF]');
    }

    return {
      hasPotentialPii: detected.length > 0,
      detectedPiiTypes: detected,
      sanitizedText: sanitized,
      originalCharLength: rawText.length,
      sanitizedCharLength: sanitized.length
    };
  }

  /**
   * Generates GDPR-compliant Data Portability archive
   */
  public static exportUserData(articles: ArticleAppraisal[], userEmail: string = 'researcher@institution.no'): string {
    const payload = {
      exportTimestamp: new Date().toISOString(),
      dataSubject: userEmail,
      gdprComplianceNotice: 'GDPR Article 20 - Right to Data Portability',
      totalAppraisalsCount: articles.length,
      appraisals: articles.map(art => ({
        ...art,
        auditTrailVerified: CryptoSecurityService.verifyAuditChain(art.auditTrail || [])
      }))
    };
    return JSON.stringify(payload, null, 2);
  }

  /**
   * Performs full GDPR Right to Erasure / Purge
   */
  public static purgeLocalVault(): boolean {
    if (typeof localStorage === 'undefined') return true;
    try {
      localStorage.removeItem('evidence_appraisal_articles_vault_v2');
      localStorage.removeItem('evidence_appraisal_snapshots_vault_v2');
      localStorage.removeItem('jbi_research_group_workspace_v1');
      localStorage.removeItem('complete-evidence-appraisal-tool:research-workflows:v1');
      localStorage.removeItem('complete-evidence-appraisal-tool:appraisal-workflows:v1');
      localStorage.removeItem('evidence-appraisal-reference-hub-v1');
      localStorage.removeItem('evidence_appraisal_search_history_v2');
      return true;
    } catch {
      return false;
    }
  }
}


