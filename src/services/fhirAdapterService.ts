export type FhirResourceType = 'DocumentReference' | 'Observation' | 'Condition';

export interface FhirReference { reference?: string; display?: string; }
export interface FhirCodeableConcept { text?: string; coding?: Array<{ system?: string; code?: string; display?: string }>; }
export interface FhirDocumentReference {
  resourceType: 'DocumentReference'; id?: string; status?: string; date?: string;
  subject?: FhirReference; description?: string; type?: FhirCodeableConcept;
  content?: Array<{ attachment?: { contentType?: string; url?: string; title?: string; creation?: string } }>;
  [key: string]: unknown;
}
export interface FhirObservation {
  resourceType: 'Observation'; id?: string; status?: string; code?: FhirCodeableConcept;
  subject?: FhirReference; effectiveDateTime?: string;
  valueQuantity?: { value?: number; unit?: string; system?: string; code?: string };
  valueString?: string; [key: string]: unknown;
}
export interface FhirCondition {
  resourceType: 'Condition'; id?: string; clinicalStatus?: FhirCodeableConcept;
  verificationStatus?: FhirCodeableConcept; code?: FhirCodeableConcept;
  subject?: FhirReference; onsetDateTime?: string; recordedDate?: string; [key: string]: unknown;
}
export interface ParsedFhirDocumentReference { id: string; status: string; date?: string; description: string; type?: string; subject?: string; attachments: Array<{contentType?:string;url?:string;title?:string;creation?:string}>; }
export interface ParsedFhirObservation { id:string; status:string; code:string; value?:string; unit?:string; effectiveDateTime?:string; subject?:string; }
export interface ParsedFhirCondition { id:string; code:string; clinicalStatus?:string; verificationStatus?:string; subject?:string; onsetDateTime?:string; recordedDate?:string; }
export interface FhirStudyData { documentReferences:ParsedFhirDocumentReference[]; observations:ParsedFhirObservation[]; conditions:ParsedFhirCondition[]; rawBundle?:unknown; }
export interface SmartOnFhirTokenExchange { tokenUrl:string; clientId:string; redirectUri:string; scopes:string[]; exchangeCode:(code:string)=>Promise<{accessToken:string;tokenType?:string;expiresIn?:number;refreshToken?:string}>; }

const display=(c?:FhirCodeableConcept)=>c?.text||c?.coding?.find(x=>x.display)?.display||c?.coding?.find(x=>x.code)?.code||'';
const subject=(r?:FhirReference)=>r?.reference||r?.display||'';

export function parseDocumentReference(r:FhirDocumentReference):ParsedFhirDocumentReference{return{id:r.id||'',status:r.status||'unknown',date:r.date,description:r.description||'',type:display(r.type)||undefined,subject:subject(r.subject)||undefined,attachments:(r.content||[]).map(x=>({contentType:x.attachment?.contentType,url:x.attachment?.url,title:x.attachment?.title,creation:x.attachment?.creation}))};}
export function parseObservation(r:FhirObservation):ParsedFhirObservation{return{id:r.id||'',status:r.status||'unknown',code:display(r.code),value:r.valueString??(r.valueQuantity?.value!==undefined?String(r.valueQuantity.value):undefined),unit:r.valueQuantity?.unit||r.valueQuantity?.code,effectiveDateTime:r.effectiveDateTime,subject:subject(r.subject)||undefined};}
export function parseCondition(r:FhirCondition):ParsedFhirCondition{return{id:r.id||'',code:display(r.code),clinicalStatus:display(r.clinicalStatus)||undefined,verificationStatus:display(r.verificationStatus)||undefined,subject:subject(r.subject)||undefined,onsetDateTime:r.onsetDateTime,recordedDate:r.recordedDate};}
export function parseFhirBundle(bundle:any):FhirStudyData{const entries=Array.isArray(bundle?.entry)?bundle.entry.map((e:any)=>e?.resource).filter(Boolean):[];return{documentReferences:entries.filter((r:any)=>r.resourceType==='DocumentReference').map(parseDocumentReference),observations:entries.filter((r:any)=>r.resourceType==='Observation').map(parseObservation),conditions:entries.filter((r:any)=>r.resourceType==='Condition').map(parseCondition),rawBundle:bundle};}
export async function fetchStudyDataFromFHIR(endpoint:string,patientOrStudyId:string,accessToken?:string):Promise<FhirStudyData>{const base=endpoint.replace(/\/$/,'');const headers:Record<string,string>={Accept:'application/fhir+json, application/json'};if(accessToken)headers.Authorization=`Bearer ${accessToken}`;const types:['DocumentReference','Observation','Condition']=['DocumentReference','Observation','Condition'];const data=await Promise.all(types.map(async type=>{const r=await fetch(`${base}/${type}?subject=${encodeURIComponent(patientOrStudyId)}`,{headers});if(!r.ok)throw new Error(`FHIR request failed (${r.status})`);return r.json();}));return{documentReferences:data[0].entry?.map(parseDocumentReference)??[],observations:data[1].entry?.map(parseObservation)??[],conditions:data[2].entry?.map(parseCondition)??[]};}
export function createSmartOnFhirTokenExchange(config:Omit<SmartOnFhirTokenExchange,'exchangeCode'> & {exchangeCode?:SmartOnFhirTokenExchange['exchangeCode']}):SmartOnFhirTokenExchange{return{...config,exchangeCode:config.exchangeCode||(()=>Promise.reject(new Error('SMART-on-FHIR token exchange requires an application-specific OAuth2/OIDC implementation.')))};}


