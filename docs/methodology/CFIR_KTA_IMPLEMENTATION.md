# CFIR 2.0 and Knowledge-to-Action (KTA)

## Scope

The implementation module extends the existing Evidence Appraisal Tool. It does not replace AMSTAR 2, CASP, AGREE II or GRADE.

## CFIR 2.0

The application uses the five updated CFIR domains as an assessment structure:

- Innovation
- Outer Setting
- Inner Setting
- Individuals
- Implementation Process

The current backend construct catalogue is derived from the current CFIR Guide construct list. It is intentionally used as a **catalogue**, not as a claim that every construct is relevant to every project.

Before a real project assessment, researchers must operationalize CFIR for the project, define the subject of each domain, adapt broad construct language where necessary, and add salient constructs where justified. The application therefore records the researcher's selected constructs, judgement, rationale and evidence location; it does not determine which constructs are critical.

The current implementation does not calculate an overall CFIR score. The influence field (barrier/facilitator) is an application-level representation of the researcher's judgement and must not be described as a validated CFIR total score.

## Knowledge-to-Action

The KTA implementation represents the seven-step action cycle described by Graham et al. (2006):

1. Identify problem
2. Adapt knowledge to local context
3. Assess barriers and facilitators
4. Select, tailor and implement interventions
5. Monitor knowledge use
6. Evaluate outcomes
7. Sustain knowledge use

The interface treats phase status as documentation. It does **not** convert status into a percentage or claim that a project is scientifically "72% implemented". The action cycle is iterative and bidirectional.

## CFIR + KTA

The intended workflow is:

CFIR determinants → documented barrier/facilitator → implementation strategy/action → monitoring → outcome evaluation → reflection/adaptation.

The application does not infer that a selected action will solve a determinant, and it does not infer implementation effectiveness from task completion.

## Primary methodological sources

Damschroder, L. J., Reardon, C. M., Opra Widerquist, M. A., & Lowery, J. (2022). The updated Consolidated Framework for Implementation Research based on user feedback. *Implementation Science, 17*, 75. https://doi.org/10.1186/s13012-022-01245-0

CFIR Research Team. (n.d.). *Updated CFIR constructs*. https://cfirguide.org/constructs

Graham, I. D., Logan, J., Harrison, M. B., Straus, S. E., Tetroe, J., Caswell, W., & Robinson, N. (2006). Lost in knowledge translation: Time for a map? *Journal of Continuing Education in the Health Professions, 26*(1), 13–24. https://doi.org/10.1002/chp.47

## Limitations of this implementation

- No database persistence yet.
- No authentication/authorization yet.
- No multi-reviewer reconciliation yet.
- No audit trail/version history yet.
- No CFIR/KTA export yet.
- No automated selection of implementation strategies.
- No automatic assessment of implementation outcomes.
- No claim of instrument validation is made by this software implementation.
