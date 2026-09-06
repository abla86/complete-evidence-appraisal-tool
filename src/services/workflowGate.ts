export type WorkflowGateState =
  | { ok: true }
  | { ok: false; reason: string };

export function requireScreened(state: string | undefined): WorkflowGateState {
  return state === 'reviewed'
    ? { ok: true }
    : { ok: false, reason: 'source-record-must-be-reviewed-before-PICO-attachment' };
}

export function requireReferenceVerification(status: string, verified: boolean): WorkflowGateState {
  if (verified && status === 'VALIDATED') return { ok: true };
  return { ok: false, reason: 'reference-verification-required' };
}

export function requireNoFalseClaim(flag: 'detected' | 'verified' | 'signal' | 'certified'): WorkflowGateState {
  if (flag === 'verified' || flag === 'certified') return { ok: false, reason: 'unsupported-certification-claim' };
  return { ok: true };
}

