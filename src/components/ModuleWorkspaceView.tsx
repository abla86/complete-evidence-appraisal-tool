import React, { useState } from 'react';
import { IntegratedResearchInspectorsView } from './IntegratedResearchInspectorsView';
import { SourceRecordIntakeView } from './SourceRecordIntakeView';

export type WorkspaceModule = 'intake' | 'inspectors';

export const ModuleWorkspaceView: React.FC = () => {
  const [module, setModule] = useState<WorkspaceModule>('intake');

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Research integration modules">
        <button type="button" role="tab" aria-selected={module === 'intake'} onClick={() => setModule('intake')} className={`px-3 py-2 rounded-lg text-sm font-semibold border ${module === 'intake' ? 'bg-teal-800 text-white border-teal-800' : 'bg-white text-slate-700 border-slate-300'}`}>
          SourceRecord Intake
        </button>
        <button type="button" role="tab" aria-selected={module === 'inspectors'} onClick={() => setModule('inspectors')} className={`px-3 py-2 rounded-lg text-sm font-semibold border ${module === 'inspectors' ? 'bg-indigo-700 text-white border-indigo-700' : 'bg-white text-slate-700 border-slate-300'}`}>
          Privacy & Accessibility
        </button>
      </div>
      {module === 'intake' ? <SourceRecordIntakeView /> : <IntegratedResearchInspectorsView />}
    </section>
  );
};


