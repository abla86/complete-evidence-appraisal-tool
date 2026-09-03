/**
 * Google Docs & Drive Integration Service
 * Utilizes Google Identity Services (GSI) OAuth 2.0 client-side token flow
 * and Google Docs v1 + Google Drive v3 REST APIs.
 */

import { CitationStyle, ReferenceItem, StudyRecord } from '../types';
import { formatReferenceInStyle } from './referenceEngine';

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (response: { access_token?: string; error?: string; expires_in?: number }) => void;
            error_callback?: (error: any) => void;
          }) => {
            requestAccessToken: (overrideConfig?: { prompt?: string }) => void;
          };
          revoke?: (token: string, done?: () => void) => void;
        };
      };
    };
  }
}

export interface GoogleDocFile {
  id: string;
  name: string;
  modifiedTime?: string;
  webViewLink?: string;
  owners?: { displayName?: string; emailAddress?: string }[];
}

export interface GoogleAuthStatus {
  isConnected: boolean;
  accessToken: string | null;
  expiresAt: number | null;
  userEmail: string | null;
  clientIdConfigured: boolean;
}

const STORAGE_KEY_TOKEN = 'applet_gdocs_access_token';
const STORAGE_KEY_EXPIRY = 'applet_gdocs_token_expiry';
const STORAGE_KEY_EMAIL = 'applet_gdocs_user_email';

export const GOOGLE_SCOPES = [
  'https://www.googleapis.com/auth/documents',
  'https://www.googleapis.com/auth/documents.readonly',
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/drive.readonly'
].join(' ');

let tokenClientInstance: any = null;

export function getGoogleClientId(): string {
  // Read from Vite environment variable
  const envId = (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID;
  if (envId && typeof envId === 'string' && envId.trim().length > 0) {
    return envId.trim();
  }
  // Check localStorage for manually configured or session client ID
  const saved = localStorage.getItem('applet_gdocs_custom_client_id');
  if (saved && saved.trim().length > 0) {
    return saved.trim();
  }
  return '';
}

export function setCustomGoogleClientId(clientId: string): void {
  if (clientId.trim()) {
    localStorage.setItem('applet_gdocs_custom_client_id', clientId.trim());
  } else {
    localStorage.removeItem('applet_gdocs_custom_client_id');
  }
  tokenClientInstance = null;
}

export function getGoogleAuthStatus(): GoogleAuthStatus {
  const token = sessionStorage.getItem(STORAGE_KEY_TOKEN) || localStorage.getItem(STORAGE_KEY_TOKEN);
  const expiry = parseInt(sessionStorage.getItem(STORAGE_KEY_EXPIRY) || localStorage.getItem(STORAGE_KEY_EXPIRY) || '0', 10);
  const email = sessionStorage.getItem(STORAGE_KEY_EMAIL) || localStorage.getItem(STORAGE_KEY_EMAIL);
  const clientId = getGoogleClientId();

  const isConnected = !!token && expiry > Date.now();

  return {
    isConnected,
    accessToken: isConnected ? token : null,
    expiresAt: isConnected ? expiry : null,
    userEmail: email,
    clientIdConfigured: !!clientId
  };
}

export function clearGoogleAuth(): void {
  sessionStorage.removeItem(STORAGE_KEY_TOKEN);
  sessionStorage.removeItem(STORAGE_KEY_EXPIRY);
  sessionStorage.removeItem(STORAGE_KEY_EMAIL);
  localStorage.removeItem(STORAGE_KEY_TOKEN);
  localStorage.removeItem(STORAGE_KEY_EXPIRY);
  localStorage.removeItem(STORAGE_KEY_EMAIL);
}

/**
 * Initiates GSI client-side OAuth flow and returns the access token.
 */
export async function authenticateWithGoogleDocs(): Promise<string> {
  const clientId = getGoogleClientId();
  if (!clientId) {
    throw new Error('Mangler VITE_GOOGLE_CLIENT_ID. Vennligst angi Google OAuth Client ID i innstillingene.');
  }

  if (typeof window === 'undefined') {
    throw new Error('Google Identity Services er kun tilgjengelig i nettleseren.');
  }

  if (!window.google?.accounts?.oauth2) {
    throw new Error('Google Identity Services-skriptet er ikke ferdig lastet. Vent et øyeblikk og prøv igjen.');
  }

  return new Promise((resolve, reject) => {
    try {
      tokenClientInstance = window.google!.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: GOOGLE_SCOPES,
        callback: (response) => {
          if (response.error) {
            reject(new Error(`Google OAuth feilet: ${response.error}`));
            return;
          }
          if (response.access_token) {
            const expiresIn = response.expires_in || 3600;
            const expiresAt = Date.now() + (expiresIn - 60) * 1000;
            sessionStorage.setItem(STORAGE_KEY_TOKEN, response.access_token);
            sessionStorage.setItem(STORAGE_KEY_EXPIRY, expiresAt.toString());
            localStorage.setItem(STORAGE_KEY_TOKEN, response.access_token);
            localStorage.setItem(STORAGE_KEY_EXPIRY, expiresAt.toString());

            // Try to fetch user profile info with token
            fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
              headers: { Authorization: `Bearer ${response.access_token}` }
            })
              .then(res => res.json())
              .then(info => {
                if (info.email) {
                  sessionStorage.setItem(STORAGE_KEY_EMAIL, info.email);
                  localStorage.setItem(STORAGE_KEY_EMAIL, info.email);
                }
              })
              .catch(() => {
                // Non-fatal
              });

            resolve(response.access_token);
          } else {
            reject(new Error('Ingen tilgangstoken mottatt fra Google.'));
          }
        },
        error_callback: (err) => {
          reject(new Error(err?.message || 'Google OAuth autorisasjonsfeil'));
        }
      });

      tokenClientInstance.requestAccessToken({ prompt: 'consent' });
    } catch (err: any) {
      reject(new Error(err?.message || 'Kunne ikke initiere Google OAuth-klient.'));
    }
  });
}

