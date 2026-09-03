# CI Verification Status

## Current run

Workflow: `CI Manual Verification`
Run: `33707273776`
Commit: `1a60b34b47435a5f82f0d46bd9c2224150c80da7`

## Result

The workflow completed with `failure` on the `verify` job. The GitHub connector does not expose the decoded job log for this run, so the failing step cannot be identified reliably from the available API response.

The repository does contain `package-lock.json`, and the CI workflow uses `npm ci`.

## Required next verification

Run locally from the repository root:

```powershell
npm ci
npm run lint
npm test
npm run build
docker build -t evidence-app:test .
```

Then inspect the first failing command, if any. Do not mark the release green until the same commands pass in GitHub Actions.

## Protection requirements

The protected `main` branch currently reports requirements for pull-request-based changes, code coverage, code scanning, and verified commit signatures. A direct admin push bypassed those requirements for the lockfile commit, so that commit is not equivalent to a protected PR merge.
