import React, { useState } from 'react';
import { ArticleAppraisal, AuditTrailEntry } from '../types';
import { History, Search, Download, ShieldCheck, User, Calendar, FileText, BookOpen, Lock, CheckCircle, AlertOctagon } from 'lucide-react';
import { useToast } from './Toast';
import { CryptoSecurityService } from '../services/cryptoSecurityService';

interface AuditTrailViewProps {
  articles?: ArticleAppraisal[];
}

export const AuditTrailView: React.FC<AuditTrailViewProps> = ({ articles = [] }) => {
  const { showToast } = useToast();
  const [selectedStudy, setSelectedStudy] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Collect all audit entries from active articles in workspace
  const allEntries: AuditTrailEntry[] = articles.flatMap(art => art.auditTrail || []);

  const chainStatus = CryptoSecurityService.verifyAuditChain(allEntries);

  const filteredEntries = allEntries.filter(entry => {
    if (selectedStudy !== 'all' && entry.studyId !== selectedStudy) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        entry.itemTitle?.toLowerCase().includes(q) ||
        entry.newRationale?.toLowerCase().includes(q) ||
        entry.previousAnswer?.toLowerCase().includes(q) ||
        entry.newAnswer?.toLowerCase().includes(q) ||
        entry.changedBy?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const exportAuditTrailJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(filteredEntries, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `jbi-audit-trail-${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('Audit trail eksportert som JSON!', 'success');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-100 text-teal-800 border border-teal-200 flex items-center gap-1">
                <History className="w-3.5 h-3.5" />
                <span>Uforanderlig Endringslogg</span>
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                Audit Trail & Metoderevisjon
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 font-serif">
              Revisjonsspor & Endringshistorikk
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              Full sporbarhet over alle metodiske endringer, svarjusteringer og begrunnelsesrevisjoner per studie i ditt prosjekt.
            </p>
          </div>

          {allEntries.length > 0 && (
            <button
              onClick={exportAuditTrailJson}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-bold shadow-2xs transition-colors self-start sm:self-auto"
            >
              <Download className="w-4 h-4 text-slate-500" />
              <span>Eksporter Audit Logg</span>
            </button>
          )}
        </div>

        {/* Filter Toolbar */}
        {articles.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6 pt-4 border-t border-slate-200 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Filtrer pÃ¥ studie:</label>
              <select
                value={selectedStudy}
                onChange={(e) => setSelectedStudy(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-teal-600 text-xs"
              >
                <option value="all">Alle studier ({allEntries.length} hendelser)</option>
                {articles.map(art => (
                  <option key={art.id} value={art.id}>{art.shortCitation}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">SÃ¸k i revisjonslogg:</label>
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="SÃ¸k i kriterier, begrunnelser eller reviewer..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-teal-600 text-xs"
                />
              </div>
            </div>
          </div>
        )}

        {/* Cryptographic Chain Integrity Banner */}
        <div className={`mt-4 p-3 rounded-xl border flex items-center justify-between text-xs ${
          chainStatus.isValid 
            ? 'bg-emerald-50 text-emerald-900 border-emerald-200' 
            : 'bg-rose-50 text-rose-900 border-rose-200'
        }`}>
          <div className="flex items-center gap-2">
            {chainStatus.isValid ? (
              <CheckCircle className="w-4 h-4 text-emerald-600" />
            ) : (
              <AlertOctagon className="w-4 h-4 text-rose-600" />
            )}
            <div>
              <span className="font-bold">Kryptografisk kjedeintegritet (SHA-256): </span>
              <span>{chainStatus.message}</span>
            </div>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-700">
            {chainStatus.totalEntries} Blokker
          </span>
        </div>
      </div>

      {/* Audit Entries List */}
      {allEntries.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center space-y-3 shadow-xs">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <History className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900 font-serif">Ingen hendelser i revisjonssporet ennÃ¥</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            NÃ¥r du oppretter, reviderer eller gjenÃ¥pner vurderinger for artikler i prosjektet ditt, vil hver endring, begrunnelse og tidsstempel loggfÃ¸res automatisk her for full metodisk transparens.
          </p>
        </div>
      ) : filteredEntries.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center space-y-2 shadow-xs">
          <p className="text-sm font-semibold text-slate-800">Ingen hendelser matchet sÃ¸ket.</p>
          <p className="text-xs text-slate-500">PrÃ¸v Ã¥ endre sÃ¸keord eller velg en annen studie.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredEntries.map((entry) => (
            <div 
              key={entry.id}
              className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-3 transition-all hover:border-slate-300"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2 text-xs">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-slate-900 font-serif">
                    {entry.itemTitle || `Kriterium ${entry.itemId}`}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">
                    Studie: {entry.studyId}
                  </span>
                  {entry.instrumentId && (
                    <span className="text-[10px] px-2 py-0.5 rounded bg-teal-50 text-teal-800 font-bold border border-teal-200">
                      {entry.instrumentId} (v{entry.version})
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3 text-slate-500 text-[11px]">
                  <span className="flex items-center gap-1">
                    <User className="w-3 h-3 text-slate-400" />
                    {entry.changedBy} {entry.reviewer ? `(${entry.reviewer})` : ''}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    {new Date(entry.timestamp).toLocaleString('nb-NO')}
                  </span>
                </div>
              </div>

              {/* Answer change diff */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Tidligere tilstand:
                  </span>
                  <div className="font-semibold text-slate-700 mb-1">
                    Svar: <span className="text-slate-900">{entry.previousAnswer || 'Ubesvart'}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 italic">
                    {entry.previousRationale || '(Ingen tidligere begrunnelse registrert)'}
                  </p>
                </div>

                <div className="bg-teal-50/40 p-3 rounded-lg border border-teal-200">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-teal-800 block mb-1">
                    Ny registrert tilstand:
                  </span>
                  <div className="font-semibold text-teal-950 mb-1">
                    Svar: <span className="font-bold text-teal-900">{entry.newAnswer}</span>
                  </div>
                  <p className="text-[11px] text-slate-700">
                    {entry.newRationale}
                  </p>
                </div>
              </div>

              {entry.comment && (
                <div className="text-[11px] text-slate-500 flex items-center gap-1.5 pt-1">
                  <FileText className="w-3 h-3 text-slate-400" />
                  <span>Notat: {entry.comment}</span>
                </div>
              )}

              {/* Cryptographic Entry Hash Signature */}
              <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[10px] font-mono text-slate-400">
                <span className="flex items-center gap-1">
                  <Lock className="w-3 h-3 text-slate-400" />
                  SHA-256 Sig: {entry.entryHash ? `${entry.entryHash.slice(0, 16)}...` : 'Uforseglet genesis-blokk'}
                </span>
                {entry.previousHash && (
                  <span>Prev: {entry.previousHash.slice(0, 12)}...</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

