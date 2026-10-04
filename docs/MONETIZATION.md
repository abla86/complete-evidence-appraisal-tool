# Monetization plan

## Product
Evidence Appraisal Suite is positioned as research-support software for students, researchers and review teams.

The commercial proposition is deliberately narrower than the technical scope: structured critical appraisal, evidence traceability and review workflow support.

The product must not claim that software output certifies study quality or replaces professional/scientific judgement.

## Launch ladder

### Free
Purpose: acquisition and product validation.
- core workspace
- starter methodology resources
- local-first workflow
- basic export
- examples

### Individual Pro
Initial proposed price range: 799 NOK for a paid package, with the final price determined after user validation.
Potential features:
- extended methodology library
- advanced project workflows
- dual-review workflow
- audit/export functionality
- saved projects
- priority updates

### Team / Institution
Custom pricing after validation.
Potential features:
- team workspace
- reviewer coordination
- administrative controls
- onboarding
- institutional support

## Revenue validation
The first commercial milestone is 10 paying users, not a target such as 20,000 USD/month.

Before increasing scope, measure:
1. free-workspace users;
2. completed appraisals;
3. Pro requests;
4. free-to-paid conversion;
5. retention;
6. feature usage;
7. support burden;
8. refund/cancellation reasons.

## Payment
Do not hard-code a payment provider before a merchant account exists. The final provider must support the intended customer geography, VAT handling, receipts, refunds and the required purchase/subscription model.

Never place API keys or webhook secrets in the repository.

## Trust requirements before accepting payment
- privacy notice
- terms of service
- refund policy
- contact/support route
- clear product limitations
- data-retention description
- security contact
- dependency/security monitoring
- backup/recovery plan for server-side data
- clear distinction between research support and clinical decision support

## Current implementation
The repository already contains substantial appraisal, methodology, audit and research-workflow functionality. The immediate commercial work is product packaging and validation, not inventing another application.

The public product page is available at /sales.html when the built application is deployed.

## Next engineering gates
1. Verify production build.
2. Verify authentication and persistence boundaries.
3. Add a clearly bounded free/pro feature gate.
4. Add product analytics only with an appropriate privacy basis.
5. Connect a real payment provider.
6. Implement purchase-to-entitlement flow.
7. Add automated tests for entitlement boundaries.
8. Perform security and privacy review.
9. Run a small beta.
10. Only then expand pricing or institutional features.
