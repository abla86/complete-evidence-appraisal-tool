export type StudyDesignType = 
  | 'Kvalitativ forskning'
  | 'Randomisert kontrollert studie (RCT)'
  | 'Tverrsnittsstudie / Observasjonsstudie'
  | 'Systematisk oversikt'
  | 'Teoretisk / Faglitteratur';

export interface AppraisalInstrument {
  id: string;
  name: string;
  acronym: string;
  targetDesign: StudyDesignType;
  description: string;
  criteria: {
    id: string;
    category: 'Formål & Design' | 'Metode & Utvalg' | 'Dataanalyse & Funn' | 'Etikk & Konklusjon';
    question: string;
    guidance: string;
  }[];
}

export const APPRAISAL_INSTRUMENTS: Record<string, AppraisalInstrument> = {
  'JBI Qualitative': {
    id: 'jbi-qualitative',
    name: 'JBI Critical Appraisal Checklist for Qualitative Research',
    acronym: 'JBI Qualitative',
    targetDesign: 'Kvalitativ forskning',
    description: 'Standardisert instrument for kritisk vurdering av kvalitative forskningsstudier (Joanna Briggs Institute).',
    criteria: [
      { id: 'jbi-1', category: 'Formål & Design', question: 'Er det kongruens mellom den filosofiske perspektivet og forskningsspørsmålene?', guidance: 'Vurder om studiens epistemologiske eller teoretiske forankring henger sammen med problemstillingen.' },
      { id: 'jbi-2', category: 'Metode & Utvalg', question: 'Er det kongruens mellom det filosofiske perspektivet og datainnsamlingsmetoden?', guidance: 'Undersøk om intervju, observasjon eller tekstmetoder er i tråd med metodologien.' },
      { id: 'jbi-3', category: 'Metode & Utvalg', question: 'Er det kongruens mellom det filosofiske perspektivet og representasjon/analyse av data?', guidance: 'Sjekk om analysestrategien matcher studiens design.' },
      { id: 'jbi-4', category: 'Metode & Utvalg', question: 'Er det kongruens mellom det filosofiske perspektivet og fortolkningen av resultatene?', guidance: 'Vurder om konklusjonene følger logisk av datatolkningen.' },
      { id: 'jbi-5', category: 'Formål & Design', question: 'Er det tatt hensyn til forskerens egen rolle, påvirkning og posisjonering (reflexivity)?', guidance: 'Er forfatterens subjektivitet og forhåndsforståelse drøftet?' },
      { id: 'jbi-6', category: 'Etikk & Konklusjon', question: 'Er deltakere og deres stemmer tilstrekkelig ivaretatt etisk?', guidance: 'Vurder samtykke, anonymisering og konfidensialitet.' },
      { id: 'jbi-7', category: 'Dataanalyse & Funn', question: 'Er forskningen godkjent av etisk komité (eller vurdert etter nasjonale regler)?', guidance: 'Sjekk REK-godkjenning eller etisk vurdering.' },
      { id: 'jbi-8', category: 'Dataanalyse & Funn', question: 'Er konklusjonene i forskningsrapporten støttet av utvalget og datatolkningen?', guidance: 'Sjekk om funnene er forankret i sitater og datamateriale.' }
    ]
  },
  'CASP RCT': {
    id: 'casp-rct',
    name: 'CASP Randomised Controlled Trial Checklist',
    acronym: 'CASP RCT',
    targetDesign: 'Randomisert kontrollert studie (RCT)',
    description: 'Kritisk sjekkliste for randomiserte kontrollerte studier (Critical Appraisal Skills Programme).',
    criteria: [
      { id: 'casp-1', category: 'Formål & Design', question: 'Hadde studien et klart fokusert forskningsspørsmål?', guidance: 'Vurder populasjon, intervensjon, komparator og utfall (PICO).' },
      { id: 'casp-2', category: 'Metode & Utvalg', question: 'Var det en randomisert kontrollert studie, og var randomiseringen hensiktsmessig?', guidance: 'Sjekk hvordan randomiseringssekvensen ble generert.' },
      { id: 'casp-3', category: 'Metode & Utvalg', question: 'Ble alle deltakere som kom inn i studien redegjort for ved slutten?', guidance: 'Sjekk frafall og intention-to-treat analyse.' },
      { id: 'casp-4', category: 'Formål & Design', question: 'Ble deltakere blindet for behandlingen de fikk? (Likt med behandlere og forskere?)', guidance: 'Vurder blinding.' },
      { id: 'casp-5', category: 'Metode & Utvalg', question: 'Var gruppene like ved studiens start?', guidance: 'Sjekk baseline-tabeller.' },
      { id: 'casp-6', category: 'Etikk & Konklusjon', question: 'Fikk alle grupper lik behandling utover selve intervensjonen?', guidance: 'Vurder co-interventions.' },
      { id: 'casp-7', category: 'Dataanalyse & Funn', question: 'Hvor store var effektene av behandlingen?', guidance: 'Vurder odds ratio, relative risk eller konfidensintervaller.' },
      { id: 'casp-8', category: 'Etikk & Konklusjon', question: 'Er resultatet presist? (Er det oppgitt konfidensintervaller?)', guidance: 'Statistisk presisjon.' }
    ]
  },
  'AMSTAR 2': {
    id: 'amstar-2',
    name: 'AMSTAR 2: A Critical Appraisal Tool for Systematic Reviews',
    acronym: 'AMSTAR 2',
    targetDesign: 'Systematisk oversikt',
    description: 'Verktøy for kritisk vurdering av systematiske oversikter av randomiserte eller ikke-randomiserte studier.',
    criteria: [
      { id: 'am-1', category: 'Formål & Design', question: 'Inkluderte forskningsspørsmålet og inklusjonskriteriene PICO-komponenter?', guidance: 'Tydelig definert populasjon og intervensjon.' },
      { id: 'am-2', category: 'Formål & Design', question: 'Hadde rapporten en eksplisitt redegjørelse for at review-metoden ble etablert før gjennomføringen?', guidance: 'Protokoll og registrering.' },
      { id: 'am-3', category: 'Metode & Utvalg', question: 'Forklarte forfatterne valg av studiedesign for inklusjon?', guidance: 'Begrunnelse for studiedesign.' },
      { id: 'am-4', category: 'Metode & Utvalg', question: 'Brukt forfatterne en omfattende litteratursøkstrategi?', guidance: 'Søk i minst to databaser.' },
      { id: 'am-5', category: 'Metode & Utvalg', question: 'Ble studieseleksjonen utført i duplikat?', guidance: 'Uavhengig screening av to personer.' },
      { id: 'am-6', category: 'Dataanalyse & Funn', question: 'Ble dataekstraksjonen utført i duplikat?', guidance: 'Uavhengig uthenting.' },
      { id: 'am-7', category: 'Dataanalyse & Funn', question: 'Utarbeidet forfatterne en liste over ekskluderte studier med begrunnelse?', guidance: 'Ekskluderingstabell.' }
    ]
  }
};

export class AssessmentEngine {
  /**
   * Automatically determines the correct instrument based on detected study design in text.
   */
  public static selectInstrumentForText(fullText: string): AppraisalInstrument {
    const lower = fullText.toLowerCase();

    if (lower.includes('systematisk oversikt') || lower.includes('systematic review') || lower.includes('meta-analyse')) {
      return APPRAISAL_INSTRUMENTS['AMSTAR 2'];
    }
    if (lower.includes('randomisert') || lower.includes('rct') || lower.includes('randomized controlled trial')) {
      return APPRAISAL_INSTRUMENTS['CASP RCT'];
    }
    // Default to qualitative JBI as primary or fallback
    return APPRAISAL_INSTRUMENTS['JBI Qualitative'];
  }
}
