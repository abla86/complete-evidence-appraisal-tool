import { LegalActReference, LegalAnalysisResult } from '../types';

export interface KnownLegalActRule {
  id: string;
  actName: string;
  officialShortCode: string;
  jurisdiction: 'Norge' | 'EU/EØS' | 'Internasjonal';
  legalCategory: LegalActReference['legalCategory'];
  legalCategoryName: string;
  defaultNormativeLevel: LegalActReference['normativeLevel'];
  matchKeywords: string[];
  sectionRegexes?: RegExp[];
  description: string;
  relevanceForAppraisal: string;
}

export const KNOWN_LEGAL_ACTS_DATABASE: KnownLegalActRule[] = [
  {
    id: 'helse-og-omsorgstjenesteloven',
    actName: 'Helse- og omsorgstjenesteloven',
    officialShortCode: 'HOL',
    jurisdiction: 'Norge',
    legalCategory: 'STATUTORY_DUTY',
    legalCategoryName: 'Lovfestet plikt & Kommunalt ansvar',
    defaultNormativeLevel: 'MANDATORY_STATUTORY_DUTY',
    matchKeywords: [
      'helse- og omsorgstjenesteloven',
      'helse og omsorgstjenesteloven',
      'hol §',
      'lov om kommunale helse- og omsorgstjenester'
    ],
    sectionRegexes: [
      /helse-?\s*og\s*omsorgstjenesteloven\s*(?:§+|paragraf)?\s*([0-9]+-[0-9]+[a-z]?)/i,
      /hol\s*§+\s*([0-9]+-[0-9]+[a-z]?)/i
    ],
    description: 'Lov om kommunale helse- og omsorgstjenester. Lovfester kommunens plikt til å tilby nødvendige helse- og omsorgstjenester, individuell plan, pårørendestøtte og samarbeidsavtaler.',
    relevanceForAppraisal: 'I faglige retningslinjer markerer henvisninger til denne loven bindende lovfestede plikter for kommuner og bydeler, i motsetning til faglige råd/anbefalinger.'
  },
  {
    id: 'spesialisthelsetjenesteloven',
    actName: 'Spesialisthelsetjenesteloven',
    officialShortCode: 'SPHL',
    jurisdiction: 'Norge',
    legalCategory: 'STATUTORY_DUTY',
    legalCategoryName: 'Lovfestet plikt & Spesialisthelsetjeneste',
    defaultNormativeLevel: 'MANDATORY_STATUTORY_DUTY',
    matchKeywords: [
      'spesialisthelsetjenesteloven',
      'spesialisthelsetjenestelov',
      'lov om spesialisthelsetjenesten',
      'sphl §'
    ],
    sectionRegexes: [
      /spesialisthelsetjenesteloven\s*(?:§+|paragraf)?\s*([0-9]+-[0-9]+[a-z]?)/i,
      /sphl\s*§+\s*([0-9]+-[0-9]+[a-z]?)/i
    ],
    description: 'Lov om spesialisthelsetjenesten m.m. Lovfester regionale helseforetaks og sykehusenes plikter innen diagnostikk, behandling, pasientkoordinering og veiledningsplikt overfor kommunene.',
    relevanceForAppraisal: 'Definerer formelle juridiske krav til spesialisthelsetjenestens organisering og pasientrettede plikter.'
  },
  {
    id: 'helsepersonelloven',
    actName: 'Helsepersonelloven',
    officialShortCode: 'HPL',
    jurisdiction: 'Norge',
    legalCategory: 'CONFIDENTIALITY_SECRECY',
    legalCategoryName: 'Taushetsplikt, Opplysningsplikt & Faglig forsvarlighet',
    defaultNormativeLevel: 'MANDATORY_STATUTORY_DUTY',
    matchKeywords: [
      'helsepersonelloven',
      'helsepersonellov',
      'lov om helsepersonell',
      'hpl §'
    ],
    sectionRegexes: [
      /helsepersonelloven\s*(?:§+|paragraf)?\s*([0-9]+[a-z]?)/i,
      /hpl\s*§+\s*([0-9]+[a-z]?)/i
    ],
    description: 'Lov om helsepersonell m.v. Lovfester krav til faglig forsvarlighet (§ 4), taushetsplikt (§ 21), opplysningsrett (§ 22ff) og opplysningsplikt til barnevern (§ 33) og nødetater (§ 31).',
    relevanceForAppraisal: 'I kliniske studier og retningslinjer er etterlevelse av taushetsplikt og opplysningsplikt avgjørende for etisk og juridisk gyldighet.'
  },
  {
    id: 'pasient-og-brukerrettighetsloven',
    actName: 'Pasient- og brukerrettighetsloven',
    officialShortCode: 'PBRL',
    jurisdiction: 'Norge',
    legalCategory: 'PATIENT_RIGHT',
    legalCategoryName: 'Pasientrettigheter & Samtykkekompetanse',
    defaultNormativeLevel: 'STATUTORY_RIGHT',
    matchKeywords: [
      'pasient- og brukerrettighetsloven',
      'pasientrettighetsloven',
      'pasient- og brukerrettighetslov',
      'pbrl §',
      'lov om pasient- og brukerrettigheter'
    ],
    sectionRegexes: [
      /pasient-?\s*(?:og\s*bruker)?rettighetsloven\s*(?:§+|paragraf)?\s*([0-9]+-[0-9]+[a-z]?)/i,
      /pbrl\s*§+\s*([0-9]+-[0-9]+[a-z]?)/i
    ],
    description: 'Lov om pasient- og brukerrettigheter. Gir rett til nødvendig helsehjelp, medvirkning, informasjon, journalinnsyn, samtykke til helsehjelp (kap. 4) og individuell plan (§ 2-5).',
    relevanceForAppraisal: 'Vurderer om pasientens lovfestede rettigheter til medvirkning og informert samtykke er ivaretatt i intervensjoner og retningslinjer.'
  },
  {
    id: 'barnevernsloven',
    actName: 'Barnevernsloven',
    officialShortCode: 'BVL',
    jurisdiction: 'Norge',
    legalCategory: 'STATUTORY_DUTY',
    legalCategoryName: 'Barnevern & Lovpålagt meldeplikt',
    defaultNormativeLevel: 'MANDATORY_STATUTORY_DUTY',
    matchKeywords: [
      'barnevernsloven',
      'barnevernloven',
      'barnevernlov',
      'lov om barnevern',
      'bvl §'
    ],
    sectionRegexes: [
      /barnevern(?:s)?loven\s*(?:§+|paragraf)?\s*([0-9]+-[0-9]+[a-z]?)/i,
      /bvl\s*§+\s*([0-9]+-[0-9]+[a-z]?)/i
    ],
    description: 'Lov om barnevern. Regulerer tiltak for sårbare barn, meldeplikt fra helsepersonell og tverrsektorielt samarbeid mellom barnevern og helsetjenester.',
    relevanceForAppraisal: 'Sentralt i studier om barnehelse og tverretatlig samarbeid (f.eks. ved vurdering av fastlegers meldeplikt og samarbeid med barnevernet).'
  },
  {
    id: 'helseforskningsloven',
    actName: 'Helseforskningsloven',
    officialShortCode: 'HFL',
    jurisdiction: 'Norge',
    legalCategory: 'ETHICS_RESEARCH_APPROVAL',
    legalCategoryName: 'Medisinsk og helsefaglig forskningsetikk (REK)',
    defaultNormativeLevel: 'LEGAL_ETHICAL_REQUIREMENT',
    matchKeywords: [
      'helseforskningsloven',
      'helseforskningslov',
      'lov om medisinsk og helsefaglig forskning',
      'rek-godkjenning',
      'regional etisk komite',
      'regional komité for medisinsk og helsefaglig forskningsetikk',
      'regional committees for medical and health research ethics',
      'rek sør-øst',
      'rek nord',
      'rek vest',
      'rek midt'
    ],
    sectionRegexes: [
      /helseforskningsloven\s*(?:§+|paragraf)?\s*([0-9]+[a-z]?)/i,
      /rek\s*(?:sør-øst|nord|vest|midt)?\s*(?:ref|saksnummer|nr)?[:.]?\s*([0-9]+(?:\/[0-9]+)?)/i
    ],
    description: 'Lov om medisinsk og helsefaglig forskning. Krever forhåndsgodkjenning fra REK for all forskning på mennesker, humant biologisk materiale eller helseopplysninger.',
    relevanceForAppraisal: 'Kritisk kontrollpunkt i JBI Q9 og CASP etikkvurdering for norske helsefaglige primærstudier.'
  },
  {
    id: 'personopplysningsloven-gdpr',
    actName: 'Personopplysningsloven & GDPR',
    officialShortCode: 'POL / GDPR',
    jurisdiction: 'EU/EØS',
    legalCategory: 'PRIVACY_DATA_PROTECTION',
    legalCategoryName: 'Personvern, Databehandling & Sikt/NSD',
    defaultNormativeLevel: 'LEGAL_ETHICAL_REQUIREMENT',
    matchKeywords: [
      'personopplysningsloven',
      'gdpr',
      'general data protection regulation',
      'personvernforordningen',
      'sikt',
      'nsd',
      'norsk senter for forskningsdata',
      'personverntjenester',
      'databehandleravtale',
      'dataprotection'
    ],
    sectionRegexes: [
      /personopplysningsloven\s*(?:§+|paragraf)?\s*([0-9]+[a-z]?)/i,
      /gdpr\s*art(?:icle|\.?)?\s*([0-9]+[a-z]?)/i,
      /sikt\s*(?:ref|prosjekt|nr|referanse)?[:.]?\s*([0-9]+)/i,
      /nsd\s*(?:ref|prosjekt|nr|referanse)?[:.]?\s*([0-9]+)/i
    ],
    description: 'Lov om behandling av personopplysninger (personopplysningsloven) og EUs personvernforordning (GDPR). Krever gyldig behandlingsgrunnlag, personvernvurdering (Sikt/NSD), samtykke og konfidensialitet.',
    relevanceForAppraisal: 'Obligatorisk for kvalitativ forskning med personidentifiserende intervjudata og lydopptak (JBI Q9).'
  },
  {
    id: 'forskningsetikkloven',
    actName: 'Forskningsetikkloven',
    officialShortCode: 'FEL',
    jurisdiction: 'Norge',
    legalCategory: 'ETHICS_RESEARCH_APPROVAL',
    legalCategoryName: 'Forskningsetisk regelverk & Institusjonsansvar',
    defaultNormativeLevel: 'LEGAL_ETHICAL_REQUIREMENT',
    matchKeywords: [
      'forskningsetikkloven',
      'forskningsetikklov',
      'lov om organisering av forskningsetisk arbeid',
      'nesh',
      'nmt',
      'granskingsutvalget'
    ],
    sectionRegexes: [
      /forskningsetikkloven\s*(?:§+|paragraf)?\s*([0-9]+[a-z]?)/i
    ],
    description: 'Lov om organisering av forskningsetisk arbeid. Pålegger forskningsinstitusjoner å sikre god forskningsskikk og behandle uredelighetssaker.',
    relevanceForAppraisal: 'Danner det overordnede nasjonale rammeverket for vitenskapelig redelighet og metodisk integritet.'
  },
  {
    id: 'forvaltningsloven',
    actName: 'Forvaltningsloven',
    officialShortCode: 'FVL',
    jurisdiction: 'Norge',
    legalCategory: 'ADMINISTRATIVE_LAW',
    legalCategoryName: 'Forvaltningsrett, Taushetsplikt & Habilitet',
    defaultNormativeLevel: 'MANDATORY_STATUTORY_DUTY',
    matchKeywords: [
      'forvaltningsloven',
      'forvaltningslov',
      'fvl §',
      'lov om behandlingsmåten i forvaltningssaker'
    ],
    sectionRegexes: [
      /forvaltningsloven\s*(?:§+|paragraf)?\s*([0-9]+[a-z]?)/i,
      /fvl\s*§+\s*([0-9]+[a-z]?)/i
    ],
    description: 'Lov om behandlingsmåten i forvaltningssaker. Regulerer saksbehandling i offentlig forvaltning, herunder habilitet (§ 6), taushetsplikt (§ 13) og begrunnelsesplikt (§ 24).',
    relevanceForAppraisal: 'Relevant for offentlige helsevedtak, retningslinjeprosesser og forvaltningsmessig transparens.'
  },
  {
    id: 'declaration-of-helsinki',
    actName: 'Helsinki-deklarasjonen (WMA Declaration of Helsinki)',
    officialShortCode: 'WMA Helsinki',
    jurisdiction: 'Internasjonal',
    legalCategory: 'INTERNATIONAL_CONVENTION',
    legalCategoryName: 'Internasjonal forskningsetisk deklarasjon',
    defaultNormativeLevel: 'LEGAL_ETHICAL_REQUIREMENT',
    matchKeywords: [
      'declaration of helsinki',
      'helsinki declaration',
      'helsinkideklarasjonen',
      'helsinki-deklarasjonen',
      'wma declaration'
    ],
    description: 'World Medical Association etiske prinsipper for medisinsk forskning som involverer mennesker. Krever informert samtykke, protokollregistrering og uavhengig etisk komitévurdering.',
    relevanceForAppraisal: 'Global standard referert i internasjonale RCT-er og kliniske studier for JBI Q9 og CONSORT.'
  }
];

