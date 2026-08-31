import { 
  StandardDocumentType, 
  MethodologicalApproach, 
  MethodologicalPurpose, 
  ClassificationConfidenceStatus, 
  DocumentClassificationResult, 
  InstrumentRoleType, 
  HumanVerificationDecision 
} from '../types';
import { MASTER_INSTRUMENTS_REGISTRY } from '../data/masterRegistry';
import { LegalActsIdentifierService } from './legalIdentifierService';

export class DocumentClassifierService {
  /**
   * Evidence-based document and study design classifier.
   * Never assumes a document is qualitative research or defaults to JBI Qualitative without evidence.
   */
  public static classifyDocument(
    rawText: string,
    providedMetadata?: {
      title?: string;
      authors?: string;
      journal?: string;
      doi?: string;
      pmid?: string;
    }
  ): DocumentClassificationResult {
    const text = (rawText || '').trim();
    const lower = text.toLowerCase();
    const title = (providedMetadata?.title || '').toLowerCase();
    const journal = (providedMetadata?.journal || '').toLowerCase();
    const fullContext = `${title} ${journal} ${lower}`;

    const signals: { signalType: string; value: string; foundIn: string }[] = [];
    const legalAnalysis = LegalActsIdentifierService.identifyLegalActs(text, providedMetadata?.title);

    // Quick explicit keyword check to allow classifying concise study design labels
    const hasExplicitKeywords = 
      fullContext.includes('kvalitativ') || 
      fullContext.includes('qualitative') || 
      fullContext.includes('intervju') || 
      fullContext.includes('interview') ||
      fullContext.includes('hermeneutikk') ||
      fullContext.includes('fenomenologi') ||
      fullContext.includes('grounded theory') ||
      fullContext.includes('rct') ||
      fullContext.includes('randomiz') ||
      fullContext.includes('randomis') ||
      fullContext.includes('systematic review') ||
      fullContext.includes('systematisk oversikt') ||
      fullContext.includes('meta-analysis') ||
      fullContext.includes('meta-analyse') ||
      fullContext.includes('scoping review') ||
      fullContext.includes('kartleggingsoversikt') ||
      fullContext.includes('mixed methods') ||
      fullContext.includes('blandet metode') ||
      fullContext.includes('kohort') ||
      fullContext.includes('cohort') ||
      fullContext.includes('case-control') ||
      fullContext.includes('kasus-kontroll') ||
      fullContext.includes('tverrsnitt') ||
      fullContext.includes('cross-sectional') ||
      fullContext.includes('diagnostic accuracy') ||
      fullContext.includes('diagnostisk nøyaktighet') ||
      fullContext.includes('guideline') ||
      fullContext.includes('retningslinje') ||
      fullContext.includes('veileder') ||
      fullContext.includes('cfir') ||
      fullContext.includes('psychometric') ||
      fullContext.includes('methodological study') ||
      fullContext.includes('metodestudie');

    // Fallback: Insufficient information / Too short / Empty
    if (text.length < 60 && !providedMetadata?.title && !hasExplicitKeywords) {
      return {
        documentType: 'UNKNOWN_UNCERTAIN',
        documentTypeName: 'Ukjent / kan ikke klassifiseres sikkert',
        isResearchDocument: null,
        studyDesign: 'Kan ikke fastslås – utilstrekkelig datagrunnlag',
        methodologicalApproach: 'Ukjent / Uavklart',
        methodologicalPurpose: 'Uavklart / Krever manuell presisering',
        confidenceScore: 0,
        confidenceStatus: 'INSUFFICIENT_INFORMATION',
        statusBadgeText: 'Kan ikke klassifiseres sikkert – manuell vurdering kreves',
        evidenceSignals: [],
        rationale: 'Tekstgrunnlaget er for kort eller ufullstendig til å gjennomføre en evidensbasert klassifisering. Ingen standardkategori kan tilordnes automatisk.',
        hasMetadataContentConflict: false,
        recommendedInstrumentId: 'jbi-qualitative-2017',
        recommendedInstrumentName: 'Manuell instrumentvalg påkrevd',
        recommendedInstrumentJustification: 'Dokumentet kan ikke klassifiseres automatisk. Forskeren må manuelt angi studiedesign og velge et godkjent appraisal-instrument.',
        alternativeInstruments: [],
        methodologicalLimitations: 'Uten identifisert design kan ingen validitetsregler eller sjekklister anvendes automatisk.',
        instrumentSourceAndAuthority: 'Krever manuell verifisering',
        instrumentRoleType: 'CRITICAL_APPRAISAL_ROB',
        humanDecision: { status: 'PENDING' },
        legalAnalysis
      };
    }

    // Check for Metadata vs Content Conflict
    let hasMetadataContentConflict = false;
    let conflictDetails: string | undefined = undefined;

    const metaImpliesReview = title.includes('systematic review') || title.includes('meta-analysis') || journal.includes('systematic reviews') || journal.includes('cochrane');
    const contentHasInterviews = lower.includes('semi-structured interview') || lower.includes('intervjuguide') || lower.includes('grounded theory') || lower.includes('thematic analysis');
    const contentHasNoSearch = !lower.includes('database') && !lower.includes('search strategy') && !lower.includes('søkestrategi') && !lower.includes('pubmed') && !lower.includes('medline');

    if (metaImpliesReview && contentHasInterviews && contentHasNoSearch) {
      hasMetadataContentConflict = true;
      conflictDetails = 'Tittel/metadata indikerer en systematisk oversikt, men innholdet beskriver kvalitative intervjuer uten søkestrategi i litteraturdatabaser.';
    }

    // -------------------------------------------------------------
    // 1. PROTOCOLS (Study Protocols, Review Protocols) - checked before completed reviews
    // -------------------------------------------------------------
    const isProtocol = 
      title.includes('protocol') ||
      fullContext.includes('protocol for a systematic review') ||
      fullContext.includes('study protocol') || 
      fullContext.includes('protokoll for') || 
      fullContext.includes('trial protocol') ||
      fullContext.includes('prospero registration protocol') ||
      fullContext.includes('systematic review protocol');

    if (isProtocol) {
      const isSRProtocol = fullContext.includes('systematic review') || fullContext.includes('meta-analysis') || fullContext.includes('prospero');
      const docType: StandardDocumentType = isSRProtocol ? 'PROTOCOL_SYSTEMATIC_REVIEW' : 'PROTOCOL';
      const docName = isSRProtocol ? 'Protokoll for systematisk oversikt' : 'Forskningsprotokoll / Studieprotokoll';

      signals.push({ signalType: 'Protocol Marker', value: 'Planlagt studiedesign og analyseprotokoll', foundIn: 'Tittel/Metode' });

      return {
        documentType: docType,
        documentTypeName: docName,
        isResearchDocument: true,
        studyDesign: isSRProtocol ? 'Protokoll for kunnskapsoppsummering' : 'Studieprotokoll',
        methodologicalApproach: 'Metodologi & Verktøyutvikling',
        methodologicalPurpose: 'Studieprotokoll / Prosjektplan',
        confidenceScore: 92,
        confidenceStatus: 'AI_CANDIDATE_REQUIRES_VERIFICATION',
        statusBadgeText: 'AI-kandidatforslag – krever verifisering (Protokoll)',
        evidenceSignals: signals,
        rationale: 'Dokumentet er en forhåndsdefinert forskningsprotokoll som beskriver planlagte metoder og analyser før datainnsamling/syntese fullføres.',
        hasMetadataContentConflict,
        conflictDetails,
        recommendedInstrumentId: 'prisma-2020',
        recommendedInstrumentName: 'PRISMA-P / PRISMA 2020 (Reporting Standard)',
        recommendedInstrumentJustification: 'PRISMA-P (Preferred Reporting Items for Systematic review and Meta-Analysis Protocols) gir standardisert veiledning for transparens i forhåndsregistrerte protokoller.',
        alternativeInstruments: [],
        methodologicalLimitations: 'Protokoller inneholder ikke empiriske resultater og kan ikke risikovurderes for publiserte utfallsmål.',
        instrumentSourceAndAuthority: 'PRISMA-P Statement (Moher et al., BMJ / PRISMA Group)',
        instrumentRoleType: 'REPORTING_STANDARD',
        humanDecision: { status: 'PENDING' },
        legalAnalysis
      };
    }

    // -------------------------------------------------------------
    // 2. GUIDELINES & POLICY DOCUMENTS (Non-Primary Research)
    // -------------------------------------------------------------
    const isNationalGuideline = 
      fullContext.includes('nasjonal faglig retningslinje') || 
      fullContext.includes('nasjonal veileder') || 
      fullContext.includes('helsedirektoratet') ||
      fullContext.includes('clinical practice guideline') ||
      fullContext.includes('faglige anbefalinger for');

    const isWhoOrInternationalGuideline = 
      fullContext.includes('who guideline') || 
      fullContext.includes('guidelines for clinical practice') ||
      fullContext.includes('evidence-based guideline') ||
      fullContext.includes('clinical guidance') ||
      (title.includes('guideline') && !title.includes('protocol'));

    const isPolicyOrPublicRecommendation = 
      fullContext.includes('public health policy') || 
      fullContext.includes('offentlig anbefaling') || 
      fullContext.includes('policy brief') ||
      fullContext.includes('helsepolitisk anbefaling');

    const isConsensusDocument = 
      (fullContext.includes('consensus statement') || fullContext.includes('konsensusdokument') || fullContext.includes('expert consensus')) &&
      !fullContext.includes('development and validation of a tool') &&
      !fullContext.includes('psychometric');

    if (isNationalGuideline || isWhoOrInternationalGuideline || isPolicyOrPublicRecommendation || isConsensusDocument) {
      let docType: StandardDocumentType = 'NATIONAL_CLINICAL_GUIDELINE';
      let docName = 'Nasjonal faglig retningslinje / Klinisk veileder';
      let purpose: MethodologicalPurpose = 'Kliniske handlingsanbefalinger';

      if (isPolicyOrPublicRecommendation) {
        docType = 'PUBLIC_RECOMMENDATION_POLICY';
        docName = 'Offentlig anbefaling / Policy-dokument';
      } else if (isConsensusDocument) {
        docType = 'CONSENSUS_DOCUMENT';
        docName = 'Konsensusdokument / Ekspertuttalelse';
      } else if (isWhoOrInternationalGuideline) {
        docType = 'CLINICAL_PRACTICE_GUIDELINE';
        docName = 'Klinisk praksisretningslinje (Internasjonal/WHO)';
      }

      signals.push({ signalType: 'Normative Recommendations', value: 'Kliniske/helsefaglige anbefalinger identifisert', foundIn: 'Tittel & Hovedtekst' });

      return {
        documentType: docType,
        documentTypeName: docName,
        isResearchDocument: false,
        studyDesign: 'Retningslinjeprosess / Evidensbasert anbefalingsutvikling',
        methodologicalApproach: 'Klinisk retningslinje / Normativ praksis',
        methodologicalPurpose: purpose,
        confidenceScore: 96,
        confidenceStatus: 'AI_CANDIDATE_REQUIRES_VERIFICATION',
        statusBadgeText: 'AI-kandidatforslag – krever verifisering (Ikke-forskningsartikkel)',
        evidenceSignals: signals,
        rationale: 'Dette dokumentet er identifisert som en klinisk eller faglig retningslinje/policy, IKKE en primærforskningsartikkel. Retningslinjer vurderes på metodisk rigiditet i utviklingsprosessen, ikke som enkeltstudier.',
        hasMetadataContentConflict,
        conflictDetails,
        recommendedInstrumentId: 'agree-ii',
        recommendedInstrumentName: 'AGREE II (Appraisal of Guidelines for Research & Evaluation)',
        recommendedInstrumentJustification: 'AGREE II er den internasjonale gullstandarden (23 items, 6 domener) for å vurdere metodisk kvalitet, transparens og utviklingsprosess for kliniske retningslinjer.',
        alternativeInstruments: [
          { id: 'grade', name: 'GRADE Evidence-to-Decision (EtD)', role: 'Vurdering av anbefalingsstyrke og balanse mellom fordeler og ulemper' }
        ],
        methodologicalLimitations: 'AGREE II vurderer retningslinjens utviklingsprosess og rapportering, men måler ikke den isolerte risikoen for bias i underliggende enkeltstudier direkte.',
        instrumentSourceAndAuthority: 'AGREE Next Steps Consortium / WHO Guidelines Review Committee (2014)',
        instrumentRoleType: 'GUIDELINE_APPRAISAL',
        humanDecision: { status: 'PENDING' },
        legalAnalysis
      };
    }

    // -------------------------------------------------------------
    // 3. METHODOLOGY STUDY / MEASUREMENT TOOL VALIDATION
    // -------------------------------------------------------------
    const isMethodologyStudy = 
      fullContext.includes('methodological study') || 
      fullContext.includes('metodestudie') || 
      fullContext.includes('development and validation of a tool') ||
      fullContext.includes('psychometric') ||
      fullContext.includes('critical appraisal tool development') ||
      (fullContext.includes('validation of a') && fullContext.includes('tool'));

    if (isMethodologyStudy) {
      signals.push({ signalType: 'Methodology Study Marker', value: 'Verktøyutvikling og metodologisk validering', foundIn: 'Tittel/Metode' });

      return {
        documentType: 'METHODOLOGY_STUDY',
        documentTypeName: 'Metodestudie / Verktøyvalidering',
        isResearchDocument: true,
        studyDesign: 'Metodestudie',
        methodologicalApproach: 'Metodologi & Verktøyutvikling',
        methodologicalPurpose: 'Metodisk rammeverk / Verktøy',
        confidenceScore: 92,
        confidenceStatus: 'AI_CANDIDATE_REQUIRES_VERIFICATION',
        statusBadgeText: 'AI-kandidatforslag – krever verifisering (Metodestudie)',
        evidenceSignals: signals,
        rationale: 'Dokumentet er en empirisk metodologisk studie som utvikler, tester eller evaluerer måleinstrumenter, analysemetoder eller appraisal-verktøy.',
        hasMetadataContentConflict,
        conflictDetails,
        recommendedInstrumentId: 'mmat-2018',
        recommendedInstrumentName: 'MMAT 2018 / Psykometrisk evalueringsmatrise',
        recommendedInstrumentJustification: 'MMAT eller spesifikk metodologisk/psykometrisk valideringsmatrise (f.eks. COSMIN) benyttes for metodiske studier.',
        alternativeInstruments: [],
        methodologicalLimitations: 'Vurderer verktøyets reliabilitet, validitet og anvendbarhet, ikke klinisk pasienteffekt.',
        instrumentSourceAndAuthority: 'Hong et al. / COSMIN Initiative for health measurement instruments',
        instrumentRoleType: 'CRITICAL_APPRAISAL_ROB',
        humanDecision: { status: 'PENDING' },
        legalAnalysis
      };
    }

    // -------------------------------------------------------------
    // 4. SECONDARY RESEARCH / KNOWLEDGE SYNTHESES (Scoping reviews, Systematic reviews, Syntheses)
    // -------------------------------------------------------------
    const isQualitativeSynthesis = 
      fullContext.includes('meta-synthesis') || 
      fullContext.includes('metasyntese') || 
      fullContext.includes('qualitative evidence synthesis') || 
      fullContext.includes('meta-ethnography') ||
      fullContext.includes('thematic synthesis of qualitative');

    const isScopingReview = 
      fullContext.includes('scoping review') || 
      fullContext.includes('scoping study') ||
      fullContext.includes('kartleggingsoversikt');

    const isMetaAnalysis = 
      (fullContext.includes('meta-analysis') || fullContext.includes('metaanalyse') || fullContext.includes('forest plot') || fullContext.includes('pooled odds ratio') || fullContext.includes('random-effects model')) &&
      (fullContext.includes('systematic review') || fullContext.includes('systematisk oversikt') || fullContext.includes('electronic databases'));

    const isSystematicReview = 
      fullContext.includes('systematic review') || 
      fullContext.includes('systematisk oversikt') || 
      fullContext.includes('systematic literature review') ||
      fullContext.includes('cochrane review');

    const isUmbrellaReview = 
      fullContext.includes('umbrella review') || 
      fullContext.includes('overview of reviews') ||
      fullContext.includes('oversikt over oversikter');

    const isRapidReview = fullContext.includes('rapid review') || fullContext.includes('hurtigoversikt');
    const isIntegrativeReview = fullContext.includes('integrative review') || fullContext.includes('integrativ oversikt');

    if (isQualitativeSynthesis) {
      signals.push({ signalType: 'Synthesis of Qualitative Studies', value: 'Meta-etnografi / Metasyntese av kvalitative primærstudier', foundIn: 'Metodedel' });

      return {
        documentType: 'QUALITATIVE_EVIDENCE_SYNTHESIS',
        documentTypeName: 'Kvalitativ evidenssyntese / Metasyntese',
        isResearchDocument: true,
        studyDesign: 'Kvalitativ metasyntese / Kunnskapsoppsummering',
        methodologicalApproach: 'Kunnskapsoppsummering / Syntese',
        methodologicalPurpose: 'Kvalitativ evidenssyntese',
        confidenceScore: 94,
        confidenceStatus: 'AI_CANDIDATE_REQUIRES_VERIFICATION',
        statusBadgeText: 'AI-kandidatforslag – krever verifisering (Kvalitativ syntese)',
        evidenceSignals: signals,
        rationale: 'Studien aggregerer og syntetiserer funn fra flere uavhengige kvalitative primærstudier for å utvikle nye konseptuelle modeller eller overordnede temaer.',
        hasMetadataContentConflict,
        conflictDetails,
        recommendedInstrumentId: 'grade-cerqual',
        recommendedInstrumentName: 'GRADE-CERQual (Confidence in the Evidence from Reviews of Qualitative research)',
        recommendedInstrumentJustification: 'GRADE-CERQual er den internasjonale gullstandarden for å vurdere tillit til funn fra kvalitative kunnskapsoppsummeringer basert på 4 kjernekomponenter (metodiske begrensninger, sammenheng, datamengde og relevans).',
        alternativeInstruments: [
          { id: 'jbi-qualitative-2017', name: 'JBI Qualitative Checklist', role: 'Vurdering av individuelle inkluderte primærstudier i syntesen' },
          { id: 'casp-systematic-review', name: 'CASP Systematic Review', role: 'Overordnet vurdering av syntesens metodikk' }
        ],
        methodologicalLimitations: 'GRADE-CERQual vurderer tilliten til syntetiserte kvalitative funn, ikke en numerisk kvalitetsskår for enkeltartikler.',
        instrumentSourceAndAuthority: 'Lewin et al., PLOS Medicine (2018) / Cochrane Qualitative Implementation Group',
        instrumentRoleType: 'EVIDENCE_CERTAINTY',
        humanDecision: { status: 'PENDING' },
        legalAnalysis
      };
    }

    if (isScopingReview) {
      signals.push({ signalType: 'Scoping Review Methodology', value: 'Kartlegging av kunnskapsfelt og omfang', foundIn: 'Formål/Tittel' });

      return {
        documentType: 'SCOPING_REVIEW',
        documentTypeName: 'Scoping review (Kartleggingsoversikt)',
        isResearchDocument: true,
        studyDesign: 'Scoping review / Metodisk kunnskapskartlegging',
        methodologicalApproach: 'Kunnskapsoppsummering / Syntese',
        methodologicalPurpose: 'Kunnskapssyntese / Meta-analyse',
        confidenceScore: 93,
        confidenceStatus: 'AI_CANDIDATE_REQUIRES_VERIFICATION',
        statusBadgeText: 'AI-kandidatforslag – krever verifisering (Scoping Review)',
        evidenceSignals: signals,
        rationale: 'Studien kartlegger utbredelse, nøkkelbegreper og forskningshull innen et bredt fagfelt uten nødvendigvis å utføre formell meta-analytisk effektestimering.',
        hasMetadataContentConflict,
        conflictDetails,
        recommendedInstrumentId: 'prisma-2020',
        recommendedInstrumentName: 'PRISMA-ScR / PRISMA 2020 (Reporting Guideline)',
        recommendedInstrumentJustification: 'PRISMA-ScR gir standardisert transparensveiledning for scoping reviews. AMSTAR 2 er primært beregnet på systematiske oversikter over intervensjonseffekter og er sjelden direkte egnet for rene kartleggingsoversikter.',
        alternativeInstruments: [
          { id: 'amstar-2', name: 'AMSTAR 2', role: 'Kun aktuelt dersom oversikten inkluderer systematisk kritisk appraisal av alle primærstudier' }
        ],
        methodologicalLimitations: 'PRISMA-ScR er en rapporteringsretningslinje, ikke et verktøy for å beregne bias i primærstudiene.',
        instrumentSourceAndAuthority: 'Tricco et al., Annals of Internal Medicine (2018) / JBI Scoping Review Guidance',
        instrumentRoleType: 'REPORTING_STANDARD',
        humanDecision: { status: 'PENDING' },
        legalAnalysis
      };
    }

    if (isUmbrellaReview || isRapidReview || isIntegrativeReview) {
      const docType: StandardDocumentType = isUmbrellaReview ? 'UMBRELLA_REVIEW' : isRapidReview ? 'RAPID_REVIEW' : 'INTEGRATIVE_REVIEW';
      const docName = isUmbrellaReview ? 'Umbrella review / Overview of reviews' : isRapidReview ? 'Rapid review (Hurtigoversikt)' : 'Integrativ review';

      signals.push({ signalType: 'Review Type Marker', value: docName, foundIn: 'Tittel & Sammendrag' });

      return {
        documentType: docType,
        documentTypeName: docName,
        isResearchDocument: true,
        studyDesign: docName,
        methodologicalApproach: 'Kunnskapsoppsummering / Syntese',
        methodologicalPurpose: 'Kunnskapssyntese / Meta-analyse',
        confidenceScore: 91,
        confidenceStatus: 'AI_CANDIDATE_REQUIRES_VERIFICATION',
        statusBadgeText: `AI-kandidatforslag – krever verifisering (${docName})`,
        evidenceSignals: signals,
        rationale: `Dokumentet representerer en spesialisert oversiktstype (${docName}) med tilpasset litteratursøk og syntesestrategi.`,
        hasMetadataContentConflict,
        conflictDetails,
        recommendedInstrumentId: 'amstar-2',
        recommendedInstrumentName: 'AMSTAR 2 / ROBIS',
        recommendedInstrumentJustification: 'Systematiske kunnskapsoppsummeringer evalueres primært med AMSTAR 2 for kvantitative synteser eller ROBIS for risiko for bias.',
        alternativeInstruments: [
          { id: 'prisma-2020', name: 'PRISMA 2020', role: 'Rapporteringsstandard' }
        ],
        methodologicalLimitations: 'Hurtigoversikter har ofte metodiske snarveier i søk eller screening som må dokumenteres eksplisitt.',
        instrumentSourceAndAuthority: 'Shea et al., BMJ (2017) / Whiting et al., J Clin Epidemiol (2016)',
        instrumentRoleType: 'CRITICAL_APPRAISAL_ROB',
        humanDecision: { status: 'PENDING' },
        legalAnalysis
      };
    }

    if (isMetaAnalysis || isSystematicReview) {
      const docType: StandardDocumentType = isMetaAnalysis ? 'META_ANALYSIS' : 'SYSTEMATIC_REVIEW';
      const docName = isMetaAnalysis ? 'Systematisk oversikt med meta-analyse' : 'Systematisk oversikt (uten formell meta-analyse)';

      signals.push({ signalType: 'Database Search', value: 'Systematisk litteratursøk i elektroniske databaser', foundIn: 'Metodedel' });
      if (isMetaAnalysis) {
        signals.push({ signalType: 'Quantitative Synthesis', value: 'Statistisk pooling / meta-analyse', foundIn: 'Resultatdel' });
      }

      return {
        documentType: docType,
        documentTypeName: docName,
        isResearchDocument: true,
        studyDesign: docName,
        methodologicalApproach: 'Kunnskapsoppsummering / Syntese',
        methodologicalPurpose: 'Kunnskapssyntese / Meta-analyse',
        confidenceScore: 97,
        confidenceStatus: 'AI_CANDIDATE_REQUIRES_VERIFICATION',
        statusBadgeText: 'AI-kandidatforslag – krever verifisering (Systematisk oversikt)',
        evidenceSignals: signals,
        rationale: 'Dokumentet er en systematisk kunnskapsoppsummering med definerte inklusjonskriterier, systematisk litteratursøk og kritisk vurdering av inkluderte studier.',
        hasMetadataContentConflict,
        conflictDetails,
        recommendedInstrumentId: 'amstar-2',
        recommendedInstrumentName: 'AMSTAR 2 (A MeaSurement Tool to Assess systematic Reviews)',
        recommendedInstrumentJustification: 'AMSTAR 2 (16 items, 7 kritiske domener) er den internasjonalt etablerte gullstandarden for å vurdere systematiske oversikter over helseintervensjoner.',
        alternativeInstruments: [
          { id: 'casp-systematic-review', name: 'CASP Systematic Review', role: 'Forenklet pedagogisk appraisal' },
          { id: 'prisma-2020', name: 'PRISMA 2020', role: 'Rapporteringsstandard (NB: måler ikke bias)' },
          { id: 'grade', name: 'GRADE Summary of Findings', role: 'Gradering av evidensstyrke på utfallsnivå' }
        ],
        methodologicalLimitations: 'AMSTAR 2 vurderer oversiktens metodiske gjennomføring, ikke resultatene i den enkelte primærstudie isolert.',
        instrumentSourceAndAuthority: 'Shea et al., BMJ (2017) / WHO Handbook for Guideline Development',
        instrumentRoleType: 'CRITICAL_APPRAISAL_ROB',
        humanDecision: { status: 'PENDING' },
        legalAnalysis
      };
    }

    // -------------------------------------------------------------
    // 5. IMPLEMENTATION FRAMEWORKS (CFIR, KTA, RE-AIM)
    // -------------------------------------------------------------
    const isImplementationFramework = 
      fullContext.includes('consolidated framework for implementation research') ||
      (fullContext.includes('cfir') && (fullContext.includes('construct') || fullContext.includes('determinant') || fullContext.includes('domain'))) ||
      fullContext.includes('knowledge to action') ||
      fullContext.includes('re-aim framework') ||
      (fullContext.includes('implementation framework') && !fullContext.includes('scoping review'));

    if (isImplementationFramework) {
      signals.push({ signalType: 'Implementation Framework Marker', value: 'Strukturerte determinanter og implementeringsdomener', foundIn: 'Tittel & Nøkkelord' });

      return {
        documentType: 'IMPLEMENTATION_FRAMEWORK',
        documentTypeName: 'Implementeringsrammeverk / Prosessmodell',
        isResearchDocument: true,
        studyDesign: 'Implementeringskartlegging & Teoretisk rammeverk',
        methodologicalApproach: 'Implementering & Tjenesteinnovasjon',
        methodologicalPurpose: 'Implementeringsdeterminanter / Endringsprosess',
        confidenceScore: 90,
        confidenceStatus: 'AI_CANDIDATE_REQUIRES_VERIFICATION',
        statusBadgeText: 'AI-kandidatforslag – krever verifisering (Implementeringsrammeverk)',
        evidenceSignals: signals,
        rationale: 'Dokumentet beskriver eller anvender et implementeringsvitenskapelig rammeverk (f.eks. CFIR / KTA) for å analysere determinanter, barrierer eller praksisendring.',
        hasMetadataContentConflict,
        conflictDetails,
        recommendedInstrumentId: 'cfir-2',
        recommendedInstrumentName: 'CFIR 2.0 (Consolidated Framework for Implementation Research)',
        recommendedInstrumentJustification: 'CFIR 2.0 gir et standardisert rammeverk over 48 konstrukter fordelt på 5 domener for å kartlegge implementeringsdeterminanter.',
        alternativeInstruments: [
          { id: 'kta', name: 'Knowledge-to-Action (KTA)', role: 'Prosessmodell for translasjon' }
        ],
        methodologicalLimitations: 'CFIR og KTA er analyse- og implementeringsrammeverk, IKKE kvalitetsskåringsverktøy for metodisk bias.',
        instrumentSourceAndAuthority: 'Damschroder et al., Implementation Science (2022)',
        instrumentRoleType: 'IMPLEMENTATION_FRAMEWORK',
        humanDecision: { status: 'PENDING' },
        legalAnalysis
      };
    }

    // -------------------------------------------------------------
    // 6. PRIMARY QUANTITATIVE: RCT, DIAGNOSTIC, COHORT, CASE-CONTROL, CROSS-SECTIONAL
    // -------------------------------------------------------------
    const isRct = 
      fullContext.includes('randomized controlled trial') || 
      fullContext.includes('randomised controlled trial') || 
      fullContext.includes('double-blind') ||
      fullContext.includes('placebo-controlled') ||
      fullContext.includes('random allocation') ||
      fullContext.includes('tilfeldig fordeling') ||
      (fullContext.includes('rct') && (fullContext.includes('trial') || fullContext.includes('intervensjon') || fullContext.includes('intervention')));

    if (isRct) {
      signals.push({ signalType: 'Randomization Marker', value: 'Randomisering og kontrollgruppe identifisert', foundIn: 'Tittel/Metode' });

      return {
        documentType: 'RCT',
        documentTypeName: 'Randomisert kontrollert studie (RCT)',
        isResearchDocument: true,
        studyDesign: 'Randomisert kontrollert studie (RCT) / Klinisk utprøving',
        methodologicalApproach: 'Kvantitativ (Eksperimentell / RCT)',
        methodologicalPurpose: 'Kausaleffekt / Behandlingseffekt',
        confidenceScore: 97,
        confidenceStatus: 'AI_CANDIDATE_REQUIRES_VERIFICATION',
        statusBadgeText: 'AI-kandidatforslag – krever verifisering (RCT)',
        evidenceSignals: signals,
        rationale: 'Studien benytter randomisert fordeling av deltakere til to eller flere grupper for å evaluere kausal effekt av en intervensjon. Kvalitative verktøy som JBI Qualitative er metodisk inkompatible.',
        hasMetadataContentConflict,
        conflictDetails,
        recommendedInstrumentId: 'rob-2',
        recommendedInstrumentName: 'Cochrane RoB 2 (Risk of Bias 2 for Randomized Trials)',
        recommendedInstrumentJustification: 'RoB 2 er den internasjonale gullstandarden (5 bias-domener, signalspørsmål og algoritmestyrt vurdering) for randomiserte forsøk.',
        alternativeInstruments: [
          { id: 'casp-rct', name: 'CASP Randomised Controlled Trial', role: 'Pedagogisk sjekkliste for RCT' },
          { id: 'mmat-2018', name: 'MMAT 2018 (Kvantitativ del)', role: 'Dersom studien inngår i et mixed-methods program' }
        ],
        methodologicalLimitations: 'RoB 2 vurderer risiko for bias knyttet til et spesifikt utfallsmål, ikke studiens overordnede sannhetsverdi generelt.',
        instrumentSourceAndAuthority: 'Sterne et al., BMJ (2019) / Cochrane Handbook for Systematic Reviews',
        instrumentRoleType: 'CRITICAL_APPRAISAL_ROB',
        humanDecision: { status: 'PENDING' },
        legalAnalysis
      };
    }

    const isDiagnostic = 
      fullContext.includes('diagnostic accuracy') || 
      fullContext.includes('sensitivity and specificity') || 
      fullContext.includes('sensitivitet og spesifisitet') ||
      fullContext.includes('index test') ||
      fullContext.includes('reference standard') ||
      fullContext.includes('roc curve') ||
      fullContext.includes('diagnostisk nøyaktighet');

    if (isDiagnostic) {
      signals.push({ signalType: 'Diagnostic Accuracy Metrics', value: 'Sensitivitet/Spesifisitet og referansestandard', foundIn: 'Metodedel' });

      return {
        documentType: 'DIAGNOSTIC_ACCURACY_STUDY',
        documentTypeName: 'Diagnostisk nøyaktighetsstudie / Testvalidering',
        isResearchDocument: true,
        studyDesign: 'Diagnostisk nøyaktighetsstudie',
        methodologicalApproach: 'Diagnostikk & Testvalidering',
        methodologicalPurpose: 'Diagnostisk nøyaktighet / Testvalidering',
        confidenceScore: 95,
        confidenceStatus: 'AI_CANDIDATE_REQUIRES_VERIFICATION',
        statusBadgeText: 'AI-kandidatforslag – krever verifisering (Diagnostisk)',
        evidenceSignals: signals,
        rationale: 'Studien sammenligner en indekstest mot en referansestandard i en definert pasientgruppe for å vurdere testens diagnostiske treffsikkerhet.',
        hasMetadataContentConflict,
        conflictDetails,
        recommendedInstrumentId: 'quadas-2',
        recommendedInstrumentName: 'QUADAS-2 (Quality Assessment of Diagnostic Accuracy Studies)',
        recommendedInstrumentJustification: 'QUADAS-2 er den internasjonale standarden (4 domener: pasientutvalg, indekstest, referansestandard, flyt/timing) for diagnostiske studier.',
        alternativeInstruments: [
          { id: 'grade', name: 'GRADE for Diagnostic Tests', role: 'Utfallsvurdering' }
        ],
        methodologicalLimitations: 'QUADAS-2 evaluerer bias og klinisk anvendelighet, men måler ikke direkte helseeffekt av å innføre testen i rutinepraksis.',
        instrumentSourceAndAuthority: 'Whiting et al., Annals of Internal Medicine (2011) / Cochrane Diagnostic Test Accuracy Group',
        instrumentRoleType: 'CRITICAL_APPRAISAL_ROB',
        humanDecision: { status: 'PENDING' },
        legalAnalysis
      };
    }

    const isCohort = 
      fullContext.includes('cohort study') || 
      fullContext.includes('kohortstudie') || 
      fullContext.includes('prospective cohort') ||
      fullContext.includes('retrospective cohort') ||
      fullContext.includes('follow-up study') ||
      fullContext.includes('register-based cohort') ||
      fullContext.includes('oppfølgingsstudie');

    if (isCohort) {
      signals.push({ signalType: 'Cohort Follow-up', value: 'Definert kohort fulgt over tid for utfallsregistrering', foundIn: 'Metodedel' });

      return {
        documentType: 'COHORT_STUDY',
        documentTypeName: 'Kohortstudie (Observasjonell / Register)',
        isResearchDocument: true,
        studyDesign: 'Prospektiv / Retrospektiv Kohortstudie',
        methodologicalApproach: 'Kvantitativ (Observasjonell)',
        methodologicalPurpose: 'Etiologi / Risikofaktorer',
        confidenceScore: 94,
        confidenceStatus: 'AI_CANDIDATE_REQUIRES_VERIFICATION',
        statusBadgeText: 'AI-kandidatforslag – krever verifisering (Kohortstudie)',
        evidenceSignals: signals,
        rationale: 'Studien følger en eksponert og en ueksponert gruppe over tid for å undersøke relativ risiko og insidens av utfall.',
        hasMetadataContentConflict,
        conflictDetails,
        recommendedInstrumentId: 'robins-i',
        recommendedInstrumentName: 'ROBINS-I (Risk Of Bias In Non-randomized Studies - of Interventions)',
        recommendedInstrumentJustification: 'ROBINS-I (7 domener for bias fra konfundering til selektiv rapportering) er gullstandarden for ikke-randomiserte kohort- og intervensjonsstudier.',
        alternativeInstruments: [
          { id: 'casp-cohort', name: 'CASP Cohort Study', role: 'Pedagogisk sjekkliste for kohortstudier' }
        ],
        methodologicalLimitations: 'Konfundering og seleksjonsskjevhet er iboende utfordringer i observasjonelle kohorter som krever nøye justering.',
        instrumentSourceAndAuthority: 'Sterne et al., BMJ (2016) / Cochrane Non-Randomized Studies Group',
        instrumentRoleType: 'CRITICAL_APPRAISAL_ROB',
        humanDecision: { status: 'PENDING' },
        legalAnalysis
      };
    }

    const isCaseControl = 
      fullContext.includes('case-control') || 
      fullContext.includes('kasus-kontroll') || 
      fullContext.includes('matched controls') ||
      fullContext.includes('odds ratio for cases');

    if (isCaseControl) {
      signals.push({ signalType: 'Case-Control Design', value: 'Sammenligning av tilfeller (cases) og kontroller', foundIn: 'Metodedel' });

      return {
        documentType: 'CASE_CONTROL_STUDY',
        documentTypeName: 'Kasus-kontroll-studie',
        isResearchDocument: true,
        studyDesign: 'Retrospektiv kasus-kontroll-studie',
        methodologicalApproach: 'Kvantitativ (Observasjonell)',
        methodologicalPurpose: 'Etiologi / Risikofaktorer',
        confidenceScore: 93,
        confidenceStatus: 'AI_CANDIDATE_REQUIRES_VERIFICATION',
        statusBadgeText: 'AI-kandidatforslag – krever verifisering (Kasus-kontroll)',
        evidenceSignals: signals,
        rationale: 'Studien identifiserer personer med et utfall (kasus) og sammenligner deres tidligere eksponering mot personer uten utfallet (kontroller).',
        hasMetadataContentConflict,
        conflictDetails,
        recommendedInstrumentId: 'casp-cohort',
        recommendedInstrumentName: 'CASP Case-Control / ROBINS-I',
        recommendedInstrumentJustification: 'CASP eller tilpasset ROBINS-I sikrer metodisk vurdering av kontrollgruppeutvalg og tilbakekallingsskjevhet (recall bias).',
        alternativeInstruments: [],
        methodologicalLimitations: 'Særlig sårbar for seleksjonsskjevhet i kontrollutvalg og unøyaktig historisk eksponeringsmåling.',
        instrumentSourceAndAuthority: 'Critical Appraisal Skills Programme (CASP Oxford)',
        instrumentRoleType: 'CRITICAL_APPRAISAL_ROB',
        humanDecision: { status: 'PENDING' },
        legalAnalysis
      };
    }

    const isCrossSectional = 
      fullContext.includes('cross-sectional') || 
      fullContext.includes('tverrsnitt') || 
      fullContext.includes('survey study') ||
      fullContext.includes('prevalence study') ||
      fullContext.includes('prevalensstudie') ||
      fullContext.includes('spørreundersøkelse');

    if (isCrossSectional) {
      signals.push({ signalType: 'Cross-sectional Survey', value: 'Samtidig måling av eksponering og utfall på ett tidspunkt', foundIn: 'Metodedel' });

      return {
        documentType: 'CROSS_SECTIONAL_STUDY',
        documentTypeName: 'Tverrsnittstudie / Prevalensundersøkelse',
        isResearchDocument: true,
        studyDesign: 'Analytisk tverrsnittsstudie / Kvantitativ survey',
        methodologicalApproach: 'Kvantitativ (Observasjonell)',
        methodologicalPurpose: 'Prevalens / Kartlegging',
        confidenceScore: 92,
        confidenceStatus: 'AI_CANDIDATE_REQUIRES_VERIFICATION',
        statusBadgeText: 'AI-kandidatforslag – krever verifisering (Tverrsnitt)',
        evidenceSignals: signals,
        rationale: 'Studien undersøker forekomst eller sammenhenger i en definert populasjon på ett gitt tidspunkt. Kan ikke fastslå kausal tidsrekkefølge.',
        hasMetadataContentConflict,
        conflictDetails,
        recommendedInstrumentId: 'mmat-2018',
        recommendedInstrumentName: 'MMAT 2018 (Kvantitativ deskriptiv del)',
        recommendedInstrumentJustification: 'MMAT eller JBI Analytical Cross-Sectional Checklist vurderer representativitet, svarprosent og målemetoder.',
        alternativeInstruments: [],
        methodologicalLimitations: 'Tverrsnittsdesign kan ikke skille årsak fra virkning.',
        instrumentSourceAndAuthority: 'Hong et al., Education for Information (2018) / JBI',
        instrumentRoleType: 'CRITICAL_APPRAISAL_ROB',
        humanDecision: { status: 'PENDING' },
        legalAnalysis
      };
    }

    // -------------------------------------------------------------
    // 7. MIXED METHODS (Both qualitative and quantitative methods)
    // -------------------------------------------------------------
    const hasQualIndicators = 
      fullContext.includes('interview') || 
      fullContext.includes('intervju') || 
      fullContext.includes('focus group') || 
      fullContext.includes('fokusgruppe') ||
      fullContext.includes('qualitative');

    const hasQuantIndicators = 
      fullContext.includes('survey') || 
      fullContext.includes('questionnaire') || 
      fullContext.includes('statistical') || 
      fullContext.includes('p-value') ||
      fullContext.includes('kvantitativ');

    const isMixedMethodsExplicit = 
      fullContext.includes('mixed methods') || 
      fullContext.includes('mixed-methods') || 
      fullContext.includes('blandet metode') ||
      fullContext.includes('flermetode') ||
      fullContext.includes('convergent parallel') ||
      fullContext.includes('sequential explanatory') ||
      fullContext.includes('sequential exploratory') ||
      (hasQualIndicators && hasQuantIndicators && fullContext.includes('integrat'));

    if (isMixedMethodsExplicit) {
      signals.push({ signalType: 'Mixed Methods Integration', value: 'Både kvalitative og kvantitative datakilder integrert', foundIn: 'Metodedel' });

      return {
        documentType: 'MIXED_METHODS_STUDY',
        documentTypeName: 'Mixed methods primærstudie (Blandet metode)',
        isResearchDocument: true,
        studyDesign: 'Mixed Methods (Kvalitativ + Kvantitativ integrasjon)',
        methodologicalApproach: 'Mixed Methods (Blandet metode)',
        methodologicalPurpose: 'Levde erfaringer / Sosiale fenomener',
        confidenceScore: 94,
        confidenceStatus: 'AI_CANDIDATE_REQUIRES_VERIFICATION',
        statusBadgeText: 'AI-kandidatforslag – krever verifisering (Mixed Methods)',
        evidenceSignals: signals,
        rationale: 'Studien kombinerer kvalitative intervjuer/observasjoner med kvantitative målinger og krever spesifikk evaluering av integrasjon og metodisk koherens. Skal IKKE tvinges inn i en ren kvalitativ eller ren kvantitativ sjekkliste.',
        hasMetadataContentConflict,
        conflictDetails,
        recommendedInstrumentId: 'mmat-2018',
        recommendedInstrumentName: 'MMAT 2018 (Mixed Methods Appraisal Tool)',
        recommendedInstrumentJustification: 'MMAT 2018 er den internasjonalt anerkjente standarden for mixed-methods-studier og vurderer både kvalitative komponenter, kvantitative komponenter og selve integrasjonen (metodisk samspill).',
        alternativeInstruments: [
          { id: 'jbi-qualitative-2017', name: 'JBI Qualitative Checklist', role: 'Kun for den kvalitative delstudien isolert' }
        ],
        methodologicalLimitations: 'Krever at forskeren vurderer om kvalitative og kvantitative data faktisk belyser den samme overordnede problemstillingen (divergens vs. konvergens).',
        instrumentSourceAndAuthority: 'Hong et al., Education for Information (2018) / McGill University',
        instrumentRoleType: 'CRITICAL_APPRAISAL_ROB',
        humanDecision: { status: 'PENDING' },
        legalAnalysis
      };
    }

    // -------------------------------------------------------------
    // 8. PRIMARY QUALITATIVE RESEARCH (Interviews, Grounded Theory, etc.)
    // -------------------------------------------------------------
    const isQualitative = 
      fullContext.includes('grounded theory') || 
      fullContext.includes('phenomenolog') || 
      fullContext.includes('fenomenolog') || 
      fullContext.includes('thematic analysis') || 
      fullContext.includes('tematisk analyse') || 
      fullContext.includes('semi-structured interview') || 
      fullContext.includes('dybdeintervju') || 
      fullContext.includes('focus group') || 
      fullContext.includes('fokusgruppe') || 
      fullContext.includes('hermeneutic') || 
      fullContext.includes('hermeneutisk') || 
      fullContext.includes('ethnograph') || 
      fullContext.includes('etnografi') || 
      fullContext.includes('lived experience') ||
      fullContext.includes('levde erfaringer') ||
      fullContext.includes('qualitative content analysis') ||
      fullContext.includes('kvalitativ innholdsanalyse') ||
      (fullContext.includes('qualitative') && (fullContext.includes('interview') || fullContext.includes('participants') || fullContext.includes('studie') || fullContext.includes('study')));

    if (isQualitative) {
      signals.push({ signalType: 'Qualitative Methodology', value: 'Kvalitativ datainnsamling og induktiv/tematisk analyse', foundIn: 'Metodedel' });

      return {
        documentType: 'QUALITATIVE_STUDY',
        documentTypeName: 'Kvalitativ primærforskning',
        isResearchDocument: true,
        studyDesign: 'Kvalitativ studie (Intervju, Fenomenologi, Grounded Theory, Hermeneutikk)',
        methodologicalApproach: 'Kvalitativ',
        methodologicalPurpose: 'Levde erfaringer / Sosiale fenomener',
        confidenceScore: 96,
        confidenceStatus: 'AI_CANDIDATE_REQUIRES_VERIFICATION',
        statusBadgeText: 'AI-kandidatforslag – krever verifisering (Kvalitativ studie)',
        evidenceSignals: signals,
        rationale: 'Studien utforsker menneskelige erfaringer, meningsdannelse eller sosiale prosesser via kvalitative forskningsmetoder (intervjuer, observasjon, hermeneutikk, Grounded Theory).',
        hasMetadataContentConflict,
        conflictDetails,
        recommendedInstrumentId: 'jbi-qualitative-2017',
        recommendedInstrumentName: 'JBI Critical Appraisal Checklist for Qualitative Research (2017/2024)',
        recommendedInstrumentJustification: 'JBI Qualitative (10 kriterier) er den internasjonalt etablerte gullstandarden for å vurdere metodisk kongruens, forskerrefleksivitet, etikk og representasjon i kvalitative primærstudier.',
        alternativeInstruments: [
          { id: 'casp-qualitative', name: 'CASP Qualitative Checklist', role: 'Pedagogisk 10-punkts sjekkliste' },
          { id: 'mmat-2018', name: 'MMAT 2018 (Kvalitativ del)', role: 'For kvalitative studier i fler-metodiske prosjekter' }
        ],
        methodologicalLimitations: 'JBI Qualitative er et kvalitativt skjønnsbasert beslutningsstøtteverktøy, IKKE en matematisk kalkulator for automatisk eksklusjon.',
        instrumentSourceAndAuthority: 'Joanna Briggs Institute (JBI Adelaide 2017) / Lockwood et al. (2015)',
        instrumentRoleType: 'CRITICAL_APPRAISAL_ROB',
        humanDecision: { status: 'PENDING' },
        legalAnalysis
      };
    }

    // -------------------------------------------------------------
    // 9. CASE REPORTS & CASE SERIES
    // -------------------------------------------------------------
    if (fullContext.includes('case report') || fullContext.includes('kasusrapport') || fullContext.includes('case series') || fullContext.includes('kasusserie')) {
      const isSeries = fullContext.includes('case series') || fullContext.includes('kasusserie');
      const docType: StandardDocumentType = isSeries ? 'CASE_SERIES' : 'CASE_REPORT';
      const docName = isSeries ? 'Kasusserie (Case Series)' : 'Kasusrapport (Case Report)';

      signals.push({ signalType: 'Case Report Marker', value: docName, foundIn: 'Tittel & Tekst' });

      return {
        documentType: docType,
        documentTypeName: docName,
        isResearchDocument: true,
        studyDesign: docName,
        methodologicalApproach: 'Kvantitativ (Observasjonell)',
        methodologicalPurpose: 'Prognose / Forløp',
        confidenceScore: 91,
        confidenceStatus: 'AI_CANDIDATE_REQUIRES_VERIFICATION',
        statusBadgeText: `AI-kandidatforslag – krever verifisering (${docName})`,
        evidenceSignals: signals,
        rationale: 'Studien beskriver ett eller få kliniske pasientforløp deskriptivt uten kontrollgruppe.',
        hasMetadataContentConflict,
        conflictDetails,
        recommendedInstrumentId: 'mmat-2018',
        recommendedInstrumentName: 'JBI / CASP Case Report Appraisal',
        recommendedInstrumentJustification: 'Kasusrapporter vurderes på klinisk deskriptiv nøyaktighet og transparens.',
        alternativeInstruments: [],
        methodologicalLimitations: 'Mangler kontrollgruppe og kan ikke generaliseres statistisk.',
        instrumentSourceAndAuthority: 'JBI Critical Appraisal Tools',
        instrumentRoleType: 'CRITICAL_APPRAISAL_ROB',
        humanDecision: { status: 'PENDING' },
        legalAnalysis
      };
    }

    // -------------------------------------------------------------
    // 10. EDITORIAL / COMMENTARY / LETTER
    // -------------------------------------------------------------
    if (fullContext.includes('editorial') || fullContext.includes('commentary') || fullContext.includes('letter to the editor') || fullContext.includes('correspondence')) {
      const docType: StandardDocumentType = fullContext.includes('letter') ? 'LETTER_CORRESPONDENCE' : 'EDITORIAL_COMMENTARY';
      const docName = fullContext.includes('letter') ? 'Letter / Correspondence' : 'Editorial / Kommentar';

      signals.push({ signalType: 'Commentary Marker', value: docName, foundIn: 'Tittel & Type' });

      return {
        documentType: docType,
        documentTypeName: docName,
        isResearchDocument: false,
        studyDesign: 'Faglig kommentar / Debattinnlegg',
        methodologicalApproach: 'Ikke-forskningsdokument / Policy',
        methodologicalPurpose: 'Uavklart / Krever manuell presisering',
        confidenceScore: 90,
        confidenceStatus: 'AI_CANDIDATE_REQUIRES_VERIFICATION',
        statusBadgeText: 'AI-kandidatforslag – krever verifisering (Ikke-forskningsartikkel)',
        evidenceSignals: signals,
        rationale: 'Dette er et menings- eller debattinnlegg, ikke en empirisk forskningsstudie. Kritiske vurderingsverktøy for empirisk forskning kan ikke anvendes.',
        hasMetadataContentConflict,
        conflictDetails,
        recommendedInstrumentId: 'jbi-qualitative-2017',
        recommendedInstrumentName: 'Ikke egnet for standard critical appraisal',
        recommendedInstrumentJustification: 'Kommentarer og brev mangler systematisk metodedel og datainnsamling og skal ikke vurderes som empiriske primærstudier.',
        alternativeInstruments: [],
        methodologicalLimitations: 'Inneholder ingen systematisk forskningsmetode.',
        instrumentSourceAndAuthority: 'Vitenskapelig publiseringsetikk (COPE)',
        instrumentRoleType: 'CRITICAL_APPRAISAL_ROB',
        humanDecision: { status: 'PENDING' },
        legalAnalysis
      };
    }

    // -------------------------------------------------------------
    // 11. UNCERTAIN / CANNOT CLASSIFY WITH CERTAINTY (Section 17)
    // -------------------------------------------------------------
    return {
      documentType: 'UNKNOWN_UNCERTAIN',
      documentTypeName: 'Ukjent / kan ikke klassifiseres sikkert',
      isResearchDocument: null,
      studyDesign: 'Uavklart studiedesign – krever manuell forskervurdering',
      methodologicalApproach: 'Ukjent / Uavklart',
      methodologicalPurpose: 'Uavklart / Krever manuell presisering',
      confidenceScore: 35,
      confidenceStatus: 'MANUAL_VERIFICATION_REQUIRED',
      statusBadgeText: 'Kan ikke klassifiseres sikkert – manuell vurdering kreves',
      evidenceSignals: signals,
      rationale: 'Teksten inneholder elementer av forskning, men mangler entydige metodiske kjennetegn for å avgjøre om dette er en primærstudie, oversikt eller retningslinje. Manuell verifisering er påkrevd før valg av vurderingsinstrument.',
      hasMetadataContentConflict,
      conflictDetails,
      recommendedInstrumentId: 'jbi-qualitative-2017',
      recommendedInstrumentName: 'Manuell verifisering kreves',
      recommendedInstrumentJustification: 'Systemet nekter å gjette vilkårlig på et studiedesign. Velg riktig instrument basert på dokumentets fulle metodedel.',
      alternativeInstruments: [
        { id: 'jbi-qualitative-2017', name: 'JBI Qualitative', role: 'Dersom dokumentet er en kvalitativ studie' },
        { id: 'amstar-2', name: 'AMSTAR 2', role: 'Dersom dokumentet er en systematisk oversikt' },
        { id: 'rob-2', name: 'RoB 2', role: 'Dersom dokumentet er en RCT' },
        { id: 'agree-ii', name: 'AGREE II', role: 'Dersom dokumentet er en retningslinje' }
      ],
      methodologicalLimitations: 'Uten verifisert studiedesign kan ingen vitenskapelig validitetsvurdering utføres.',
      instrumentSourceAndAuthority: 'Metodisk integritetskontroll',
      instrumentRoleType: 'CRITICAL_APPRAISAL_ROB',
      humanDecision: { status: 'PENDING' },
      legalAnalysis
    };
  }

