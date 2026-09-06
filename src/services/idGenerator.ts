import { generateId } from '../utils/id';
export const idGenerator = { next: (prefix?: string) => generateId(prefix) };