export class LegalActsIdentifierService {
  /**
   * Identifies all Norwegian and international laws, statutory mandates, regulations and ethical approvals in text.
   */
  public static identifyLegalActs(text: string, title?: string): LegalAnalysisResult {
    const raw = `${title || ''}\n${text || ''}`;
    const lower = raw.toLowerCase();

    const identifiedActs: LegalActReference[] = [];
    const foundActIds = new Set<string>();

    for (const rule of KNOWN_LEGAL_ACTS_DATABASE) {
      let matched = false;
      let matchedSnippet = '';
      let matchedSection: string | undefined = undefined;

      // 1. Keyword search
      for (const kw of rule.matchKeywords) {
        const idx = lower.indexOf(kw);
        if (idx !== -1) {
          matched = true;
          // Extract sentence/context snippet
          const start = Math.max(0, raw.lastIndexOf('.', idx) + 1, raw.lastIndexOf('\n', idx) + 1);
          let end = raw.indexOf('.', idx + kw.length);
          if (end === -1) end = Math.min(raw.length, idx + kw.length + 120);
          matchedSnippet = raw.slice(start, end).trim();
          break;
        }
      }

      // 2. Section extraction via regexes
      if (rule.sectionRegexes) {
        for (const regex of rule.sectionRegexes) {
          const match = raw.match(regex);
          if (match) {
            matched = true;
            matchedSection = match[1] ? `§ ${match[1]}` : undefined;
            if (!matchedSnippet) {
              matchedSnippet = match[0];
            }
            break;
          }
        }
      }

      if (matched && !foundActIds.has(rule.id)) {
        foundActIds.add(rule.id);

        const isStatutory = 
          rule.defaultNormativeLevel === 'MANDATORY_STATUTORY_DUTY' ||
          lower.includes('lovfestet plikt') ||
          lower.includes('lovhjemmel') ||
          lower.includes('skal') ||
          lower.includes('plikt');

        identifiedActs.push({
          actName: rule.actName,
          sectionReference: matchedSection,
          legalCategory: rule.legalCategory,
          legalCategoryName: rule.legalCategoryName,
          normativeLevel: isStatutory && rule.defaultNormativeLevel === 'MANDATORY_STATUTORY_DUTY' 
            ? 'MANDATORY_STATUTORY_DUTY' 
            : rule.defaultNormativeLevel,
          snippetText: matchedSnippet || rule.description,
          isStatutoryDuty: isStatutory,
          officialShortCode: rule.officialShortCode,
          description: rule.description,
          relevanceForAppraisal: rule.relevanceForAppraisal
        });
      }
    }

    // Detect explicit statutory mandate keywords in guidelines
    const hasStatutoryDutyKeywords = 
      lower.includes('lovfestet plikt') || 
      lower.includes('lovpålagt') || 
      lower.includes('lovhjemmel:') ||
      lower.includes('lovhjemlet plikt');

    const statutoryCount = identifiedActs.filter(a => a.isStatutoryDuty).length;

    // Detect specific ethical and privacy clearances
    const rekMatch = raw.match(/rek\s*(?:sør-øst|nord|vest|midt)?\s*(?:ref|saksnummer|nr|godkjenning)?[:.]?\s*([0-9]+(?:\/[0-9]+)?)/i);
    const siktMatch = raw.match(/(?:sikt|nsd)\s*(?:ref|prosjekt|nr|referanse)?[:.]?\s*([0-9]+)/i);

    const ethicsAndPrivacyApprovals = {
      hasRekApproval: lower.includes('rek') || lower.includes('regional komité for medisinsk') || lower.includes('regional etisk komite') || Boolean(rekMatch),
      rekReference: rekMatch ? rekMatch[0].trim() : undefined,
      hasSiktNsdApproval: lower.includes('sikt') || lower.includes('nsd') || lower.includes('norsk senter for forskningsdata') || Boolean(siktMatch),
      siktReference: siktMatch ? siktMatch[0].trim() : undefined,
      hasInformedConsent: lower.includes('informert samtykke') || lower.includes('informed consent') || lower.includes('skriftlig samtykke') || lower.includes('written consent'),
      hasDeclarationOfHelsinki: lower.includes('helsinki') || lower.includes('declaration of helsinki'),
      hasGdprCompliance: lower.includes('gdpr') || lower.includes('personvernforordningen') || lower.includes('personopplysningsloven') || lower.includes('anonymisering') || lower.includes('pseudonymiser')
    };

    let summary = '';
    if (identifiedActs.length === 0) {
      summary = 'Ingen eksplisitte referanser til spesifikke lovverk eller forskrifter ble identifisert i dokumentteksten.';
    } else {
      const actNames = identifiedActs.map(a => `${a.actName}${a.sectionReference ? ` (${a.sectionReference})` : ''}`).join(', ');
      summary = `${identifiedActs.length} lovverk/lovhjemler identifisert: ${actNames}.`;
    }

    return {
      identifiedActs,
      hasStatutoryDuties: statutoryCount > 0 || hasStatutoryDutyKeywords,
      statutoryDutiesCount: statutoryCount,
      ethicsAndPrivacyApprovals,
      summary
    };
  }

