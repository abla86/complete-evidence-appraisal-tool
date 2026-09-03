export function createId(prefix = 'id'): string {
  const uuid = typeof globalThis.crypto?.randomUUID === 'function'
    ? globalThis.crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  if (typeof uuid === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(uuid)) {
    return uuid;
  }

  // RFC 4122 UUIDv4 fallback for environments without crypto.randomUUID.
  const seed = `${Date.now()}-${Math.random()}-${Math.random()}`;
  const hex = Array.from({ length: 32 }, (_, index) => {
    const value = Math.floor((seed.charCodeAt(index % seed.length) * 2654435761 + index * 97) % 16);
    return value.toString(16);
  });
  hex[12] = '4';
  hex[16] = ((parseInt(hex[16], 16) & 0x3) | 0x8).toString(16);
  return `${hex.slice(0, 8).join('')}-${hex.slice(8, 12).join('')}-${hex.slice(12, 16).join('')}-${hex.slice(16, 20).join('')}-${hex.slice(20).join('')}`;
}
