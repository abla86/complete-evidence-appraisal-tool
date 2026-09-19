import { ChecklistCriterion } from '@/types/frameworks';

export const CASP_QUALITATIVE_CRITERIA: ChecklistCriterion[] = [
  {
    id: 'casp_q1',
    code: 'CASP_1',
    questionText: 'Var det en klar og tydelig formålsbeskrivelse for forskningen?',
    helpText: 'Sjekk om målet med studien er eksplisitt formulert og hvorfor studien var viktig.',
    mandatory: true,
  },
  {
    id: 'casp_q2',
    code: 'CASP_2',
    questionText: 'Er en kvalitativ metodikk hensiktsmessig?',
    helpText: 'Passer metoden for å belyse forskningsspørsmålet og deltakernes opplevelser/mening?',
    mandatory: true,
  },
  {
    id: 'casp_q3',
    code: 'CASP_3',
    questionText: 'Var forskningsdesignet hensiktsmessig for å nå målene?',
    helpText: 'Har forskeren begrunnet designvalget (f.eks. fenomenologi, grounded theory)?',
    mandatory: false,
  },
  {
    id: 'casp_q4',
    code: 'CASP_4',
    questionText: 'Var rekrutteringsstrategien hensiktsmessig for forskningsmålene?',
    helpText: 'Er det forklart hvordan deltakerne ble valgt ut, og hvorfor noen eventuelt falt fra?',
    mandatory: false,
  },
  {
    id: 'casp_q5',
    code: 'CASP_5',
    questionText: 'Ble dataene samlet inn på en måte som adresserte forskningsspørsmålet?',
    helpText: 'Er datainnsamlingsmetoden (intervjuguide, metning, kontekst) klart beskrevet?',
    mandatory: false,
  },
  {
    id: 'casp_q6',
    code: 'CASP_6',
    questionText: 'Har forholdet mellom forsker og deltakere blitt tilstrekkelig vurdert (refleksivitet)?',
    helpText: 'Gjør forskeren rede for egen forforståelse, posisjonalitet og potensiell påvirkning?',
    mandatory: true,
  },
  {
    id: 'casp_q7',
    code: 'CASP_7',
    questionText: 'Ble etiske hensyn tatt i betraktning?',
    helpText: 'Foreligger informert samtykke, godkjenning fra etisk komité (REK/Sikt) og konfidensialitet?',
    mandatory: true,
  },
  {
    id: 'casp_q8',
    code: 'CASP_8',
    questionText: 'Var dataanalysen tilstrekkelig stringent?',
    helpText: 'Beskrives analyseprosessen (f.eks. Braun & Clarke tematisk analyse), koding og validering?',
    mandatory: true,
  },
  {
    id: 'casp_q9',
    code: 'CASP_9',
    questionText: 'Er det en klar redegjørelse for funnene?',
    helpText: 'Er funnene underbygget med relevante sitater og drøftet opp mot datamaterialet?',
    mandatory: true,
  },
  {
    id: 'casp_q10',
    code: 'CASP_10',
    questionText: 'Hvor verdifull er forskningen?',
    helpText: 'Drøfter forfatterne overførbarhet, praktisk nytte og bidrag til eksisterende kunnskapsfelt?',
    mandatory: false,
  },
];
