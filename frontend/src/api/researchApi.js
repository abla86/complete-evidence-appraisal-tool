const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

function parseResponse(text) {
  try { return text ? JSON.parse(text) : null; } catch { return { error: text }; }
}

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers: { 'Content-Type': 'application/json', ...(options.headers ?? {}) } });
  const data = parseResponse(await response.text());
  if (!response.ok) throw new Error(data?.error ?? data?.title ?? 'API request failed.');
  return data;
}

async function post(path, payload) { return request(path, { method: 'POST', body: JSON.stringify(payload) }); }
export async function getInstruments() { return request('/api/instruments'); }
export async function getCfirMetadata() { return request('/api/cfir2/metadata'); }
export async function getKtaMetadata() { return request('/api/kta/metadata'); }
export async function getProjectOverview() { return request('/api/project-overview'); }
export async function getProjectAudit(cfirId) { return request(`/api/project-overview/${cfirId}/audit`); }
export const validateCasp = (assessment) => post('/api/casp/validate', assessment);
export const validateJbiQualitative2017 = (assessment) => post('/api/jbi/qualitative-2017/validate', assessment);
export const calculateAgree2 = (assessment) => post('/api/agree2/calculate', assessment);
export const evaluateGrade = (assessment) => post('/api/grade/evaluate', assessment);
export const validateCfir = (assessment) => post('/api/cfir2/validate', assessment);
export const validateKta = (assessment) => post('/api/kta/validate', assessment);
export const validateImplementation = (assessment) => post('/api/implementation/validate', assessment);
export const saveImplementation = (assessment) => post('/api/implementation/save', assessment);

export async function downloadImplementationExport(format, assessment) {
  const response = await fetch(`${API_BASE_URL}/api/implementation/export/${format}/file`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(assessment) });
  if (!response.ok) throw new Error((await response.text()) || 'Export failed.');
  const blob = await response.blob();
  const disposition = response.headers.get('Content-Disposition') ?? '';
  const match = disposition.match(/filename="?([^";]+)"?/i);
  const filename = match?.[1] ?? `cfir-kta.${format}`;
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a'); anchor.href = url; anchor.download = filename;
  document.body.appendChild(anchor); anchor.click(); anchor.remove(); URL.revokeObjectURL(url);
}