  /**
   * Distinguishes between statutory duties (lovfestede plikter) and clinical recommendations (faglige anbefalinger)
   * in clinical guidelines according to Helsedirektoratet standard.
   */
  public static classifyGuidelineRecommendationType(text: string): {
    level: 'LOVFESTET_PLIKT' | 'STERK_ANBEFALING' | 'SVAK_ANBEFALING' | 'FAGLIG_RAD';
    levelName: string;
    badgeColor: string;
    description: string;
    isLegallyBinding: boolean;
  } {
    const lower = (text || '').toLowerCase();

    if (lower.includes('lovfestet plikt') || lower.includes('lovpålagt plikt') || lower.includes('hjemlet i lov') || lower.includes('skal iht.') || lower.includes('lovhjemmel:')) {
      return {
        level: 'LOVFESTET_PLIKT',
        levelName: 'Lovfestet plikt («skal» / «må»)',
        badgeColor: 'bg-rose-100 text-rose-900 border-rose-300',
        description: 'Juridisk bindende plikt forankret direkte i helselovgivningen (f.eks. helse- og omsorgstjenesteloven eller pasient- og brukerrettighetsloven). Ikke gjenstand for lokalt skjønn.',
        isLegallyBinding: true
      };
    }

    if (lower.includes('sterk anbefaling') || lower.includes('bør') || lower.includes('strong recommendation')) {
      return {
        level: 'STERK_ANBEFALING',
        levelName: 'Sterk anbefaling («bør»)',
        badgeColor: 'bg-blue-100 text-blue-900 border-blue-300',
        description: 'Normerende faglig anbefaling hvor fordelene klart vurderes å oppveie ulempene basert på systematisk kunnskapsgrunnlag (GRADE).',
        isLegallyBinding: false
      };
    }

    if (lower.includes('svak anbefaling') || lower.includes('betinget anbefaling') || lower.includes('kan vurderes') || lower.includes('conditional recommendation')) {
      return {
        level: 'SVAK_ANBEFALING',
        levelName: 'Svak/betinget anbefaling («kan»)',
        badgeColor: 'bg-amber-100 text-amber-900 border-amber-300',
        description: 'Faglig anbefaling med balanse mellom fordeler og ulemper hvor pasientverdier og lokale ressurser må tillegges stor vekt.',
        isLegallyBinding: false
      };
    }

    return {
      level: 'FAGLIG_RAD',
      levelName: 'God praksis / Faglig råd',
      badgeColor: 'bg-slate-100 text-slate-900 border-slate-300',
      description: 'Erfaringsbasert eller konsensusbasert råd for god klinisk praksis der det mangler formelle GRADE-oppsummeringer.',
      isLegallyBinding: false
    };
  }
}
