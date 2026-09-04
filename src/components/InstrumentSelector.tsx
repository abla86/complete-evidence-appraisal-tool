import React, { useState } from 'react';
import { AppraisalInstrument } from '../types';
import { MASTER_INSTRUMENTS_REGISTRY, INSTRUMENT_CATEGORIES } from '../data/masterRegistry';
import { 
  CheckCircle2, 
  ChevronDown, 
  ShieldCheck, 
  Layers, 
  BookOpen, 
  GraduationCap, 
  Sparkles, 
  Search, 
  X,
  ExternalLink 
} from 'lucide-react';
import { MethodologyHubModal } from './MethodologyHubModal';

interface InstrumentSelectorProps {
  selectedInstrumentId: string;
  onSelectInstrument: (instrumentId: string) => void;
}

export const InstrumentSelector: React.FC<InstrumentSelectorProps> = ({
  selectedInstrumentId,
  onSelectInstrument
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isHubModalOpen, setIsHubModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  const currentInstrument = MASTER_INSTRUMENTS_REGISTRY.find(i => i.id === selectedInstrumentId);

  const filteredInstruments = MASTER_INSTRUMENTS_REGISTRY.filter(inst => {
    if (filterCategory !== 'all' && inst.category !== filterCategory) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        inst.name.toLowerCase().includes(q) ||
        inst.shortName.toLowerCase().includes(q) ||
        inst.purpose.toLowerCase().includes(q) ||
        inst.categoryName.toLowerCase().includes(q) ||
        inst.targetStudyDesign.some(d => d.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <>
      <div className="bg-white border-b border-slate-200 py-2.5 px-4 sm:px-6 lg:px-8 text-xs relative z-30">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          {/* Left: Current Instrument Badge & Picker */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-slate-500 uppercase tracking-wider text-[10px]">
              Vurderingsinstrument:
            </span>

            <div className="relative">
              <button
                type="button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-teal-50 border border-teal-200 text-teal-900 font-bold hover:bg-teal-100 transition-colors shadow-2xs"
              >
                <ShieldCheck className="w-4 h-4 text-teal-700" />
                <span>{currentInstrument ? `${currentInstrument.shortName} (${currentInstrument.year})` : 'Ingen gyldig instrument valgt'}</span>
                <span className="px-1.5 py-0.2 rounded text-[9px] bg-teal-200/60 text-teal-900 font-medium">
                  {currentInstrument?.categoryName ?? 'Manuelt valg kreves'}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-teal-700" />
              </button>

              {/* Dynamic Categorized Dropdown Menu */}
              {isDropdownOpen && (
                <div 
                  className="absolute left-0 top-full mt-1.5 w-[420px] max-w-[92vw] bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 p-3.5 animate-in fade-in zoom-in-95 duration-100 max-h-[80vh] flex flex-col"
                  onMouseLeave={() => setIsDropdownOpen(false)}
                >
                  {/* Search inside dropdown */}
                  <div className="relative mb-2.5 shrink-0">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Søk i alle 36+ instrumenter..."
                      className="w-full pl-8 pr-7 py-1.5 rounded-lg border border-slate-300 bg-slate-50 text-xs text-slate-900 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-teal-700"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  {/* Category Filter Pills inside dropdown */}
                  <div className="flex items-center gap-1 overflow-x-auto pb-1.5 mb-2 shrink-0 text-[10px]">
                    <button
                      onClick={() => setFilterCategory('all')}
                      className={`px-2 py-0.5 rounded font-bold transition-colors shrink-0 ${
                        filterCategory === 'all'
                          ? 'bg-slate-900 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      Alle ({MASTER_INSTRUMENTS_REGISTRY.length})
                    </button>
                    {INSTRUMENT_CATEGORIES.map(cat => (
                      <button
                        key={cat.id}
                        onClick={() => setFilterCategory(cat.id)}
                        className={`px-2 py-0.5 rounded font-bold transition-colors shrink-0 ${
                          filterCategory === cat.id
                            ? 'bg-teal-800 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {cat.name} ({cat.itemCount})
                      </button>
                    ))}
                  </div>

                  {/* Scrollable list of instruments */}
                  <div className="overflow-y-auto space-y-1 flex-1 max-h-72 pr-1">
                    {filteredInstruments.length === 0 ? (
                      <div className="p-4 text-center text-slate-500 text-xs">
                        Ingen verktøy matcher søket.
                      </div>
                    ) : (
                      filteredInstruments.map(inst => {
                        const isSelected = inst.id === selectedInstrumentId;
                        return (
                          <button
                            key={inst.id}
                            onClick={() => {
                              onSelectInstrument(inst.id);
                              setIsDropdownOpen(false);
                            }}
                            className={`w-full text-left px-3 py-2 rounded-xl flex items-start justify-between gap-2 transition-colors ${
                              isSelected 
                                ? 'bg-teal-50 text-teal-900 border border-teal-200' 
                                : 'hover:bg-slate-50 text-slate-700'
                            }`}
                          >
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold text-xs flex items-center gap-1.5 flex-wrap">
                                <span>{inst.shortName}</span>
                                <span className="text-[10px] text-slate-400 font-normal">({inst.year})</span>
                                <span className="px-1.5 py-0.2 rounded text-[9px] bg-slate-100 text-slate-600 font-medium">
                                  {inst.categoryName}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                                {inst.purpose}
                              </p>
                            </div>
                            {isSelected && <CheckCircle2 className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />}
                          </button>
                        );
                      })
                    )}
                  </div>

                  {/* Dropdown Footer */}
                  <div className="pt-2 mt-2 border-t border-slate-100 shrink-0 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => {
                        setIsDropdownOpen(false);
                        setIsHubModalOpen(true);
                      }}
                      className="text-[11px] font-bold text-teal-800 hover:text-teal-950 flex items-center gap-1"
                    >
                      <GraduationCap className="w-3.5 h-3.5" />
                      <span>Åpne fullt metodebibliotek</span>
                    </button>
                    <span className="text-[10px] text-slate-400">
                      {MASTER_INSTRUMENTS_REGISTRY.length} verktøy
                    </span>
                  </div>
                </div>
              )}
            </div>

            <span className="text-slate-400 hidden lg:inline">|</span>
            <span className="text-slate-600 hidden lg:inline line-clamp-1 max-w-md">
              Formål: <strong className="text-slate-800">{currentInstrument?.purpose ?? 'Ingen instrumentinformasjon tilgjengelig'}</strong>
            </span>
          </div>

          {/* Right: Quick Category Shortcuts & Library Hub Trigger */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsHubModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-[11px] shadow-2xs transition-colors"
            >
              <BookOpen className="w-3.5 h-3.5 text-teal-300" />
              <span>Metodebibliotek ({MASTER_INSTRUMENTS_REGISTRY.length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Full Modal Hub */}
      <MethodologyHubModal
        isOpen={isHubModalOpen}
        onClose={() => setIsHubModalOpen(false)}
        selectedInstrumentId={selectedInstrumentId}
        onSelectInstrument={(id) => {
          onSelectInstrument(id);
          setIsHubModalOpen(false);
        }}
      />
    </>
  );
};
