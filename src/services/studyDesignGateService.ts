import { AppraisalInstrument, StandardDocumentType } from '../types';
import { MASTER_INSTRUMENTS_REGISTRY } from '../data/masterRegistry';
import { DocumentClassifierService } from './documentClassifierService';

export interface StudyDesignOption {
  id: string;
  name: string;
  category: 'Kvalitativ' | 'Kunnskapsoppsummering' | 'Kvantitativ / Eksperimentell' | 'Kvantitativ / Observasjonell' | 'Blandet metode' | 'Diagnostikk' | 'Retningslinjer' | 'Implementering' | 'Protokoll' | 'Metodologi' | 'Uavklart / Ukjent';
  description: string;
  primaryInstrumentId: string;
  alternativeInstrumentIds: string[];
  isResearchDocument: boolean | null;
}

export const SUPPORTED_STUDY_DESIGNS: StudyDesignOption[] = [
  {
    id: 'qualitative',
    name: 'Kvalitativ forskning (Intervjuer, fokusgrupper, observasjon, hermeneutikk, fenomenologi)',
    category: 'Kvalitativ',
    description: 'Primærstudier som utforsker menneskelige erfaringer, meningsbærende strukturer, sosial samhandling eller prosesser.',
    primaryInstrumentId: 'jbi-qualitative-2017',
    alternativeInstrumentIds: ['casp-qualitative', 'mmat-2018'],
    isResearchDocument: true
  },
  {
    id: 'systematic-review',
    name: 'Systematisk oversikt / Kunnskapsoppsummering (med eller uten meta-analyse)',
    category: 'Kunnskapsoppsummering',
    description: 'Systematiske oversikter over intervensjoner eller observasjonsstudier med definert søkestrategi og syntese.',
    primaryInstrumentId: 'amstar-2',
    alternativeInstrumentIds: ['casp-systematic-review', 'prisma-2020', 'grade'],
    isResearchDocument: true
  },
  {
    id: 'qualitative-synthesis',
    name: 'Kvalitativ metasyntese / Kunnskapsoppsummering av kvalitative studier',
    category: 'Kunnskapsoppsummering',
    description: 'Systematiske synteser av kvalitative funn (meta-etnografi, tematisk syntese, meta-aggregering).',
    primaryInstrumentId: 'casp-systematic-review',
    alternativeInstrumentIds: ['grade-cerqual', 'jbi-qualitative-2017'],
    isResearchDocument: true
  },
  {
    id: 'scoping-review',
    name: 'Scoping review (Kartleggingsoversikt over kunnskapsfelt)',
    category: 'Kunnskapsoppsummering',
    description: 'Bred kartlegging av begreper, evidens og kunnskapshull innen et forskningsfelt.',
    primaryInstrumentId: 'prisma-scr',
    alternativeInstrumentIds: ['amstar-2'],
    isResearchDocument: true
  },
  {
    id: 'rct',
    name: 'Randomisert kontrollert studie (RCT) / Klyngerandomisert utprøving',
    category: 'Kvantitativ / Eksperimentell',
    description: 'Eksperimentelle studier med tilfeldig fordeling til intervensjons- og kontrollgruppe for å måle behandlingseffekt.',
    primaryInstrumentId: 'rob-2',
    alternativeInstrumentIds: ['casp-rct', 'mmat-2018'],
    isResearchDocument: true
  },
  {
    id: 'non-randomized-cohort',
    name: 'Observasjonsstudie / Kohortstudie / Registerforskning',
    category: 'Kvantitativ / Observasjonell',
    description: 'Prospektive eller retrospektive kohort- og registerstudier som følger deltakere over tid.',
    primaryInstrumentId: 'robins-i',
    alternativeInstrumentIds: ['casp-cohort', 'mmat-2018'],
    isResearchDocument: true
  },
  {
    id: 'case-control',
    name: 'Kasus-kontroll-studie (Case-Control)',
    category: 'Kvantitativ / Observasjonell',
    description: 'Retrospektiv sammenligning av pasienter med utfall (cases) mot kontroller.',
    primaryInstrumentId: 'casp-case-control',
    alternativeInstrumentIds: ['robins-i'],
    isResearchDocument: true
  },
  {
    id: 'cross-sectional',
    name: 'Analytisk tverrsnittsstudie / Kvantitativ survey / Prevalensstudie',
    category: 'Kvantitativ / Observasjonell',
    description: 'Kvantitative studier som måler eksponering og utfall samtidig i en definert populasjon.',
    primaryInstrumentId: 'mmat-2018',
    alternativeInstrumentIds: [],
    isResearchDocument: true
  },
  {
    id: 'mixed-methods',
    name: 'Blandet metode (Mixed Methods / Kvalitativ + Kvantitativ integrasjon)',
    category: 'Blandet metode',
    description: 'Fler-metodiske studier som integrerer kvalitative intervjuer/observasjoner med kvantitative utfallsmål.',
    primaryInstrumentId: 'mmat-2018',
    alternativeInstrumentIds: [],
    isResearchDocument: true
  },
  {
    id: 'diagnostic-accuracy',
    name: 'Diagnostisk nøyaktighetsstudie / Testvalidering / Sensitivitet & Spesifisitet',
    category: 'Diagnostikk',
    description: 'Studier som evaluerer nøyaktigheten til en diagnostisk test eller biomarkør mot en referansestandard.',
    primaryInstrumentId: 'quadas-2',
    alternativeInstrumentIds: ['grade'],
    isResearchDocument: true
  },
  {
    id: 'clinical-guideline',
    name: 'Klinisk retningslinje / Faglige behandlingsanbefalinger / Nasjonal veileder',
    category: 'Retningslinjer',
    description: 'Systematisk utviklede faglige anbefalinger for klinisk praksis, pasientforløp og helsetjenester (Ikke primærforskning).',
    primaryInstrumentId: 'agree-ii',
    alternativeInstrumentIds: ['grade'],
    isResearchDocument: false
  },
  {
    id: 'implementation-study',
    name: 'Implementeringsstudie / Tjenesteinnovasjon & Praksisendring (f.eks. CFIR / KTA)',
    category: 'Implementering',
    description: 'Evaluering av barrierer, fremmere, implementeringsutfall og determinanter ved innføring av nye tiltak.',
    primaryInstrumentId: 'cfir-2',
    alternativeInstrumentIds: ['kta'],
    isResearchDocument: true
  },
  {
    id: 'protocol',
    name: 'Studieprotokoll / Prosjektplan (f.eks. PROSPERO, ClinicalTrials.gov)',
    category: 'Protokoll',
    description: 'Forhåndsdefinert forskningsprotokoll uten empiriske resultater.',
    primaryInstrumentId: 'prisma-2020',
    alternativeInstrumentIds: [],
    isResearchDocument: true
  },
  {
    id: 'methodology-study',
    name: 'Metodestudie / Verktøyvalidering',
    category: 'Metodologi',
    description: 'Studie som utvikler, tester eller validerer måleinstrumenter eller forskningsmetoder.',
    primaryInstrumentId: 'mmat-2018',
    alternativeInstrumentIds: [],
    isResearchDocument: true
  },
  {
    id: 'unknown-uncertain',
    name: 'Uavklart / Kan ikke klassifiseres sikkert',
    category: 'Uavklart / Ukjent',
    description: 'Dokumentet mangler tilstrekkelig metodisk informasjon eller har motstridende kjennetegn. Krever manuell forskervurdering.',
    primaryInstrumentId: '',
    alternativeInstrumentIds: [],
    isResearchDocument: null
  }
];

