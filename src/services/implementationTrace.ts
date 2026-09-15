export type TraceStatus = 'Verified' | 'Partial' | 'Gap' | 'Unknown' | 'Hypothesis';

export interface TraceItem {
  requirement: string;
  observation: string;
  evidence: string;
  status: TraceStatus;
  hypothesis: string;
  action: string;
}

export interface ActivityEvent {
  timestamp: string;
  activity: string;
  performedBy: string;
}

export interface StructuralComparison {
  missing: string[];
  unexpected: string[];
  orderViolations: string[];
  duplicateExpected: string[];
  presenceRate: number;
  sequenceOk: boolean;
  structurallyPass: boolean;
}

export interface TraceCaseResult extends StructuralComparison {
  caseId: string;
  actual: string[];
}

export function parseCsv(text: string): Record<string, ActivityEvent[]> {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (char === '"') {
      if (quoted && text[i + 1] === '"') { cell += '"'; i += 1; }
      else quoted = !quoted;
    } else if (char === ',' && !quoted) {
      row.push(cell.trim()); cell = '';
    } else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && text[i + 1] === '\n') i += 1;
      row.push(cell.trim()); cell = '';
      if (row.some(Boolean)) rows.push(row);
      row = [];
    } else cell += char;
  }

  if (cell || row.length) {
    row.push(cell.trim());
    if (row.some(Boolean)) rows.push(row);
  }

  if (rows.length < 2) throw new Error('CSV must contain a header and at least one data row.');
  const header = rows[0].map((value) => value.replace(/^\uFEFF/, '').trim().toLowerCase());
  const required = ['caseid', 'timestamp', 'activity', 'performedby'];
  const indexes = required.map((name) => header.indexOf(name));
  if (indexes.some((index) => index < 0)) {
    throw new Error('CSV header must contain: CaseId, Timestamp, Activity, PerformedBy.');
  }

  const cases: Record<string, ActivityEvent[]> = {};
  rows.slice(1).forEach((values, rowIndex) => {
    const [caseIndex, timeIndex, activityIndex, personIndex] = indexes;
    const caseId = (values[caseIndex] || '').trim();
    const timestamp = (values[timeIndex] || '').trim();
    const activity = (values[activityIndex] || '').trim();
    const performedBy = (values[personIndex] || '').trim();
    if (!caseId && !timestamp && !activity && !performedBy) return;
    if (!caseId || !timestamp || !activity) {
      throw new Error(`CSV row ${rowIndex + 2} is missing CaseId, Timestamp or Activity.`);
    }
    if (Number.isNaN(Date.parse(timestamp))) {
      throw new Error(`CSV row ${rowIndex + 2} has an invalid timestamp: ${timestamp}`);
    }
    (cases[caseId] ||= []).push({ timestamp, activity, performedBy });
  });
  return cases;
}

export function compareSequence(expected: string[], actual: string[]): StructuralComparison {
  const expectedIndex = new Map(expected.map((activity, index) => [activity, index]));
  const missing = expected.filter((activity) => !actual.includes(activity));
  const unexpected = [...new Set(actual.filter((activity) => !expectedIndex.has(activity)))];
  const observedExpected = actual.filter((activity) => expectedIndex.has(activity));
  const orderViolations: string[] = [];
  for (let i = 1; i < observedExpected.length; i += 1) {
    const previous = expectedIndex.get(observedExpected[i - 1])!;
    const current = expectedIndex.get(observedExpected[i])!;
    if (current < previous) orderViolations.push(`${observedExpected[i - 1]} → ${observedExpected[i]}`);
  }
  const duplicateExpected = [...new Set(expected.filter((activity) => actual.filter((item) => item === activity).length > 1))];
  const matched = expected.filter((activity) => actual.includes(activity)).length;
  const presenceRate = expected.length ? (matched / expected.length) * 100 : 0;
  const sequenceOk = orderViolations.length === 0;
  const structurallyPass = missing.length === 0 && unexpected.length === 0 && orderViolations.length === 0 && duplicateExpected.length === 0;
  return { missing, unexpected, orderViolations, duplicateExpected, presenceRate, sequenceOk, structurallyPass };
}

export function analyseTraceCases(expected: string[], cases: Record<string, ActivityEvent[]>): TraceCaseResult[] {
  return Object.entries(cases).map(([caseId, events]) => {
    const sorted = [...events].sort((a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp));
    return { caseId, actual: sorted.map((event) => event.activity), ...compareSequence(expected, sorted.map((event) => event.activity)) };
  });
}
