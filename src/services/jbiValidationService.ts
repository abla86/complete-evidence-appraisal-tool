import { 
  ArticleAppraisal, 
  AssessmentStatus, 
  JBIEvaluationItem, 
  ValidationReport,
  ScoreCalculationResult,
  VerdictRecommendation,
  InterRaterAgreementResult
} from '../types';
import { WhoValidationService } from './whoValidationService';
import { INSTRUMENTS_REGISTRY, JBI_QUESTIONS } from '../data/jbiData';

export const CANONICAL_STATUS_MAP: Record<string, AssessmentStatus> = {
  'ja': 'Ja',
  'yes': 'Ja',
  'j': 'Ja',
  'y': 'Ja',
  'nei': 'Nei',
  'no': 'Nei',
  'n': 'Nei',
  'uklart': 'Uklart',
  'unclear': 'Uklart',
  'u': 'Uklart',
  'ikke relevant': 'Ikke relevant',
  'not applicable': 'Ikke relevant',
  'n/a': 'Ikke relevant',
  'na': 'Ikke relevant',
  'ikke aktuelt': 'Ikke relevant'
};

export class JbiQualitativeValidationService {
  /**
   * Normalizes any input status (English/Norwegian, varying case, abbreviations)
   * into canonical Norwegian AssessmentStatus: 'Ja' | 'Nei' | 'Uklart' | 'Ikke relevant'.
   */
  public static normalizeStatus(rawStatus?: string): AssessmentStatus {
    if (!rawStatus) return 'Uklart';
    const key = rawStatus.trim().toLowerCase();
    return CANONICAL_STATUS_MAP[key] || (rawStatus as AssessmentStatus);
  }

  /**
   * Deterministic mathematical score calculator for JBI Appraisal records.
   * Eliminates calculation discrepancies and guarantees consistent percentages.
   */
  public static computeScore(
    items: JBIEvaluationItem[] = [], 
    totalExpectedItems: number = 10
  ): ScoreCalculationResult {
    let ja = 0;
    let nei = 0;
    let uklart = 0;
    let ikkeRelevant = 0;

    items.forEach(item => {
      const canonical = this.normalizeStatus(item.status);
      if (canonical === 'Ja') ja++;
      else if (canonical === 'Nei') nei++;
      else if (canonical === 'Uklart') uklart++;
      else if (canonical === 'Ikke relevant') ikkeRelevant++;
    });

    const answered = ja + nei + uklart + ikkeRelevant;
    const unanswered = Math.max(0, totalExpectedItems - answered);
    const completenessPercent = totalExpectedItems > 0 
      ? Math.round((answered / totalExpectedItems) * 100) 
      : 0;

    const jaScorePercent = totalExpectedItems > 0 
      ? Math.round((ja / totalExpectedItems) * 100) 
      : 0;

    const applicableTotal = Math.max(1, totalExpectedItems - ikkeRelevant);
    const applicableJaPercent = Math.round((ja / applicableTotal) * 100);

    return {
      ja,
      nei,
      uklart,
      ikkeRelevant,
      total: totalExpectedItems,
      answered,
      unanswered,
      completenessPercent,
      jaScorePercent,
      applicableTotal,
      applicableJaPercent
    };
  }

