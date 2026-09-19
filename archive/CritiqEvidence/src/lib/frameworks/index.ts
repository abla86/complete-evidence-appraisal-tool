import { FrameworkType, ChecklistCriterion } from '@/types/frameworks';
import { CASP_QUALITATIVE_CRITERIA } from './caspQualitative';
import { AMSTAR_2_CRITERIA } from './amstar2';
import { AGREE_II_CRITERIA } from './agree2';
import { COCHRANE_ROB_2_CRITERIA } from './cochraneRob2';

export { CASP_QUALITATIVE_CRITERIA } from './caspQualitative';
export { AMSTAR_2_CRITERIA } from './amstar2';
export { AGREE_II_CRITERIA } from './agree2';
export { COCHRANE_ROB_2_CRITERIA } from './cochraneRob2';

export interface FrameworkMeta {
  id: FrameworkType;
  title: string;
  subtitle: string;
  studyType: string;
  description: string;
  totalCriteria: number;
  mandatoryCount: number;
}

export const FRAMEWORK_REGISTRY: Record<FrameworkType, { meta: FrameworkMeta; criteria: ChecklistCriterion[] }> = {
  CASP_QUALITATIVE: {
    meta: {
      id: 'CASP_QUALITATIVE',
      title: 'CASP Kvalitativ',
      subtitle: 'Critical Appraisal Skills Programme',
      studyType: 'Kvalitativ forskning (intervjuer, fokusgrupper, observasjon)',
      description: 'Systematisk verktøy med 10 kriterier for vurdering av metodisk kvalitet i kvalitative studier.',
      totalCriteria: CASP_QUALITATIVE_CRITERIA.length,
      mandatoryCount: CASP_QUALITATIVE_CRITERIA.filter(c => c.mandatory).length,
    },
    criteria: CASP_QUALITATIVE_CRITERIA,
  },
  AMSTAR_2: {
    meta: {
      id: 'AMSTAR_2',
      title: 'AMSTAR 2',
      subtitle: 'A MeaSurement Tool to Assess systematic Reviews',
      studyType: 'Systematiske oversikter og meta-analyser',
      description: 'Kritisk vurdering av systematiske kunnskapsoversikter med fokus på 7 kritiske og 9 ikke-kritiske domener.',
      totalCriteria: AMSTAR_2_CRITERIA.length,
      mandatoryCount: AMSTAR_2_CRITERIA.filter(c => c.mandatory).length,
    },
    criteria: AMSTAR_2_CRITERIA,
  },
  AGREE_II: {
    meta: {
      id: 'AGREE_II',
      title: 'AGREE II',
      subtitle: 'Appraisal of Guidelines for Research & Evaluation II',
      studyType: 'Kliniske retningslinjer og veiledere',
      description: 'Internasjonal gullstandard for metodisk vurdering av kliniske faglige retningslinjer.',
      totalCriteria: AGREE_II_CRITERIA.length,
      mandatoryCount: AGREE_II_CRITERIA.filter(c => c.mandatory).length,
    },
    criteria: AGREE_II_CRITERIA,
  },
  COCHRANE_ROB_2: {
    meta: {
      id: 'COCHRANE_ROB_2',
      title: 'Cochrane RoB 2',
      subtitle: 'Risk of Bias 2 Tool',
      studyType: 'Randomiserte kontrollerte forsøk (RCT)',
      description: 'Cochranes offisielle verktøy for vurdering av risiko for skjevhet i randomiserte studier.',
      totalCriteria: COCHRANE_ROB_2_CRITERIA.length,
      mandatoryCount: COCHRANE_ROB_2_CRITERIA.filter(c => c.mandatory).length,
    },
    criteria: COCHRANE_ROB_2_CRITERIA,
  },
};

export function getFrameworkCriteria(type: FrameworkType): ChecklistCriterion[] {
  return FRAMEWORK_REGISTRY[type]?.criteria || CASP_QUALITATIVE_CRITERIA;
}
