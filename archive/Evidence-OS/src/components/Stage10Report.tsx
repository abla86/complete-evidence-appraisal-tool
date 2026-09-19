import React, { useState } from 'react';
import { 
  FileText, 
  Download, 
  Copy, 
  Check, 
  Sparkles, 
  Printer, 
  ArrowLeft, 
  Layers, 
  Share2,
  CheckCircle2,
  GitBranch
} from 'lucide-react';
import { EvidenceOSProject, ReportData } from '../types';

interface Stage10Props {
  project: EvidenceOSProject;
  onChangeReport: (updated: ReportData) => void;
  onPrev: () => void;
  language: 'no' | 'en';
}

export const Stage10Report: React.FC<Stage10Props> = ({
  project,
  onChangeReport,
  onPrev,
  language,
}) => {
  const [activeSection, setActiveSection] = useState<'abstract' | 'introduction' | 'methods' | 'results' | 'discussion' | 'flowchart'>('abstract');
  const [copied, setCopied] = useState(false);
  const [isAiGenerating, setIsAiGenerating] = useState(false);

  const report = project.report;

  const handleCopyManuscript = () => {
    const fullText = `# ${project.question.title}
Protokoll: ${project.question.protocolRegistration}
Forfattere: ${project.metadata.authors.join(', ')}
Dato: ${new Date().toLocaleDateString('no-NO')}

## Sammendrag (Abstract)
${report.abstract}

## Introduksjon & Bakgrunn
${report.introduction}

## Metoder (PRISMA 2020)
${report.methods}

## Resultater & Metaanalyse
${report.results}

## Diskusjon & GRADE Konklusjon
${report.discussion}

## Evidenssikkerhet & Konklusjon
${report.conclusion}

---
Generert i EvidenceOS: En komplett plattform for forskningsarbeid fra spørsmål til dokumentert konklusjon.`;

    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadMarkdown = () => {
    const fullText = `# ${project.question.title}
Protokoll: ${project.question.protocolRegistration}
Dato: ${new Date().toISOString().split('T')[0]}

## Sammendrag
${report.abstract}

## Introduksjon
${report.introduction}

## Metoder
${report.methods}

## Resultater
${report.results}

## Diskusjon
${report.discussion}

## Konklusjon
${report.conclusion}
`;
    const blob = new Blob([fullText], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `EvidenceOS_Rapport_${project.id}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleDownloadJsonPackage = () => {
    const jsonStr = JSON.stringify(project, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `EvidenceOS_ReproPackage_${project.id}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleAiSectionGenerate = async (sectionKey: keyof ReportData) => {
    setIsAiGenerating(true);
    try {
      const res = await fetch('/api/ai/assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task: 'generate_report_section',
          payload: {
            section: sectionKey,
            title: project.question.title,
            primaryQuestion: project.question.primaryQuestion,
            pico: project.pico,
            searchCount: project.search.totalRecordsIdentified,
            screenedCount: project.search.recordsAfterDeduplication,
            includedCount: project.studies.filter(s => s.status === 'fulltext_eligible').length,
            gradeCertainty: project.grade.overallCertainty,
          },
          language,
        }),
      });

      const json = await res.json();
      if (json.success && json.data) {
        const text = json.data.text || json.data.content || json.data.paragraph;
        if (text) {
          onChangeReport({
            ...report,
            [sectionKey]: text,
          });
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsAiGenerating(false);
    }
  };

  // PRISMA 2020 Flow counts
  const totalIdentified = project.search.totalRecordsIdentified;
  const duplicates = project.search.duplicatesRemoved;
  const screened = project.search.recordsAfterDeduplication;
  const titleAbstractExcluded = project.studies.filter(s => s.status === 'screened_excluded').length;
  const fullTextAssessed = project.studies.filter(s => s.status === 'screened_included' || s.status === 'fulltext_eligible' || s.status === 'fulltext_excluded').length;
  const fullTextExcluded = project.studies.filter(s => s.status === 'fulltext_excluded').length;
  const includedStudies = project.studies.filter(s => s.status === 'screened_included' || s.status === 'fulltext_eligible').length;

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="bg-white rounded-xl p-6 border border-stone-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-medium text-emerald-700 uppercase tracking-wider mb-1">
            <span>Trinn 10 av 10</span>
            <span>•</span>
            <span>Reproduserbar forskningsrapport</span>
          </div>
          <h1 className="text-2xl font-bold text-stone-900 tracking-tight">
            Reproduserbar Rapport (Reproducible Report)
          </h1>
          <p className="text-sm text-stone-600 mt-1 max-w-3xl">
            Komplett publiseringsklar systematisk oversiktsartikkel utarbeidet i henhold til PRISMA 2020-standarden. Inkluderer automatisert PRISMA flytdiagram og 100% reproduserbar JSON-forskningspakke.
          </p>
        </div>

        {/* Export action buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleCopyManuscript}
            className="px-3 py-2 rounded-lg border border-stone-300 bg-white hover:bg-stone-50 text-stone-700 text-xs font-medium flex items-center gap-1.5 transition shadow-xs"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Kopiert til utklipp' : 'Kopier manus'}</span>
          </button>

          <button
            onClick={handleDownloadMarkdown}
            className="px-3 py-2 rounded-lg border border-stone-300 bg-white hover:bg-stone-50 text-stone-700 text-xs font-medium flex items-center gap-1.5 transition shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Last ned Markdown (.md)</span>
          </button>

          <button
            onClick={handleDownloadJsonPackage}
            className="px-3 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-medium flex items-center gap-1.5 transition shadow-sm"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Repro-pakke (.json)</span>
          </button>
        </div>
      </div>

      {/* Navigation tabs for report sections & PRISMA flow */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="flex border-b border-stone-200 bg-stone-50 px-4 pt-3 overflow-x-auto gap-2">
          {[
            { id: 'abstract', label: '1. Sammendrag (Abstract)' },
            { id: 'introduction', label: '2. Introduksjon' },
            { id: 'methods', label: '3. Metoder' },
            { id: 'results', label: '4. Resultater' },
            { id: 'discussion', label: '5. Diskusjon & GRADE' },
            { id: 'flowchart', label: 'PRISMA 2020 Flytdiagram' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSection(tab.id as any)}
              className={`px-3.5 py-2 rounded-t-lg text-xs font-medium border-t border-x transition whitespace-nowrap ${
                activeSection === tab.id
                  ? 'bg-white border-stone-300 text-stone-900 shadow-xs font-bold'
                  : 'border-transparent text-stone-600 hover:text-stone-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Section Contents */}
        <div className="p-6">
          {activeSection === 'flowchart' ? (
            /* Interactive PRISMA 2020 Flow Diagram */
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
                    <GitBranch className="w-4 h-4 text-emerald-700" />
                    <span>PRISMA 2020 Flytdiagram for systematiske oversikter</span>
                  </h3>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Viser seleksjonsprosessen trinn-for-trinn med dokumenterte eksklusjonsgrunner.
                  </p>
                </div>
              </div>

              {/* Graphical PRISMA Flowchart Layout */}
              <div className="max-w-2xl mx-auto space-y-4 font-sans text-xs">
                {/* Stage 1: Identification */}
                <div className="border border-stone-300 rounded-xl p-4 bg-sky-50/50 shadow-xs space-y-2">
                  <span className="font-bold text-sky-950 uppercase text-[10px] tracking-wider block">
                    1. Identifisering (Identification)
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3 bg-white rounded-lg border border-sky-200">
                      <div className="font-semibold text-stone-800">Poster identifisert fra databaser:</div>
                      <div className="text-xl font-bold font-mono text-sky-900 mt-1">
                        n = {totalIdentified.toLocaleString()}
                      </div>
                      <div className="text-[10px] text-stone-500 mt-0.5">PubMed, CENTRAL, Embase</div>
                    </div>

                    <div className="p-3 bg-white rounded-lg border border-rose-200">
                      <div className="font-semibold text-stone-800">Duplikater fjernet før screening:</div>
                      <div className="text-xl font-bold font-mono text-rose-700 mt-1">
                        n = {duplicates.toLocaleString()}
                      </div>
                      <div className="text-[10px] text-stone-500 mt-0.5">Automatisert deduplisering</div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-center text-stone-400 font-mono">↓</div>

                {/* Stage 2: Screening */}
                <div className="border border-stone-300 rounded-xl p-4 bg-amber-50/50 shadow-xs space-y-2">
                  <span className="font-bold text-amber-950 uppercase text-[10px] tracking-wider block">
                    2. Screening (Tittel & Abstrakt)
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3 bg-white rounded-lg border border-amber-200">
                      <div className="font-semibold text-stone-800">Poster screenet:</div>
                      <div className="text-xl font-bold font-mono text-amber-900 mt-1">
                        n = {screened.toLocaleString()}
                      </div>
                      <div className="text-[10px] text-stone-500 mt-0.5">Tittel- og abstraktscreening</div>
                    </div>

                    <div className="p-3 bg-white rounded-lg border border-rose-200">
                      <div className="font-semibold text-stone-800">Poster ekskludert:</div>
                      <div className="text-xl font-bold font-mono text-rose-700 mt-1">
                        n = {titleAbstractExcluded}
                      </div>
                      <div className="text-[10px] text-stone-500 mt-0.5">Ikke-relevant populasjon / design</div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-center text-stone-400 font-mono">↓</div>

                {/* Stage 3: Full-text eligibility */}
                <div className="border border-stone-300 rounded-xl p-4 bg-purple-50/50 shadow-xs space-y-2">
                  <span className="font-bold text-purple-950 uppercase text-[10px] tracking-wider block">
                    3. Fulltekstvurdering (Eligibility)
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3 bg-white rounded-lg border border-purple-200">
                      <div className="font-semibold text-stone-800">Fulltekstartikler vurdert:</div>
                      <div className="text-xl font-bold font-mono text-purple-900 mt-1">
                        n = {fullTextAssessed}
                      </div>
                      <div className="text-[10px] text-stone-500 mt-0.5">Hentet inn i fulltekst</div>
                    </div>

                    <div className="p-3 bg-white rounded-lg border border-rose-200">
                      <div className="font-semibold text-stone-800">Fulltekster ekskludert:</div>
                      <div className="text-xl font-bold font-mono text-rose-700 mt-1">
                        n = {fullTextExcluded}
                      </div>
                      <div className="text-[10px] text-stone-500 mt-0.5">Med dokumenterte eksklusjonsgrunner</div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-center text-stone-400 font-mono">↓</div>

                {/* Stage 4: Included */}
                <div className="border border-emerald-300 rounded-xl p-4 bg-emerald-50 shadow-xs space-y-2">
                  <span className="font-bold text-emerald-950 uppercase text-[10px] tracking-wider block">
                    4. Inkludert i oversikten (Included)
                  </span>
                  <div className="p-3 bg-white rounded-lg border border-emerald-300">
                    <div className="font-semibold text-emerald-950 text-sm">
                      Studier inkludert i kvalitativ og kvantitativ metaanalyse:
                    </div>
                    <div className="text-2xl font-bold font-mono text-emerald-800 mt-1">
                      n = {includedStudies} studier ({project.grade.participantsCount.toLocaleString()} pasienter)
                    </div>
                    <div className="text-xs text-stone-600 mt-1">
                      DELIVER (2022), EMPEROR-Preserved (2021), SOLOIST-WHF HFpEF subgruppe (2021), PRESERVED-HF (2021)
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Text Section Editor / Preview */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-stone-900 capitalize">
                    {activeSection === 'abstract' && 'Strukturert Sammendrag (Abstract)'}
                    {activeSection === 'introduction' && 'Introduksjon & Bakgrunn'}
                    {activeSection === 'methods' && 'Metoder (Methods)'}
                    {activeSection === 'results' && 'Resultater (Results)'}
                    {activeSection === 'discussion' && 'Diskusjon & Konklusjon (Discussion)'}
                  </h3>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Rediger og formater teksten fritt. AI kan assistere med formuleringer iht. Cochrane Style Guide.
                  </p>
                </div>

                <button
                  onClick={() => handleAiSectionGenerate(activeSection as keyof ReportData)}
                  disabled={isAiGenerating}
                  className="px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-300 text-amber-900 hover:bg-amber-100 text-xs font-semibold flex items-center gap-1.5 transition shadow-xs"
                >
                  <Sparkles className={`w-3.5 h-3.5 text-amber-600 ${isAiGenerating ? 'animate-spin' : ''}`} />
                  <span>{isAiGenerating ? 'Genererer avsnitt...' : 'AI Generer/Forbedre'}</span>
                </button>
              </div>

              <textarea
                rows={14}
                value={report[activeSection as keyof ReportData] as string}
                onChange={(e) => onChangeReport({ ...report, [activeSection]: e.target.value })}
                className="w-full text-xs text-stone-900 bg-stone-50 border border-stone-300 rounded-xl p-4 focus:bg-white focus:outline-none focus:border-emerald-600 font-sans leading-relaxed transition"
              />
            </div>
          )}
        </div>
      </div>

      {/* Navigation Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-stone-200">
        <button
          onClick={onPrev}
          className="px-4 py-2.5 rounded-lg border border-stone-300 text-stone-700 hover:bg-stone-50 font-medium text-xs flex items-center gap-1.5 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Tilbake til Evidenssikkerhet (GRADE)</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs text-emerald-800 font-mono font-semibold flex items-center gap-1">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            Forskningsarbeid fullført fra spørsmål til konklusjon
          </span>
        </div>
      </div>
    </div>
  );
};
