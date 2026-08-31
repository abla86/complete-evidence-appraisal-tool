import { AppraisalInstrument, InstrumentCategory } from '../types';
import { JBI_INSTRUMENTS } from './instruments/jbiSuite';
import { CASP_INSTRUMENTS } from './instruments/caspSuite';
import { RISK_OF_BIAS_INSTRUMENTS } from './instruments/riskOfBiasSuite';
import { SYNTHESIS_AND_CERTAINTY_INSTRUMENTS } from './instruments/synthesesAndCertainty';
import { GUIDELINES_AND_ETHICS_INSTRUMENTS } from './instruments/guidelinesAndEthics';
import { IMPLEMENTATION_AND_MIXED_INSTRUMENTS } from './instruments/implementationAndMixed';

/**
 * MASTER REGISTRY – EVIDENCE APPRAISAL & METHODOLOGY SUITE
 * Komplett bibliotek over metodiske instrumenter, sjekklister, bias-verktøy,
 * etiske retningslinjer og implementeringsrammeverk for kunnskapsbasert praksis (KBP).
 */
export const MASTER_INSTRUMENTS_REGISTRY: AppraisalInstrument[] = [
  ...JBI_INSTRUMENTS,
  ...CASP_INSTRUMENTS,
  ...RISK_OF_BIAS_INSTRUMENTS,
  ...SYNTHESIS_AND_CERTAINTY_INSTRUMENTS,
  ...GUIDELINES_AND_ETHICS_INSTRUMENTS,
  ...IMPLEMENTATION_AND_MIXED_INSTRUMENTS
];

export const MethodologyRegistry = MASTER_INSTRUMENTS_REGISTRY;

export interface InstrumentCategoryMetadata {
  id: InstrumentCategory;
  name: string;
  nameEn: string;
  description: string;
  badgeColor: string;
  iconName: string;
  itemCount: number;
}

export const INSTRUMENT_CATEGORIES: InstrumentCategoryMetadata[] = [
  {
    id: 'critical_appraisal',
    name: 'Kritisk vurdering',
    nameEn: 'Critical Appraisal',
    description: 'Systematiske sjekklister for kvalitetsvurdering av kvalitative studier, RCT, kohorter, kasus-kontroll, tverrsnitt og mixed methods (JBI, CASP, MMAT).',
    badgeColor: 'bg-teal-50 text-teal-800 border-teal-200',
    iconName: 'ShieldCheck',
    itemCount: MASTER_INSTRUMENTS_REGISTRY.filter(i => i.category === 'critical_appraisal').length
  },
  {
    id: 'risk_of_bias',
    name: 'Risk of Bias & Intern validitet',
    nameEn: 'Risk of Bias',
    description: 'Cochranes offisielle domenebaserte verktøy for systematisk biasvurdering i randomiserte og ikke-randomiserte intervensjons- og eksponeringsstudier (RoB 2, ROBINS-I, ROBINS-E, QUADAS-2, ROBIS, PROBAST).',
    badgeColor: 'bg-amber-50 text-amber-800 border-amber-200',
    iconName: 'AlertTriangle',
    itemCount: MASTER_INSTRUMENTS_REGISTRY.filter(i => i.category === 'risk_of_bias').length
  },
  {
    id: 'reporting_synthesis',
    name: 'Synteser, Scoping & Rapportering',
    nameEn: 'Syntheses & Reporting Standards',
    description: 'Internasjonale standarder for kunnskapssynteser, metaanalyser og scoping reviews (AMSTAR 2, PRISMA 2020, PRISMA-ScR, ENTREQ, MOOSE, GRAMMS).',
    badgeColor: 'bg-blue-50 text-blue-800 border-blue-200',
    iconName: 'Layers',
    itemCount: MASTER_INSTRUMENTS_REGISTRY.filter(i => i.category === 'reporting_synthesis').length
  },
  {
    id: 'certainty_framework',
    name: 'Evidensgradering & Tillit',
    nameEn: 'Evidence Certainty & Confidence',
    description: 'Internasjonalt standardiserte rammeverk for gradering av sikkerhet og tillit i kvantitativ og kvalitativ evidens (GRADE, GRADE-CERQual).',
    badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    iconName: 'CheckCircle2',
    itemCount: MASTER_INSTRUMENTS_REGISTRY.filter(i => i.category === 'certainty_framework').length
  },
  {
    id: 'guideline_appraisal',
    name: 'Retningslinjer & Anbefalinger',
    nameEn: 'Clinical Guidelines Appraisal',
    description: 'Gullstandarder for metodisk evaluering og rapportering av kliniske retningslinjer og handlingsanbefalinger (AGREE II, AGREE-REX, RIGHT Statement).',
    badgeColor: 'bg-indigo-50 text-indigo-800 border-indigo-200',
    iconName: 'BookOpen',
    itemCount: MASTER_INSTRUMENTS_REGISTRY.filter(i => i.category === 'guideline_appraisal').length
  },
  {
    id: 'ethics_governance',
    name: 'Forskningsetikk & Integritet',
    nameEn: 'Research Ethics & Scientific Integrity',
    description: 'Nasjonale og internasjonale forskningsetiske standarder, Helsinki-deklarasjonen, NESH-retningslinjer, personvern (Sikt/REK) og EQUATOR-standarder (COREQ, STROBE, CONSORT, SQUIRE, TIDieR).',
    badgeColor: 'bg-purple-50 text-purple-800 border-purple-200',
    iconName: 'Scale',
    itemCount: MASTER_INSTRUMENTS_REGISTRY.filter(i => i.category === 'ethics_governance').length
  },
  {
    id: 'implementation',
    name: 'Implementering & KBP',
    nameEn: 'Implementation Science & KTA',
    description: 'Rammeverk for determinanter, barrierer, kunnskapstranslasjon og helsetjenesteimplementering (CFIR 2.0, KTA, RE-AIM, Proctor Implementation Outcomes).',
    badgeColor: 'bg-rose-50 text-rose-800 border-rose-200',
    iconName: 'Sparkles',
    itemCount: MASTER_INSTRUMENTS_REGISTRY.filter(i => i.category === 'implementation').length
  }
];

/**
 * Finn instrument basert på ID
 */
export function getInstrumentById(id: string): AppraisalInstrument | undefined {
  return MASTER_INSTRUMENTS_REGISTRY.find(inst => inst.id === id);
}

/**
 * Finn anbefalt instrument basert på studiedesign eller metodisk formål
 */
export function findMatchingInstruments(query: string): AppraisalInstrument[] {
  const q = query.toLowerCase().trim();
  if (!q) return MASTER_INSTRUMENTS_REGISTRY;

  return MASTER_INSTRUMENTS_REGISTRY.filter(inst => {
    return (
      inst.name.toLowerCase().includes(q) ||
      inst.shortName.toLowerCase().includes(q) ||
      inst.purpose.toLowerCase().includes(q) ||
      inst.targetStudyDesign.some(d => d.toLowerCase().includes(q)) ||
      inst.categoryName.toLowerCase().includes(q) ||
      inst.publisher.toLowerCase().includes(q)
    );
  });
}
