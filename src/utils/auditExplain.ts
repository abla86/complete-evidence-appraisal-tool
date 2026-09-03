export interface AuditDiffValue {
  before: unknown;
  after: unknown;
}

export type AuditDiff = Record<string, AuditDiffValue>;

export function auditExplain(diff: AuditDiff): string[] {
  return Object.entries(diff).map(([key, value]) => {
    const before = formatValue(value.before);
    const after = formatValue(value.after);
    return `Feltet «${key}» ble endret fra «${before}» til «${after}».`;
  });
}

function formatValue(value: unknown): string {
  if (value === undefined) return 'ikke satt';
  if (value === null) return 'null';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return JSON.stringify(value);
}
