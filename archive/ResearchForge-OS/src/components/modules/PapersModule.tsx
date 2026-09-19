import React, { useState } from 'react';
import {
  FileText,
  Search,
  Download,
  ExternalLink,
  Tag,
  Calendar,
  CheckCircle,
  Database,
  Copy,
  Check,
  FileSpreadsheet
} from 'lucide-react';
import { CitationItem } from '../../types';

interface PapersModuleProps {
  citations: CitationItem[];
}

export const PapersModule: React.FC<PapersModuleProps> = ({ citations }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('ALL');
  const [copiedDoi, setCopiedDoi] = useState<string | null>(null);
  const [downloadSuccess, setDownloadSuccess] = useState<boolean>(false);

  // Extract all unique tags
  const allTags = Array.from(new Set(citations.flatMap((c) => c.tags)));

  const filtered = citations.filter((c) => {
    const matchesSearch =
      !searchTerm ||
      c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.authors.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.journal.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTag = selectedTag === 'ALL' || c.tags.includes(selectedTag);
    return matchesSearch && matchesTag;
  });

  const handleCopyDoi = (doi: string) => {
    navigator.clipboard.writeText(doi);
    setCopiedDoi(doi);
    setTimeout(() => setCopiedDoi(null), 2000);
  };

  const handleExportBibTeX = () => {
    const bibtex = citations
      .map(
        (c, idx) =>
          `@article{researchforge_${idx},\n  title={${c.title}},\n  author={${c.authors}},\n  journal={${c.journal}},\n  year={${c.year}},\n  doi={${c.doi}}\n}`
      )
      .join('\n\n');
    const blob = new Blob([bibtex], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'evidence_citations.bib';
    a.click();
    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Top action header */}
      <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <FileText className="w-4 h-4 text-indigo-400" />
            Evidensregister & Forskningsbibliotek
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Strukturerte artikler med metadata, DOI-koblinger og annoterte syntetiske forskningsdatasett.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportBibTeX}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition-all"
          >
            {downloadSuccess ? (
              <>
                <Check className="w-3.5 h-3.5 text-white" /> Eksportert .bib!
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5" /> Eksporter BibTeX
              </>
            )}
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Søk tittel, forfatter eller tidsskrift..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Tag Filters */}
        <div className="flex flex-wrap items-center gap-1.5 self-start sm:self-center">
          <span className="text-xs text-slate-400 mr-1 flex items-center gap-1">
            <Tag className="w-3 h-3" /> Tema:
          </span>
          <button
            onClick={() => setSelectedTag('ALL')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium ${
              selectedTag === 'ALL'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Alle ({citations.length})
          </button>
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setSelectedTag(tag)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium ${
                selectedTag === tag
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              #{tag}
            </button>
          ))}
        </div>
      </div>

      {/* Papers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((item) => (
          <div
            key={item.id}
            className="p-5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between space-y-3"
          >
            <div>
              <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  {item.year} • {item.journal}
                </span>
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                    item.screeningStatus === 'INCLUDED'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                      : item.screeningStatus === 'EXCLUDED'
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                      : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                  }`}
                >
                  {item.screeningStatus}
                </span>
              </div>

              <h4 className="text-sm font-bold text-white leading-snug">{item.title}</h4>
              <p className="text-xs text-slate-400 mt-1">{item.authors}</p>

              <p className="text-xs text-slate-300 mt-2.5 line-clamp-3 leading-relaxed bg-slate-950/50 p-2.5 rounded-lg border border-slate-800">
                {item.abstract}
              </p>
            </div>

            <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-400">
                <span>DOI:</span>
                <button
                  onClick={() => handleCopyDoi(item.doi)}
                  className="hover:text-white flex items-center gap-1 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700"
                  title="Kopier DOI"
                >
                  {item.doi}
                  {copiedDoi === item.doi ? (
                    <Check className="w-3 h-3 text-emerald-400" />
                  ) : (
                    <Copy className="w-3 h-3 text-slate-400" />
                  )}
                </button>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-mono bg-indigo-950 text-indigo-300 px-2 py-0.5 rounded border border-indigo-800/40">
                  Syntetisk Vedlegg
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
