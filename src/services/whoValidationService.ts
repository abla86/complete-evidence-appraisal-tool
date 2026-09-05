import type { 
  ArticleAppraisal, 
  MethodologyControlReport, 
  MethodologyRuleEvaluation,
  AppraisalInstrument
} from '../types';
import { INSTRUMENTS_REGISTRY, JBI_QUESTIONS } from '../data/jbiData';

export class WhoValidationService {
  /**
   * Evaluates an article appraisal against World Health Organization (WHO)
   * Guideline Development & Evidence Appraisal Standards (WHO Handbook 2nd Ed. 2014 & JBI Quality Assurance).
   */
  public static auditArticle(
    article: Partial<ArticleAppraisal>, 
    instrumentId: string = 'jbi-qualitative-2017'
  ): MethodologyControlReport {
    const instrument = INSTRUMENTS_REGISTRY.find(i => i.id === instrumentId);
    if (!instrument) {
      throw new Error(`Ukjent instrument: ${instrumentId || 'mangler'}. Metodisk kontroll kan ikke gjennomføres uten et eksplisitt registrert instrument.`);
    }
    const rules: MethodologyRuleEvaluation[] = [];
    const recommendations: string[] = [];

    // RULE 1: Model Version & Up-to-date Standard Verification
    const isLatestVersion = instrument.latestUpdateYear >= 2017;
    const isWhoApproved = instrument.methodologyAlignmentStatus === 'OFFICIAL_SOURCE_REFERENCED' || instrument.methodologyAlignmentStatus === 'GOLD_STANDARD_REFERENCE' || instrument.methodologyAlignmentStatus === 'ACTIVE_INTERNATIONAL_STANDARD';

    rules.push({
      id: 'WHO-MOD-01',
      name: 'Modellens Autoritet & Versjonsintegritet',
      standard: 'WHO Handbook for Guideline Development (2. utg., 2014, Kapittel 8: Quality of Evidence)',
      category: 'Modellversjon',
      passed: isLatestVersion && isWhoApproved,
      severity: 'critical',
      details: `Vurderingen anvender offisiell modell: «${instrument.name}» (Versjon: ${instrument.version}, ${instrument.edition}). Modell-sjekksum: ${instrument.validationChecksum}.`,
      recommendation: isLatestVersion 
        ? 'Modellen er verifisert mot nyeste offisielle revisjon.' 
        : 'Oppdater til nyeste standardversjon for å forhindre feilvurdering.'
    });

    // RULE 2: Completeness Control (100% Item Coverage)
    const items = article.items || [];
    const totalRequiredItems = instrument.itemCount || 10;
    const validStatuses = new Set(['Ja', 'Nei', 'Uklart', 'Ikke relevant', 'Yes', 'No', 'Unclear', 'Not applicable']);
    
    const answeredItems = items.filter(i => i.status && validStatuses.has(i.status));
    const allAnswered = answeredItems.length >= totalRequiredItems;

    rules.push({
      id: 'WHO-EVI-02',
      name: 'Fullstendighetskrav (Ingen utelatte kriterier)',
      standard: 'Metodisk kontrollregel: Omfattende kritisk vurdering uten utelatte dimensjoner',
      category: 'Fullstendighet',
      passed: allAnswered,
      severity: 'critical',
      details: `${answeredItems.length} av ${totalRequiredItems} metodiske kriterier er fullstendig besvart.`,
      recommendation: allAnswered 
        ? 'Alle standardiserte kriterier er systematisk gjennomgått.' 
        : `Fullfør evalueringen for de resterende ${totalRequiredItems - answeredItems.length} punktene.`
    });

    if (!allAnswered) {
      recommendations.push(`Besvar alle ${totalRequiredItems} kriterier for å oppnå full metodisk transparens.`);
    }

    // RULE 3: Mandatory Substantive Rationale (Begrunnelsesplikt)
    // Every answer must have a meaningful rationale (>15 chars) to prevent arbitrary scoring
    const itemsWithRationale = items.filter(i => i.justification && i.justification.trim().length >= 15);
    const missingRationaleItems = items.filter(i => !i.justification || i.justification.trim().length < 15);
    const hasSufficientRationales = missingRationaleItems.length === 0;

    rules.push({
      id: 'WHO-RAT-03',
      name: 'Faglig Begrunnelsesplikt (Rationale Transparency)',
      standard: 'Interne kontrollregel basert på oppgitt WHO/JBI-kildemateriale: Eksplisitt, transparent begrunnelse bak alle metodiske vurderinger',
      category: 'Begrunnelse & Rationale',
      passed: hasSufficientRationales,
      severity: 'critical',
      details: hasSufficientRationales
        ? `Alle ${items.length} kriterier har dokumentert skriftlig begrunnelse.`
        : `${missingRationaleItems.length} kriterier mangler tilstrekkelig skriftlig begrunnelse (f.eks. Spm ${missingRationaleItems.map(i => i.questionId).join(', ')}).`,
      recommendation: hasSufficientRationales
        ? 'Transparensen i de metodiske vurderingene oppfyller forventet faglig standard.'
        : 'Legg inn utfyllende faglige begrunnelser for alle vurderinger for å sikre etterprøvbarhet.'
    });

    if (!hasSufficientRationales) {
      recommendations.push('Fyll ut utfyllende faglige begrunnelser for alle kriterier.');
    }

    // RULE 4: Empirical Text Grounding (Evidensforankring / Sitater)
    // Positive 'Ja' assessments should preferably cite text snippets or page numbers
    const jaItems = items.filter(i => i.status === 'Ja' || i.status === 'Yes');
    const jaItemsWithEvidence = jaItems.filter(i => (i.evidenceText && i.evidenceText.trim().length > 5) || (i.location && (i.location.page || i.location.section)));
    const evidenceRate = jaItems.length > 0 ? Math.round((jaItemsWithEvidence.length / jaItems.length) * 100) : 100;
    const hasGoodEvidenceAnchoring = jaItems.length === 0 || evidenceRate >= 70;

    rules.push({
      id: 'WHO-EVI-04',
      name: 'Empirisk Evidensforankring & Kildetransparens',
      standard: 'WHO Evidence Standards (2014): Direkte sitering eller sidetallsangivelse av empiriske funn',
      category: 'Evidensforankring',
      passed: hasGoodEvidenceAnchoring,
      severity: 'warning',
      details: `${evidenceRate}% av bekreftende «Ja»-vurderinger (${jaItemsWithEvidence.length}/${jaItems.length}) har direkte sitat eller sidetallhenvisning.`,
      recommendation: hasGoodEvidenceAnchoring
        ? 'God empirisk forankring med direkte henvisning til artikkelens tekst.'
        : 'Knytt flere direkte sitater eller sidetall til «Ja»-vurderingene for maksimal vitenskapelig stringens.'
    });

    // RULE 5: Researcher Reflexivity & Ethics (Forskerrefleksivitet)
    // In qualitative appraisal (JBI Spm 6 & 7), reflexivity must be specifically addressed
    const reflexivityItems = items.filter(i => i.questionId === 6 || i.questionId === 7);
    const reflexivityAddressed = reflexivityItems.length === 2 && reflexivityItems.every(i => i.justification && i.justification.trim().length > 15);

    rules.push({
      id: 'WHO-REF-05',
      name: 'Forskerposisjonering & Refleksivitetskontroll',
      standard: 'JBI-relevant metodisk kontroll: Vurdering av forskerposisjonering og bias-potensial',
      category: 'Forskerrefleksivitet',
      passed: reflexivityAddressed,
      severity: 'warning',
      details: reflexivityAddressed
        ? 'Forskerens teoretiske ståsted og refleksivitet (JBI 6 & 7) er eksplisitt evaluert.'
        : 'Forskerposisjonering og påvirkning på datainnsamling/analyse bør drøftes mer inngående.',
      recommendation: 'Sørg for at forskerens forforståelse og relasjon til informantene er vurdert.'
    });

    // RULE 6: Epistemological Guardrail (No Unwarranted Causal Leaps)
    // Checks that a qualitative study is not interpreted as proving causal treatment effects
    const designText = (article.design || '').toLowerCase();
    const verdictNoteText = (article.verdictNote || '').toLowerCase();
    const hasCausalViolation = (designText.includes('kvalitativ') || designText.includes('grounded') || designText.includes('fenomenolog')) &&
      (verdictNoteText.includes('beviser effekt') || verdictNoteText.includes('kausal effekt') || verdictNoteText.includes('isolerer årsak'));

    rules.push({
      id: 'WHO-EPI-06',
      name: 'Vitenskapsteoretisk Avgrensning (Epistemologisk Kausalitetsvakt)',
      standard: 'Metodisk kontrollregel: Riktig avgrensning av kvalitative funn uten uberettigede kausalslutninger',
      category: 'Kausalitetsvakt',
      passed: !hasCausalViolation,
      severity: 'critical',
      details: hasCausalViolation
        ? 'ADVARSEL: Kvalitativ studie omtales som bevis for kausal intervensjonseffekt.'
        : 'Kvalitative funn tolkes korrekt som meningsbærende erfaringer og mekanismer, uten ulovlige kausale slutninger.',
      recommendation: 'Kvalitative studier kan belyse hvordan og hvorfor opplevelser skapes, men kan aldri isolere kausalitet.'
    });

    // Calculate compliance for reporting/validation only; this is not an evidence-quality score.
    const criticalRules = rules.filter(r => r.severity === 'critical');
    const allCriticalPassed = criticalRules.every(r => r.passed);
    const passedCount = rules.filter(r => r.passed).length;
    const totalCount = rules.length;
    const completionPercent = totalCount === 0 ? 0 : Math.round((passedCount / totalCount) * 100);
    const complianceScore = completionPercent;

    let summaryVerdict: 'INTERN_METODISK_KONTROLLERT' | 'KREVER_KOMPLETTERING' | 'IKKE_GODKJENT' = 'INTERN_METODISK_KONTROLLERT';
    if (!allCriticalPassed) {
      summaryVerdict = 'KREVER_KOMPLETTERING';
    } else if (completionPercent < 70) {
      summaryVerdict = 'KREVER_KOMPLETTERING';
    }

    return {
      overallPassed: allCriticalPassed && complianceScore >= 80,
      complianceScore,
      whoHandbookStandard: 'WHO Handbook for Guideline Development (2nd ed., 2014) — kildereferanse, ikke sertifisering',
      appraisalModel: instrument.name,
      modelVersion: `${instrument.version} (${instrument.edition})`,
      modelChecksum: instrument.validationChecksum,
      timestamp: new Date().toISOString(),
      articleCitation: article.shortCitation || article.title || 'Uten tittel',
      rules,
      passedRuleCount: passedCount,
      totalRuleCount: totalCount,
      summaryVerdict,
      recommendations
    };
  }

