const API_BASE_URL = import.meta.env.VITE_API_URL ?? (import.meta.env.PROD ? '' : 'http://localhost:5237');

export async function analyzeEvidenceDocument(file, instruments, includePageText = false) {
  const form = new FormData();
  form.append('file', file);
  form.append('instruments', instruments.join(','));
  form.append('includePageText', String(includePageText));

  const response = await fetch(`${API_BASE_URL}/api/evidence/analyze`, {
    method: 'POST',
    body: form,
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || `Document analysis failed with status ${response.status}.`);
  return body;
}

export async function getManualEvidence(documentHash) {
  const response = await fetch(`${API_BASE_URL}/api/evidence/manual/${encodeURIComponent(documentHash)}`);
  const body = await response.json().catch(() => []);
  if (!response.ok) throw new Error(body.error || `Could not load manual evidence (${response.status}).`);
  return body;
}

export async function addManualEvidence(payload) {
  const response = await fetch(`${API_BASE_URL}/api/evidence/manual`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const details = Array.isArray(body.details) ? ` ${body.details.join(' ')}` : '';
    throw new Error((body.error || `Could not save evidence (${response.status}).`) + details);
  }
  return body;
}

// Backwards-compatible name for existing callers.
export const analyzePdfEvidence = analyzeEvidenceDocument;