export interface CompatibilityCheckResult {
  isCompatible: boolean;
  matchLevel: 'EXACT_RECOMMENDED' | 'ACCEPTABLE_ALTERNATIVE' | 'METHODOLOGICAL_MISMATCH' | 'CRITICAL_ERROR';
  headline: string;
  explanation: string;
  recommendedInstruments: AppraisalInstrument[];
  incompatibleReasons?: string[];
  requiresExplicitOverrideConfirmation: boolean;
}

export class StudyDesignGateService {
  /**
   * Validates compatibility for contract testing and gating
   */
  public static validateCompatibility(
    instrumentId: string,
    studyDesignOrText: string
  ): { isCompatible: boolean; gateStatus: 'COMPATIBLE' | 'WARNING' | 'INCOMPATIBLE'; recommendedInstrumentId: string; message: string } {
    const detected = this.detectStudyDesign(studyDesignOrText);
    const result = this.checkCompatibility(detected.id, instrumentId);

    return {
      isCompatible: result.isCompatible,
      gateStatus: result.matchLevel === 'EXACT_RECOMMENDED' || result.matchLevel === 'ACCEPTABLE_ALTERNATIVE' ? 'COMPATIBLE' : 'INCOMPATIBLE',
      recommendedInstrumentId: detected.primaryInstrumentId || 'UNKNOWN',
      message: result.explanation
    };
  }

