export type TerminologySystem='SNOMED_CT'|'ICD10'|'ICD11'|'ATC'|'FEST';
export interface TerminologyConcept{system:TerminologySystem;code:string;display:string;mapsTo?:Array<{system:TerminologySystem;code:string;display:string;relationship?:string}>;}
const concepts:TerminologyConcept[]=[
{system:'ICD10',code:'F00.0',display:'Dementia in Alzheimer disease with early onset',mapsTo:[{system:'ICD11',code:'6D80.0',display:'Dementia due to Alzheimer disease with early onset',relationship:'example mapping'}]},
{system:'ATC',code:'N06DA02',display:'Donepezil',mapsTo:[{system:'FEST',code:'DONEPEZIL',display:'Donepezil',relationship:'ingredient example'}]},
{system:'SNOMED_CT',code:'56265001',display:'Heart disease',mapsTo:[{system:'ICD10',code:'I51.9',display:'Heart disease, unspecified',relationship:'example crosswalk'}]}
];
export function lookupTerminology(query:string,system?:TerminologySystem):TerminologyConcept[]{const q=query.trim().toLowerCase();return concepts.filter(c=>(!system||c.system===system)&&[c.code,c.display].some(v=>v.toLowerCase().includes(q)));}
export function mapTerminology(system:TerminologySystem,code:string,targetSystem?:TerminologySystem):TerminologyConcept[]{const c=concepts.find(x=>x.system===system&&x.code.toLowerCase()===code.toLowerCase());if(!c)return[];return(c.mapsTo||[]).filter(m=>!targetSystem||m.system===targetSystem).map(m=>({system:m.system,code:m.code,display:m.display,mapsTo:[{system:c.system,code:c.code,display:c.display,relationship:m.relationship}]}));}
export function getSupportedTerminologySystems():TerminologySystem[]{return['SNOMED_CT','ICD10','ICD11','ATC','FEST'];}
export function terminologyNotice():string{return'Kryssmappingene er demonstrasjons-/arbeidsflytdata og erstatter ikke autoritative SNOMED CT-, ICD-, ATC- eller FEST-kilder.';}


