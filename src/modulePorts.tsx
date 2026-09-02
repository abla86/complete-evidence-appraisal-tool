import React from 'react';
import { IntegratedResearchInspectorsView } from './components/IntegratedResearchInspectorsView';
import { SourceRecordIntakeView } from './components/SourceRecordIntakeView';
import { ModuleWorkspaceView } from './components/ModuleWorkspaceView';

export type ModulePort = {
  id: string;
  label: string;
  component: React.ComponentType;
  enabled: boolean;
};

export const moduleRegistry: readonly ModulePort[] = [
  {
    id: 'source-intake',
    label: 'SourceRecord Intake',
    component: SourceRecordIntakeView,
    enabled: true,
  },
  {
    id: 'research-inspector',
    label: 'Privacy & Accessibility',
    component: IntegratedResearchInspectorsView,
    enabled: true,
  },
  {
    id: 'research-modules',
    label: 'Research Modules',
    component: ModuleWorkspaceView,
    enabled: true,
  },
];

export function isModuleEnabled(id: string): boolean {
  return moduleRegistry.some((module) => module.id === id && module.enabled);
}
