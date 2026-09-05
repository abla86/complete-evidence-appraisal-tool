import React, { createContext, useContext, useMemo } from 'react';
import type { ArticleAppraisal } from '../types';
import type { ReferenceRecord } from '../services/referenceHubService';
import type { EvidencePipelineState } from '../services/evidencePipelineService';

export interface StudioStateContextValue {
  articles: ArticleAppraisal[];
  setArticles: React.Dispatch<React.SetStateAction<ArticleAppraisal[]>>;
  references: ReferenceRecord[];
  setReferences: React.Dispatch<React.SetStateAction<ReferenceRecord[]>>;
  pipelineState: EvidencePipelineState;
  setPipelineState: React.Dispatch<React.SetStateAction<EvidencePipelineState>>;
  selectedArticleId: string;
  setSelectedArticleId: React.Dispatch<React.SetStateAction<string>>;
}

const StudioStateContext = createContext<StudioStateContextValue | null>(null);

export function StudioStateProvider({
  children,
  value,
}: {
  children: React.ReactNode;
  value: StudioStateContextValue;
}) {
  const stableValue = useMemo(() => value, [
    value.articles,
    value.references,
    value.pipelineState,
    value.selectedArticleId,
    value.setArticles,
    value.setReferences,
    value.setPipelineState,
    value.setSelectedArticleId,
  ]);
  return <StudioStateContext.Provider value={stableValue}>{children}</StudioStateContext.Provider>;
}

export function useStudioState(): StudioStateContextValue {
  const context = useContext(StudioStateContext);
  if (!context) throw new Error('useStudioState must be used inside StudioStateProvider');
  return context;
}
