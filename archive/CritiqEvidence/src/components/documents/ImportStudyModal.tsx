import React, { useState } from 'react';
import { Study } from '@/schemas/study.schema';
import { FrameworkType } from '@/types/frameworks';
import { FRAMEWORK_REGISTRY } from '@/lib/frameworks';
import { SAMPLE_STUDIES } from '@/lib/sampleStudies';
import { detectHeadingsFromRawText, parseStructuredDocument } from '@/lib/parsers/imradExtractor';
import { fetchMetadataByDoi } from '@/lib/parsers/doiFetcher';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { FileUp, BookOpen, Search, Sparkles, AlertCircle } from 'lucide-react';

interface ImportStudyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportStudy: (study: Study, framework: FrameworkType) => void;
}

export const ImportStudyModal: React.FC<ImportStudyModalProps> = ({
  isOpen,
  onClose,
  onImportStudy,
}) => {
  const [tab, setTab] = useState<'sample' | 'paste' | 'doi'>('sample');
  const [selectedFramework, setSelectedFramework] = useState<FrameworkType>('CASP_QUALITATIVE');

  // Manual Paste Form State
  const [title, setTitle] = useState('');
  const [authors, setAuthors] = useState('');
  const [year, setYear] = useState<string>('2024');
  const [journal, setJournal] = useState('');
  const [doi, setDoi] = useState('');
  const [rawText, setRawText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // DOI Lookup State
  const [lookupDoi, setLookupDoi] = useState('');
  const [isFetchingDoi, setIsFetchingDoi] = useState(false);

  const handleSelectSample = (index: number) => {
    const sample = SAMPLE_STUDIES[index];
    if (sample) {
      onImportStudy(sample.study, sample.framework);
      onClose();
    }
  };

  const handleDoiSearch = async () => {
    if (!lookupDoi.trim()) return;
    setIsFetchingDoi(true);
    setErrorMessage('');
    try {
      const meta = await fetchMetadataByDoi(lookupDoi);
      setTitle(meta.title);
      setAuthors(meta.authors);
      if (meta.year) setYear(meta.year.toString());
      if (meta.journal) setJournal(meta.journal);
      setDoi(meta.doi);
      if (meta.abstract) {
        setRawText(`## Abstract\n${meta.abstract}\n\n## Introduction\n\n## Methods\n\n## Results\n\n## Discussion\n`);
      }
      setTab('paste');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Kunne ikke hente DOI-metadata';
      setErrorMessage(msg);
    } finally {
      setIsFetchingDoi(false);
    }
  };

  const handleManualImport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !rawText.trim()) {
      setErrorMessage('Tittel og artikkeltekst er obligatoriske felt.');
      return;
    }

    setIsProcessing(true);
    try {
      const detectedHeadings = detectHeadingsFromRawText(rawText);
      const extractedSections = parseStructuredDocument(rawText, detectedHeadings);

      const newStudy: Study = {
        id: crypto.randomUUID ? crypto.randomUUID() : `study-${Date.now()}`,
        title: title.trim(),
        authors: authors.trim() || 'Ukjente forfattere',
        year: year ? parseInt(year, 10) : undefined,
        journal: journal.trim() || undefined,
        doi: doi.trim() || undefined,
        fullText: rawText,
        sections: extractedSections,
        importedAt: new Date().toISOString(),
      };

      onImportStudy(newStudy, selectedFramework);
      onClose();
    } catch (err) {
      setErrorMessage('Feil under parsing av tekst.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Importer forskningsartikkel eller studie"
      subtitle="Last inn en publisert artikkel med automatisk IMRaD-segmentering for kritisk vurdering"
      maxWidth="2xl"
    >
      {/* Tabs */}
      <div className="flex border-b border-slate-200 mb-5">
        <button
          onClick={() => setTab('sample')}
          className={`pb-2.5 px-4 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition-colors ${
            tab === 'sample'
              ? 'border-slate-950 text-slate-950'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          Eksempelartikler
        </button>
        <button
          onClick={() => setTab('paste')}
          className={`pb-2.5 px-4 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition-colors ${
            tab === 'paste'
              ? 'border-slate-950 text-slate-950'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileUp className="w-3.5 h-3.5" />
          Lim inn artikkeltekst (IMRaD)
        </button>
        <button
          onClick={() => setTab('doi')}
          className={`pb-2.5 px-4 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition-colors ${
            tab === 'doi'
              ? 'border-slate-950 text-slate-950'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Search className="w-3.5 h-3.5" />
          Hent via DOI (CrossRef)
        </button>
      </div>

      {errorMessage && (
        <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* TAB 1: SAMPLES */}
      {tab === 'sample' && (
        <div className="space-y-3">
          <p className="text-xs text-slate-600">
            Velg en forhåndsinnlastet vitenskapelig studie for rask utprøving av sjekklistene:
          </p>
          <div className="space-y-2.5">
            {SAMPLE_STUDIES.map((item, idx) => {
              const meta = FRAMEWORK_REGISTRY[item.framework]?.meta;
              return (
                <div
                  key={idx}
                  onClick={() => handleSelectSample(idx)}
                  className="p-4 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/20 transition-all cursor-pointer group flex flex-col gap-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-900">
                      {meta?.title} • {meta?.studyType}
                    </span>
                    <span className="text-xs text-blue-600 font-semibold group-hover:underline">
                      Velg studie →
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 group-hover:text-blue-900">
                    {item.study.title}
                  </h4>
                  <p className="text-xs text-slate-500 line-clamp-2">{item.study.abstract}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: PASTE RAW TEXT */}
      {tab === 'paste' && (
        <form onSubmit={handleManualImport} className="space-y-4 text-xs">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <label className="block font-bold text-slate-800 mb-1.5">
              Velg metodisk vurderingsrammeverk for studien:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(['CASP_QUALITATIVE', 'AMSTAR_2', 'AGREE_II', 'COCHRANE_ROB_2'] as FrameworkType[]).map((f) => {
                const meta = FRAMEWORK_REGISTRY[f].meta;
                const isSelected = selectedFramework === f;
                return (
                  <button
                    type="button"
                    key={f}
                    onClick={() => setSelectedFramework(f)}
                    className={`p-2 rounded-lg border text-left transition-all ${
                      isSelected
                        ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    <div className="font-bold text-xs">{meta.title}</div>
                    <div className={`text-[10px] ${isSelected ? 'text-slate-300' : 'text-slate-500'} truncate`}>
                      {meta.studyType}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Studiens tittel *</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="f.eks. Pasienters erfaringer..."
                className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Forfattere</label>
              <input
                type="text"
                value={authors}
                onChange={(e) => setAuthors(e.target.value)}
                placeholder="f.eks. Olsen, K., & Smith, J."
                className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Publikasjonsår</label>
              <input
                type="number"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                placeholder="2024"
                className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Tidsskrift / DOI</label>
              <input
                type="text"
                value={journal}
                onChange={(e) => setJournal(e.target.value)}
                placeholder="f.eks. BMJ / 10.1136/..."
                className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-semibold text-slate-700">Artikkeltekst / Fulltekst *</label>
              <span className="text-[11px] text-slate-500">
                Gjenkjenner automatisk Abstract, Introduction, Methods, Results, Discussion
              </span>
            </div>
            <textarea
              required
              rows={8}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="Lim inn artikkelteksten her. Seksjonsoverskrifter som '## Methods' eller 'Metode' vil automatisk bli delt inn i IMRaD-blokker..."
              className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-xs leading-relaxed font-mono"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
            <Button variant="outline" size="sm" onClick={onClose} type="button">
              Avbryt
            </Button>
            <Button variant="primary" size="sm" type="submit" isLoading={isProcessing}>
              Importer & Strukturér studie
            </Button>
          </div>
        </form>
      )}

      {/* TAB 3: DOI LOOKUP */}
      {tab === 'doi' && (
        <div className="space-y-4 text-xs">
          <p className="text-slate-600 leading-relaxed">
            Skriv inn DOI (Digital Object Identifier) for artikkelen. Metadata som tittel, forfattere, årstall, tidsskrift og sammendrag hentes direkte fra CrossRef:
          </p>

          <div className="flex gap-2">
            <input
              type="text"
              value={lookupDoi}
              onChange={(e) => setLookupDoi(e.target.value)}
              placeholder="f.eks. 10.1016/j.ijnurstu.2021.103988 eller 10.1136/bmj.m4268"
              className="flex-1 p-2.5 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
            <Button
              variant="primary"
              size="md"
              onClick={handleDoiSearch}
              isLoading={isFetchingDoi}
            >
              Hent metadata
            </Button>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-[11px] text-slate-500 space-y-1">
            <strong>Tips:</strong>
            <p>
              Etter at DOI-metadata er hentet, overføres tittelen og sammendraget til artikkelfeltet. Du kan deretter lime inn resten av artikkelteksten (Methods, Results) og starte vurderingen.
            </p>
          </div>
        </div>
      )}
    </Modal>
  );
};
