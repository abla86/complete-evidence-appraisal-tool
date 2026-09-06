import React,{useState} from 'react';
import {deIdentifyHealthcareText} from '../services/normenPrivacyEngine';
import {lookupTerminology,getSupportedTerminologySystems,type TerminologySystem} from '../services/nordicTerminologyService';
import {fetchStudyDataFromFHIR} from '../services/fhirAdapterService';

export const ClinicalInteroperabilityPanel:React.FC=()=>{
 const [endpoint,setEndpoint]=useState('https://hapi.fhir.org/baseR4');
 const [studyId,setStudyId]=useState('');
 const [fhirStatus,setFhirStatus]=useState('');
 const [text,setText]=useState('');
 const [deid,setDeid]=useState('');
 const [term,setTerm]=useState('N06DA02');
 const [system,setSystem]=useState<TerminologySystem>('ATC');
 const [results,setResults]=useState<ReturnType<typeof lookupTerminology>>([]);
 const importFhir=async()=>{try{const d=await fetchStudyDataFromFHIR(endpoint,studyId);setFhirStatus(`FHIR: ${d.documentReferences.length} DocumentReference, ${d.observations.length} Observation, ${d.conditions.length} Condition`);}catch(e){setFhirStatus(e instanceof Error?e.message:'FHIR-import feilet');}};
 const sanitize=async()=>{const r=await deIdentifyHealthcareText(text,{replaceNames:true});setDeid(r.deIdentifiedText);};
 return <section className="mt-6 grid lg:grid-cols-3 gap-4">
  <div className="bg-white border rounded-2xl p-4 space-y-3"><h3 className="font-bold">Clinical Mode Â· FHIR R4</h3><input className="w-full border rounded-lg p-2 text-xs" value={endpoint} onChange={e=>setEndpoint(e.target.value)} placeholder="FHIR endpoint"/><input className="w-full border rounded-lg p-2 text-xs" value={studyId} onChange={e=>setStudyId(e.target.value)} placeholder="Patient/study ID"/><button type="button" onClick={importFhir} disabled={!studyId} className="px-3 py-2 rounded-lg bg-slate-900 text-white text-xs disabled:opacity-40">Importer via FHIR DocumentReference</button>{fhirStatus&&<p className="text-xs text-slate-600">{fhirStatus}</p>}</div>
  <div className="bg-white border rounded-2xl p-4 space-y-3"><h3 className="font-bold">Normen Â· lokal PII-sanering</h3><textarea className="w-full border rounded-lg p-2 text-xs min-h-24" value={text} onChange={e=>setText(e.target.value)} placeholder="Tekst behandles lokalt i nettleseren"/><button type="button" onClick={sanitize} className="px-3 py-2 rounded-lg bg-teal-800 text-white text-xs">KjÃ¸r PII-sanering</button>{deid&&<pre className="text-[10px] whitespace-pre-wrap bg-slate-50 p-2 rounded-lg">{deid}</pre>}</div>
  <div className="bg-white border rounded-2xl p-4 space-y-3"><h3 className="font-bold">Nordisk terminologi</h3><div className="flex gap-2"><select className="border rounded-lg p-2 text-xs" value={system} onChange={e=>setSystem(e.target.value as TerminologySystem)}>{getSupportedTerminologySystems().map(s=><option key={s}>{s}</option>)}</select><input className="flex-1 border rounded-lg p-2 text-xs" value={term} onChange={e=>setTerm(e.target.value)}/></div><button type="button" onClick={()=>setResults(lookupTerminology(term,system))} className="px-3 py-2 rounded-lg bg-slate-900 text-white text-xs">SlÃ¥ opp kode</button>{results.map(r=><div key={r.system+r.code} className="text-xs bg-slate-50 p-2 rounded-lg"><b>{r.code}</b> Â· {r.display}</div>)}</div>
 </section>;
};
