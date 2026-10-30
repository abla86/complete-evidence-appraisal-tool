# «siste-versjon» og «research-ready-space1» mot denne kodebasen

Denne kodebasen er den eneste kanoniske. De to zip-filene (`siste-versjon-complete-evidence-appraisal-tool.zip` og `655794cc4_research-ready-space1.zip`) inneholder en eldre AI Studio-variant og en Lovable/TanStack-variant med samme moduler. De ble sammenlignet 2026-10-30. Ingen kode ble kopiert inn uendret, fordi datamodellen (`src/types/index.ts`) er en annen og kopiering ville gitt duplikater.

## Allerede dekket her

| Modul i zip | Dekket av |
|---|---|
| AppraisalWorkspace, Header, ModuleHubView | `UniversalAppraisalView`, `Header`, menystruktur |
| DuplicateDetectorModal | Duplikatkontroll i `ReferenceHubView` / `referenceHubService` |
| DoiVerificationModal, CitationModal | `ResearchSearchView` (DOI-verifisering), `Apa7CitationStudio`, `apa7CitationService` |
| DataExtractionModal | `AnalysisToolsView` (ekstraksjonskontroll), `dataExtractionService` |
| PrismaFlowDiagram | `MetaResearchLabView`, `prismaCalculator` |
| StudyDesignAdvisoryModal | `studyDesignGateService`, instrumentvalg i vurderingen |
| ValidationTestRunnerModal | `ValidationDashboardView` |
| ThesisDraftModal | `ThesisReadyView`, `WritingStudioView`, `AcademicWriterView` |
| KnowledgeBaseModal | `HelpAndExamplesView`, `MethodologyView` |
| SourceRecordWorkflowView, ReferenceHubView, EvidenceDocumentViewer | Tilsvarende komponenter + `PdfEvidenceViewer` |
| AuthPanel/AccountGate (space1, Supabase) | `LicenseGate` + valgfri Google-innlogging (uten Supabase/Lovable-avhengighet) |
| Juridiske sider (space1) | `LegalView` (oppdatert med selgerinformasjon) |
| lib/apa7.js, lib/norskLov.js, lib/doi.js | `sharedReferenceEngine`, `legalIdentifierService`, `apa7CitationService` |

## Ikke flyttet inn ennå (kandidater for neste fase)

| Modul | Hva den gjør | Merknad |
|---|---|---|
| SensitivityAnalysisModal | Sensitivitetsanalyse (utelat-én, RoB-filter) | Bør bygges på `metaAnalysisEngine` |
| ReliabilityReportModal, MultiReviewerComparison | Reliabilitet for flere enn to vurderere (parvis κ, Fleiss) | Utvider `consensusProtocolService` |
| ResearchFreezeModal | «Frys» av prosjekt med kryptografisk forsegling | `snapshotService` har SHA-256-snapshots; mangler UI for hele prosjektet |
| PrivateShareModal | Kryptert deling av prosjekt | Må designes sikkert (nøkkelhåndtering) før det tilbys |
| GovernanceGateModal, ProjectProtocolModal | Protokoll- og styringsport | Delvis i `projectScopeService`/`workflowGate` |
| KtaTimelineModal | KTA-tidslinje | KTA finnes som instrument uten tidslinje-UI |
| OcrDiagnosticsModal | Diagnostikk av OCR-feil i PDF-tekst | Skannede PDF-er flagges i dag, men uten diagnostikkvisning |
| SelfHealingMonitor | Selvreparasjon av lagret data | Erstattes delvis av sikkerhetskopi/gjenoppretting |
| StudentTools (space1) | PICO-bygger, quiz/flashcards fra sykepleie-spørsmålsbank | Spørsmålsbanken har uklar kilde/opphav og må avklares før salg |
| Nettleserutvidelse (popup/, injected/, manifest.json) | Samle referanse fra åpen nettside | Egen pakke (Chrome Web Store), krever egen personvernvurdering |

Disse tas inn én og én med tester, ikke som kopier.
