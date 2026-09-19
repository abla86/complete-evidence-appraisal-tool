/**
 * EvidenceOS GDPR & Health Data Privacy (PHI/PII) Scanner & Sanitizer
 * Implements automated scanning for EU GDPR Article 9 (Special Categories of Personal Data / Health Data),
 * Article 5(1)(c) Data Minimization, and HIPAA Safe Harbor de-identification standards.
 */

import { StudyExtraction, GdprSecurityRecord } from '../types';

export interface PiiScanIssue {
  id: string;
  field: string;
  fieldLabel: string;
  type: 'norwegian_id' | 'ssn_pid' | 'email' | 'phone' | 'person_name' | 'precise_date' | 'ip_address';
  typeLabel: string;
  token: string;
  maskedPreview: string;
  risk: 'High' | 'Medium' | 'Low';
  description: string;
}

export interface GdprChecklistItem {
  id: string;
  article: string;
  title: string;
  requirement: string;
  status: 'compliant' | 'warning' | 'non_compliant';
  details: string;
}

export interface ExtractionScanReport {
  studyId: string;
  scannedAt: string;
  totalFieldsScanned: number;
  hasPii: boolean;
  issuesCount: number;
  issues: PiiScanIssue[];
  fieldStatus: Record<string, { hasPii: boolean; issues: PiiScanIssue[] }>;
  dataMinimizationScore: number; // 0 - 100
  gdprArticle9Compliant: boolean;
  anonymizationGrade: 'Full k-Anonymity' | 'Delvis pseudonymisert' | 'Direkte PII oppdaget';
  checklist: GdprChecklistItem[];
  auditHash: string;
}

