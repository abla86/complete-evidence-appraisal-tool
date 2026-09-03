import { 
  AppraisalAssessment, 
  CitationStyle, 
  DataExtractionRecord, 
  PrismaFlowData, 
  ReferenceItem, 
  ResearchProject, 
  StudyRecord 
} from '../types';
import { formatReferenceInStyle } from './referenceEngine';

export interface GoogleUserInfo {
  sub: string;
  name: string;
  email: string;
  picture?: string;
}

export interface GoogleWorkspaceTokenState {
  accessToken: string | null;
  expiresAt: number | null; // timestamp ms
  userInfo: GoogleUserInfo | null;
  scopes: string[];
}

export interface GoogleExportResult {
  id: string;
  title: string;
  url: string;
  type: 'document' | 'spreadsheet';
  createdAt: string;
  description: string;
}

export const GOOGLE_WORKSPACE_SCOPES = [
  'https://www.googleapis.com/auth/documents',
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/drive.readonly'
];

const STORAGE_KEY_TOKEN = 'evidence_appraisal_google_token';
const STORAGE_KEY_EXPIRES = 'evidence_appraisal_google_expires';
const STORAGE_KEY_USER = 'evidence_appraisal_google_user';
const STORAGE_KEY_CLIENT_ID = 'evidence_appraisal_google_client_id';

/**
 * Get resolved Google OAuth Client ID
 */
export function getGoogleClientId(): string {
  const customId = localStorage.getItem(STORAGE_KEY_CLIENT_ID);
  if (customId && customId.trim()) return customId.trim();
  const envId = (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID;
  if (envId && typeof envId === 'string' && envId.trim()) return envId.trim();
  // Safe default or placeholder
  return '';
}

export function setCustomGoogleClientId(clientId: string): void {
  if (clientId && clientId.trim()) {
    localStorage.setItem(STORAGE_KEY_CLIENT_ID, clientId.trim());
  } else {
    localStorage.removeItem(STORAGE_KEY_CLIENT_ID);
  }
}

/**
 * Get stored token state from session/local storage
 */
export function getStoredGoogleTokenState(): GoogleWorkspaceTokenState {
  try {
    const token = sessionStorage.getItem(STORAGE_KEY_TOKEN) || localStorage.getItem(STORAGE_KEY_TOKEN);
    const expiresStr = sessionStorage.getItem(STORAGE_KEY_EXPIRES) || localStorage.getItem(STORAGE_KEY_EXPIRES);
    const userStr = sessionStorage.getItem(STORAGE_KEY_USER) || localStorage.getItem(STORAGE_KEY_USER);

    const expiresAt = expiresStr ? parseInt(expiresStr, 10) : null;
    const isExpired = expiresAt ? Date.now() > expiresAt : false;

    if (!token || isExpired) {
      return {
        accessToken: null,
        expiresAt: null,
        userInfo: null,
        scopes: GOOGLE_WORKSPACE_SCOPES
      };
    }

    const userInfo: GoogleUserInfo | null = userStr ? JSON.parse(userStr) : null;
    return {
      accessToken: token,
      expiresAt,
      userInfo,
      scopes: GOOGLE_WORKSPACE_SCOPES
    };
  } catch (e) {
    return {
      accessToken: null,
      expiresAt: null,
      userInfo: null,
      scopes: GOOGLE_WORKSPACE_SCOPES
    };
  }
}

/**
 * Save Google token state
 */
export function saveGoogleTokenState(token: string, expiresInSeconds: number, userInfo?: GoogleUserInfo | null): void {
  const expiresAt = Date.now() + expiresInSeconds * 1000;
  sessionStorage.setItem(STORAGE_KEY_TOKEN, token);
  sessionStorage.setItem(STORAGE_KEY_EXPIRES, expiresAt.toString());
  localStorage.setItem(STORAGE_KEY_TOKEN, token);
  localStorage.setItem(STORAGE_KEY_EXPIRES, expiresAt.toString());

  if (userInfo) {
    sessionStorage.setItem(STORAGE_KEY_USER, JSON.stringify(userInfo));
    localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(userInfo));
  }
}

