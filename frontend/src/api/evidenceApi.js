const API_BASE_URL = import.meta.env.VITE_API_URL ?? (import.meta.env.PROD ? '' : 'http://localhost:5237');

export async function analyzePdfEvidence(file, instruments, includePageText = false) {
  const form = new FormData();
  form.append('file', file);
  form.append('instruments', instruments.join(','));
  form.append('includePageText', String(includePageText));

  const response = await fetch(`${API_BASE_URL}/api/evidence/pdf/analyze`, {
    method: 'POST',
    body: form,
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(body.error || `PDF analysis failed with status ${response.status}.`);
  }
  return body;
}
