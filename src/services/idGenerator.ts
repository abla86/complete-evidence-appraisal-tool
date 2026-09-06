import { generateId } from '../utils/id';
export const idGenerator = { next: (prefix?: string): string => generateId(prefix) };