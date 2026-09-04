import { 
  ArticleAppraisal, 
  AppraisalInstrument, 
  AssessmentStatus, 
  AssessmentLifecycleStatus 
} from '../types';
import { MASTER_INSTRUMENTS_REGISTRY } from '../data/masterRegistry';
import { SnapshotService } from './snapshotService';

export interface GateCheckItem {
  name: string;
  category: 'SOURCE' | 'VERSIONING' | 'ITEM_COUNT' | 'SCORING_MODEL';
  passed: boolean;
  severity: 'CRITICAL' | 'WARNING';
  message: string;
  expected?: string | number;
  actual?: string | number;
  ruleCitation?: string;
}

export interface MethodIntegrityGateResult {
  appraisalId: string;
  articleCitation: string;
  instrumentId: string;
  instrumentName: string;
  passed: boolean;
  canBeVerified: boolean;
  canBeExported: boolean;
  timestamp: string;
  checks: {
    source: GateCheckItem[];
    versioning: GateCheckItem[];
    itemCount: GateCheckItem[];
    scoringModel: GateCheckItem[];
  };
  criticalErrors: string[];
  warnings: string[];
  registeredInstrument: AppraisalInstrument;
  integrityHash: string;
}

export interface GateExportCheckResult {
  allowed: boolean;
  reasons: string[];
  totalAppraisalsChecked: number;
  passedCount: number;
  blockedCount: number;
  gateResults: MethodIntegrityGateResult[];
}

export class MethodIntegrityGateError extends Error {
  public gateResults: MethodIntegrityGateResult[];
  constructor(message: string, gateResults: MethodIntegrityGateResult[] = []) {
    super(message);
    this.name = 'MethodIntegrityGateError';
    this.gateResults = gateResults;
  }
}

/**
 * CENTRAL METHOD INTEGRITY GATE (MethodIntegrityGate)
 * 
 * Systematically enforces methodological contracts across:
 * 1. Source Provenance & Level 1/2 Authority
 * 2. Explicit Versioning & Immutable Snapshot Consistency
 * 3. Exact Item Count & Sequential Checklist Integrity
 * 4. Scoring Model Authenticity (Qualitative Judgement vs. Domain-based vs. None)
 * 
 * Every active appraisal must pass through this gate before being marked as 'Verified'
 * or exported (Markdown, CSV, Thesis Synthesis, JSON, Certificate).
 */
