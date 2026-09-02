import type { AppraisalSession } from './universalAppraisalService';
import { getInstrumentOrNull, validateAppraisalSession } from './universalAppraisalService';

export interface AppraisalIntegrityReport {
  valid: boolean;
  blockingIssues: string[];
  warnings: string[];
}

export function validateAppraisalIntegrity(session: AppraisalSession): AppraisalIntegrityReport {
  const blockingIssues: string[] = [];
  const warnings: string[] = [];
  const instrument = getInstrumentOrNull(session.instrumentId);

  if (!instrument) return { valid: false, blockingIssues: ['Instrumentet finnes ikke i MethodologyRegistry.'], warnings };

  const validation = validateAppraisalSession(session);
  blockingIssues.push(...validation.issues);

  if (session.instrumentVersion !== instrument.version) {
    blockingIssues.push(`Instrumentversjon er endret: økt ${session.instrumentVersion}, registry ${instrument.version}. Opprett ny vurderingsversjon.`);
  }

  if (instrument.verificationStatus === 'PROTOTYPE' || instrument.verificationStatus === 'DEPRECATED') {
    warnings.push(`Instrumentstatus er ${instrument.verificationStatus}; resultatet skal ikke presenteres som gjeldende standard uten eksplisitt metodisk kontroll.`);
  }

  return { valid: blockingIssues.length === 0, blockingIssues, warnings };
}