/**
 * Clear stored Google token
 */
export function clearGoogleTokenState(): void {
  sessionStorage.removeItem(STORAGE_KEY_TOKEN);
  sessionStorage.removeItem(STORAGE_KEY_EXPIRES);
  sessionStorage.removeItem(STORAGE_KEY_USER);
  localStorage.removeItem(STORAGE_KEY_TOKEN);
  localStorage.removeItem(STORAGE_KEY_EXPIRES);
  localStorage.removeItem(STORAGE_KEY_USER);
}

/**
 * Fetch Google User Info using the Access Token
 */
export async function fetchGoogleUserInfo(accessToken: string): Promise<GoogleUserInfo | null> {
  try {
    const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    if (!res.ok) return null;
    const data = await res.json();
    return {
      sub: data.sub,
      name: data.name || data.email,
      email: data.email,
      picture: data.picture
    };
  } catch (err) {
    console.warn('Could not fetch user info from Google:', err);
    return null;
  }
}

/**
 * Initiate GSI client-side token flow
 */
export function requestGoogleWorkspaceToken(clientId: string): Promise<{ accessToken: string; expiresIn: number }> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      return reject(new Error('Window not available'));
    }

    const google = (window as any).google;
    if (!google || !google.accounts || !google.accounts.oauth2) {
      return reject(new Error('Google Identity Services (GSI) script er ikke lastet. Sjekk nettverkstilkoblingen.'));
    }

    if (!clientId) {
      return reject(new Error('Mangler Google OAuth Client ID. Vennligst oppgi en gyldig Client ID i konfigurasjonen.'));
    }

    try {
      const client = google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: GOOGLE_WORKSPACE_SCOPES.join(' '),
        callback: (tokenResponse: any) => {
          if (tokenResponse.error) {
            reject(new Error(tokenResponse.error_description || tokenResponse.error));
            return;
          }
          const accessToken = tokenResponse.access_token;
          const expiresIn = parseInt(tokenResponse.expires_in || '3600', 10);
          resolve({ accessToken, expiresIn });
        }
      });

      client.requestAccessToken({ prompt: 'consent' });
    } catch (err: any) {
      reject(err);
    }
  });
}

/* =========================================================================
   GOOGLE DOCS API FUNCTIONS
   ========================================================================= */

/**
 * Create a new Google Doc with the given title and text body
 */
export async function createGoogleDoc(
  accessToken: string, 
  title: string, 
  content: string
): Promise<GoogleExportResult> {
  // 1. Create document
  const createRes = await fetch('https://docs.googleapis.com/v1/documents', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ title })
  });

  if (!createRes.ok) {
    const errorData = await createRes.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Kunne ikke opprette Google Doc (${createRes.status})`);
  }

  const docData = await createRes.json();
  const documentId = docData.documentId;

  // 2. Insert content into the document if provided
  if (content && content.trim().length > 0) {
    const batchRes = await fetch(`https://docs.googleapis.com/v1/documents/${documentId}:batchUpdate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        requests: [
          {
            insertText: {
              location: { index: 1 },
              text: content
            }
          }
        ]
      })
    });

    if (!batchRes.ok) {
      console.warn('Doc created, but batchUpdate failed to insert text');
    }
  }

  const url = `https://docs.google.com/document/d/${documentId}/edit`;
  return {
    id: documentId,
    title: docData.title || title,
    url,
    type: 'document',
    createdAt: new Date().toISOString(),
    description: `Google Doc opprettet med ${content.length} tegn`
  };
}

/**
 * Export thesis / methodology chapter to Google Docs
 */
export async function exportThesisSectionToGoogleDoc(
  accessToken: string,
  project: ResearchProject,
  sectionTitle: string,
  bodyContent: string
): Promise<GoogleExportResult> {
  const docTitle = `${project.shortCode || 'PROJ'} - ${sectionTitle} (Evidensvurdering)`;
  const headerText = `${project.title}\nProsjektkode: ${project.shortCode || 'PROJ'} | Dato: ${new Date().toLocaleDateString('no-NO')}\nMetodisk rammeverk: JBI / Cochrane / PRISMA 2020\n\n========================================================\n\n`;
  const fullContent = headerText + bodyContent;
  return createGoogleDoc(accessToken, docTitle, fullContent);
}