  /**
   * Evaluates compatibility between study design and chosen instrument
   */
  public static checkCompatibility(
    studyDesignId: string,
    instrumentId: string
  ): CompatibilityCheckResult {
    const design = SUPPORTED_STUDY_DESIGNS.find(d => d.id === studyDesignId);
    const instrument = MASTER_INSTRUMENTS_REGISTRY.find(i => i.id === instrumentId);
    if (!design) throw new Error(`Ukjent studiedesign: ${studyDesignId}`);
    if (!instrument) throw new Error(`Ukjent appraisal-instrument: ${instrumentId}`);

    const recommendedList = design.id === 'unknown-uncertain'
      ? []
      : MASTER_INSTRUMENTS_REGISTRY.filter(
        i => i.id === design.primaryInstrumentId || design.alternativeInstrumentIds.includes(i.id)
      );

    // If design is unknown/uncertain, no instrument is automatically pre-cleared without researcher verification
    if (design.id === 'unknown-uncertain') {
      const specificError = `Uavklart studiedesign: Studiedesignet er ikke sikkert identifisert. Forskeren må eksplisitt bekrefte design før valg av ${instrument.shortName}.`;
      return {
        isCompatible: false,
        matchLevel: 'CRITICAL_ERROR',
        headline: `Metodisk uoverensstemmelse (Advarsel / Sperre)`,
        explanation: specificError,
        recommendedInstruments: recommendedList,
        incompatibleReasons: [
          specificError,
          `Ingen verktøy kan forhåndsgodkjennes automatisk for uavklart studiedesign.`
        ],
        requiresExplicitOverrideConfirmation: true
      };
    }

    // Exact primary match
    if (instrument.id === design.primaryInstrumentId) {
      return {
        isCompatible: true,
        matchLevel: 'EXACT_RECOMMENDED',
        headline: `Optimalt metodisk instrument (${instrument.shortName})`,
        explanation: `«${instrument.name}» er det verifiserte gullstandard-instrumentet for ${design.name.toLowerCase()}.`,
        recommendedInstruments: recommendedList,
        requiresExplicitOverrideConfirmation: false
      };
    }

    // Acceptable alternative
    if (design.alternativeInstrumentIds.includes(instrument.id)) {
      return {
        isCompatible: true,
        matchLevel: 'ACCEPTABLE_ALTERNATIVE',
        headline: `Gyldig metodisk alternativ (${instrument.shortName})`,
        explanation: `«${instrument.name}» er et anerkjent alternativ for ${design.name.toLowerCase()}, men ${recommendedList[0]?.shortName || 'anbefalt verktøy'} gir mer spesifikk veiledning.`,
        recommendedInstruments: recommendedList,
        requiresExplicitOverrideConfirmation: false
      };
    }

    // Critical Mismatch / Methodological Error
    let specificError = '';
    if (design.id === 'qualitative' && (instrument.id === 'amstar-2' || instrument.id === 'rob-2' || instrument.id === 'robins-i' || instrument.id === 'agree-ii')) {
      specificError = `Metodisk feil: ${instrument.shortName} kan IKKE brukes til å vurdere kvalitative primærstudier (intervjuer/tekst). Bruk JBI Qualitative eller CASP Qualitative.`;
    } else if (design.id === 'systematic-review' && (instrument.id === 'jbi-qualitative-2017' || instrument.id === 'casp-qualitative')) {
      specificError = `Metodisk feil: Kvalitative sjekklister vurderer kvalitative primærstudier, ikke systematiske kunnskapsoppsummeringer. Bruk AMSTAR 2 eller ROBIS.`;
    } else if (design.id === 'rct' && (instrument.id === 'jbi-qualitative-2017' || instrument.id === 'casp-qualitative')) {
      specificError = `Metodisk feil: Kvalitative verktøy kan ikke vurdere randomiserte kontrollerte studier (RCT). Bruk RoB 2 eller CASP RCT.`;
    } else if (design.id === 'clinical-guideline' && instrument.id !== 'agree-ii') {
      specificError = `Metodisk advarsel: Kliniske retningslinjer er normative veiledere, ikke primærforskning, og skal vurderes med AGREE II.`;
    } else if (design.id === 'diagnostic-accuracy' && instrument.id !== 'quadas-2') {
      specificError = `Metodisk advarsel: Diagnostiske nøyaktighetsstudier krever QUADAS-2 (4 bias-domener).`;
    } else if (design.id === 'mixed-methods' && (instrument.id === 'rob-2' || instrument.id === 'amstar-2')) {
      specificError = `Metodisk advarsel: Mixed methods krever evaluering av integrasjonen mellom kvalitative og kvantitative data med MMAT 2018.`;
    } else if (design.id === 'unknown-uncertain') {
      specificError = `Uavklart studiedesign: Studiedesignet er ikke sikkert identifisert. Forskeren må eksplisitt bekrefte design før valg av ${instrument.shortName}.`;
    } else {
      specificError = `Instrumentet «${instrument.shortName}» (${instrument.categoryName}) er ikke metodisk tilpasset studiedesignet «${design.name}».`;
    }

    return {
      isCompatible: false,
      matchLevel: 'CRITICAL_ERROR',
      headline: `Metodisk uoverensstemmelse (Advarsel / Sperre)`,
      explanation: specificError,
      recommendedInstruments: recommendedList,
      incompatibleReasons: [
        specificError,
        `Målgruppe for ${instrument.shortName}: ${instrument.targetPopulationOrContext}`,
        `Valgt studiedesign krever: ${recommendedList.map(r => r.shortName).join(' eller ')}`
      ],
      requiresExplicitOverrideConfirmation: true
    };
  }