/**
 * Ensures a valid access token is present or prompts user to log in.
 */
export async function getValidAccessToken(): Promise<string> {
  const status = getGoogleAuthStatus();
  if (status.isConnected && status.accessToken) {
    return status.accessToken;
  }
  return authenticateWithGoogleDocs();
}

/**
 * Creates a new blank Google Document and populates it with content.
 */
export async function createGoogleDocument(
  title: string,
  content: string,
  existingToken?: string
): Promise<{ documentId: string; title: string; url: string }> {
  const token = existingToken || await getValidAccessToken();

  // 1. Create document
  const createRes = await fetch('https://docs.googleapis.com/v1/documents', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ title })
  });

  if (!createRes.ok) {
    const errorData = await createRes.json().catch(() => ({}));
    throw new Error(`Kunne ikke opprette Google-dokument (${createRes.status}): ${errorData?.error?.message || createRes.statusText}`);
  }

  const docData = await createRes.json();
  const documentId = docData.documentId;
  const docUrl = `https://docs.googleapis.com/document/d/${documentId}/edit`;

  // 2. Insert text content
  if (content && content.trim().length > 0) {
    const updateRes = await fetch(`https://docs.googleapis.com/v1/documents/${documentId}:batchUpdate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
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

    if (!updateRes.ok) {
      console.warn('Kunne ikke skrive all tekst til Google Doc, men dokumentet ble opprettet:', await updateRes.text().catch(() => ''));
    }
  }

  return {
    documentId,
    title: docData.title || title,
    url: docUrl
  };
}

/**
 * Lists user's Google Docs from Google Drive.
 */
export async function listUserGoogleDocs(
  searchQuery?: string,
  existingToken?: string
): Promise<GoogleDocFile[]> {
  const token = existingToken || await getValidAccessToken();

  let q = "mimeType='application/vnd.google-apps.document' and trashed=false";
  if (searchQuery && searchQuery.trim().length > 0) {
    const cleanSearch = searchQuery.replace(/'/g, "\\'");
    q += ` and name contains '${cleanSearch}'`;
  }

  const url = new URL('https://www.googleapis.com/drive/v3/files');
  url.searchParams.set('q', q);
  url.searchParams.set('pageSize', '25');
  url.searchParams.set('orderBy', 'modifiedTime desc');
  url.searchParams.set('fields', 'files(id, name, modifiedTime, webViewLink, owners)');

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(`Kunne ikke hente Google Docs (${res.status}): ${errorData?.error?.message || res.statusText}`);
  }

  const data = await res.json();
  return (data.files || []).map((f: any) => ({
    id: f.id,
    name: f.name,
    modifiedTime: f.modifiedTime,
    webViewLink: f.webViewLink || `https://docs.googleapis.com/document/d/${f.id}/edit`,
    owners: f.owners
  }));
}

