import { GoogleGenAI } from '@google/genai';
import { ResearchWorkspaceService } from './researchWorkspaceService';

let client: GoogleGenAI | null = null;
function getClient() {
  if (!client && process.env.GEMINI_API_KEY) client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  return client;
}

export class ResearchAiService {
  static async answer(question: string, documentIds: string[]) {
    const docs = documentIds.map(id => ResearchWorkspaceService.getDocument(id)).filter(Boolean) as any[];
    const context = docs.map(d => 'DOCUMENT: ' + d.fileName + '\n' + d.text.slice(0, 18000)).join('\n\n');
    const ai = getClient();
    if (!ai) return { mode: 'deterministic', answer: 'AI er ikke konfigurert.', evidence: [], uncertainties: ['AI engine unavailable'] };

    const prompt = 'Svar kun med opplysningene i kildeteksten. Ikke finn på referanser, sitater eller resultater. Skill dokumentert informasjon fra usikkerhet. Returner JSON med feltene answer, evidence og uncertainties. evidence skal inneholde documentId, location og quote.\nSpørsmål: ' + question + '\n\n' + context;
    const response = await ai.models.generateContent({
      model: process.env.GEMINI_MODEL || 'gemini-3.8-flash',
      contents: prompt,
      config: { responseMimeType: 'application/json' }
    });
    return { mode: 'gemini', ...(JSON.parse(response.text || '{"answer":"","evidence":[],"uncertainties":["No response"]}')) };
  }
}
