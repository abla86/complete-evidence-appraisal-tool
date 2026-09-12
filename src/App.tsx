/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Dataset } from "./types";
import { defaultDatasets } from "./data/defaultDatasets";
import { Navigation, TabId } from "./components/Navigation";
import { FlowView } from "./components/FlowView";
import { WizardView } from "./components/WizardView";
import { DatasetView } from "./components/DatasetView";
import { AnalysisRunnerView } from "./components/AnalysisRunnerView";
import { OutputInterpreterView } from "./components/OutputInterpreterView";
import { AssumptionsView } from "./components/AssumptionsView";
import { EffectSizeView } from "./components/EffectSizeView";
import { ApaReportView } from "./components/ApaReportView";
import { PicoWorkflowView } from "./components/PicoWorkflowView";
import { AiAdvisorView } from "./components/AiAdvisorView";

export default function App() {
  const [activeTab, setActiveTab] = useState<TabId>("flow");
  const [currentDataset, setCurrentDataset] = useState<Dataset>(defaultDatasets[0]);
  const [selectedTestId, setSelectedTestId] = useState<string>("independent-t-test");

  const handleSelectTestAndNavigate = (testId: string) => {
    setSelectedTestId(testId);
    setActiveTab("analysis");
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col antialiased">
      {/* Top Main Navigation */}
      <Navigation
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        datasetName={currentDataset.name}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {activeTab === "flow" && (
          <FlowView
            onNavigate={(tab) => {
              setActiveTab(tab);
            }}
          />
        )}

        {activeTab === "wizard" && (
          <WizardView
            onSelectTest={handleSelectTestAndNavigate}
            onNavigate={(tab) => setActiveTab(tab)}
          />
        )}

        {activeTab === "data" && (
          <DatasetView
            currentDataset={currentDataset}
            onSelectDataset={(ds) => setCurrentDataset(ds)}
            onUpdateDataset={(updated) => setCurrentDataset(updated)}
          />
        )}

        {activeTab === "analysis" && (
          <AnalysisRunnerView
            dataset={currentDataset}
            selectedTestId={selectedTestId}
          />
        )}

        {activeTab === "interpreter" && <OutputInterpreterView />}

        {activeTab === "assumptions" && <AssumptionsView />}

        {activeTab === "effect-size" && <EffectSizeView />}

        {activeTab === "apa" && <ApaReportView />}

        {activeTab === "pico" && (
          <PicoWorkflowView onNavigate={(tab) => setActiveTab(tab)} />
        )}

        {activeTab === "ai-advisor" && <AiAdvisorView />}
      </main>

      {/* Academic Footer */}
      <footer className="bg-slate-900 text-slate-400 border-t border-slate-800 text-xs py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-slate-200">
              SPSS Survival Manual – Digital
            </span>
            <span>•</span>
            <span>Kvantitativ metode & statistisk tenkning</span>
          </div>
          <div className="text-center sm:text-right text-slate-400">
            Designet for helse-, samfunns- og organisasjonsfag • APA 7 standard
          </div>
        </div>
      </footer>
    </div>
  );
}
