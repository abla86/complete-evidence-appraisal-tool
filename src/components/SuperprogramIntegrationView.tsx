import React from 'react';
import { SourceRecordIntakeView } from './SourceRecordIntakeView';
import { IntegratedResearchInspectorsView } from './IntegratedResearchInspectorsView';

export const SuperprogramIntegrationView: React.FC = () => (
  <section className="space-y-8" aria-labelledby="research-integration-title">
    <header>
      <div className="flex items-center gap-2">
        <h2
          id="research-integration-title"
          className="text-xl font-bold text-slate-900"
        >
          Research Integration
        </h2>
      </div>
      <p className="mt-1 max-w-3xl text-sm text-slate-600">
        Samlet inngang til SourceRecord-intak og lokal metadata-, personvern- og
        tilgjengelighetsanalyse. Importen er separat fra screening og endrer ikke
        PRISMA-tellinger før en eksplisitt workflow-handling utføres.
      </p>
    </header>

    <SourceRecordIntakeView />
    <IntegratedResearchInspectorsView />
  </section>
);
