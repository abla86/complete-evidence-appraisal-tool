import React from "react";
import {
  Compass,
  Database,
  Calculator,
  FileSearch,
  CheckCircle2,
  BarChart3,
  FileText,
  Workflow,
  Sparkles,
  Layers,
} from "lucide-react";

export type TabId =
  | "flow"
  | "wizard"
  | "data"
  | "analysis"
  | "interpreter"
  | "assumptions"
  | "effect-size"
  | "apa"
  | "pico"
  | "ai-advisor";

interface NavigationProps {
  activeTab: TabId;
  setActiveTab: (tab: TabId) => void;
  datasetName: string;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  setActiveTab,
  datasetName,
}) => {
  const tabs: { id: TabId; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: "flow", label: "Hovedflyt", icon: Layers },
    { id: "wizard", label: "Analyseveileder", icon: Compass },
    { id: "data", label: "Datasett & Variabler", icon: Database },
    { id: "analysis", label: "Statistikkbibliotek", icon: Calculator },
    { id: "interpreter", label: "SPSS Output-tolk", icon: FileSearch },
    { id: "assumptions", label: "Forutsetninger", icon: CheckCircle2 },
    { id: "effect-size", label: "Effektstørrelse & KI", icon: BarChart3 },
    { id: "apa", label: "APA 7 Rapportering", icon: FileText },
    { id: "pico", label: "PICO & Evidens", icon: Workflow },
    { id: "ai-advisor", label: "AI Veileder", icon: Sparkles },
  ];

  return (
    <header className="bg-slate-900 text-slate-100 border-b border-slate-800 sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between py-3 border-b border-slate-800/80">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-600 flex items-center justify-center font-bold text-white shadow-sm">
              Σ
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-base tracking-tight text-white">
                  SPSS Survival Manual
                </span>
                <span className="px-2 py-0.5 text-xs font-medium rounded bg-emerald-950 text-emerald-300 border border-emerald-800/50">
                  Digital Edition
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Strukturert metode, forutsetningskontroll, tolkning og akademisk rapportering
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="text-right text-xs">
              <span className="text-slate-400">Aktivt datasett:</span>{" "}
              <span className="font-medium text-slate-200">{datasetName}</span>
            </div>
          </div>
        </div>

        {/* Tab Strip */}
        <nav className="flex space-x-1 overflow-x-auto py-2 scrollbar-none" aria-label="Hovednavigasjon">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`nav-tab-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-3 py-2 text-xs md:text-sm font-medium rounded-md whitespace-nowrap transition-colors ${
                  isActive
                    ? "bg-slate-800 text-emerald-400 shadow-inner border border-slate-700"
                    : "text-slate-300 hover:text-white hover:bg-slate-800/60"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-emerald-400" : "text-slate-400"}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