  /**
   * Helper to detect likely study design using DocumentClassifierService
   * Never blindly defaults to Qualitative!
   */
  public static detectStudyDesign(textOrTitle: string): StudyDesignOption {
    const raw = (textOrTitle || '').toLowerCase();

    // Fast keyword detection for study design labels
    if (raw.includes('qualitative') || raw.includes('kvalitativ') || raw.includes('intervju') || raw.includes('interview') || raw.includes('hermeneutikk') || raw.includes('fenomenologi') || raw.includes('grounded theory')) {
      if (!raw.includes('synthesis') && !raw.includes('syntese') && !raw.includes('review') && !raw.includes('oversikt')) {
        return SUPPORTED_STUDY_DESIGNS.find(d => d.id === 'qualitative')!;
      }
    }
    if (raw.includes('scoping review') || raw.includes('kartleggingsoversikt')) {
      return SUPPORTED_STUDY_DESIGNS.find(d => d.id === 'scoping-review')!;
    }
    if (raw.includes('randomized') || raw.includes('randomised') || raw.includes('rct') || raw.includes('klinisk utprøving')) {
      return SUPPORTED_STUDY_DESIGNS.find(d => d.id === 'rct')!;
    }
    if (raw.includes('mixed methods') || raw.includes('blandet metode')) {
      return SUPPORTED_STUDY_DESIGNS.find(d => d.id === 'mixed-methods')!;
    }
    if (raw.includes('systematic review') || raw.includes('systematisk oversikt') || raw.includes('meta-analyse') || raw.includes('meta-analysis')) {
      return SUPPORTED_STUDY_DESIGNS.find(d => d.id === 'systematic-review')!;
    }
    if (raw.includes('retningslinje') || raw.includes('guideline') || raw.includes('veileder')) {
      return SUPPORTED_STUDY_DESIGNS.find(d => d.id === 'clinical-guideline')!;
    }

    const classification = DocumentClassifierService.classifyDocument(textOrTitle);

    switch (classification.documentType) {
      case 'QUALITATIVE_STUDY':
        return SUPPORTED_STUDY_DESIGNS.find(d => d.id === 'qualitative')!;
      case 'RCT':
        return SUPPORTED_STUDY_DESIGNS.find(d => d.id === 'rct')!;
      case 'COHORT_STUDY':
        return SUPPORTED_STUDY_DESIGNS.find(d => d.id === 'non-randomized-cohort')!;
      case 'CASE_CONTROL_STUDY':
        return SUPPORTED_STUDY_DESIGNS.find(d => d.id === 'case-control')!;
      case 'CROSS_SECTIONAL_STUDY':
        return SUPPORTED_STUDY_DESIGNS.find(d => d.id === 'cross-sectional')!;
      case 'MIXED_METHODS_STUDY':
        return SUPPORTED_STUDY_DESIGNS.find(d => d.id === 'mixed-methods')!;
      case 'DIAGNOSTIC_ACCURACY_STUDY':
        return SUPPORTED_STUDY_DESIGNS.find(d => d.id === 'diagnostic-accuracy')!;
      case 'QUALITATIVE_EVIDENCE_SYNTHESIS':
        return SUPPORTED_STUDY_DESIGNS.find(d => d.id === 'qualitative-synthesis')!;
      case 'SCOPING_REVIEW':
        return SUPPORTED_STUDY_DESIGNS.find(d => d.id === 'scoping-review')!;
      case 'SYSTEMATIC_REVIEW':
      case 'META_ANALYSIS':
      case 'UMBRELLA_REVIEW':
      case 'RAPID_REVIEW':
      case 'INTEGRATIVE_REVIEW':
        return SUPPORTED_STUDY_DESIGNS.find(d => d.id === 'systematic-review')!;
      case 'NATIONAL_CLINICAL_GUIDELINE':
      case 'CLINICAL_PRACTICE_GUIDELINE':
      case 'PUBLIC_RECOMMENDATION_POLICY':
      case 'CONSENSUS_DOCUMENT':
        return SUPPORTED_STUDY_DESIGNS.find(d => d.id === 'clinical-guideline')!;
      case 'IMPLEMENTATION_FRAMEWORK':
        return SUPPORTED_STUDY_DESIGNS.find(d => d.id === 'implementation-study')!;
      case 'PROTOCOL':
      case 'PROTOCOL_SYSTEMATIC_REVIEW':
        return SUPPORTED_STUDY_DESIGNS.find(d => d.id === 'protocol')!;
      case 'METHODOLOGY_STUDY':
        return SUPPORTED_STUDY_DESIGNS.find(d => d.id === 'methodology-study')!;
      default:
        // Returns unknown-uncertain, NEVER blindly defaults to qualitative!
        return SUPPORTED_STUDY_DESIGNS.find(d => d.id === 'unknown-uncertain')!;
    }
  }
}