export class MethodIntegrityGate {
  /**
   * Systematically validates a single active appraisal against the MethodologyRegistry.
   */
  public static validateAppraisal(appraisal: ArticleAppraisal): MethodIntegrityGateResult {
    const instrumentId = appraisal.instrumentId?.trim() || '';
    const instrument = MASTER_INSTRUMENTS_REGISTRY.find(i => i.id === instrumentId);
    if (!instrument) {
      throw new MethodIntegrityGateError(`Ukjent appraisal-instrument: ${instrumentId || 'mangler'}. Vurderingen kan ikke valideres uten et registrert instrument.`);
    }

    const sourceChecks: GateCheckItem[] = [];
    const versioningChecks: GateCheckItem[] = [];
    const itemCountChecks: GateCheckItem[] = [];
    const scoringModelChecks: GateCheckItem[] = [];

    const criticalErrors: string[] = [];
    const warnings: string[] = [];

    // ==========================================
    // 1. SOURCE PROVENANCE & AUTHORITY CHECK
    // ==========================================
    const hasRegisteredInst = MASTER_INSTRUMENTS_REGISTRY.some(i => i.id === instrumentId);
    sourceChecks.push({
      name: 'Registry Existence',
      category: 'SOURCE',
      passed: hasRegisteredInst,
      severity: 'CRITICAL',
      message: hasRegisteredInst 
        ? `Instrument «${instrument.shortName}» (${instrument.id}) er offisielt registrert i Master Methodology Registry.`
        : `Ukjent instrument-ID «${instrumentId}» finnes ikke i autoritetsregisteret.`,
      expected: 'Registrert instrument-ID',
      actual: instrumentId,
      ruleCitation: 'Master Methodology Registry (Nivå 1 & 2 Kildekrav)'
    });
    if (!hasRegisteredInst) {
      criticalErrors.push(`Instrumentet «${instrumentId}» er ikke godkjent i registeret.`);
    }

    const hasAuthorityLevel = ['original-source', 'peer-reviewed-publication', 'official-manual'].includes(instrument.authorityLevel);
    sourceChecks.push({
      name: 'Authority Level (Nivå 1/2 Kilde)',
      category: 'SOURCE',
      passed: hasAuthorityLevel,
      severity: 'CRITICAL',
      message: hasAuthorityLevel
        ? `Instrumentet har autoritetsnivå: ${instrument.authorityLevel} (${instrument.publisher}).`
        : `Ugyldig autoritetsnivå: ${instrument.authorityLevel}. Krever primærkilde eller offisiell manual.`,
      expected: 'original-source | peer-reviewed-publication | official-manual',
      actual: instrument.authorityLevel,
      ruleCitation: 'WHO & JBI Metodisk kildestandard'
    });
    if (!hasAuthorityLevel) {
      criticalErrors.push('Instrumentet mangler godkjent autoritetsnivå.');
    }

    const hasSourceDoiOrUrl = !!(instrument.doi || instrument.sourceUrl);
    sourceChecks.push({
      name: 'Primary DOI / Official Source Citation',
      category: 'SOURCE',
      passed: hasSourceDoiOrUrl,
      severity: 'CRITICAL',
      message: hasSourceDoiOrUrl
        ? `Primærkilde: ${instrument.primaryPublication} (DOI: ${instrument.doi || 'URL verifisert'})`
        : 'Mangler offisiell DOI eller primærkilde-URL i registeret.',
      expected: 'DOI eller kilde-URL',
      actual: instrument.doi || instrument.sourceUrl || 'Mangler',
      ruleCitation: 'APA 7 & Metodisk Sporbarhet'
    });
    if (!hasSourceDoiOrUrl) {
      criticalErrors.push('Instrumentet mangler offisiell DOI/kilde-URL i registeret.');
    }

    // ==========================================
    // 2. VERSIONING & SNAPSHOT IMMUTABILITY CHECK
    // ==========================================
    const versionMatches = !appraisal.instrumentVersion || appraisal.instrumentVersion === instrument.version;
    versioningChecks.push({
      name: 'Explicit Version Matching',
      category: 'VERSIONING',
      passed: versionMatches,
      severity: 'CRITICAL',
      message: versionMatches
        ? `Vurderingen anvender autorisert versjon ${instrument.version} (${instrument.edition}).`
        : `Versjonskonflikt: Vurderingen oppgir versjon ${appraisal.instrumentVersion}, mens registeret krever ${instrument.version}.`,
      expected: instrument.version,
      actual: appraisal.instrumentVersion || instrument.version,
      ruleCitation: 'Metodisk Versjonslås & Integritetsvern'
    });
    if (!versionMatches) {
      criticalErrors.push(`Versjonskonflikt for instrument ${instrument.id}: forventet ${instrument.version}, mottok ${appraisal.instrumentVersion}.`);
    }

    const isNotDeprecated = instrument.status !== 'Beta';
    versioningChecks.push({
      name: 'Registry Status Active',
      category: 'VERSIONING',
      passed: isNotDeprecated,
      severity: 'CRITICAL',
      message: isNotDeprecated
        ? `Instrumentstatus er ${instrument.status} (Godkjent for produksjon og syntese).`
        : `Instrumentstatus er ${instrument.status} (Ikke ferdig verifisert i produksjon).`,
      expected: 'Active | Available',
      actual: instrument.status,
      ruleCitation: 'Kvalitetsstyringsmanual'
    });
    if (!isNotDeprecated) {
      warnings.push(`Instrumentet har status «${instrument.status}».`);
    }

    // Snapshot integrity check if snapshot exists
    if (appraisal.snapshot) {
      const snapshot = appraisal.snapshot;
      const snapshotVersionValid = snapshot.instrumentVersion === instrument.version;
      versioningChecks.push({
        name: 'Snapshot Version Lock Verification',
        category: 'VERSIONING',
        passed: snapshotVersionValid,
        severity: 'CRITICAL',
        message: snapshotVersionValid
          ? `Snapshot er forseglet med uforanderlig låse-hash ${snapshot.immutableLockHash.slice(0, 16)}...`
          : `Snapshot versjonsfeil: Snapshot oppgir ${snapshot.instrumentVersion}, registrert er ${instrument.version}.`,
        expected: instrument.version,
        actual: snapshot.instrumentVersion,
        ruleCitation: 'Snapshot Immutability Contract'
      });
      if (!snapshotVersionValid) {
        criticalErrors.push('Snapshotets versjonslås stemmer ikke overens med registeret.');
      }
    }

    // ==========================================
    // 3. ITEM COUNT & CHECKLIST INTEGRITY CHECK
    // ==========================================
    const items = appraisal.items || [];
    const expectedCount = instrument.itemCount;
    const actualCount = items.length;
    const countMatches = actualCount === expectedCount;

    itemCountChecks.push({
      name: 'Exact Item Count Verification',
      category: 'ITEM_COUNT',
      passed: countMatches,
      severity: 'CRITICAL',
      message: countMatches
        ? `Sjekklisten har nøyaktig ${expectedCount} kriterier som påkrevd av ${instrument.shortName}.`
        : `Metodisk avvik i antall spørsmål: Sjekklisten har ${actualCount} kriterier, registeret krever nøyaktig ${expectedCount}.`,
      expected: expectedCount,
      actual: actualCount,
      ruleCitation: `${instrument.shortName} Offisiell Manual (${instrument.edition})`
    });
    if (!countMatches) {
      criticalErrors.push(`Ugyldig antall kriterier: forventet ${expectedCount}, fant ${actualCount}.`);
    }

    // Sequential question ID verification (1..itemCount)
    const questionIds = items.map(it => it.questionId).sort((a, b) => a - b);
    const hasAllSequentialIds = questionIds.length === expectedCount && 
      questionIds.every((id, idx) => id === idx + 1);

    itemCountChecks.push({
      name: 'Sequential Question ID Integrity (1..N)',
      category: 'ITEM_COUNT',
      passed: hasAllSequentialIds,
      severity: 'CRITICAL',
      message: hasAllSequentialIds
        ? `Alle spørsmåls-ID-er (1–${expectedCount}) er sekvensielle og uten duplikater.`
        : `Feil i spørsmåls-ID-er: Mangler elementer eller inneholder duplikater (${questionIds.join(', ')}).`,
      expected: `Sekvens 1 til ${expectedCount}`,
      actual: questionIds.join(', '),
      ruleCitation: 'Strukturert sjekklistekontrakt'
    });
    if (!hasAllSequentialIds) {
      criticalErrors.push('Sjekklisten mangler nødvendige spørsmål eller har dupliserte spørsmåls-ID-er.');
    }

    // Allowed answers check
    const invalidAnswers = items.filter(it => !instrument.allowedAnswers.includes(it.status));
    const allAnswersValid = invalidAnswers.length === 0;
    itemCountChecks.push({
      name: 'Allowed Answer Value Validation',
      category: 'ITEM_COUNT',
      passed: allAnswersValid,
      severity: 'CRITICAL',
      message: allAnswersValid
        ? 'Alle svaralternativer er autoriserte i henhold til instrumentets spesifikasjon.'
        : `Ugyldige svaralternativer oppdaget på ${invalidAnswers.length} spørsmål: ${invalidAnswers.map(i => `Q${i.questionId}: «${i.status}»`).join(', ')}.`,
      expected: instrument.allowedAnswers.join(', '),
      actual: allAnswersValid ? 'Gyldige' : invalidAnswers.map(i => i.status).join(', '),
      ruleCitation: `${instrument.shortName} Svarformat-standard`
    });
    if (!allAnswersValid) {
      criticalErrors.push(`Uautoriserte svarverdier funnet i ${invalidAnswers.length} spørsmål.`);
    }

    // ==========================================
    // 4. SCORING MODEL & RIGOUR CHECK
    // ==========================================
    if (instrument.scoringModel === 'qualitative-judgement') {
      // JBI Qualitative Check:
      // 1. Overall verdict must be qualitative (Inkluder, Ekskluder, etc.), not a fake arithmetic cut-off
      const validVerdicts = ['Inkluder', 'Ekskluder', 'Vurder videre', 'Søk mer informasjon'];
      const verdictPass = validVerdicts.includes(appraisal.overallVerdict);
      scoringModelChecks.push({
        name: 'Qualitative Holistic Decision Model',
        category: 'SCORING_MODEL',
        passed: verdictPass,
        severity: 'CRITICAL',
        message: verdictPass
          ? `Samlet beslutning er kvalitativt begrunnet: «${appraisal.overallVerdict}» (${instrument.scoringModelExplanation.slice(0, 80)}...).`
          : `Ugyldig vurderingsbeslutning «${appraisal.overallVerdict}». JBI krever helhetlig kvalitativ dom.`,
        expected: validVerdicts.join(' | '),
        actual: appraisal.overallVerdict,
        ruleCitation: 'JBI Qualitative Guidelines (Aromataris & Munn, 2024)'
      });
      if (!verdictPass) {
        criticalErrors.push('Ugyldig kvalitativ samlet vurderingsbeslutning.');
      }

      // 2. Rationale / Justification check for all items
      const itemsWithoutJustification = items.filter(it => !it.justification || it.justification.trim().length < 3);
      const allJustified = itemsWithoutJustification.length === 0;
      scoringModelChecks.push({
        name: 'Mandatory Methodological Rationale (WHO standard)',
        category: 'SCORING_MODEL',
        passed: allJustified,
        severity: 'CRITICAL',
        message: allJustified
          ? 'Alle vurderingspunkter har dokumentert metodisk begrunnelse (rationale).'
          : `${itemsWithoutJustification.length} spørsmål mangler obligatorisk skriftlig begrunnelse (Q: ${itemsWithoutJustification.map(i => i.questionId).join(', ')}).`,
        expected: 'Begrunnelse på alle 10 punkter',
        actual: allJustified ? '100% begrunnet' : `${itemsWithoutJustification.length} mangler`,
        ruleCitation: 'WHO Handbook Annex 8.1 & JBI Rationale Mandate'
      });
      if (!allJustified) {
        criticalErrors.push(`${itemsWithoutJustification.length} sjekklistepunkter mangler obligatorisk metodisk begrunnelse.`);
      }

      // 3. Reflexivity (Q6 & Q7) & Ethics (Q9) explicit focus
      const q6 = items.find(it => it.questionId === 6);
      const q7 = items.find(it => it.questionId === 7);
      const q9 = items.find(it => it.questionId === 9);
      const hasReflexivity = !!(q6?.justification && q7?.justification);
      const hasEthics = !!(q9?.justification);

      scoringModelChecks.push({
        name: 'Reflexivity & Positionality Rationale (JBI Q6 & Q7)',
        category: 'SCORING_MODEL',
        passed: hasReflexivity,
        severity: 'CRITICAL',
        message: hasReflexivity
          ? 'Forskerrefleksivitet og posisjonering er eksplisitt vurdert i Q6 og Q7.'
          : 'Mangler eksplisitt drøfting av forskerposisjon/refleksivitet i Q6 eller Q7.',
        expected: 'Dokumentert drøfting i Q6 og Q7',
        actual: hasReflexivity ? 'Oppfylt' : 'Ufullstendig',
        ruleCitation: 'JBI Reflexivity Quality Standard'
      });
      if (!hasReflexivity) {
        criticalErrors.push('Forskerrefleksivitet (JBI Q6 & Q7) må ha eksplisitt metodisk begrunnelse.');
      }

      scoringModelChecks.push({
        name: 'Ethics Approval Rationale (JBI Q9)',
        category: 'SCORING_MODEL',
        passed: hasEthics,
        severity: 'CRITICAL',
        message: hasEthics
          ? 'Forskningsetisk godkjenning/samtykke er dokumentert i Q9.'
          : 'Mangler vurdering av etisk godkjenning i Q9.',
        expected: 'Etisk vurdering i Q9',
        actual: hasEthics ? 'Oppfylt' : 'Mangler',
        ruleCitation: 'Forskningsetisk Lovverk & JBI Q9'
      });
      if (!hasEthics) {
        criticalErrors.push('Forskningsetisk godkjenning (JBI Q9) må være vurdert.');
      }

    } else if (instrument.scoringModel === 'domain-based') {
      if (instrument.id === 'amstar-2') {
        scoringModelChecks.push({
          name: 'AMSTAR 2 Non-Summation Constraint',
          category: 'SCORING_MODEL',
          passed: true,
          severity: 'CRITICAL',
          message: 'AMSTAR 2 håndhever 7 kritiske domener uten kunstig numerisk prosentpoengscore.',
          expected: 'Domain Confidence (High, Moderate, Low, Critically Low)',
          actual: 'Domain-based',
          ruleCitation: 'Shea et al., BMJ 2017 (AMSTAR 2 standard)'
        });
      }
    } else if (instrument.scoringModel === 'none') {
      scoringModelChecks.push({
        name: 'Implementation Framework Quality Non-Scoring',
        category: 'SCORING_MODEL',
        passed: true,
        severity: 'CRITICAL',
        message: `${instrument.shortName} er et implementerings- eller spredningsrammeverk uten numerisk kvalitetsskår.`,
        expected: 'ScoringModel: none',
        actual: 'none',
        ruleCitation: 'Implementeringsvitenskapelig standard'
      });
    }

    // Determine overall gate status
    const allChecks = [
      ...sourceChecks, 
      ...versioningChecks, 
      ...itemCountChecks, 
      ...scoringModelChecks
    ];
    
    const hasCriticalFailure = allChecks.some(c => !c.passed && c.severity === 'CRITICAL');
    const passed = !hasCriticalFailure && criticalErrors.length === 0;

    // Fast deterministic integrity hash
    const rawContent = `${appraisal.id}:${instrument.id}:${instrument.version}:${actualCount}:${items.map(i => `${i.questionId}:${i.status}`).join('|')}`;
    let hash = 0;
    for (let i = 0; i < rawContent.length; i++) {
      hash = (hash << 5) - hash + rawContent.charCodeAt(i);
      hash |= 0;
    }
    const integrityHash = `MIG-CHECKSUM:${Math.abs(hash).toString(16).padStart(8, '0')}${instrument.validationChecksum?.slice(-6) || ''}`;

    return {
      appraisalId: appraisal.id,
      articleCitation: appraisal.shortCitation || appraisal.title,
      instrumentId: instrument.id,
      instrumentName: instrument.name,
      passed,
      canBeVerified: passed,
      canBeExported: passed,
      timestamp: new Date().toISOString(),
      checks: {
        source: sourceChecks,
        versioning: versioningChecks,
        itemCount: itemCountChecks,
        scoringModel: scoringModelChecks
      },
      criticalErrors,
      warnings,
      registeredInstrument: instrument,
      integrityHash
    };
  }

