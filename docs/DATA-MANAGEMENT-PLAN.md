# Data Management Plan (DMP)

**Project:** Evidence Appraisal Tool & Forsk på Forskning  
**Document status:** Living project document  
**Scope:** Software development, validation and potential research use

## 1. Purpose

This DMP defines how research-related data and digital research objects associated with the Evidence Appraisal Tool are created, processed, protected, documented, retained and potentially shared.

The plan follows the principle that data should be as open as possible and as closed as necessary. Sikt describes a DMP as a living document covering data handling throughout the research process (Sikt, n.d.). FAIR principles are used as a design objective for findability, accessibility, interoperability and reusability (Wilkinson et al., 2016).

## 2. Data categories

The application is designed to distinguish between:

1. **Bibliographic metadata:** title, authors, DOI, journal, publication year and study-design metadata.
2. **Appraisal data:** instrument, instrument version, item answers, domain assessments, reviewer notes, evidence locations and rationale.
3. **Derived data:** deterministic domain results, confidence classifications where the selected instrument permits them, agreement statistics and validation results.
4. **Audit metadata:** timestamps, application version, methodology version and change history.
5. **Test/reference data:** synthetic data and explicitly documented published reference cases used for software validation.
6. **Account data:** only the minimum authentication/session information required for access control, where authentication is enabled.

The system should not require patient records, clinical case details, national identity numbers or other directly identifying health information for its core appraisal function.

## 3. Personal data and special-category data

The preferred architecture is **privacy by design and by default**: personal data are not collected unless a documented feature requires them.

If users enter free-text notes containing personal data, the application must not assume that the text is anonymous. Such data must be treated according to the applicable institutional privacy assessment and legal basis. Special-category personal data, including health information, should not be entered into ordinary appraisal fields.

The application is not itself a determination that a project is exempt from privacy requirements. The responsible institution must assess the actual processing before operational research use.

## 4. Collection and provenance

Each appraisal should retain sufficient provenance to reconstruct what was assessed and how the result was produced:

- study identifier/DOI where available;
- appraisal instrument and exact instrument version;
- date/time of appraisal;
- application version;
- reviewer identifier where necessary;
- item-level answers;
- evidence location and rationale;
- derived result;
- relevant methodology/source identifier.

The system must distinguish **source facts**, **human judgments**, **software-derived values** and **AI-generated candidate suggestions**.

## 5. Storage

Production data must be stored only in an institutionally approved environment appropriate to the classification of the data. Development databases must contain synthetic or de-identified test data unless an approved research environment explicitly permits otherwise.

Secrets, credentials, OAuth client secrets, database passwords and session-signing keys must never be committed to Git.

## 6. Access control

Access must follow least privilege. Where multi-user functionality is enabled, authorization should be enforced server-side rather than relying on client-side UI restrictions.

Recommended roles:

- **Reviewer:** create and edit own assessments.
- **Adjudicator/lead reviewer:** review discrepancies and record consensus.
- **Project administrator:** manage project membership and configuration.
- **System administrator:** infrastructure operations only.

Access to audit records should be restricted to authorized project roles.

## 7. Retention and deletion

Retention periods must be defined by the actual research project, institutional policy and applicable legal requirements. The application should support controlled deletion or de-identification where required.

The software must not claim that a generic retention period is legally sufficient for every research project.

## 8. Sharing and publication

The default publication target is the least sensitive reusable research object. Examples include:

- instrument/version metadata;
- synthetic validation datasets;
- software source code;
- test specifications;
- aggregated or de-identified appraisal results where legally and ethically appropriate.

Raw personal data must not be published merely because a project aims to be FAIR. FAIR principles explicitly allow controlled access for sensitive data (Wilkinson et al., 2016).

## 9. Reproducibility

A published or archived assessment should, where possible, identify:

- the appraisal instrument version;
- the source methodology;
- application release/commit;
- input dataset or article identifier;
- calculation rules;
- output result;
- validation status.

This is particularly important because different appraisal instruments use fundamentally different interpretation rules. For example, AMSTAR 2 explicitly states that its item responses should **not** be converted into an overall numerical score; its overall confidence judgment is based on weaknesses in critical and non-critical domains (Shea et al., 2017).

## 10. Data quality

Validation must address:

- schema validity;
- missing and impossible values;
- instrument/version compatibility;
- deterministic calculations;
- immutable assessment snapshots;
- provenance completeness;
- consistency between UI and server calculations;
- regression tests after methodology changes.

Software tests demonstrate implementation behavior. They do not independently validate the scientific instrument itself.

## 11. AI-assisted processing

If AI is used, the application must preserve a distinction between machine-generated candidate information and a researcher's final judgment. AI output must not silently become an appraisal answer.

The system should record when an AI candidate was generated, what source material was available to the model where technically feasible, and whether a human reviewer accepted, rejected or edited it.

## 12. Security controls

The production baseline should include:

- TLS in transit;
- encrypted storage where supported by the hosting environment;
- secure, HttpOnly and SameSite session cookies;
- CSRF protection where cookie-based state-changing requests are used;
- input validation and output encoding;
- rate limiting on authentication endpoints;
- dependency and vulnerability scanning;
- secret scanning/push protection;
- CodeQL or equivalent static security analysis;
- audit logging without sensitive payload leakage;
- tested backup and restore procedures;
- documented incident-response procedures.

## 13. FAIR implementation

| FAIR objective | Evidence Tool implementation |
|---|---|
| Findable | Stable project/study identifiers and descriptive metadata |
| Accessible | Controlled access using authentication/authorization where needed |
| Interoperable | Structured JSON/CSV export and explicit methodology identifiers |
| Reusable | Provenance, versions, documented schemas and licenses |

FAIR is treated as a design objective, not as a justification for unrestricted publication.

## 14. Responsibilities

The project owner/research team is responsible for determining the lawful and ethical basis for actual research-data processing. Software developers are responsible for implementing documented technical controls and making limitations explicit.

The application itself must not present a generic configuration as legal or ethical approval.

## References

Sikt. (n.d.). *Datahåndteringsplan*. https://sikt.no/studere-eller-forske/datahandteringsplan

Shea, B. J., Reeves, B. C., Wells, G., Thuku, M., Hamel, C., Moran, J., Moher, D., Tugwell, P., & Henry, D. A. (2017). AMSTAR 2: A critical appraisal tool for systematic reviews that include randomised or non-randomised studies of healthcare interventions, or both. *BMJ, 358*, j4008. https://doi.org/10.1136/bmj.j4008

Wilkinson, M. D., Dumontier, M., Aalbersberg, I. J., Appleton, G., Axton, M., Baak, A., Blomberg, N., Boiten, J.-W., da Silva Santos, L. B., Bourne, P. E., Bouwman, J., Brookes, A. J., Clark, T., Crosas, M., Dillo, I., Dumon, O., Edmunds, S., Evelo, C. T., Finkers, R., ... Mons, B. (2016). The FAIR Guiding Principles for scientific data management and stewardship. *Scientific Data, 3*, 160018. https://doi.org/10.1038/sdata.2016.18