  /**
   * Evaluates methodological rigor according to WHO Handbook (2014) and JBI Qualitative 2017 guidance.
   * Provides structured qualitative decision support without unsupported numerical threshold cut-offs.
   */
  public static calculateRecommendedVerdict(
    items: JBIEvaluationItem[] = [],
    metadata?: Partial<ArticleAppraisal>
  ): VerdictRecommendation {
    const score = this.computeScore(items, 10);
    const criticalFlaws: string[] = [];
    const identifiedWeaknesses: string[] = [];

    // Check each of the 10 JBI items for identified weaknesses or lack of reporting
    items.forEach(item => {
      const canonical = this.normalizeStatus(item.status);
      const qDef = JBI_QUESTIONS.find(q => q.id === item.questionId);
      const qTitle = qDef?.shortTitle || `Spm ${item.questionId}`;

      if (canonical === 'Nei') {
        identifiedWeaknesses.push(`${qTitle} (Spm ${item.questionId}): Ikke oppfylt.`);
      } else if (canonical === 'Uklart') {
        identifiedWeaknesses.push(`${qTitle} (Spm ${item.questionId}): Uklart rapportert.`);
      }
    });

    // Epistemological overreach guard
    const design = (metadata?.design || '').toLowerCase();
    const verdictNote = (metadata?.verdictNote || '').toLowerCase();
    if (
      (design.includes('kvalitativ') || design.includes('grounded') || design.includes('fenomenolog')) &&
      (verdictNote.includes('beviser kausal') || verdictNote.includes('kausal effekt') || verdictNote.includes('isolerer årsak'))
    ) {
      criticalFlaws.push('Epistemologisk kausalitetsfeil: Kvalitativ studie omtales som kausal effektprøving.');
    }

    if (score.unanswered > 0) {
      return {
        verdict: 'Ufullstendig',
        riskOfBias: 'Uavklart',
        rationale: `Vurderingen er ufullstendig (${score.unanswered} av 10 spørsmål gjenstår). Alle 10 kriterier må vurderes med begrunnelse.`,
        criticalFlaws: [...criticalFlaws, ...identifiedWeaknesses],
        suggestedAction: 'Fullfør de ubesvarte kriteriene før endelig inklusjonsvedtak fattes.'
      };
    }

    // JBI Qualitative (2017) has no official numerical threshold algorithm for inclusion/exclusion.
    // The tool provides structured decision support based on the qualitative synthesis of items.
    if (criticalFlaws.length > 0) {
      return {
        verdict: 'Vurder videre',
        riskOfBias: 'Moderat',
        rationale: `Epistemologisk avvik oppdaget: ${criticalFlaws.join('; ')}. Studien krever metodisk presisering i oppgaven.`,
        criticalFlaws,
        suggestedAction: 'Drøft det metodiske avviket og unngå kausale generaliseringer i syntesen.'
      };
    }

    if (score.nei === 0 && score.uklart === 0) {
      return {
        verdict: 'Inkluder',
        riskOfBias: 'Lav',
        rationale: 'Høy metodisk stringens: Samtlige 10 JBI-kriterier er vurdert som oppfylt («Ja») med dokumentert begrunnelse.',
        criticalFlaws: [],
        suggestedAction: 'Inkluder studien i kunnskapsgrunnlaget og tematisk syntese.'
      };
    }

    if (score.nei > 0 || score.uklart > 0) {
      const hasManyUnclear = score.uklart >= 3;
      const suggestedVerdict = hasManyUnclear ? 'Søk mer informasjon' : (score.ja >= 7 ? 'Inkluder' : 'Vurder videre');
      const biasLevel = score.nei >= 3 ? 'Høy' : (score.nei >= 1 || score.uklart >= 2 ? 'Moderat' : 'Lav');

      return {
        verdict: suggestedVerdict,
        riskOfBias: biasLevel,
        rationale: `JBI Metodisk profil: ${score.ja} Ja, ${score.nei} Nei, ${score.uklart} Uklart, ${score.ikkeRelevant} Ikke relevant. Identifiserte punkter: ${identifiedWeaknesses.join(' ')} (JBI foreskriver ikke en rigid cut-off score; vurderingen er veiledende beslutningsstøtte).`,
        criticalFlaws: identifiedWeaknesses,
        suggestedAction: hasManyUnclear 
          ? 'Kontakt forfattere eller søk supplerende metodisk dokumentasjon for uavklarte punkter.' 
          : 'Vurder studiens metodiske styrker og svakheter i lys av syntesens formål og kontekst.'
      };
    }

    return {
      verdict: 'Vurder videre',
      riskOfBias: 'Moderat',
      rationale: `Metodisk profil: ${score.ja}/10 Ja. JBI krever helhetlig faglig forskerskjønn for inklusjonsbeslutning.`,
      criticalFlaws: identifiedWeaknesses,
      suggestedAction: 'Vurder studiens samlede metodiske troverdighet i oppgavens diskusjonskapittel.'
    };
  }