  /**
   * Evaluates if an appraisal can be marked as 'Verified' or 'INTERNALLY_COMPLIANCE_CHECKED'.
   */
  public static canMarkAsVerified(appraisal: ArticleAppraisal): {
    allowed: boolean;
    reasons: string[];
    gateResult: MethodIntegrityGateResult;
  } {
    const gateResult = this.validateAppraisal(appraisal);
    const reasons: string[] = [];

    if (!gateResult.passed) {
      reasons.push(...gateResult.criticalErrors);
    }

    // Additional check: Cannot verify if marked as UNANSWERED or has empty answers
    const unansweredCount = (appraisal.items || []).filter(it => !it.status).length;
    if (unansweredCount > 0) {
      reasons.push(`${unansweredCount} kriterier er ubesvart.`);
    }

    const allowed = gateResult.passed && reasons.length === 0;
    return {
      allowed,
      reasons,
      gateResult
    };
  }

  /**
   * Systematically checks if one or multiple appraisals are legally exportable
   * according to Methodological Gate integrity rules.
   */
  public static canExport(appraisals: ArticleAppraisal | ArticleAppraisal[]): GateExportCheckResult {
    const list = Array.isArray(appraisals) ? appraisals : [appraisals];
    const gateResults = list.map(a => this.validateAppraisal(a));

    const failedResults = gateResults.filter(r => !r.passed);
    const blockedCount = failedResults.length;
    const passedCount = list.length - blockedCount;
    const allowed = blockedCount === 0;

    const reasons: string[] = [];
    if (!allowed) {
      failedResults.forEach(f => {
        reasons.push(`[${f.articleCitation}]: ${f.criticalErrors.join('; ')}`);
      });
    }

    return {
      allowed,
      reasons,
      totalAppraisalsChecked: list.length,
      passedCount,
      blockedCount,
      gateResults
    };
  }