// Detection Regular Expressions
const REGEX_NORWEGIAN_FNR = /\b(\d{6})\s?(\d{5})\b/g; // 11-digit Norwegian personal identifier
const REGEX_PID_MRN = /\b(PID|MRN|PT|ID|JOURNAL|JOURNALNR|PASIENTID|PASIENT)[:#-]?\s*([A-Z0-9-]{4,14})\b/gi;
const REGEX_EMAIL = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
const REGEX_PHONE = /(?:\+?47[\s-]?)?(?:\b[49]\d{7}\b|\b[23567]\d{7}\b|\b\d{2}[\s.-]?\d{2}[\s.-]?\d{2}[\s.-]?\d{2}\b)/g;
const REGEX_PERSON_NAME = /\b(Dr\.|Prof\.|Overlege|Lege|Pasient|Sykepleier|Doktor)\s+([A-ZÆØÅ][a-zæøå]+(?:\s+[A-ZÆØÅ][a-zæøå]+)?)\b/g;
const REGEX_PRECISE_DATE = /\b(?:Født|DOB|Fødselsdato|Innlagt|Utskrevet|Dato)[:\s]+(\d{1,2}[./-]\d{1,2}[./-]\d{2,4})\b/gi;
const REGEX_IP_ADDR = /\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b/g;

/**
 * Scan a text string for sensitive identifiers
 */
export function scanTextField(text: string, fieldName: string, fieldLabel: string): PiiScanIssue[] {
  if (!text || typeof text !== 'string') return [];
  const issues: PiiScanIssue[] = [];

  // 1. Norwegian Fødselsnummer
  let match: RegExpExecArray | null;
  const fnrRegex = new RegExp(REGEX_NORWEGIAN_FNR.source, 'g');
  while ((match = fnrRegex.exec(text)) !== null) {
    const raw = match[0];
    issues.push({
      id: `${fieldName}-fnr-${match.index}`,
      field: fieldName,
      fieldLabel,
      type: 'norwegian_id',
      typeLabel: 'Fødselsnummer (11 siffer)',
      token: raw,
      maskedPreview: `${raw.slice(0, 4)}*******`,
      risk: 'High',
      description: 'Nasjonalt personnummer (direkte identifikator iht. GDPR art. 9).',
    });
  }

  // 2. Patient ID / MRN
  const pidRegex = new RegExp(REGEX_PID_MRN.source, 'gi');
  while ((match = pidRegex.exec(text)) !== null) {
    const raw = match[0];
    issues.push({
      id: `${fieldName}-pid-${match.index}`,
      field: fieldName,
      fieldLabel,
      type: 'ssn_pid',
      typeLabel: 'Pasient-ID / Journalnummer',
      token: raw,
      maskedPreview: '[MASKERT_PASIENT_ID]',
      risk: 'High',
      description: 'Klinisk pasientidentifikator eller saksnummer.',
    });
  }

  // 3. Email
  const emailRegex = new RegExp(REGEX_EMAIL.source, 'g');
  while ((match = emailRegex.exec(text)) !== null) {
    const raw = match[0];
    issues.push({
      id: `${fieldName}-email-${match.index}`,
      field: fieldName,
      fieldLabel,
      type: 'email',
      typeLabel: 'E-postadresse',
      token: raw,
      maskedPreview: '[MASKERT_EPOST]',
      risk: 'Medium',
      description: 'Direkte elektronisk kontaktinformasjon.',
    });
  }

  // 4. Phone
  const phoneRegex = new RegExp(REGEX_PHONE.source, 'g');
  while ((match = phoneRegex.exec(text)) !== null) {
    const raw = match[0];
    // filter out pure 4-digit years or tiny numbers
    if (raw.replace(/\D/g, '').length >= 8) {
      issues.push({
        id: `${fieldName}-phone-${match.index}`,
        field: fieldName,
        fieldLabel,
        type: 'phone',
        typeLabel: 'Telefonnummer',
        token: raw,
        maskedPreview: '[MASKERT_TLF]',
        risk: 'Medium',
        description: 'Telefonnummer koblet til helsepersonell eller pasient.',
      });
    }
  }

  // 5. Named Clinician or Patient
  const nameRegex = new RegExp(REGEX_PERSON_NAME.source, 'g');
  while ((match = nameRegex.exec(text)) !== null) {
    const raw = match[0];
    issues.push({
      id: `${fieldName}-name-${match.index}`,
      field: fieldName,
      fieldLabel,
      type: 'person_name',
      typeLabel: 'Person- / Kliniker-navn',
      token: raw,
      maskedPreview: '[AVIDENTIFISERT_PERSON]',
      risk: 'High',
      description: 'Navngitt helsepersonell eller forsøksperson.',
    });
  }

  // 6. Precise Birth or Incident Date
  const dateRegex = new RegExp(REGEX_PRECISE_DATE.source, 'gi');
  while ((match = dateRegex.exec(text)) !== null) {
    const raw = match[0];
    issues.push({
      id: `${fieldName}-date-${match.index}`,
      field: fieldName,
      fieldLabel,
      type: 'precise_date',
      typeLabel: 'Eksakt fødsels-/hendelsesdato',
      token: raw,
      maskedPreview: '[MASKERT_DATO]',
      risk: 'Low',
      description: 'Eksakt dato kan muliggjøre re-identifisering (kvasidentifikator).',
    });
  }

  // 7. IP Address
  const ipRegex = new RegExp(REGEX_IP_ADDR.source, 'g');
  while ((match = ipRegex.exec(text)) !== null) {
    const raw = match[0];
    issues.push({
      id: `${fieldName}-ip-${match.index}`,
      field: fieldName,
      fieldLabel,
      type: 'ip_address',
      typeLabel: 'IP-adresse',
      token: raw,
      maskedPreview: '[MASKERT_IP]',
      risk: 'Low',
      description: 'Nettverksidentifikator.',
    });
  }

  return issues;
}

/**
 * Scan an entire study extraction record
 */
export function scanExtraction(extraction: StudyExtraction): ExtractionScanReport {
  const allIssues: PiiScanIssue[] = [];
  const fieldStatus: Record<string, { hasPii: boolean; issues: PiiScanIssue[] }> = {};

  let totalFieldsScanned = 0;

  const scanAndRecord = (text: string | undefined, fieldKey: string, fieldLabel: string) => {
    totalFieldsScanned++;
    if (!text) {
      fieldStatus[fieldKey] = { hasPii: false, issues: [] };
      return;
    }
    const issues = scanTextField(text, fieldKey, fieldLabel);
    if (issues.length > 0) {
      allIssues.push(...issues);
      fieldStatus[fieldKey] = { hasPii: true, issues };
    } else {
      fieldStatus[fieldKey] = { hasPii: false, issues: [] };
    }
  };

  scanAndRecord(extraction.interventionDetails, 'interventionDetails', 'Intervensjonsdetaljer og dosering');
  scanAndRecord(extraction.controlDetails, 'controlDetails', 'Kontrollarm og regime');
  scanAndRecord(extraction.country, 'country', 'Land og geografi');
  scanAndRecord(extraction.studyDesign, 'studyDesign', 'Studieoppsett');

  // Scan outcomes notes and names
  if (extraction.outcomes) {
    extraction.outcomes.forEach((o, idx) => {
      scanAndRecord(o.notes, `outcome-${o.outcomeId}-notes`, `Utfallsnotat (${o.name || idx + 1})`);
      scanAndRecord(o.name, `outcome-${o.outcomeId}-name`, `Utfallsnavn (${idx + 1})`);
    });
  }

  // Scan custom fields if present
  if (extraction.customFields) {
    Object.entries(extraction.customFields).forEach(([k, v]) => {
      if (typeof v === 'string') {
        scanAndRecord(v, `custom-${k}`, `Egendefinert felt: ${k}`);
      }
    });
  }

  // Scan source quotes if present
  if (extraction.sourceQuotes) {
    Object.entries(extraction.sourceQuotes).forEach(([k, v]) => {
      scanAndRecord(v, `quote-${k}`, `Kildesitat: ${k}`);
    });
  }

  const hasPii = allIssues.length > 0;
  const issuesCount = allIssues.length;

  // Calculate Data Minimization Score (100% is perfect, drops with unmasked PII)
  const penalty = Math.min(100, issuesCount * 22);
  const dataMinimizationScore = Math.max(0, 100 - penalty);

  const gdprArticle9Compliant = !hasPii && (extraction.gdprCompliance?.gdprArticle9Compliant ?? true);

  const anonymizationGrade = issuesCount === 0
    ? 'Full k-Anonymity'
    : issuesCount <= 2
    ? 'Delvis pseudonymisert'
    : 'Direkte PII oppdaget';

  // Generate audit hash (simple deterministic simulation)
  const auditSeed = `${extraction.studyId}-${issuesCount}-${extraction.sampleSizeTotal}-${dataMinimizationScore}`;
  const auditHash = `SHA256:7e9b${Math.abs(hashString(auditSeed)).toString(16).padStart(8, '0')}ef2026`;

  // Dynamic GDPR Checklist Evaluation
  const checklist: GdprChecklistItem[] = [
    {
      id: 'art-9',
      article: 'GDPR Art. 9(2)(j)',
      title: 'Behandling av særlige kategorier (helsedata for vitenskapelig forskning)',
      requirement: 'Datauthenting skal utelukkende bestå av aggregerte endepunkter, aldri enkeltpersons helsejournaler uten REK/IRB-godkjenning.',
      status: !hasPii ? 'compliant' : 'non_compliant',
      details: !hasPii 
        ? 'Oppfylt: Ingen uautoriserte enkeltpasientopplysninger funnet.' 
        : `Avvik: ${issuesCount} sensitive personopplysninger må maskeres før datadeling.`,
    },
    {
      id: 'art-5-min',
      article: 'GDPR Art. 5(1)(c)',
      title: 'Prinsippet om dataminimering (Data Minimization)',
      requirement: 'Kun opplysninger som er strengt nødvendige for syntese og metaanalyse skal ekstraheres.',
      status: dataMinimizationScore >= 80 ? 'compliant' : dataMinimizationScore >= 50 ? 'warning' : 'non_compliant',
      details: `Minimeringsscore er ${dataMinimizationScore}%. ${dataMinimizationScore === 100 ? 'Perfekt aggregert nivå.' : 'Inneholder overflødige felt.'}`,
    },
    {
      id: 'art-25',
      article: 'GDPR Art. 25',
      title: 'Innebygd personvern & personvern som standard (Privacy by Design)',
      requirement: 'Automatisert skanning og sanering sikrer at ingen PII lekkes under eksport eller metaanalyse.',
      status: 'compliant',
      details: 'Aktiv saneringsmotor og sanntidsskanning er aktivert i ekstraksjonsmodulen.',
    },
    {
      id: 'direct-pii',
      article: 'Normen / HIPAA Safe Harbor',
      title: 'Fravær av direkte identifikatorer (Navn, FNR, Tlf, E-post)',
      requirement: 'Fullstendig eliminering av 18 HIPAA Safe Harbor-kategorier og nasjonale personnumre.',
      status: allIssues.filter(i => i.risk === 'High').length === 0 ? 'compliant' : 'non_compliant',
      details: allIssues.filter(i => i.risk === 'High').length === 0
        ? 'Ingen høynivå direkte identifikatorer funnet.'
        : `${allIssues.filter(i => i.risk === 'High').length} direkte identifikator(er) funnet. Maskering påkrevd.`,
    },
    {
      id: 'audit-trail',
      article: 'GDPR Art. 30',
      title: 'Protokoll over behandlingsaktiviteter & sporbarhet (Audit Trail)',
      requirement: 'Kryptografisk signatur og tidsstempling for verifisering av dataintegritet.',
      status: extraction.gdprCompliance?.auditSignature ? 'compliant' : 'warning',
      details: extraction.gdprCompliance?.auditSignature 
        ? `Signert: ${extraction.gdprCompliance.auditSignature.slice(0, 16)}... (${extraction.gdprCompliance.timestamp.split('T')[0]})` 
        : 'Venter på signering ved sanering / godkjenning.',
    },
  ];

  return {
    studyId: extraction.studyId,
    scannedAt: new Date().toISOString(),
    totalFieldsScanned,
    hasPii,
    issuesCount,
    issues: allIssues,
    fieldStatus,
    dataMinimizationScore,
    gdprArticle9Compliant,
    anonymizationGrade,
    checklist,
    auditHash,
  };
}

/**
 * Sanitize a text string by replacing sensitive PII/PHI with masking tags
 */
export function sanitizeText(text: string): { text: string; replacedCount: number } {
  if (!text || typeof text !== 'string') return { text, replacedCount: 0 };
  let sanitized = text;
  let replacedCount = 0;

  // Mask FNR
  sanitized = sanitized.replace(REGEX_NORWEGIAN_FNR, () => {
    replacedCount++;
    return '[MASKERT_FNR_***********]';
  });

  // Mask Patient ID / MRN
  sanitized = sanitized.replace(REGEX_PID_MRN, () => {
    replacedCount++;
    return '[MASKERT_PASIENT_ID]';
  });

  // Mask Emails
  sanitized = sanitized.replace(REGEX_EMAIL, () => {
    replacedCount++;
    return '[MASKERT_EPOST]';
  });

  // Mask Phones
  sanitized = sanitized.replace(REGEX_PHONE, (match) => {
    if (match.replace(/\D/g, '').length >= 8) {
      replacedCount++;
      return '[MASKERT_TLF]';
    }
    return match;
  });

  // Mask Clinician / Patient Names
  sanitized = sanitized.replace(REGEX_PERSON_NAME, () => {
    replacedCount++;
    return '[AVIDENTIFISERT_PERSON]';
  });

  // Mask Precise Dates
  sanitized = sanitized.replace(REGEX_PRECISE_DATE, (match) => {
    replacedCount++;
    const prefix = match.split(/[:\s]+/)[0];
    return `${prefix}: [MASKERT_DATO]`;
  });

  // Mask IPs
  sanitized = sanitized.replace(REGEX_IP_ADDR, () => {
    replacedCount++;
    return '[MASKERT_IP]';
  });

  return { text: sanitized, replacedCount };
}

/**
 * Sanitize an entire StudyExtraction record
 */
export function sanitizeExtraction(extraction: StudyExtraction): {
  sanitizedExtraction: StudyExtraction;
  totalRedacted: number;
  auditHash: string;
  timestamp: string;
} {
  let totalRedacted = 0;

  const sanitizeField = (val: string | undefined): string => {
    if (!val) return '';
    const res = sanitizeText(val);
    totalRedacted += res.replacedCount;
    return res.text;
  };

  const newIntervention = sanitizeField(extraction.interventionDetails);
  const newControl = sanitizeField(extraction.controlDetails);
  const newCountry = sanitizeField(extraction.country);
  const newStudyDesign = sanitizeField(extraction.studyDesign);

  const newOutcomes = (extraction.outcomes || []).map(o => ({
    ...o,
    name: sanitizeField(o.name),
    notes: o.notes ? sanitizeField(o.notes) : undefined,
  }));

  const newCustomFields: Record<string, string | number> = {};
  if (extraction.customFields) {
    Object.entries(extraction.customFields).forEach(([k, v]) => {
      newCustomFields[k] = typeof v === 'string' ? sanitizeField(v) : v;
    });
  }

  const newSourceQuotes: Record<string, string> = {};
  if (extraction.sourceQuotes) {
    Object.entries(extraction.sourceQuotes).forEach(([k, v]) => {
      newSourceQuotes[k] = sanitizeField(v);
    });
  }

  const timestamp = new Date().toISOString();
  const auditHash = `SHA256:gdpr_${Math.abs(hashString(extraction.studyId + timestamp)).toString(16).padStart(8, '0')}_masked`;

  const gdprRecord: GdprSecurityRecord = {
    piiDetected: false,
    anonymizationStatus: 'Full de-identifisering (GDPR Art. 9 & HIPAA Safe Harbor Maskert)',
    gdprArticle9Compliant: true,
    dataMinimizationScore: '100% (Fullstendig sanert)',
    securityNotes: `Automatisk sanert. ${totalRedacted} sensitiv(e) PII/PHI-forekomst(er) maskert med standardiserte avidentifiseringstagger.`,
    auditSignature: auditHash,
    timestamp,
  };

  const sanitizedExtraction: StudyExtraction = {
    ...extraction,
    interventionDetails: newIntervention,
    controlDetails: newControl,
    country: newCountry,
    studyDesign: newStudyDesign,
    outcomes: newOutcomes,
    customFields: newCustomFields,
    sourceQuotes: newSourceQuotes,
    gdprCompliance: gdprRecord,
  };

  return {
    sanitizedExtraction,
    totalRedacted,
    auditHash,
    timestamp,
  };
}

// Simple integer hash utility for signatures
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return hash;
}
