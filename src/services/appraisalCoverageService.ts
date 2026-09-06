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

const RUNTIME_ENGINE_IDS = new Set([
  'jbi-qualitative-2017', 'amstar-2', 'agree-ii', 'rob-2', 'robins-i',
]);

const ENGINE_ONLY_IDS = new Set([
  'casp-qualitative', 'grade', 'grade-cerqual', 'who-etd', 'cfir-2', 'kta',
  'robis', 'quadas-2', 'quips', 'probast', 'mmat'
]);

export function getInstrumentCoverage(): InstrumentCoverage[] {
  return MASTER_INSTRUMENTS_REGISTRY.map((instrument: AppraisalInstrument) => {
    const hasQuestions = Boolean(instrument.questions?.length);
    const implementationLevel: ImplementationLevel = RUNTIME_ENGINE_IDS.has(instrument.id)
      ? 'FULL'
      : ENGINE_ONLY_IDS.has(instrument.id)
        ? 'ENGINE'
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
      readyForAssessment: implementationLevel === 'FULL',
      note: implementationLevel === 'FULL'
        ? 'Kanonisk arbeidsflate og instrumentspesifikk resultatmotor er koblet.'
        : implementationLevel === 'ENGINE'
          ? 'Det finnes en instrumentspesifikk motor, men den er ikke koblet til den kanoniske arbeidsflaten ennÃ¥.'
          : implementationLevel === 'WORKSPACE'
            ? 'Felles vurderingsflate finnes; instrumentspesifikk resultatmotor er ikke koblet.'
            : 'Instrumentet finnes som metoderegisteroppfÃ¸ring, men er ikke aktivt kjÃ¸rbart i appraisal-arbeidsflaten.'
    };
  });
}

