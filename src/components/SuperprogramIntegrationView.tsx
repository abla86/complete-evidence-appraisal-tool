import React from 'react';
import { SourceRecordIntakeView } from './SourceRecordIntakeView';
import { IntegratedResearchInspectorsView } from './IntegratedResearchInspectorsView';

export const SuperprogramIntegrationView: React.FC = () => (
  <section className="space-y-8">
    <header>
      <div className="flex items-center gap-2">
        <h2 className="text-xl font-bold text-slate-900">Research Integration</h2>
        <span className="rounded-full bg-teal-50 border border-teal-200 px-2 py-0.5 text-[10px] font-bold text-teal-900">TESTBAR MODUL</span>
      </div>
      <p className="text-sm text-slate-600 mt-1 max-w-3xl">
        Samlet inngang til SourceRecord-intake og lokal metadata-, personvern- og tilgjengelighetsanalyse. Importen er separat fra screening og endrer ikke PRISMA-tellinger fÃ¸r en eksplisitt workflow-handling utfÃ¸res.
      </p>
    </header>
    <SourceRecordIntakeView />
    <IntegratedResearchInspectorsView />
  </section>
);