  /**
   * Explains the methodological difference between different framework roles (Section 13)
   */
  public static explainFrameworkRole(roleType: InstrumentRoleType): {
    title: string;
    roleExplanation: string;
    whatItIsFor: string;
    whatItIsNotFor: string;
  } {
    switch (roleType) {
      case 'CRITICAL_APPRAISAL_ROB':
        return {
          title: 'Critical Appraisal & Risk of Bias (f.eks. JBI, AMSTAR 2, RoB 2, ROBINS-I, MMAT)',
          roleExplanation: 'Evaluerer den metodiske validiteten, indre stringensen og risikoen for systematiske skjevheter (bias) i design, gjennomføring og analyse av en empirisk studie.',
          whatItIsFor: 'Kvalitetsvurdering og bias-screening for å avgjøre om studiens resultater er pålitelige.',
          whatItIsNotFor: 'Dette er IKKE en rapporteringssjekkliste og måler IKKE sikkerheten til hele evidensgrunnlaget på tvers av studier.'
        };
      case 'GUIDELINE_APPRAISAL':
        return {
          title: 'Guideline Appraisal (f.eks. AGREE II)',
          roleExplanation: 'Evaluerer den metodiske rigiditeten, transparensen og interessent-involveringen i utviklingen av faglige og kliniske retningslinjer.',
          whatItIsFor: 'Kvalitetsvurdering av nasjonale og internasjonale retningslinjer.',
          whatItIsNotFor: 'Dette er IKKE et verktøy for å vurdere enkeltstående primærforskningsartikler.'
        };
      case 'REPORTING_STANDARD':
        return {
          title: 'Reporting Standard (f.eks. PRISMA 2020, CONSORT, COREQ, STROBE)',
          roleExplanation: 'Spesifiserer minimumskrav til åpenhet og transparens for hva som må rapporteres i en publisert artikkel.',
          whatItIsFor: 'Sikre at forfattere oppgir alle nødvendige opplysninger slik at leseren kan forstå hva som er gjort.',
          whatItIsNotFor: 'Dette er IKKE et kvalitetsskåringsverktøy for metodisk gyldighet. En studie kan være perfekt rapportert etter PRISMA, men likevel ha fatal risiko for metodisk bias.'
        };
      case 'EVIDENCE_CERTAINTY':
        return {
          title: 'Certainty of Evidence Framework (f.eks. GRADE, GRADE-CERQual)',
          roleExplanation: 'Vurderer den samlede tilliten til et spesifikt syntetisert kunnskapsfunn eller en effektstørrelse på tvers av en hel samling studier.',
          whatItIsFor: 'Gradere tillit til evidens på utfallsnivå for kliniske beslutninger og oppsummeringer.',
          whatItIsNotFor: 'Dette er IKKE en kvalitetsskår for en enkeltstående primærstudie.'
        };
      case 'IMPLEMENTATION_FRAMEWORK':
        return {
          title: 'Implementation Framework (f.eks. CFIR 2.0, KTA)',
          roleExplanation: 'Strukturerer og kategoriserer determinanter, barrierer, fremmere og endringsprosesser ved innføring av nye tiltak i helse- og velferdstjenestene.',
          whatItIsFor: 'Kartlegge kontekstuelle faktorer og implementeringsutfall.',
          whatItIsNotFor: 'Dette er IKKE et kvalitetsskåringsverktøy for metodisk bias.'
        };
    }
  }