/**
 * Export Reference Library formatted to Google Docs
 */
export async function exportReferenceLibraryToGoogleDoc(
  accessToken: string,
  project: ResearchProject,
  references: ReferenceItem[],
  style: CitationStyle = 'APA7'
): Promise<GoogleExportResult> {
  const docTitle = `${project.shortCode || 'PROJ'} - Referanseliste (${style})`;
  const header = `REFERANSELISTE (${style})\nProsjekt: ${project.title}\nAntall referanser: ${references.length}\nGenerert: ${new Date().toLocaleString('no-NO')}\n\n========================================================\n\n`;
  
  const entries = references.map((ref, idx) => {
    const formatted = formatReferenceInStyle(ref, style);
    return `[${idx + 1}] ${formatted}\n`;
  }).join('\n');

  return createGoogleDoc(accessToken, docTitle, header + entries);
}

/* =========================================================================
   GOOGLE SHEETS API FUNCTIONS
   ========================================================================= */

/**
 * Create a new Google Spreadsheet and populate cells
 */
export async function createGoogleSheet(
  accessToken: string,
  title: string,
  sheetTitle: string = 'Data',
  rows: (string | number | boolean)[][] = []
): Promise<GoogleExportResult> {
  // 1. Create spreadsheet
  const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      properties: { title },
      sheets: [
        {
          properties: {
            title: sheetTitle,
            gridProperties: {
              frozenRowCount: rows.length > 0 ? 1 : 0
            }
          }
        }
      ]
    })
  });

  if (!createRes.ok) {
    const errorData = await createRes.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Kunne ikke opprette Google Sheet (${createRes.status})`);
  }

  const sheetData = await createRes.json();
  const spreadsheetId = sheetData.spreadsheetId;

  // 2. Populate values if rows are provided
  if (rows && rows.length > 0) {
    const range = `${sheetTitle}!A1`;
    const valuesRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          range,
          majorDimension: 'ROWS',
          values: rows
        })
      }
    );

    if (!valuesRes.ok) {
      console.warn('Spreadsheet created, but values update failed');
    }
  }

  const url = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;
  return {
    id: spreadsheetId,
    title: sheetData.properties?.title || title,
    url,
    type: 'spreadsheet',
    createdAt: new Date().toISOString(),
    description: `Google Sheet opprettet med ${rows.length} rader`
  };
}

/**
 * Export Studies and JBI Appraisal Scores to Google Sheets
 */
export async function exportStudiesToGoogleSheet(
  accessToken: string,
  project: ResearchProject,
  studies: StudyRecord[],
  assessments: Record<string, AppraisalAssessment[]>
): Promise<GoogleExportResult> {
  const headers = [
    'Studie-ID',
    'Tittel',
    'Forfattere',
    'Årstall',
    'Tidsskrift / Kilde',
    'DOI',
    'Metodisk Instrument',
    'Vurderingsstatus',
    'Ja-svar',
    'Nei-svar',
    'Uklar-svar',
    'Ikke relevant',
    'Skår (%)',
    'Kvalitetsnivå',
    'Revisjons-SHA256',
    'Sist oppdatert'
  ];

  const rows: (string | number | boolean)[][] = [headers];

  for (const study of studies) {
    const studyAssessments = assessments[study.id] || [];
    const latest = studyAssessments[studyAssessments.length - 1];

    const ratings = latest?.ratings || {};
    const answerVals = Object.values(ratings).map(r => r.answer);
    const yesCount = answerVals.filter(v => v === 'yes' || v === 'ja').length;
    const noCount = answerVals.filter(v => v === 'no' || v === 'nei').length;
    const unclearCount = answerVals.filter(v => v === 'unclear').length;
    const naCount = answerVals.filter(v => v === 'not_applicable').length;
    const totalApplicable = answerVals.length - naCount;
    const scorePct = totalApplicable > 0 ? Math.round((yesCount / totalApplicable) * 100) : 0;

    let qualityTier = 'Ikke vurdert';
    if (latest) {
      if (scorePct >= 80) qualityTier = 'Høy metodisk kvalitet';
      else if (scorePct >= 60) qualityTier = 'Moderat kvalitet';
      else qualityTier = 'Lav / Høy risiko for skjevhet';
    }

    rows.push([
      study.id,
      study.title,
      study.authors || '',
      study.year || '',
      study.journal || '',
      study.doi || '',
      study.documentType || 'Kvalitativ studie',
      latest ? 'Fullført' : 'Avventer',
      yesCount,
      noCount,
      unclearCount,
      naCount,
      `${scorePct}%`,
      qualityTier,
      study.documentHashSha256 || 'Uverifisert',
      latest?.updatedAt || study.importedAt || new Date().toISOString()
    ]);
  }

  const title = `${project.shortCode || 'PROJ'} - JBI Evidens- & Vurderingsmatrise`;
  return createGoogleSheet(accessToken, title, 'Vurderingsmatrise', rows);
}

/**
 * Export PICO Data Extraction Matrix to Google Sheets
 */
export async function exportExtractionsToGoogleSheet(
  accessToken: string,
  project: ResearchProject,
  extractions: DataExtractionRecord[],
  studies: StudyRecord[]
): Promise<GoogleExportResult> {
  const headers = [
    'Studie-ID',
    'Studietittel',
    'Populasjon (P)',
    'Intervensjon / Eksponering (I)',
    'Komparator / Kontroll (C)',
    'Primære Utfall (O)',
    'Evidensreferanse / Sidetall',
    'Utvalgsstørrelse (N)',
    'Direkte sitat / Udrag',
    'Finansiering & COI',
    'Kvalitetsstatus',
    'Ekstrahert av',
    'Dato'
  ];

  const studyMap = new Map(studies.map(s => [s.id, s]));
  const rows: (string | number | boolean)[][] = [headers];

  for (const ext of extractions) {
    const study = studyMap.get(ext.studyId);
    rows.push([
      ext.studyId,
      study?.title || ext.studyTitle || ext.studyId,
      ext.populationCharacteristics || '',
      ext.interventionDetails || '',
      ext.comparatorDetails || '',
      ext.primaryOutcomeMeasure ? `${ext.primaryOutcomeMeasure}: ${ext.primaryOutcomeValue}` : '',
      ext.evidencePageRef || '',
      ext.sampleSize || '',
      ext.rawQuote || '',
      ext.fundingAndCoi || '',
      ext.verifiedByResearcher ? 'Verifisert' : 'Utkast',
      ext.extractedBy || 'Hovedgransker',
      ext.timestamp || new Date().toISOString()
    ]);
  }

  const title = `${project.shortCode || 'PROJ'} - Dataekstraksjonsmatrise (PICO)`;
  return createGoogleSheet(accessToken, title, 'Ekstraksjonsmatrise', rows);
}

/**
 * Export Reference Hub items to Google Sheets
 */
export async function exportReferencesToGoogleSheet(
  accessToken: string,
  project: ResearchProject,
  references: ReferenceItem[]
): Promise<GoogleExportResult> {
  const headers = [
    'Ref-ID',
    'Type',
    'Tittel',
    'Første Forfatter',
    'Alle Forfattere',
    'Årstall',
    'Tidsskrift / Publikasjon',
    'Volum',
    'Hefte',
    'Sider',
    'DOI',
    'PMID',
    'EndNote CWYW Token',
    'APA 7 Referanse',
    'Sammendrag',
    'Tagger'
  ];

  const rows: (string | number | boolean)[][] = [headers];

  for (const ref of references) {
    const firstAuthor = ref.authors?.[0]?.family || 'Ukjent';
    const allAuthors = (ref.authors || []).map(a => `${a.family}, ${a.given || ''}`).join('; ');
    const apa = formatReferenceInStyle(ref, 'APA7');

    rows.push([
      ref.id,
      ref.itemType || 'journalArticle',
      ref.title,
      firstAuthor,
      allAuthors,
      ref.year || '',
      ref.journal || '',
      ref.volume || '',
      ref.issue || '',
      ref.pages || '',
      ref.doi || '',
      ref.pmid || '',
      ref.cwywToken || `{${firstAuthor}, ${ref.year || '2024'} #${ref.id}}`,
      apa,
      ref.abstract || '',
      (ref.tags || []).join(', ')
    ]);
  }

  const title = `${project.shortCode || 'PROJ'} - Komplett Referansebibliotek`;
  return createGoogleSheet(accessToken, title, 'Referanser', rows);
}

