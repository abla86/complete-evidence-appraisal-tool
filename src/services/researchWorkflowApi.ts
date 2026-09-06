// Canonical research-workflow API is implemented in researchWorkflowRoutes.ts.
// This module is intentionally kept as a compatibility shim so legacy imports
// do not register a second, conflicting route set.
export { registerResearchWorkflowRoutes as registerResearchWorkflowApi } from './researchWorkflowRoutes';

