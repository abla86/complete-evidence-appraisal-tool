const API_BASE_URL = import.meta.env.VITE_API_URL ?? (import.meta.env.PROD ? '' : 'http://localhost:5237');

async function readJson(response, fallback = {}) {
  const body = await response.json().catch(() => fallback);
  if (!response.ok) {
    const details = Array.isArray(body.details) ? ` ${body.details.join(' ')}` : '';
    throw new Error((body.error || `Request failed with status ${response.status}.`) + details);
  }
  return body;
}

export async function analyzeEvidenceDocument(file, instruments, includePageText = false) {
  const form = new FormData();
  form.append('file', file);
  form.append('instruments', instruments.join(','));
  form.append('includePageText', String(includePageText));

  return readJson(await fetch(`${API_BASE_URL}/api/evidence/analyze`, { method: 'POST', body: form }));
}

export async function getManualEvidence(documentHash) {
  return readJson(await fetch(`${API_BASE_URL}/api/evidence/manual/${encodeURIComponent(documentHash)}`), []);
}

export async function addManualEvidence(payload) {
  return readJson(await fetch(`${API_BASE_URL}/api/evidence/manual`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }));
}

export async function verifyEvidence(id, status, reviewer, verificationNote = '') {
  return readJson(await fetch(`${API_BASE_URL}/api/evidence/manual/${id}/verification`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status, reviewer, verificationNote }),
  }));
}

export async function getEvidenceSummary(documentHash) {
  return readJson(await fetch(`${API_BASE_URL}/api/evidence/manual/${encodeURIComponent(documentHash)}/summary`));
}

// Backwards-compatible name for existing callers.
export const analyzePdfEvidence = analyzeEvidenceDocument;
