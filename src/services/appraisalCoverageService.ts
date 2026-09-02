import { MASTER_INSTRUMENTS_REGISTRY } from '../data/masterRegistry';
import type { AppraisalInstrument } from '../types';

export type ImplementationLevel = 'FULL' | 'ENGINE' | 'WORKSPACE' | 'REGISTRY_ONLY';

export interface InstrumentCoverage {
  instrumentId: string;
  name: string;
  category: string;
  itemCount: number;
  hasQuestions: boolean;
  implementationLevel: ImplementationLevel;
  readyForAssessment: boolean;
  note: string;
}

const ENGINE_IDS = new Set(['jbi-qualitative-2017', 'amstar-2', 'agree-ii', 'rob-2', 'casp-qualitative']);

export function getInstrumentCoverage(): InstrumentCoverage[] {
  return MASTER_INSTRUMENTS_REGISTRY.map((instrument: AppraisalInstrument) => {
    const hasQuestions = Boolean(instrument.questions?.length);
    const implementationLevel: ImplementationLevel = ENGINE_IDS.has(instrument.id)
      ? 'FULL'
      : hasQuestions
        ? 'WORKSPACE'
        : 'REGISTRY_ONLY';

    return {
      instrumentId: instrument.id,
      name: instrument.name,
      category: instrument.categoryName,
      itemCount: instrument.itemCount,
      hasQuestions,
      implementationLevel,
      readyForAssessment: implementationLevel !== 'REGISTRY_ONLY',
      note: implementationLevel === 'FULL'
        ? 'Arbeidsflate og instrumentspesifikk resultatmotor er koblet.'
        : implementationLevel === 'WORKSPACE'
          ? 'Felles vurderingsflate finnes; egen beregnings-/tolkningsmotor må kobles før vitenskapelig resultat kan kalles instrumentspesifikt.'
          : 'Instrumentet finnes som metoderegisteroppføring, men har ikke egen vurderingsflate ennå.'
    };
  });
}