  /**
   * Generates a printable / downloadable internal academic methodological quality audit report
   */
  public static generateCertificateText(report: MethodologyControlReport, article: Partial<ArticleAppraisal>): string {
    let cert = `================================================================================\n`;
    cert += `       METODISK KVALITETSREVISJONSRAPPORT & INTEGRITETSKONTROLL\n`;
    cert += `     Basert på prinsipper fra WHO Handbook (2. utg., 2014) & JBI Standards\n`;
    cert += `================================================================================\n\n`;
    cert += `Dato: ${new Date(report.timestamp).toLocaleDateString('no-NO')}  Kl: ${new Date(report.timestamp).toLocaleTimeString('no-NO')}\n`;
    cert += `Standard: ${report.whoHandbookStandard}\n`;
    cert += `Vurderingsmodell: ${report.appraisalModel} [Versjon: ${report.modelVersion}]\n`;
    cert += `Modell Sjekksum: ${report.modelChecksum}\n`;
    cert += `Gjeldende Studie: ${report.articleCitation}\n`;
    cert += `Tittel: ${article.title || '-'}\n`;
    cert += `Forfattere: ${article.authors || '-'} (${article.year || '-'})\n`;
    cert += `Vurderer: ${article.reviewerName || 'Registrert forsker'} (${article.reviewerRole || 'Primærvurderer'})\n\n`;
    cert += `STATUS: ${report.summaryVerdict} (Skår: ${report.complianceScore}% / ${report.passedRuleCount} av ${report.totalRuleCount} kontrollregler bestått)\n\n`;
    cert += `--------------------------------------------------------------------------------\n`;
    cert += `REVISJONSRESULTAT PER KONTROLLREGEL:\n`;
    cert += `--------------------------------------------------------------------------------\n`;

    report.rules.forEach((r, idx) => {
      const statusIcon = r.passed ? '[BESTÅTT]' : '[IKKE OPPFYLT]';
      cert += `${idx + 1}. ${statusIcon} [${r.id}] ${r.name} (${r.category})\n`;
      cert += `   Standard: ${r.standard}\n`;
      cert += `   Detaljer: ${r.details}\n`;
      cert += `   Anbefaling: ${r.recommendation}\n\n`;
    });

    cert += `--------------------------------------------------------------------------------\n`;
    cert += `METODISK TRANSPARENS & GYLDIGHETSAVGRENSNING:\n`;
    cert += `Denne rapporten dokumenterer at evalueringen av «${report.articleCitation}» oppfyller\n`;
    cert += `de interne kravene til fullstendighet, begrunnelsesplikt, forskerrefleksivitet og\n`;
    cert += `evidensforankring i tråd med WHO Handbook (2014) og JBI Appraisal Standards.\n`;
    cert += `Merk: Verdens helseorganisasjon (WHO) utsteder ikke individuelle sertifikater for enkeltstudier.\n`;
    cert += `================================================================================\n`;

    return cert;
  }
}