/**
 * Reads a Google Doc and extracts plain text structure.
 */
export async function fetchGoogleDocText(
  documentId: string,
  existingToken?: string
): Promise<{ title: string; text: string }> {
  const token = existingToken || await getValidAccessToken();

  const res = await fetch(`https://docs.googleapis.com/v1/documents/${documentId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(`Kunne ikke lese Google-dokument (${res.status}): ${errorData?.error?.message || res.statusText}`);
  }

  const data = await res.json();
  const title = data.title || 'Uten tittel';

  let fullText = '';
  const body = data.body?.content || [];

  for (const element of body) {
    if (element.paragraph?.elements) {
      for (const pElem of element.paragraph.elements) {
        if (pElem.textRun?.content) {
          fullText += pElem.textRun.content;
        }
      }
    } else if (element.table?.tableRows) {
      for (const row of element.table.tableRows) {
        const cellsText: string[] = [];
        for (const cell of row.tableCells || []) {
          let cellText = '';
          for (const cElem of cell.content || []) {
            if (cElem.paragraph?.elements) {
              for (const pe of cElem.paragraph.elements) {
                if (pe.textRun?.content) cellText += pe.textRun.content.trim();
              }
            }
          }
          cellsText.push(cellText);
        }
        fullText += cellsText.join(' | ') + '\n';
      }
    }
  }

  return { title, text: fullText.trim() };
}

/**
 * Formats and exports a full academic thesis manuscript to Google Docs.
 */
export async function exportThesisManuscriptToGoogleDocs(
  projectTitle: string,
  sections: { title: string; content: string }[],
  references: ReferenceItem[],
  style: CitationStyle = 'APA7'
): Promise<{ documentId: string; url: string }> {
  const timestamp = new Date().toLocaleDateString('no-NO', { year: 'numeric', month: 'long', day: 'numeric' });
  
  let formattedBody = `${projectTitle}\nAkademisk Utkast & Systematisk Oversikt\nGenerert: ${timestamp}\n\n`;
  formattedBody += '========================================================================\n\n';

  for (const sec of sections) {
    formattedBody += `\n\n## ${sec.title}\n\n`;
    formattedBody += sec.content + '\n';
  }

  if (references.length > 0) {
    formattedBody += '\n\n## Referanseliste\n\n';
    const refStrings = references.map(r => formatReferenceInStyle(r, style));
    formattedBody += refStrings.join('\n\n');
  }

  const docTitle = `${projectTitle} - Utkast (${new Date().toISOString().slice(0, 10)})`;
  const result = await createGoogleDocument(docTitle, formattedBody);
  return { documentId: result.documentId, url: result.url };
}

/**
 * Exports reference list / bibliography to Google Docs in chosen citation style.
 */
export async function exportBibliographyToGoogleDocs(
  references: ReferenceItem[],
  style: CitationStyle = 'APA7',
  collectionName: string = 'Referanser'
): Promise<{ documentId: string; url: string }> {
  const formattedRefs = references.map(r => formatReferenceInStyle(r, style)).join('\n\n');
  const title = `Litteraturliste (${style}) - ${collectionName}`;
  const content = `${title}\nTotalt: ${references.length} referanser\nGenerert: ${new Date().toLocaleDateString('no-NO')}\n\n` +
    '------------------------------------------------------------------------\n\n' +
    formattedRefs;

  const res = await createGoogleDocument(title, content);
  return { documentId: res.documentId, url: res.url };
}

/**
 * Exports single study critical appraisal report to Google Docs.
 */
export async function exportAppraisalReportToGoogleDocs(
  study: StudyRecord,
  assessmentText: string
): Promise<{ documentId: string; url: string }> {
  const title = `Kritisk Vurdering (JBI) - ${study.title.slice(0, 45)}`;
  const content = `KRITISK METODISK VURDERINGSRAPPORT\n` +
    `Studie: ${study.title}\n` +
    `Forfatter(e): ${study.authors || 'Ikke oppgitt'}\n` +
    `År: ${study.year || 'u.å.'}\n` +
    `SHA-256 Integritetshash: ${study.documentHashSha256 || 'Ikke beregnet'}\n` +
    `Rapport generert: ${new Date().toISOString()}\n\n` +
    `========================================================================\n\n` +
    assessmentText;

  const res = await createGoogleDocument(title, content);
  return { documentId: res.documentId, url: res.url };
}
