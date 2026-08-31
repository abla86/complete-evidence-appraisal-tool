let globalIdCounter = 0;

/**
 * Generates a collision-free unique identifier with prefix, millisecond timestamp,
 * monotonic counter, and random alphanumeric suffix.
 */
export function generateUniqueId(prefix = 'id'): string {
  globalIdCounter += 1;
  const time = Date.now();
  const rand = Math.random().toString(36).substring(2, 9);
  return `${prefix}-${time}-${globalIdCounter}-${rand}`;
}

export function generateArticleId(prefix = 'art'): string {
  return generateUniqueId(prefix);
}

export function generateAuditId(prefix = 'audit'): string {
  return generateUniqueId(prefix);
}
