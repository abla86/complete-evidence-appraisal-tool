import crypto from 'node:crypto';
import type {ResearchDocument,EvidenceClaim} from '../types/index.js';
const documents=new Map<string,ResearchDocument>();const claims=new Map<string,EvidenceClaim>();
export function addDocument(input:Omit<ResearchDocument,'id'|'createdAt'|'verification'>){const d={...input,id:crypto.randomUUID(),createdAt:new Date().toISOString(),verification:'unverified' as const};documents.set(d.id,d);return d}
export function getDocument(id:string){return documents.get(id)}
export function listDocuments(){return [...documents.values()].map(d=>({...d,text:undefined,characters:d.text.length}))}
export function searchDocuments(query:string,ids?:string[]){const terms=query.toLowerCase().split(/\s+/).filter(Boolean);const allow=ids?.length?new Set(ids):undefined;const out:EvidenceLocation[]=[];for(const d of documents.values()){if(allow&&!allow.has(d.id))continue;const t=d.text.toLowerCase();for(const term of terms){let p=t.indexOf(term),n=0;while(p>=0&&n<10){out.push({documentId:d.id,fileName:d.fileName,location:`character:${p}`,quote:d.text.slice(Math.max(0,p-220),Math.min(d.text.length,p+600))});p=t.indexOf(term,p+1);n++}}}return out.slice(0,100)}
export function createClaim(input:Omit<EvidenceClaim,'id'|'createdAt'>){const c={...input,id:crypto.randomUUID(),createdAt:new Date().toISOString()};claims.set(c.id,c);return c}
export function listClaims(){return [...claims.values()]}
export function verifyDocument(id:string){const d=documents.get(id);if(!d)throw Error('Document not found');d.verification='verified';return d}
