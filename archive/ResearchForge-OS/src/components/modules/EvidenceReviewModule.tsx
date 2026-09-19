import React, { useState } from 'react';
import {
  BookOpen,
  Filter,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Copy,
  Check,
  Search,
  Plus,
  ArrowDown,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  FileText
} from 'lucide-react';
import { CitationItem, PicoData } from '../../types';

interface EvidenceReviewModuleProps {
  citations: CitationItem[];
  onUpdateCitationStatus: (id: string, status: CitationItem['screeningStatus'], reason?: string) => void;
  onAddCitation: (citation: Omit<CitationItem, 'id'>) => void;
  pico: PicoData;
  onUpdatePico: (pico: PicoData) => void;
}

export const EvidenceReviewModule: React.FC<EvidenceReviewModuleProps> = ({
  citations,
  onUpdateCitationStatus,
  onAddCitation,
  pico,
  onUpdatePico
}) => {
  const [activeTab, setActiveTab] = useState<'prisma' | 'pico' | 'screening'>('prisma');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [copiedQuery, setCopiedQuery] = useState<boolean>(false);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);

  // New citation form state
  const [newTitle, setNewTitle] = useState('');
  const [newAuthors, setNewAuthors] = useState('');
  const [newJournal, setNewJournal] = useState('');
  const [newYear, setNewYear] = useState(2026);
  const [newDoi, setNewDoi] = useState('');
  const [newAbstract, setNewAbstract] = useState('');

  // Counts for PRISMA
  const totalIdentified = 148; // Base database hits from PubMed & Cochrane
  const duplicatesRemoved = 22;
  const screenedCount = citations.length + (totalIdentified - duplicatesRemoved - citations.length);
  const includedCount = citations.filter((c) => c.screeningStatus === 'INCLUDED').length;
  const excludedCount = citations.filter((c) => c.screeningStatus === 'EXCLUDED').length;
  const pendingCount = citations.filter((c) => c.screeningStatus === 'UNSCREENED' || c.screeningStatus === 'MAYBE').length;

  const generatedSearchQuery = `("${pico.population}"[Mesh] OR "${pico.population}") AND ("${pico.intervention}"[tiab] OR "${pico.intervention}") AND ("${pico.outcome}"[tiab]) AND ("2020/01/01"[Date - Publication] : "3000"[Date - Publication])`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedSearchQuery);
    setCopiedQuery(true);
    setTimeout(() => setCopiedQuery(false), 2000);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    onAddCitation({
      title: newTitle,
      authors: newAuthors || 'Forskergruppe',
      journal: newJournal || 'Nordic Health Informatics',
      year: Number(newYear) || 2026,
      doi: newDoi || `10.1016/j.clinmed.${Date.now()}`,
      abstract: newAbstract || 'Ingen abstrakt spesifisert.',
      screeningStatus: 'UNSCREENED',
      tags: ['Manuell import', 'Klinisk']
    });
    setNewTitle('');
    setNewAuthors('');
    setNewJournal('');
    setNewDoi('');
    setNewAbstract('');
    setShowAddModal(false);
  };

  const filteredCitations = citations.filter((item) => {
    const matchesStatus =
      filterStatus === 'ALL' || item.screeningStatus === filterStatus;
    const matchesSearch =
      !searchFilter ||
      item.title.toLowerCase().includes(searchFilter.toLowerCase()) ||
      item.authors.toLowerCase().includes(searchFilter.toLowerCase()) ||
      item.abstract.toLowerCase().includes(searchFilter.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Sub-Navigation Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <button
            id="tab-prisma"
            onClick={() => setActiveTab('prisma')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              activeTab === 'prisma'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-700'
            }`}
          >
            PRISMA 2020 Flyt
          </button>
          <button
            id="tab-pico"
            onClick={() => setActiveTab('pico')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              activeTab === 'pico'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-700'
            }`}
          >
            PICO & Søkestrategi
          </button>
          <button
            id="tab-screening"
            onClick={() => setActiveTab('screening')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'screening'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-700'
            }`}
          >
            <span>Screening Benk</span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-slate-900/60 border border-slate-700">
              {pendingCount} gjenstår
            </span>
          </button>
        </div>

        <button
          id="btn-add-citation"
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" /> Legg til artikkel
        </button>
      </div>

      {/* Tab 1: PRISMA 2020 Flow Diagram */}
      {activeTab === 'prisma' && (
        <div className="space-y-6">
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-blue-400" />
                PRISMA 2020 Flow Diagram for Helseforskning
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Standardisert transparent metodikk for rapportering av systematiske oversikter og meta-analyser.
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <div className="text-right">
                <div className="text-slate-400 text-[11px]">Inkluderte studier</div>
                <div className="text-lg font-black text-emerald-400">{includedCount} artikler</div>
              </div>
              <div className="text-right border-l border-slate-800 pl-3">
                <div className="text-slate-400 text-[11px]">Ekskluderte studier</div>
                <div className="text-lg font-black text-rose-400">{excludedCount} artikler</div>
              </div>
            </div>
          </div>

          {/* Interactive Flow Columns */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Step 1: Identification */}
            <div className="p-4 rounded-xl bg-slate-900/90 border border-blue-900/40 relative">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 bg-blue-950/60 px-2 py-0.5 rounded border border-blue-800/40">
                1. Identifikasjon
              </span>
              <h4 className="text-sm font-bold text-white mt-2">Database-treff</h4>
              <div className="text-2xl font-black text-blue-300 mt-1">{totalIdentified}</div>
              <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                PubMed (n=94), Cochrane (n=32), Embase (n=22).
              </p>
              <div className="mt-3 pt-2 border-t border-slate-800 text-[11px] text-slate-400 flex justify-between">
                <span>Dubletter fjernet:</span>
                <span className="font-mono text-rose-400">-{duplicatesRemoved}</span>
              </div>
            </div>

            {/* Step 2: Screening */}
            <div className="p-4 rounded-xl bg-slate-900/90 border border-indigo-900/40">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-800/40">
                2. Tittel/Abstrakt
              </span>
              <h4 className="text-sm font-bold text-white mt-2">Screenet tittel</h4>
              <div className="text-2xl font-black text-indigo-300 mt-1">
                {totalIdentified - duplicatesRemoved}
              </div>
              <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                Første screening mot PICO inklusjonskriterier.
              </p>
              <div className="mt-3 pt-2 border-t border-slate-800 text-[11px] text-slate-400 flex justify-between">
                <span>Ekskludert på tittel:</span>
                <span className="font-mono text-rose-400">-{excludedCount}</span>
              </div>
            </div>

            {/* Step 3: Eligibility */}
            <div className="p-4 rounded-xl bg-slate-900/90 border border-amber-900/40">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/40">
                3. Kvalifisering
              </span>
              <h4 className="text-sm font-bold text-white mt-2">Fulltekst vurdert</h4>
              <div className="text-2xl font-black text-amber-300 mt-1">
                {citations.length}
              </div>
              <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                Hentet i fulltekst og sjekket mot metodekrav.
              </p>
              <div className="mt-3 pt-2 border-t border-slate-800 text-[11px] text-slate-400 flex justify-between">
                <span>Uavklart/Vurderes:</span>
                <span className="font-mono text-amber-400">{pendingCount}</span>
              </div>
            </div>

            {/* Step 4: Included */}
            <div className="p-4 rounded-xl bg-slate-900/90 border border-emerald-900/40 bg-gradient-to-b from-slate-900 to-emerald-950/20">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">
                4. Inkludert
              </span>
              <h4 className="text-sm font-bold text-white mt-2">Syntese & RoB</h4>
              <div className="text-2xl font-black text-emerald-400 mt-1">{includedCount}</div>
              <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                Inngår i kvalitativ evidenssyntese og meta-analyse.
              </p>
              <div className="mt-3 pt-2 border-t border-slate-800 text-[11px] text-emerald-400 flex justify-between">
                <span>Kvalitet: RoB 2</span>
                <span className="font-bold">Høy integritet</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: PICO & Search Strategy */}
      {activeTab === 'pico' && (
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">
                  PICO Forskningsrammeverk
                </h3>
                <p className="text-xs text-slate-400">
                  Rediger elementene for å tilpasse forskningsspørsmålet og generere standardiserte søkestenger.
                </p>
              </div>
              <span className="text-xs font-mono text-blue-400 bg-blue-950/80 px-2.5 py-1 rounded-lg border border-blue-800/40">
                PRISMA Protokoll v1.0
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  (P) Population / Pasientgruppe
                </label>
                <textarea
                  value={pico.population}
                  onChange={(e) => onUpdatePico({ ...pico, population: e.target.value })}
                  rows={2}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  (I) Intervention / Tiltak
                </label>
                <textarea
                  value={pico.intervention}
                  onChange={(e) => onUpdatePico({ ...pico, intervention: e.target.value })}
                  rows={2}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  (C) Comparison / Kontrollgruppe
                </label>
                <textarea
                  value={pico.comparison}
                  onChange={(e) => onUpdatePico({ ...pico, comparison: e.target.value })}
                  rows={2}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  (O) Outcome / Endepunkter
                </label>
                <textarea
                  value={pico.outcome}
                  onChange={(e) => onUpdatePico({ ...pico, outcome: e.target.value })}
                  rows={2}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Generated Search Syntax */}
          <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Search className="w-4 h-4 text-blue-400" />
                Generert PubMed / MEDLINE Søkestreng
              </h4>
              <button
                onClick={copyToClipboard}
                className="flex items-center gap-1.5 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700"
              >
                {copiedQuery ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" /> Kopiert!
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-400" /> Kopier syntaks
                  </>
                )}
              </button>
            </div>
            <pre className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-blue-300 whitespace-pre-wrap">
              {generatedSearchQuery}
            </pre>
          </div>
        </div>
      )}

      {/* Tab 3: Interactive Screening Bench */}
      {activeTab === 'screening' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Filter buttons */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs font-medium text-slate-400 mr-1 flex items-center gap-1">
                <Filter className="w-3.5 h-3.5" /> Filter:
              </span>
              {[
                { id: 'ALL', label: 'Alle' },
                { id: 'UNSCREENED', label: 'Ubehandlet' },
                { id: 'INCLUDED', label: 'Inkludert' },
                { id: 'EXCLUDED', label: 'Ekskludert' },
                { id: 'MAYBE', label: 'Kanskje' }
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFilterStatus(f.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                    filterStatus === f.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Local Search inside screening */}
            <input
              type="text"
              placeholder="Filtrer artikler i benken..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1 text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-blue-500 w-full sm:w-60"
            />
          </div>

          {/* Cards List */}
          <div className="space-y-3">
            {filteredCitations.length === 0 ? (
              <div className="p-8 text-center text-slate-400 bg-slate-900/60 rounded-xl border border-slate-800 text-xs">
                Ingen artikler matcher valgt filter.
              </div>
            ) : (
              filteredCitations.map((item) => (
                <article
                  key={item.id}
                  className="p-4 sm:p-5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-all space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                            item.screeningStatus === 'INCLUDED'
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                              : item.screeningStatus === 'EXCLUDED'
                              ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                              : item.screeningStatus === 'MAYBE'
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                              : 'bg-slate-700/40 text-slate-300 border-slate-600'
                          }`}
                        >
                          {item.screeningStatus}
                        </span>
                        {item.robScore && (
                          <span className="text-[10px] font-mono bg-blue-950 text-blue-300 px-2 py-0.5 rounded border border-blue-800/40">
                            RoB 2: {item.robScore}
                          </span>
                        )}
                        <span className="text-xs text-slate-400 font-mono">{item.journal} ({item.year})</span>
                      </div>
                      <h4 className="text-sm sm:text-base font-bold text-white">{item.title}</h4>
                      <p className="text-xs text-slate-400 mt-0.5">{item.authors} • DOI: {item.doi}</p>
                    </div>

                    {/* Screening decision controls */}
                    <div className="flex items-center gap-1.5 self-start shrink-0">
                      <button
                        onClick={() => onUpdateCitationStatus(item.id, 'INCLUDED')}
                        className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                          item.screeningStatus === 'INCLUDED'
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : 'bg-slate-800 text-emerald-400 hover:bg-emerald-950/60 border border-slate-700'
                        }`}
                        title="Inkluder i evidenssyntese"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Inkluder
                      </button>

                      <button
                        onClick={() =>
                          onUpdateCitationStatus(
                            item.id,
                            'EXCLUDED',
                            'Ikke i overensstemmelse med PICO-populasjonskriterier'
                          )
                        }
                        className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                          item.screeningStatus === 'EXCLUDED'
                            ? 'bg-rose-600 text-white shadow-sm'
                            : 'bg-slate-800 text-rose-400 hover:bg-rose-950/60 border border-slate-700'
                        }`}
                        title="Ekskluder fra gjennomgang"
                      >
                        <XCircle className="w-3.5 h-3.5" /> Ekskluder
                      </button>

                      <button
                        onClick={() => onUpdateCitationStatus(item.id, 'MAYBE', 'Avventer andregransker')}
                        className={`p-1.5 rounded-lg text-xs transition-all ${
                          item.screeningStatus === 'MAYBE'
                            ? 'bg-amber-600 text-white'
                            : 'bg-slate-800 text-amber-400 hover:bg-amber-950/60 border border-slate-700'
                        }`}
                        title="Sett på vent (Maybe)"
                      >
                        <HelpCircle className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
                    {item.abstract}
                  </p>

                  {item.exclusionReason && (
                    <div className="text-[11px] text-rose-300 bg-rose-950/40 border border-rose-900/60 px-3 py-1 rounded-lg">
                      <span className="font-bold">Eksklusjonsbegrunnelse:</span> {item.exclusionReason}
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    {item.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-[10px] font-medium bg-slate-800 text-slate-300 px-2 py-0.5 rounded"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </article>
              ))
            )}
          </div>
        </div>
      )}

      {/* Add Citation Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-base font-bold text-white">Legg til artikkel i evidensbase</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Artikkeltittel *</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="F.eks. Clinical Decision Support in Intensive Care"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Forfattere</label>
                  <input
                    type="text"
                    value={newAuthors}
                    onChange={(e) => setNewAuthors(e.target.value)}
                    placeholder="Etternavn, Init."
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Årstall</label>
                  <input
                    type="number"
                    value={newYear}
                    onChange={(e) => setNewYear(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Tidsskrift</label>
                  <input
                    type="text"
                    value={newJournal}
                    onChange={(e) => setNewJournal(e.target.value)}
                    placeholder="BMJ Health Care"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">DOI</label>
                  <input
                    type="text"
                    value={newDoi}
                    onChange={(e) => setNewDoi(e.target.value)}
                    placeholder="10.1136/..."
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Abstrakt</label>
                <textarea
                  rows={3}
                  value={newAbstract}
                  onChange={(e) => setNewAbstract(e.target.value)}
                  placeholder="Kort sammendrag av bakgrunn, metode og funn..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
                >
                  Avbryt
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold"
                >
                  Lagre artikkel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
