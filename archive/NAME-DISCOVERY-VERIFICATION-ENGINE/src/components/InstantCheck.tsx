import React, { useState } from 'react';
import { Search, Loader2, Sparkles, Globe } from 'lucide-react';
import { MarketJurisdiction } from '../types/index.js';

interface InstantCheckProps {
  onVerify: (name: string, market: MarketJurisdiction) => Promise<void>;
  isVerifying: boolean;
}

export function InstantCheck({ onVerify, isVerifying }: InstantCheckProps) {
  const [nameInput, setNameInput] = useState('');
  const [market, setMarket] = useState<MarketJurisdiction>('Norway');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput.trim() || isVerifying) return;
    await onVerify(nameInput.trim(), market);
  };

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 sm:p-5 backdrop-blur shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-indigo-400" />
          <h2 className="text-sm font-semibold text-slate-200">
            Instant Name Investigation
          </h2>
          <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-400">
            Ad-Hoc Verification
          </span>
        </div>
        <p className="text-xs text-slate-400">
          Screen against Brønnøysund, EUIPO/WIPO, DNS/RDAP, App Stores & GitHub
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            placeholder="Type any company, brand, or product name to verify (e.g., Vipps, Novalis, Klaro)..."
            disabled={isVerifying}
            className="w-full bg-slate-950 border border-slate-700/80 rounded-lg pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <select
              aria-label="Target Market Jurisdiction"
              value={market}
              onChange={(e) => setMarket(e.target.value as MarketJurisdiction)}
              disabled={isVerifying}
              className="bg-slate-950 border border-slate-700/80 text-xs sm:text-sm text-slate-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            >
              <option value="Norway">Norway (Brønnøysund)</option>
              <option value="Nordic">Nordic</option>
              <option value="Europe">Europe (EUIPO)</option>
              <option value="USA">USA (USPTO)</option>
              <option value="Global">Global</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={!nameInput.trim() || isVerifying}
            className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-medium px-5 py-2.5 rounded-lg text-sm transition shadow-sm whitespace-nowrap min-w-[130px]"
          >
            {isVerifying ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Screening...</span>
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                <span>Verify Name</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
