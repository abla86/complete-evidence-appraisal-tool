# Evidence Practice Proof

A browser-based MVP for comparing an expected activity pathway with observed event records.

## What it does

1. Defines an expected activity sequence.
2. Accepts pasted CSV or a local CSV file.
3. Groups observations by case.
4. Sorts events by timestamp.
5. Detects missing expected activities.
6. Detects unexpected activities.
7. Detects order violations.
8. Detects duplicate expected activities.
9. Calculates activity presence per case and a transparent structural-compliance signal.

## CSV format

```csv
CaseId,Timestamp,Activity,PerformedBy
C001,2026-08-28 08:00:00,Assessment,NurseA
C001,2026-08-28 08:30:00,Intervention,NurseA
C001,2026-08-28 09:00:00,FollowUp,NurseA
```

The parser supports quoted CSV fields containing commas.

## Structural-compliance rule

A case is marked **structurally compliant** only when:

- every expected activity is observed;
- each expected activity occurs once;
- no unexpected activity is present; and
- expected activities occur in the defined order.

This is deliberately narrower than a generic "compliance %" claim.

## Synthetic test cases

The built-in dataset includes:

- C001: complete expected sequence.
- C002: missing activity.
- C003: missing activity.
- C004: incorrect order.
- C005: duplicate activity.
- C006: unexpected activity.

## Interpretation boundary

The output is a record-level structural signal. It does **not** establish:

- causality;
- clinical quality;
- effectiveness;
- patient outcome;
- misconduct;
- regulatory compliance; or
- that an observed gap has a particular cause.

Synthetic data is used for development.

## Run locally

Open `index.html` in a modern browser.

No backend or external service is required for this MVP.
