import { 
  MetaResearchReport, 
  MetaResearchClassification, 
  MetaResearchIntegrityDimension, 
  CandidateEvidence, 
  DocumentTypeCategory,
  MethodologyFamily 
} from '../types';
import { MASTER_INSTRUMENTS_REGISTRY } from '../data/masterRegistry';

export class MetaResearchService {
  /**
   * Deterministic NLP & Heuristic Classifier for Meta-Research
   */
  public static classifyAndAuditDocument(text: string, fileName: string = 'research-document.pdf'): MetaResearchReport {
    const raw = text || '';
    const lower = raw.toLowerCase();

    // 1. Extract metadata (Title, Authors, DOI, Year)
    const title = this.extractTitle(raw, fileName);
    const authors = this.extractAuthors(raw);
    const doi = this.extractDoi(raw);
    const year = this.extractYear(raw);
    const abstract = this.extractAbstract(raw);

    // 2. Identify Document Category & Methodology
    const classification = this.determineClassification(lower, raw);

    // 3. Evaluate 9 Meta-Research Integrity Dimensions (Research-on-Research Gate)
    const integrityDimensions = this.evaluateIntegrityDimensions(lower, raw, classification.documentType);

    // 4. Determine Overall Integrity Level
    const highCount = integrityDimensions.filter(d => d.score === 'HIGH').length;
    const lowCount = integrityDimensions.filter(d => d.score === 'LOW').length;
    const unclearCount = integrityDimensions.filter(d => d.score === 'UNCLEAR').length;

    let overallIntegrityLevel: 'HIGH_INTEGRITY' | 'MODERATE_INTEGRITY' | 'REPORTING_DEFICIT' | 'HIGH_RISK_OF_BIAS' = 'MODERATE_INTEGRITY';
    if (lowCount >= 3) {
      overallIntegrityLevel = 'HIGH_RISK_OF_BIAS';
    } else if (lowCount >= 1 || unclearCount >= 3) {
      overallIntegrityLevel = 'REPORTING_DEFICIT';
    } else if (highCount >= 6) {
      overallIntegrityLevel = 'HIGH_INTEGRITY';
    }

    // 5. Extract Candidate Evidence Snippets
    const candidateEvidence = this.extractCandidateEvidence(raw, lower);

    // 6. Summary, Strengths, Risks
    const keyStrengths: string[] = [];
    const potentialMethodologicalRisks: string[] = [];

    integrityDimensions.forEach(dim => {
      if (dim.score === 'HIGH') {
        keyStrengths.push(`${dim.name}: ${dim.assessment}`);
      } else if (dim.score === 'LOW') {
        potentialMethodologicalRisks.push(`${dim.name}: ${dim.recommendation}`);
      }
    });

    if (keyStrengths.length === 0) {
      keyStrengths.push('Artikkelen inneholder strukturert fagtekst egnet for metodisk kildekontroll.');
    }
    if (potentialMethodologicalRisks.length === 0) {
      potentialMethodologicalRisks.push('Ingen alvorlige metodiske brudd identifisert ved automatisk screening.');
    }

    const integritySummary = `Dokumentet er klassifisert som «${classification.documentTypeName}» innen familien «${classification.methodologyType}». ` +
      `Integritetsscreening viser ${highCount} sterke dimensjoner, ${unclearCount} uavklarte og ${lowCount} metodiske risikopunkter. ` +
      `Anbefalt primærinstrument: ${classification.recommendedInstrumentId.toUpperCase()}.`;

    return {
      id: `meta-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      fileName,
      extractedTitle: title,
      extractedAuthors: authors,
      extractedDoi: doi,
      extractedYear: year,
      extractedAbstract: abstract,
      classification,
      integrityDimensions,
      overallIntegrityLevel,
      integritySummary,
      keyStrengths,
      potentialMethodologicalRisks,
      candidateEvidence,
      generatedAt: new Date().toISOString(),
      engineUsed: 'DETERMINISTIC_FALLBACK'
    };
  }

  private static determineClassification(lower: string, raw: string): MetaResearchClassification {
    const detectedKeywords: string[] = [];

    // Check Systematic Review / Meta-analysis
    if (
      lower.includes('systematic review') ||
      lower.includes('systematisk oversikt') ||
      lower.includes('meta-analysis') ||
      lower.includes('metaanalyse') ||
      lower.includes('prisma') ||
      lower.includes('prospero')
    ) {
      detectedKeywords.push('systematic review', 'database search', 'synthesis');
      return {
        documentType: 'SECONDARY_SYSTEMATIC_REVIEW',
        documentTypeName: 'Systematisk kunnskapsoppsummering / Meta-analyse',
        methodologyType: 'Kunnskapsoppsummering / Syntese',
        epistemology: 'Empirisk-syntetiserende / Post-positivistisk',
        confidenceScore: 94,
        detectedKeywords,
        rationale: 'Teksten inneholder eksplisitte kjennetegn på systematisk oversikt (søkestrenger, seleksjonskriterier og synteseprotokoll).',
        unitOfAnalysis: 'Publiserte primærstudier (artikkel-/effektnivå)',
        recommendedInstrumentId: 'amstar-2',
        alternativeInstrumentIds: ['casp-systematic-review', 'prisma-2020', 'grade'],
        incompatibleInstrumentIds: ['jbi-qualitative-2017', 'rob-2', 'quadas-2']
      };
    }

    // Check Qualitative Metasynthesis
    if (
      lower.includes('meta-synthesis') ||
      lower.includes('metasyntese') ||
      lower.includes('meta-ethnography') ||
      lower.includes('qualitative evidence synthesis') ||
      lower.includes('thematic synthesis')
    ) {
      detectedKeywords.push('qualitative synthesis', 'meta-ethnography', 'cerqual');
      return {
        documentType: 'SECONDARY_QUALITATIVE_SYNTHESIS',
        documentTypeName: 'Kvalitativ metasyntese / Kunnskapsoppsummering',
        methodologyType: 'Kunnskapsoppsummering / Syntese',
        epistemology: 'Konstruktivistisk / Hermeneutisk syntese',
        confidenceScore: 92,
        detectedKeywords,
        rationale: 'Teksten syntetiserer kvalitative funn og begreper fra flere uavhengige primærstudier.',
        unitOfAnalysis: 'Kvalitative primærstudier og funn/temaer',
        recommendedInstrumentId: 'grade-cerqual',
        alternativeInstrumentIds: ['jbi-qualitative-2017', 'casp-systematic-review'],
        incompatibleInstrumentIds: ['rob-2', 'amstar-2', 'robins-i']
      };
    }

    // Check Clinical Practice Guideline
    if (
      lower.includes('guideline') ||
      lower.includes('retningslinje') ||
      lower.includes('faglige retningslinjer') ||
      lower.includes('anbefalinger for klinisk') ||
      lower.includes('agree ii') ||
      lower.includes('helsedirektoratet')
    ) {
      detectedKeywords.push('guideline', 'clinical recommendations', 'stakeholder involvement');
      return {
        documentType: 'CLINICAL_GUIDELINE',
        documentTypeName: 'Klinisk retningslinje / Faglige behandlingsanbefalinger',
        methodologyType: 'Klinisk retningslinje',
        epistemology: 'Evidensbasert normativ praksis',
        confidenceScore: 95,
        detectedKeywords,
        rationale: 'Dokumentet formulerer normative kliniske eller helsefaglige handlingsanbefalinger for praksis.',
        unitOfAnalysis: 'Retningslinjedokument og konsensusanbefalinger',
        recommendedInstrumentId: 'agree-ii',
        alternativeInstrumentIds: ['grade'],
        incompatibleInstrumentIds: ['jbi-qualitative-2017', 'casp-rct', 'rob-2']
      };
    }

    // Check Mixed Methods
    if (
      lower.includes('mixed method') ||
      lower.includes('blandet metode') ||
      lower.includes('convergent parallel') ||
      lower.includes('sequential explanatory') ||
      lower.includes('qualitative and quantitative')
    ) {
      detectedKeywords.push('mixed methods', 'integration', 'qualitative + quantitative');
      return {
        documentType: 'PRIMARY_MIXED_METHODS',
        documentTypeName: 'Primærstudie med blandede metoder (Mixed Methods)',
        methodologyType: 'Blandet metode (Mixed Methods)',
        epistemology: 'Pragmatisme / Dialektisk pluralisme',
        confidenceScore: 91,
        detectedKeywords,
        rationale: 'Studien kombinerer kvalitative intervjuer/observasjoner med kvantitative målinger og krever vurdering av dataintegrasjon.',
        unitOfAnalysis: 'Mixed methods primærstudie (artikkelnivå)',
        recommendedInstrumentId: 'mmat-2018',
        alternativeInstrumentIds: ['jbi-qualitative-2017', 'casp-qualitative'],
        incompatibleInstrumentIds: ['amstar-2', 'agree-ii', 'prisma-2020']
      };
    }

    // Check Diagnostic Accuracy
    if (
      lower.includes('diagnostic accuracy') ||
      lower.includes('sensitivity and specificity') ||
      lower.includes('sensitivitet og spesifisitet') ||
      lower.includes('reference standard') ||
      lower.includes('index test') ||
      lower.includes('roc curve')
    ) {
      detectedKeywords.push('diagnostic accuracy', 'sensitivity', 'gold standard', 'index test');
      return {
        documentType: 'PRIMARY_DIAGNOSTIC',
        documentTypeName: 'Diagnostisk nøyaktighetsstudie / Testvalidering',
        methodologyType: 'Diagnostikk & Prediksjon',
        epistemology: 'Empirisk-kvantitativ testvalidering',
        confidenceScore: 93,
        detectedKeywords,
        rationale: 'Studien evaluerer diagnostisk treffsikkerhet (sensitivitet, spesifisitet, prediktive verdier) mot en referansestandard.',
        unitOfAnalysis: 'Diagnostisk test og pasientutfall',
        recommendedInstrumentId: 'quadas-2',
        alternativeInstrumentIds: ['grade'],
        incompatibleInstrumentIds: ['jbi-qualitative-2017', 'agree-ii', 'cfir-2']
      };
    }

    // Check RCT / Experimental
    if (
      lower.includes('randomized') ||
      lower.includes('randomised') ||
      lower.includes('randomisert') ||
      lower.includes('placebo') ||
      lower.includes('double-blind') ||
      lower.includes('control group') ||
      lower.includes('clinical trial')
    ) {
      detectedKeywords.push('randomized', 'control group', 'intervention effect', 'blinding');
      return {
        documentType: 'PRIMARY_QUANT_RCT',
        documentTypeName: 'Randomisert kontrollert forsøk (RCT) / Eksperimentell studie',
        methodologyType: 'Kvantitativ (Eksperimentell)',
        epistemology: 'Positivistisk / Kausal-empirisk',
        confidenceScore: 96,
        detectedKeywords,
        rationale: 'Studien benytter randomisering til intervensjons- og kontrollgruppe for å evaluere kausal effekt.',
        unitOfAnalysis: 'Spesifikke effekt- og bivirkningsutfall (outcome-level)',
        recommendedInstrumentId: 'rob-2',
        alternativeInstrumentIds: ['casp-rct', 'mmat-2018'],
        incompatibleInstrumentIds: ['jbi-qualitative-2017', 'casp-qualitative', 'agree-ii']
      };
    }

    // Check Cohort / Observational
    if (
      lower.includes('cohort') ||
      lower.includes('kohort') ||
      lower.includes('longitudinal') ||
      lower.includes('prospektiv') ||
      lower.includes('retrospective') ||
      lower.includes('follow-up period') ||
      lower.includes('register-based')
    ) {
      detectedKeywords.push('cohort', 'longitudinal follow-up', 'relative risk', 'exposure');
      return {
        documentType: 'PRIMARY_QUANT_OBSERVATIONAL',
        documentTypeName: 'Observasjonsstudie / Kohortstudie / Registerforskning',
        methodologyType: 'Kvantitativ (Observasjonell)',
        epistemology: 'Epidemiologisk / Kvantitativ observasjonell',
        confidenceScore: 89,
        detectedKeywords,
        rationale: 'Studien observerer en definert kohort eller registerpopulasjon over tid for å undersøke sammenheng mellom eksponering og utfall.',
        unitOfAnalysis: 'Kohort og observerte utfallsmål',
        recommendedInstrumentId: 'robins-i',
        alternativeInstrumentIds: ['casp-cohort', 'jbi-cross-sectional', 'mmat-2018'],
        incompatibleInstrumentIds: ['jbi-qualitative-2017', 'agree-ii']
      };
    }

    // Check Implementation / Quality Improvement
    if (
      lower.includes('implementation') ||
      lower.includes('implementering') ||
      lower.includes('cfir') ||
      lower.includes('barriers and facilitators') ||
      lower.includes('quality improvement') ||
      lower.includes('kvalitetsforbedring') ||
      lower.includes('tjenesteinnovasjon')
    ) {
      detectedKeywords.push('implementation', 'barriers', 'determinants', 'cfir');
      return {
        documentType: 'IMPLEMENTATION_QUALITY_IMPROVEMENT',
        documentTypeName: 'Implementeringsstudie / Kvalitetsforbedring & Praksisendring',
        methodologyType: 'Implementering & Forbedring',
        epistemology: 'Kontekstuell / Tjenestevitenskapelig',
        confidenceScore: 90,
        detectedKeywords,
        rationale: 'Studien undersøker implementeringsdeterminanter, organisatoriske barrierer og praksisendring i helse- og velferdstjenestene.',
        unitOfAnalysis: 'Implementeringsprosess og organisasjonskontekst',
        recommendedInstrumentId: 'cfir-2',
        alternativeInstrumentIds: ['kta', 'mmat-2018'],
        incompatibleInstrumentIds: ['rob-2', 'amstar-2']
      };
    }

    // Default to Qualitative Research
    detectedKeywords.push('intervju', 'meningsbærende strukturer', 'tematisk analyse', 'opplevelser');
    return {
      documentType: 'PRIMARY_QUALITATIVE',
      documentTypeName: 'Kvalitativ primærforskning (Intervjuer, observasjon, hermeneutikk, fenomenologi)',
      methodologyType: 'Kvalitativ',
      epistemology: 'Konstruktivistisk / Hermeneutisk / Fenomenologisk',
      confidenceScore: 95,
      detectedKeywords,
      rationale: 'Teksten utforsker deltakeres levde erfaringer, meningsdannelse eller sosiale prosesser via kvalitative metoder.',
      unitOfAnalysis: 'Kvalitativ primærstudie (artikkelnivå)',
      recommendedInstrumentId: 'jbi-qualitative-2017',
      alternativeInstrumentIds: ['casp-qualitative', 'mmat-2018'],
      incompatibleInstrumentIds: ['rob-2', 'amstar-2', 'robins-i', 'quadas-2']
    };
  }

  private static evaluateIntegrityDimensions(
    lower: string, 
    raw: string, 
    docType: DocumentTypeCategory
  ): MetaResearchIntegrityDimension[] {
    const dimensions: MetaResearchIntegrityDimension[] = [];

    // 1. Research Question & Aim
    const hasAim = lower.includes('aim') || lower.includes('hensikt') || lower.includes('formål') || lower.includes('objective') || lower.includes('research question');
    const aimSnippet = this.extractContextSnippet(raw, ['aim', 'hensikt', 'formål', 'objective', 'research question']);
    dimensions.push({
      id: 'DIM-1-AIM',
      name: '1. Problemstilling & Formålstydelighet',
      category: 'Konseptuell stringens',
      score: hasAim ? 'HIGH' : 'LOW',
      foundSnippet: aimSnippet || 'Ingen eksplisitt formålssetning funnet i screening.',
      assessment: hasAim ? 'Artikkelen formulerer et eksplisitt forskningsspørsmål / formål.' : 'Uklar eller manglende formålsformulering.',
      recommendation: hasAim ? 'Oppretthold fokus på avgrensning av målgruppe og kontekst.' : 'Krev eksplisitt formulering av forskningsspørsmål.'
    });

    // 2. Methodological Congruence & Epistemological Fit
    const hasMethodology = lower.includes('method') || lower.includes('metode') || lower.includes('design') || lower.includes('fenomenolog') || lower.includes('grounded theory') || lower.includes('hermeneut');
    const methSnippet = this.extractContextSnippet(raw, ['methodology', 'metodologi', 'design', 'tilnærming', 'fenomenologisk', 'grounded theory']);
    dimensions.push({
      id: 'DIM-2-CONGRUENCE',
      name: '2. Metodisk Koherens & Filosofisk Forankring',
      category: 'Epistemologisk integritet',
      score: hasMethodology ? 'HIGH' : 'MODERATE',
      foundSnippet: methSnippet || 'Metodologisk tilnærming er kortfattet beskrevet.',
      assessment: hasMethodology ? 'Tydelig sammenheng mellom forskningsspørsmål og valgt metodisk rammeverk.' : 'Metodisk tilnærming bør spesifiseres tydeligere.',
      recommendation: 'Kontroller at datainnsamling og analyse samsvarer med den filosofiske posisjonen.'
    });

    // 3. Sample Size / Saturation / Power Justification
    const hasSampleJust = lower.includes('saturation') || lower.includes('metning') || lower.includes('power calculation') || lower.includes('styrkeberegning') || lower.includes('sample size') || lower.includes('informant');
    const sampleSnippet = this.extractContextSnippet(raw, ['saturation', 'metning', 'power calculation', 'sample size', 'utvalgsstørrelse', 'rekruttering']);
    dimensions.push({
      id: 'DIM-3-SAMPLING',
      name: '3. Utvalgsbegrunnelse (Metning vs. Styrkeberegning)',
      category: 'Datainnsamling & Utvalg',
      score: hasSampleJust ? 'HIGH' : 'UNCLEAR',
      foundSnippet: sampleSnippet || 'Utvalgsstørrelse er oppgitt, men teoretisk metning / statistisk styrke er ikke eksplisitt begrunnet.',
      assessment: hasSampleJust ? 'Utvalgets størrelse og sammensetning er metodisk begrunnet.' : 'Begrunnelse for utvalgsstørrelse er mangelfull eller overfladisk.',
      recommendation: 'Verifiser om studien har oppnådd empirisk dybde eller tilstrekkelig statistisk power.'
    });

    // 4. Researcher Reflexivity & Positioning
    const hasReflexivity = lower.includes('reflexiv') || lower.includes('refleksivitet') || lower.includes('forforståelse') || lower.includes('positionality') || lower.includes('preunderstanding') || lower.includes('insider');
    const refSnippet = this.extractContextSnippet(raw, ['reflexiv', 'refleksivitet', 'forforståelse', 'positionality', 'preunderstanding']);
    const isQual = docType === 'PRIMARY_QUALITATIVE' || docType === 'PRIMARY_MIXED_METHODS';
    dimensions.push({
      id: 'DIM-4-REFLEXIVITY',
      name: '4. Forskerrefleksivitet & Posisjonering (WHO/JBI Kjerne)',
      category: 'Forskerrolle & Skjevhet',
      score: hasReflexivity ? 'HIGH' : isQual ? 'LOW' : 'NOT_APPLICABLE',
      foundSnippet: refSnippet || (isQual ? 'Ingen eksplisitt redegjørelse for forskerens forforståelse eller rolle funnet.' : 'Ikke påkrevd som eget kjerneavsnitt for dette studiedesignet.'),
      assessment: hasReflexivity ? 'Forskerne redegjør eksplisitt for egen forforståelse og rolle i datainnsamlingen.' : isQual ? 'Mangler eksplisitt redegjørelse for forskerposisjon (brudd på JBI pkt 6/7).' : 'Ikke primært anvendelig for kvantitative oversikter.',
      recommendation: isQual ? 'Menneskelig vurdering må undersøke om forskerens rolle kan ha påvirket intervjuene.' : 'Vurder protokollering av uavhengige ekstraktører.'
    });

    // 5. Research Ethics & Informed Consent
    const hasEthics = lower.includes('ethics') || lower.includes('etikk') || lower.includes('rek') || lower.includes('nsd') || lower.includes('sikt') || lower.includes('consent') || lower.includes('samtykke') || lower.includes('helsinki');
    const ethSnippet = this.extractContextSnippet(raw, ['ethics', 'etisk', 'rek', 'sikt', 'nsd', 'consent', 'samtykke', 'helsinki']);
    dimensions.push({
      id: 'DIM-5-ETHICS',
      name: '5. Forskningsetikk & Informert Samtykke',
      category: 'Etisk etterlevelse',
      score: hasEthics ? 'HIGH' : 'LOW',
      foundSnippet: ethSnippet || 'Ingen referanse til etisk komité (REK/SIKT/IRB) eller informert samtykke identifisert.',
      assessment: hasEthics ? 'Etisk godkjenning og informert samtykke er formelt dokumentert.' : 'Manglende etisk godkjenning eller samtykkedeklarasjon (Alvorlig avvik).',
      recommendation: hasEthics ? 'Bekreft at godkjenningsnummer er sporbart.' : 'Undersøk om etisk dispensasjon foreligger.'
    });

    // 6. Pre-Registration & Protocol Transparency
    const hasReg = lower.includes('prospero') || lower.includes('clinicaltrials.gov') || lower.includes('osf') || lower.includes('registered') || lower.includes('protocol') || lower.includes('forhåndsregistrert');
    const regSnippet = this.extractContextSnippet(raw, ['prospero', 'clinicaltrials', 'osf', 'protocol', 'registrert']);
    dimensions.push({
      id: 'DIM-6-REGISTRATION',
      name: '6. Forhåndsregistrering & Åpen Protokoll (Open Science)',
      category: 'Transparens & Repliserbarhet',
      score: hasReg ? 'HIGH' : 'UNCLEAR',
      foundSnippet: regSnippet || 'Ingen eksplisitt protokollregistrering (f.eks. PROSPERO, OSF, ClinicalTrials.gov) funnet.',
      assessment: hasReg ? 'Studien/oversikten er forhåndsregistrert med tilgjengelig protokoll.' : 'Uregistrert studie eller upresisert protokollreferanse.',
      recommendation: 'Sjekk for mulige selektive utfallsendringer mot opprinnelig plan.'
    });

    // 7. Funding Source & Conflicts of Interest
    const hasFunding = lower.includes('funding') || lower.includes('finansier') || lower.includes('conflict of interest') || lower.includes('interessekonflikt') || lower.includes('grant') || lower.includes('competing interests');
    const fundSnippet = this.extractContextSnippet(raw, ['funding', 'finansiering', 'conflict of interest', 'interessekonflikter', 'competing']);
    dimensions.push({
      id: 'DIM-7-FUNDING',
      name: '7. Finansiering & Interessekonflikter',
      category: 'Uavhengighet & Integritet',
      score: hasFunding ? 'HIGH' : 'LOW',
      foundSnippet: fundSnippet || 'Ingen eksplisitt finansierings- eller interessekonfliktdeklarasjon funnet.',
      assessment: hasFunding ? 'Finansieringskilder og eventuelle interessekonflikter er deklarert.' : 'Mangler deklarasjon om finansiering eller interessekonflikter.',
      recommendation: 'Verifiser at kommersielle sponsorer ikke har styrt analysen.'
    });

    // 8. Open Data & FAIR Sharing Statement
    const hasDataShare = lower.includes('data availability') || lower.includes('tilgjengelighet av data') || lower.includes('repository') || lower.includes('zenodo') || lower.includes('upon reasonable request');
    const dataSnippet = this.extractContextSnippet(raw, ['data availability', 'tilgjengelighet av data', 'repository', 'zenodo', 'raw data']);
    dimensions.push({
      id: 'DIM-8-OPEN-DATA',
      name: '8. Datatilgjengelighet & FAIR Deling',
      category: 'Transparens & Repliserbarhet',
      score: hasDataShare ? 'HIGH' : 'UNCLEAR',
      foundSnippet: dataSnippet || 'Ingen eksplisitt erklæring om datatilgjengelighet / datadeling identifisert.',
      assessment: hasDataShare ? 'Data-tilgjengelighetserklæring er oppgitt.' : 'Datadeling er uavklart eller begrenset til «upon request».',
      recommendation: 'Vurder om rådata/analysekode kan etterprøves i tråd med FAIR-prinsippene.'
    });

    // 9. Data-Grounded Conclusions (Anti-Overclaiming)
    const hasLimitations = lower.includes('limitation') || lower.includes('begrensning') || lower.includes('svakhet') || lower.includes('strengths and limitations');
    const limSnippet = this.extractContextSnippet(raw, ['limitation', 'begrensning', 'svakhet', 'strengths and limitations']);
    dimensions.push({
      id: 'DIM-9-GROUNDING',
      name: '9. Konklusjonens Dataforankring & Begrensninger (Anti-Slop)',
      category: 'Tolkning & Kausalitetsvern',
      score: hasLimitations ? 'HIGH' : 'MODERATE',
      foundSnippet: limSnippet || 'Forbehold og begrensninger er ikke eksplisitt framhevet i eget avsnitt.',
      assessment: hasLimitations ? 'Forfatterne drøfter eksplisitt metodiske begrensninger og unngår uforholdsmessige overgeneraliseringer.' : 'Begrensninger bør undersøkes nøye for å unngå overdrevne generaliseringer.',
      recommendation: 'Sjekk at konklusjonene ikke overskrider det empiriske datagrunnlaget.'
    });

    return dimensions;
  }

  private static extractCandidateEvidence(raw: string, lower: string): CandidateEvidence[] {
    const list: CandidateEvidence[] = [];

    // Extract quote for Q1 / Congruence
    const q1 = this.extractContextSnippet(raw, ['phenomenol', 'hermeneut', 'grounded theory', 'metodologisk', 'epistemol']);
    if (q1) {
      list.push({
        questionId: 1,
        relevanceScore: 92,
        suggestedLocation: { section: 'Metode & Vitenskapsteori' },
        extractedSnippet: q1,
        confidenceReason: 'Inneholder eksplisitt omtale av metodologisk og filosofisk forankring.',
        verifiedByResearcher: false
      });
    }

    // Extract quote for Q6 / Ethics & Reflexivity
    const q6 = this.extractContextSnippet(raw, ['forforståelse', 'reflexiv', 'posisjon', 'rolle', 'preunderstanding']);
    if (q6) {
      list.push({
        questionId: 6,
        relevanceScore: 88,
        suggestedLocation: { section: 'Forskerrolle & Forforståelse' },
        extractedSnippet: q6,
        confidenceReason: 'Inneholder redegjørelse for forskerens refleksivitet og forkunnskaper.',
        verifiedByResearcher: false
      });
    }

    // Extract quote for Q9 / Ethics approval
    const q9 = this.extractContextSnippet(raw, ['rek', 'sikt', 'nsd', 'ethics approval', 'samtykke', 'informert']);
    if (q9) {
      list.push({
        questionId: 9,
        relevanceScore: 95,
        suggestedLocation: { section: 'Etiske hensyn & Godkjenning' },
        extractedSnippet: q9,
        confidenceReason: 'Inneholder formell referanse til etisk godkjenning og samtykkeprosess.',
        verifiedByResearcher: false
      });
    }

    return list;
  }

  private static extractTitle(raw: string, fileName: string): string {
    const lines = raw.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    for (let i = 0; i < Math.min(lines.length, 5); i++) {
      const line = lines[i];
      if (line.length > 15 && line.length < 250 && !line.toLowerCase().startsWith('http') && !line.toLowerCase().startsWith('volume')) {
        return line;
      }
    }
    return fileName.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
  }

  private static extractAuthors(raw: string): string {
    const match = raw.match(/(?:by|av|authors?|forfattere?)\s*[:]\s*([^\n\r.]+)/i) ||
                  raw.match(/([A-Z][a-z]+,\s+[A-Z]\.(?:\s*[A-Z]\.)?(?:,\s+[A-Z][a-z]+,\s+[A-Z]\.)*)/);
    if (match && match[1]) {
      return match[1].trim();
    }
    return 'Forskere / Forfattergruppe';
  }

  private static extractDoi(raw: string): string | undefined {
    const doiMatch = raw.match(/10\.\d{4,9}\/[-._;()/:A-Z0-9]+/i);
    return doiMatch ? doiMatch[0] : undefined;
  }

  private static extractYear(raw: string): string {
    const yearMatch = raw.match(/\b(20[0-2][0-9]|19[8-9][0-9])\b/);
    return yearMatch ? yearMatch[0] : new Date().getFullYear().toString();
  }

  private static extractAbstract(raw: string): string {
    const abstractMatch = raw.match(/(?:abstract|sammendrag)\s*[:\n]\s*([\s\S]{100,600}?)(?:\n\s*(?:introduction|bakgrunn|keywords|nøkkelord|metode|methods))/i);
    if (abstractMatch && abstractMatch[1]) {
      return abstractMatch[1].trim();
    }
    return raw.slice(0, 350).trim() + '...';
  }

  private static extractContextSnippet(raw: string, keywords: string[]): string | null {
    const lower = raw.toLowerCase();
    for (const kw of keywords) {
      const idx = lower.indexOf(kw.toLowerCase());
      if (idx !== -1) {
        const start = Math.max(0, idx - 80);
        const end = Math.min(raw.length, idx + kw.length + 180);
        let snippet = raw.slice(start, end).replace(/\s+/g, ' ').trim();
        if (start > 0) snippet = '...' + snippet;
        if (end < raw.length) snippet = snippet + '...';
        return snippet;
      }
    }
    return null;
  }
}