/**
 * Export PRISMA 2020 Flow Numbers to Google Sheets
 */
export async function exportPrismaFlowToGoogleSheet(
  accessToken: string,
  project: ResearchProject,
  prisma: PrismaFlowData
): Promise<GoogleExportResult> {
  const headers = ['Fase / Kategori', 'Beskrivelse', 'Antall poster'];

  const rows: (string | number | boolean)[][] = [
    headers,
    ['1. IDENTIFIKASJON', 'Poster identifisert via databaser (PubMed, CINAHL, Embase, etc.)', prisma.recordsIdentifiedDatabases || 0],
    ['1. IDENTIFIKASJON', 'Poster identifisert via registre (ClinicalTrials.gov, etc.)', prisma.recordsIdentifiedRegisters || 0],
    ['1. IDENTIFIKASJON', 'Poster identifisert via andre kilder (grå litteratur, nettsider)', prisma.recordsIdentifiedOther || 0],
    ['2. DEDUPLIKERING', 'Duplikater fjernet før skjerming', prisma.duplicatesRemoved || 0],
    ['3. SKJERMING', 'Poster skjermet på tittel og sammendrag', prisma.recordsScreened || 0],
    ['3. SKJERMING', 'Poster ekskludert etter tittel/sammendrag', prisma.recordsExcludedScreening || 0],
    ['4. FULLTEKST', 'Fulltekstartikler søkt innhentet', prisma.reportsSoughtForRetrieval || 0],
    ['4. FULLTEKST', 'Fulltekstartikler ikke innhentet', prisma.reportsNotRetrieved || 0],
    ['4. FULLTEKST', 'Fulltekstartikler vurdert for inklusjon', prisma.reportsAssessedForEligibility || 0],
    ['4. EKSKLUSJON', 'Fulltekstartikler ekskludert ved grundig vurdering', prisma.reportsExcludedEligibility || 0],
    ...Object.entries(prisma.exclusionReasonsEligibility || {}).map(([reason, count]) => (
      ['4. EKSKLUSJONSÅRSAK', `Ekskludert: ${reason}`, count] as (string | number | boolean)[]
    )),
    ['5. INKLUDERT', 'Nye studier inkludert i kvalitativ syntese (JBI)', prisma.newStudiesIncluded || 0],
    ['5. INKLUDERT', 'Totalt antall inkluderte studier i syntesen', prisma.totalStudiesIncluded || 0]
  ];

  const title = `${project.shortCode || 'PROJ'} - PRISMA 2020 Flytskjema-tall`;
  return createGoogleSheet(accessToken, title, 'PRISMA_2020', rows);
}

/**
 * List recent documents and spreadsheets from Google Drive
 */
export async function listRecentGoogleFiles(
  accessToken: string
): Promise<{ id: string; name: string; mimeType: string; modifiedTime: string; webViewLink?: string }[]> {
  try {
    const q = "mimeType = 'application/vnd.google-apps.document' or mimeType = 'application/vnd.google-apps.spreadsheet'";
    const res = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&orderBy=modifiedTime desc&pageSize=12&fields=files(id,name,mimeType,modifiedTime,webViewLink)`,
      {
        headers: { Authorization: `Bearer ${accessToken}` }
      }
    );

    if (!res.ok) {
      console.warn('Could not list drive files:', res.status);
      return [];
    }

    const data = await res.json();
    return data.files || [];
  } catch (err) {
    console.warn('Error fetching recent Google files:', err);
    return [];
  }
}
