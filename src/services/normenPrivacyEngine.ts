export interface DeIdentificationAuditRecord{timestamp:string;algorithm:'SHA-256';inputDigest:string;outputDigest:string;replacements:number;clientOnly:true;}
export interface DeIdentificationResult{deIdentifiedText:string;replacements:number;audit:DeIdentificationAuditRecord;}
function mod11Valid(value:string):boolean{if(!/^\d{11}$/.test(value))return false;const d=value.split('').map(Number);const w1=[3,2,7,6,5,4,3,2,1],w2=[5,4,3,2,7,6,5,4,3,2];const c1=11-(w1.reduce((s,w,i)=>s+d[i]*w,0)%11),c2=11-(w2.reduce((s,w,i)=>s+d[i]*w,0)%11);const k1=c1===11?0:c1===10?-1:c1,k2=c2===11?0:c2===10?-1:c2;return k1>=0&&k2>=0&&k1===d[9]&&k2===d[10];}
async function sha256(value:string):Promise<string>{const digest=await globalThis.crypto.subtle.digest('SHA-256',new TextEncoder().encode(value));return Array.from(new Uint8Array(digest)).map(b=>b.toString(16).padStart(2,'0')).join('');}
export interface DeIdentificationOptions{knownNames?:string[];replaceNames?:boolean;replaceAddresses?:boolean;}
export function isValidNorwegianNationalId(value:string):boolean{return mod11Valid(value);}
export async function deIdentifyHealthcareText(text:string,options:DeIdentificationOptions={}):Promise<DeIdentificationResult>{
 let output=text,replacements=0;
 const replace=(pattern:RegExp,label:string)=>{output=output.replace(pattern,()=>{replacements++;return label;});};
 replace(/\b\d{11}\b/g,'[FNR_REDACTED]');
 replace(/\b(?:HPR[- ]?nr\.?|HPR)\s*[:#-]?\s*\d{6,8}\b/gi,'HPR-[REDACTED]');
 if(options.knownNames){for(const name of [...options.knownNames].filter(Boolean).sort((a,b)=>b.length-a.length)){const escaped=name.replace(/[.*+?^$()|[\]\\]/g,'\\$&');replace(new RegExp('\\b'+escaped+'\\b','gi'),'[NAME_REDACTED]');}}
 if(options.replaceNames)replace(/\b(?:Ola|Kari|Per|Anne|Hans|Liv)\s+[A-ZÃ†Ã˜Ã…][a-zÃ¦Ã¸Ã¥]+\b/g,'[NAME_REDACTED]');
 if(options.replaceAddresses!==false)replace(/\b(?:St|Street|Gate|veg|veien|vei)\.?\s+[A-Za-zÃ†Ã˜Ã…Ã¦Ã¸Ã¥0-9 .'-]{2,60}\s+\d{1,4}\b/gi,'[ADDRESS_REDACTED]');
 const [inputDigest,outputDigest]=await Promise.all([sha256(text),sha256(output)]);
 return{deIdentifiedText:output,replacements,audit:{timestamp:new Date().toISOString(),algorithm:'SHA-256',inputDigest,outputDigest,replacements,clientOnly:true}};
}

