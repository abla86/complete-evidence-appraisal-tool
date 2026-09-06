import { generateId } from '../utils/id';

export function generateUniqueId(prefix = 'id'): string {
  return generateId(prefix);
}

export function generateArticleId(prefix = 'art'): string {
  return generateId(prefix);
}

export function generateAuditId(prefix = 'audit'): string {
  return generateId(prefix);
}