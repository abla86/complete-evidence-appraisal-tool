# Sharing and real-world use

## Goal

The Evidence Appraisal Tool is a private flagship application. The source repository remains private while the application can be made available to the researcher through a controlled deployment.

## Recommended use

1. Keep the GitHub repository private.
2. Deploy a protected application from the repository.
3. Use Google OAuth for authenticated access.
4. Keep all credentials in deployment secrets; never commit them.
5. Use the application's import/export functions to move appraisal sessions and evidence records when appropriate.
6. Create a release/tag before using a version for a formal assignment so the exact software version is traceable.

## Local use

`npm ci`

`npm run lint`

`npm test`

`npm run build`

`npm start`

The development server is started with `npm run dev`.

## Assignment-ready workflow

Create a project/session → register the source → identify study design → select the appropriate appraisal instrument → complete item-level evidence locations and rationale → review/dual-review where required → inspect the audit trail → export the resulting record.

## Sharing

For a temporary or controlled deployment, use a deployment provider connected to the private repository and configure `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and `AUTH_SESSION_SECRET` as deployment secrets. The production OAuth callback must exactly match the deployed application URL.

Do not publish the repository merely to make the application accessible.

## Release checklist

- CI is green.
- `npm run lint` passes.
- `npm test` passes.
- `npm run build` passes.
- OAuth callback is configured for the exact deployment URL.
- No secrets are present in repository history or deployment artifacts.
- The release/version is recorded in the assignment's methods/materials where relevant.
- Exported appraisal data contains evidence locations and reviewer rationale required by the selected methodology.

## Methodological boundary

Software validation demonstrates that the implementation behaves as specified. It does not certify the methodological quality of a study. Human appraisal and authoritative instrument guidance remain necessary.
