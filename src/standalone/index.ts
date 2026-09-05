/**
 * Dual-mode public entrypoints.
 *
 * These exports intentionally preserve each studio unit as an independently
 * importable surface while the main application composes the same units through
 * the shared StudioStateContext.
 */
export { DocumentAnalysisModal } from '../components/DocumentAnalysisModal';
export { SourceRecordWorkflowView } from '../components/SourceRecordWorkflowView';
export { UniversalAppraisalView } from '../components/UniversalAppraisalView';
export { ReferenceHubView } from '../components/ReferenceHubView';
export { MetaResearchLabView } from '../components/MetaResearchLabView';
export { PeerReviewStudioView } from '../components/PeerReviewStudioView';
export { ThesisReadyView } from '../components/ThesisReadyView';
export { AuditTrailView } from '../components/AuditTrailView';

export { StudioStateProvider, useStudioState } from '../state/StudioStateContext';

export {
  createBlankAppraisalSession,
  upsertAppraisalResponse,
  validateAppraisalSession,
  decideAppraisalLaunch,
} from '../services/universalAppraisalService';

export { DocumentParserService } from '../services/documentParserService';
export { ImportExportService } from '../services/importExportService';
