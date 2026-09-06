import React from 'react';
import { ModuleWorkspaceView } from './ModuleWorkspaceView';

export const SuperprogramIntegrationCard: React.FC = () => (
  <div className="rounded-2xl border border-indigo-200 bg-white shadow-sm overflow-hidden">
    <div className="px-5 py-4 border-b border-indigo-100 bg-indigo-50">
      <h2 className="text-lg font-bold text-indigo-950">Integrerte research-moduler</h2>
      <p className="text-xs text-indigo-800 mt-1">SourceRecord Intake Â· referanseintegritet Â· privacy Â· accessibility</p>
    </div>
    <div className="p-5">
      <ModuleWorkspaceView />
    </div>
  </div>
);