  /**
   * Applies a verified human decision to an automated classification result (Section 15)
   */
  public static applyHumanDecision(
    original: DocumentClassificationResult,
    decision: HumanVerificationDecision
  ): DocumentClassificationResult {
    const updated = { ...original };
    updated.humanDecision = {
      ...decision,
      verifiedAt: new Date().toISOString()
    };

    if (decision.status === 'APPROVED') {
      updated.confidenceStatus = 'HUMAN_VERIFIED';
      updated.statusBadgeText = 'Menneskelig verifisert klassifisering';
    } else if (decision.status === 'MODIFIED') {
      updated.confidenceStatus = 'HUMAN_VERIFIED';
      updated.statusBadgeText = 'Menneskelig overstyrt klassifisering';
      if (decision.manualDocType) {
        updated.documentType = decision.manualDocType;
      }
      if (decision.manualStudyDesign) {
        updated.studyDesign = decision.manualStudyDesign;
      }
      if (decision.manualMethodology) {
        updated.methodologicalApproach = decision.manualMethodology;
      }
      if (decision.manualPurpose) {
        updated.methodologicalPurpose = decision.manualPurpose;
      }
      if (decision.manualInstrumentId) {
        updated.recommendedInstrumentId = decision.manualInstrumentId;
        const matched = MASTER_INSTRUMENTS_REGISTRY.find(i => i.id === decision.manualInstrumentId);
        if (matched) {
          updated.recommendedInstrumentName = matched.name;
        }
      }
    } else if (decision.status === 'UNCERTAIN' || decision.status === 'REJECTED') {
      updated.confidenceStatus = 'MANUAL_VERIFICATION_REQUIRED';
      updated.statusBadgeText = 'Avvist av forsker – krever manuell re-vurdering';
    }

    return updated;
  }
}