  /**
   * Computes Inter-Rater Reliability (Cohen's Kappa and Percent Agreement)
   * between two independent reviewers according to WHO/Cochrane dual review protocols.
   */
  public static calculateInterRaterAgreement(
    r1Items: JBIEvaluationItem[] = [],
    r2Items: JBIEvaluationItem[] = []
  ): InterRaterAgreementResult {
    const totalItems = Math.max(r1Items.length, r2Items.length, 10);
    let agreedCount = 0;
    const discrepancies: InterRaterAgreementResult['discrepancies'] = [];

    // Frequency matrix for 4 canonical categories: [Ja, Nei, Uklart, Ikke relevant]
    const categories: AssessmentStatus[] = ['Ja', 'Nei', 'Uklart', 'Ikke relevant'];
    const r1Counts: Record<string, number> = { 'Ja': 0, 'Nei': 0, 'Uklart': 0, 'Ikke relevant': 0 };
    const r2Counts: Record<string, number> = { 'Ja': 0, 'Nei': 0, 'Uklart': 0, 'Ikke relevant': 0 };

    for (let qId = 1; qId <= totalItems; qId++) {
      const it1 = r1Items.find(i => i.questionId === qId);
      const it2 = r2Items.find(i => i.questionId === qId);

      const st1 = this.normalizeStatus(it1?.status);
      const st2 = this.normalizeStatus(it2?.status);

      r1Counts[st1] = (r1Counts[st1] || 0) + 1;
      r2Counts[st2] = (r2Counts[st2] || 0) + 1;

      const qDef = JBI_QUESTIONS.find(q => q.id === qId);
      const qTitle = qDef?.shortTitle || `Spørsmål ${qId}`;

      if (st1 === st2) {
        agreedCount++;
      } else {
        discrepancies.push({
          questionId: qId,
          questionTitle: qTitle,
          r1Status: st1,
          r2Status: st2,
          r1Rationale: it1?.justification,
          r2Rationale: it2?.justification
        });
      }
    }

    const percentAgreement = Math.round((agreedCount / totalItems) * 100);
    const pObserved = agreedCount / totalItems;

    // Expected agreement Pe = sum((count_r1_c / N) * (count_r2_c / N))
    let pExpected = 0;
    categories.forEach(cat => {
      const p1 = (r1Counts[cat] || 0) / totalItems;
      const p2 = (r2Counts[cat] || 0) / totalItems;
      pExpected += (p1 * p2);
    });

    let cohensKappa = 1;
    if (pExpected < 1) {
      cohensKappa = Math.max(-1, Math.min(1, Number(((pObserved - pExpected) / (1 - pExpected)).toFixed(3))));
    }

    let kappaInterpretation: InterRaterAgreementResult['kappaInterpretation'] = 'Svært god (Almost perfect)';
    if (cohensKappa < 0.20) kappaInterpretation = 'Dårlig (Poor)';
    else if (cohensKappa <= 0.40) kappaInterpretation = 'Middels (Fair)';
    else if (cohensKappa <= 0.60) kappaInterpretation = 'Moderat (Moderate)';
    else if (cohensKappa <= 0.80) kappaInterpretation = 'Betydelig (Substantial)';
    else kappaInterpretation = 'Svært god (Almost perfect)';

    return {
      totalItems,
      agreedCount,
      disagreedCount: discrepancies.length,
      percentAgreement,
      cohensKappa,
      kappaInterpretation,
      discrepancies
    };
  }

  /**
   * Generates a standardized APA 7th edition citation string.
   */
  public static formatShortCitation(authors: string, year: number | string): string {
    if (!authors || authors.trim().length === 0) return `Studie (${year})`;
    const authorList = authors.split(/,|og|and/i).map(a => a.trim()).filter(Boolean);
    
    if (authorList.length === 1) {
      const surname = authorList[0].split(' ').pop() || authorList[0];
      return `${surname} (${year})`;
    } else if (authorList.length === 2) {
      const surname1 = authorList[0].split(' ').pop() || authorList[0];
      const surname2 = authorList[1].split(' ').pop() || authorList[1];
      return `${surname1} & ${surname2} (${year})`;
    } else {
      const firstSurname = authorList[0].split(' ').pop() || authorList[0];
      return `${firstSurname} et al. (${year})`;
    }
  }

