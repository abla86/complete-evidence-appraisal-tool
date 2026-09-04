import React, { useState } from 'react';
import { AppraisalInstrument } from '../types';
import { MASTER_INSTRUMENTS_REGISTRY } from '../data/masterRegistry';
import { 
  ShieldCheck, 
  BookOpen, 
  Layers, 
  ArrowRight, 
  ExternalLink, 
  CheckCircle2, 
  AlertTriangle, 
  Lock, 
  Scale, 
  FileCode,
  Sparkles,
  HelpCircle,
  Copy,
  Check,
  ListOrdered
} from 'lucide-react';

interface InstrumentInfoViewProps {
  instrumentId: string;
  onSwitchToJbi: () => void;
}

export const InstrumentInfoView: React.FC<InstrumentInfoViewProps> = ({
  instrumentId,
  onSwitchToJbi
}) => {
  const [copiedCitation, setCopiedCitation] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'questions' | 'anti_slop'>('overview');

  const inst = MASTER_INSTRUMENTS_REGISTRY.find(i => i.id === instrumentId);

  if (!inst) {
    return <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-sm text-amber-950">Ukjent eller manglende instrument. Velg et eksplisitt registrert instrument før instrumentinformasjon vises.</div>;
  }

  const handleCopyCitation = () => {
    const citation = `${inst.publisher} (${inst.year}). ${inst.name} [Versjon ${inst.version}]. ${inst.officialSource}${inst.doi ? ` https://doi.org/${inst.doi}` : ''}`;
    navigator.clipboard.writeText(citation);
    setCopiedCitation(true);
    setTimeout(() => setCopiedCitation(false), 2500);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
          <div className="space-y-2.5 max-w-4xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-800 border border-slate-200">
                {inst.categoryName}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-50 text-teal-800 border border-teal-200">
                Versjon: {inst.version} ({inst.year})
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                {inst.itemCount} Vurderingspunkter / Ledd
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                <span>{inst.verificationStatus}</span>
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 font-serif">
              {inst.name}
            </h1>
            <p className="text-sm text-slate-600 leading-relaxed">
              {inst.purpose}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row lg:flex-col gap-2 shrink-0">
            {inst.id !== 'jbi-qualitative-2017' && (
              <button
                type="button"
                onClick={onSwitchToJbi}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-teal-800 hover:bg-teal-900 text-white text-xs font-bold shadow-xs transition-colors"
              >
                <ShieldCheck className="w-4 h-4 text-teal-200" />
                <span>Gå til JBI Qualitative matrise</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}

            {inst.sourceUrl && (
              <a
                href={inst.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors"
              >
                <span>Åpne originalmanual</span>
                <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
              </a>
            )}
          </div>
        </div>

        {/* Provenance and Metainfo Grid */}
        <div className="mt-6 pt-6 border-t border-slate-200 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1">
            <span className="font-bold text-slate-900 block uppercase text-[10px] tracking-wider">Utgiver / Organ</span>
            <p className="text-slate-800 font-medium">{inst.publisher}</p>
            <p className="text-[11px] text-slate-500">{inst.governingBody}</p>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1">
            <span className="font-bold text-slate-900 block uppercase text-[10px] tracking-wider">Autoritetsnivå</span>
            <div className="flex items-center gap-1 text-teal-800 font-bold text-[11px]">
              <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
              <span>{inst.authorityLevel}</span>
            </div>
            <p className="text-[11px] text-slate-500">{inst.methodologyControlStatus || 'Metodisk kilde / internasjonal standard'}</p>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1">
            <span className="font-bold text-slate-900 block uppercase text-[10px] tracking-wider">Scoringmodell</span>
            <p className="font-mono text-teal-900 font-bold text-[11px]">{inst.scoringModel}</p>
            <p className="text-[11px] text-slate-500">Metodisk etterprøvbarhet</p>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1">
            <span className="font-bold text-slate-900 block uppercase text-[10px] tracking-wider">Lisens & Bruk</span>
            <p className="text-slate-800 font-medium">{inst.licenseStatus}</p>
            <p className="text-[10px] text-slate-500 truncate" title={inst.sourceAttribution}>{inst.sourceAttribution}</p>
          </div>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 text-xs">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 rounded-xl font-bold transition-colors ${
            activeTab === 'overview'
              ? 'bg-slate-900 text-white shadow-2xs'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          Oversikt & Kildegrunnlag
        </button>

        {inst.questions && inst.questions.length > 0 && (
          <button
            onClick={() => setActiveTab('questions')}
            className={`px-4 py-2 rounded-xl font-bold transition-colors flex items-center gap-1.5 ${
              activeTab === 'questions'
                ? 'bg-teal-800 text-white shadow-2xs'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <ListOrdered className="w-3.5 h-3.5" />
            <span>Sjekklistepunkter ({inst.questions.length})</span>
          </button>
        )}

        {inst.prohibitedAcademicPractices && inst.prohibitedAcademicPractices.length > 0 && (
          <button
            onClick={() => setActiveTab('anti_slop')}
            className={`px-4 py-2 rounded-xl font-bold transition-colors flex items-center gap-1.5 ${
              activeTab === 'anti_slop'
                ? 'bg-amber-800 text-white shadow-2xs'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            <span>Anti-slop & Forbudte praksiser</span>
          </button>
        )}
      </div>

      {/* TAB CONTENT: Questions */}
      {activeTab === 'questions' && inst.questions && (
        <div className="space-y-4">
          <div className="bg-teal-50 border border-teal-200 p-4 rounded-2xl text-xs text-teal-950 flex items-center justify-between">
            <div>
              <strong>Offisielle vurderingskriterier for {inst.shortName}:</strong> Viser alle {inst.questions.length} ledd med signalspørsmål og veiledning.
            </div>
            <span className="font-mono font-bold text-[11px] bg-teal-100 px-2 py-0.5 rounded text-teal-900">
              {inst.itemCount} ledd
            </span>
          </div>

          <div className="space-y-3">
            {inst.questions.map((q) => (
              <div key={q.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-2 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-slate-900 text-xs">
                    {q.shortTitle}
                  </span>
                  {(q.categoryTitle || q.domainTitle) && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                      {q.categoryTitle || q.domainTitle}
                    </span>
                  )}
                </div>

                <p className="text-slate-800 font-medium text-xs">
                  {q.officialQuestion || q.questionText}
                </p>

                {(q.officialQuestionEn || q.questionTextEn) && (
                  <p className="text-slate-500 italic text-[11px]">
                    "{q.officialQuestionEn || q.questionTextEn}"
                  </p>
                )}

                {q.descriptionGuide && (
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-slate-600 text-[11px] leading-relaxed">
                    <strong>Vurderingsveiledning:</strong> {q.descriptionGuide}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB CONTENT: Anti-slop */}
      {activeTab === 'anti_slop' && inst.prohibitedAcademicPractices && (
        <div className="bg-amber-50/90 border border-amber-200 rounded-2xl p-6 space-y-4 text-xs">
          <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
            <AlertTriangle className="w-5 h-5 text-amber-700" />
            <span>Eksplisitt forbudte akademiske og metodiske praksiser</span>
          </div>
          <p className="text-amber-900 text-xs leading-relaxed">
            For å opprettholde epistemologisk stringens og unngå feilaktig metodereduksjon, må følgende feil aldri begås ved bruk av {inst.shortName}:
          </p>

          <ul className="space-y-2.5">
            {inst.prohibitedAcademicPractices.map((proc, i) => (
              <li key={i} className="p-3 bg-white/80 border border-amber-200 rounded-xl text-amber-950 flex items-start gap-2">
                <span className="font-bold text-amber-800 text-sm leading-none">•</span>
                <span className="font-medium">{proc}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* TAB CONTENT: Overview */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-xs">
          {/* Left 2 Cols: Detailed Method Analysis */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-900 font-serif flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-teal-700" />
                  <span>Autoritativ Kilde & Primærpublikasjon</span>
                </h3>
                <button
                  onClick={handleCopyCitation}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] transition-colors"
                >
                  {copiedCitation ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Kopiert til utklipp!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-500" />
                      <span>Kopier referanse</span>
                    </>
                  )}
                </button>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <p className="text-slate-800 font-serif italic text-xs leading-relaxed">
                  {inst.officialSource}
                </p>
                {inst.doi && (
                  <div className="pt-1 text-[11px] text-teal-800 font-mono flex items-center gap-1.5">
                    <span className="font-bold">Permanent DOI:</span>
                    <a 
                      href={`https://doi.org/${inst.doi}`} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="underline hover:text-teal-950 font-bold"
                    >
                      {inst.doi}
                    </a>
                    <ExternalLink className="w-3 h-3 text-teal-600" />
                  </div>
                )}
              </div>

              <div className="space-y-2 pt-2">
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                  Scoringmodell & Vitenskapelig Begrunnelse:
                </h4>
                <p className="text-slate-700 leading-relaxed bg-teal-50/50 p-4 rounded-xl border border-teal-200/70">
                  {inst.scoringModelExplanation}
                </p>
              </div>

              {/* Critical Domains if present */}
              {inst.criticalDomains && inst.criticalDomains.length > 0 && (
                <div className="space-y-2 pt-2">
                  <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                    Kritiske Domener ({inst.criticalDomains.length}):
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {inst.criticalDomains.map((dom, idx) => (
                      <div key={idx} className="flex items-start gap-2 p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                        <CheckCircle2 className="w-3.5 h-3.5 text-teal-700 shrink-0 mt-0.5" />
                        <span className="text-slate-700 text-[11px]">{dom}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Col: Scope & Rules */}
          <div className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-slate-900 font-serif flex items-center gap-2">
                <Scale className="w-4 h-4 text-teal-700" />
                <span>Tillatte Svar & Skala</span>
              </h3>

              <div className="space-y-1.5">
                {inst.allowedAnswers.map(ans => (
                  <div key={ans} className="p-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 font-mono text-[11px] flex items-center justify-between">
                    <span>{ans}</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-600"></span>
                  </div>
                ))}
              </div>

              <div className="pt-3 border-t border-slate-200 space-y-2">
                <span className="font-bold text-slate-900 text-[11px] block">Målgruppe / Studiedesign:</span>
                <div className="flex flex-wrap gap-1">
                  {inst.targetStudyDesign.map(des => (
                    <span key={des} className="px-2 py-0.5 rounded bg-teal-50 border border-teal-200 text-teal-900 text-[10px] font-medium">
                      {des}
                    </span>
                  ))}
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Kontekst: {inst.targetPopulationOrContext}
                </p>
              </div>
            </div>

            <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-xs space-y-3">
              <div className="flex items-center gap-2 text-teal-300 font-bold text-xs">
                <Lock className="w-4 h-4 text-teal-400" />
                <span>Immutable Version Lock</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Vurderinger som utføres med {inst.shortName} låses til versjon {inst.version} og sjekksum <code className="text-teal-200 font-mono">{inst.validationChecksum}</code> for å sikre etterprøvbarhet i akademiske oppgaver og systematiske oversikter.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