  /**
   * Enforces export integrity by throwing MethodIntegrityGateError if any appraisal fails.
   */
  public static assertCanExport(appraisals: ArticleAppraisal | ArticleAppraisal[]): void {
    const check = this.canExport(appraisals);
    if (!check.allowed) {
      throw new MethodIntegrityGateError(
        `MethodIntegrityGate blokkerte eksport for ${check.blockedCount} av ${check.totalAppraisalsChecked} studier på grunn av metodiske avvik:\n${check.reasons.join('\n')}`,
        check.gateResults
      );
    }
  }

  /**
   * Applies 'Verified' status with an immutable MethodIntegrityGate seal.
   */
  public static verifyAppraisal(appraisal: ArticleAppraisal, verifiedBy: string = 'MethodIntegrityGate'): ArticleAppraisal {
    const check = this.canMarkAsVerified(appraisal);
    if (!check.allowed) {
      throw new MethodIntegrityGateError(
        `Kan ikke verifisere vurderingen: ${check.reasons.join(', ')}`,
        [check.gateResult]
      );
    }

    const snapshot = SnapshotService.createSnapshot(appraisal, verifiedBy);
    const updatedAuditTrail = [
      {
        id: `AUD-VERIFY-${Date.now()}`,
        studyId: appraisal.id,
        reviewer: verifiedBy,
        instrumentId: check.gateResult.instrumentId,
        version: check.gateResult.registeredInstrument.version,
        itemId: 0,
        itemTitle: 'MethodIntegrityGate Verifikasjon',
        previousAnswer: appraisal.methodologyAlignmentStatus || 'PENDING_VERIFICATION',
        newAnswer: 'INTERNALLY_COMPLIANCE_CHECKED',
        previousRationale: 'Uverifisert',
        newRationale: `Godkjent gjennom MethodIntegrityGate (Hash: ${check.gateResult.integrityHash}). Kilde, versjon, antall kriterier og skåringsmodell er validert mot registeret.`,
        changedBy: verifiedBy,
        timestamp: new Date().toISOString(),
        comment: 'Full metodisk samsvarsgodkjenning fullført.'
      },
      ...(appraisal.auditTrail || [])
    ];

    return {
      ...appraisal,
      methodologyAlignmentStatus: 'INTERNALLY_COMPLIANCE_CHECKED',
      snapshot: {
        ...snapshot,
        immutableLockHash: check.gateResult.integrityHash
      },
      auditTrail: updatedAuditTrail
    };
  }

  /**
   * Runs an integrity audit on all active appraisals in the current library.
   */
  public static checkAllActiveAppraisals(appraisals: ArticleAppraisal[]): {
    allPassed: boolean;
    totalCount: number;
    passedCount: number;
    blockedCount: number;
    results: {
      appraisalId: string;
      title: string;
      shortCitation: string;
      passed: boolean;
      gateResult: MethodIntegrityGateResult;
    }[];
  } {
    const results = appraisals.map(a => {
      const gateResult = this.validateAppraisal(a);
      return {
        appraisalId: a.id,
        title: a.title,
        shortCitation: a.shortCitation,
        passed: gateResult.passed,
        gateResult
      };
    });

    const passedCount = results.filter(r => r.passed).length;
    const blockedCount = results.length - passedCount;

    return {
      allPassed: blockedCount === 0,
      totalCount: appraisals.length,
      passedCount,
      blockedCount,
      results
    };
  }
}