  /**
   * Formats a complete APA 7th Edition reference string.
   */
  public static formatApa7Reference(meta: {
    authors: string;
    year: number | string;
    title: string;
    journal: string;
    doi?: string;
    volumeIssue?: string;
    pages?: string;
  }): string {
    const { authors, year, title, journal, doi, volumeIssue, pages } = meta;
    let ref = `${authors || 'Forfattere'} (${year || 'u.å.'}). ${title}. ${journal}`;
    if (volumeIssue) ref += `, ${volumeIssue}`;
    if (pages) ref += `, ${pages}`;
    ref += '.';
    if (doi) {
      const cleanDoi = doi.startsWith('http') ? doi : `https://doi.org/${doi.replace(/^doi:/i, '').trim()}`;
      ref += ` ${cleanDoi}`;
    }
    return ref;
  }

  /**
   * Centralized master validation method combining syntax, metadata completeness,
   * deterministic scoring, decision logic, and WHO handbook standards auditing.
   */
  public static validate(
    assessment: Partial<ArticleAppraisal>, 
    instrumentId: string = 'jbi-qualitative-2017'
  ): ValidationReport {
    const errors: string[] = [];
    const warnings: string[] = [];

    const instrument = INSTRUMENTS_REGISTRY.find(i => i.id === instrumentId) || INSTRUMENTS_REGISTRY[0];
    const totalItems = instrument.itemCount || 10;

    // 1. Mandatory metadata checks
    if (!assessment.title || assessment.title.trim().length === 0) {
      errors.push('Studietittel / Artikkeltittel er påkrevd.');
    }
    if (!assessment.authors || assessment.authors.trim().length === 0) {
      warnings.push('Forfattere bør registreres for korrekt akademisk kildehenvisning.');
    }
    if (!assessment.reviewerName || assessment.reviewerName.trim().length === 0) {
      warnings.push('Reviewer-navn / Vurderer bør registreres for sporbarhet i audit trail.');
    }
    if (!assessment.assessmentDate) {
      warnings.push('Vurderingsdato mangler.');
    }

    const items = assessment.items || [];
    const scoreCalculation = this.computeScore(items, totalItems);

    // 2. Individual Item Checks
    for (let qId = 1; qId <= totalItems; qId++) {
      const item = items.find(i => i.questionId === qId);

      if (!item) {
        warnings.push(`Spørsmål ${qId} er ikke besvart.`);
        continue;
      }

      if (!item.status) {
        warnings.push(`Spørsmål ${qId} mangler svarverdi (Ja, Nei, Uklart, Ikke relevant).`);
        continue;
      }

      const canonical = this.normalizeStatus(item.status);

      // Check rationale
      if (!item.justification || item.justification.trim().length < 10) {
        warnings.push(`Spørsmål ${qId} mangler utførlig faglig begrunnelse / rationale (WHO standard).`);
      }

      // Evidence check for 'Ja' answers
      if (canonical === 'Ja' && (!item.evidenceText || item.evidenceText.trim().length === 0) && (!item.location?.page && !item.location?.section)) {
        warnings.push(`Spørsmål ${qId}: Direkte sitat eller sidetallhenvisning anbefales for positive «Ja»-vurderinger.`);
      }
    }

    // 3. Centralized Verdict Calculation
    const verdictRecommendation = this.calculateRecommendedVerdict(items, assessment);

    // 4. Audit with WHO Validation Service
    const whoCompliance = WhoValidationService.auditArticle(assessment, instrumentId);

    const isValid = errors.length === 0;

    return {
      isValid,
      instrumentId: instrument.id,
      instrumentName: instrument.name,
      instrumentVersion: `${instrument.version} (${instrument.edition})`,
      timestamp: new Date().toISOString(),
      totalItems,
      answeredItems: scoreCalculation.answered,
      completenessPercent: scoreCalculation.completenessPercent,
      errors,
      warnings,
      counts: {
        yes: scoreCalculation.ja,
        no: scoreCalculation.nei,
        unclear: scoreCalculation.uklart,
        notApplicable: scoreCalculation.ikkeRelevant,
        unanswered: scoreCalculation.unanswered
      },
      scoreCalculation,
      verdictRecommendation,
      summaryVerdictSuggestion: verdictRecommendation.verdict,
      whoCompliance
    };
  }
}

// Export canonical alias for broad full-app appraisal validation
export { JbiQualitativeValidationService as AppraisalValidationEngine };
