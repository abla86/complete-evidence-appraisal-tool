export function createId(prefix = 'id'): string {
  const uuid = typeof globalThis.crypto?.randomUUID === 'function'
    ? globalThis.crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return uuid;
}
