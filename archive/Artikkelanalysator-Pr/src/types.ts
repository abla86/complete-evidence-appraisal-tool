export type ArticleType = 
  | 'Kvalitativ forskningsartikkel'
  | 'Kvantitativ forskningsartikkel'
  | 'Systematisk oversikt / Scoping Review'
  | 'Kunnskapsbasert teori / Teoretisk artikkel'
  | 'Faglitteratur / Fagartikkel';

export interface EvidenceHighlight {
  id: string;
  questionId: string;
  category: 'Formål & Design' | 'Metode & Utvalg' | 'Dataanalyse & Funn' | 'Etikk & Konklusjon';
  quote: string;
  color: string; // Tailwind color class or hex (e.g. 'bg-emerald-100 border-emerald-400 text-emerald-900')
  startIndex?: number;
  endIndex?: number;
}

export interface ArticleData {
  id: string;
  title: string;
  authors: string;
  journal: string;
  year: number;
  doi?: string;
  abstract: string;
  fullText: string;
  defaultClassification: ArticleType;
  methodology: string;
  keyFindings: string[];
  highlights?: EvidenceHighlight[];
}

export interface ChecklistItem {
  id: string;
  question: string;
  category: 'Formål & Design' | 'Metode & Utvalg' | 'Dataanalyse & Funn' | 'Etikk & Konklusjon';
  answer: 'Ja' | 'Delvis' | 'Nei' | 'Ikke relevant';
  justification: string;
  evidenceQuote: string;
  highlightColor?: string;
}

export interface ArticleAnalysis {
  articleId: string;
  articleType: ArticleType;
  typeJustification: string;
  theoreticalFramework: string;
  methodologicalQualityScore: number; // 0-100
  summary: {
    background: string;
    objective: string;
    methods: string;
    results: string;
    conclusion: string;
  };
  checklists: ChecklistItem[];
  strengths: string[];
  limitations: string[];
  practicalImplications: string;
  highlights?: EvidenceHighlight[];
}

export interface ComparisonResult {
  comparisonTitle: string;
  aspects: {
    title: string;
    article1Text: string;
    article2Text: string;
    analysis: string;
  }[];
  conclusion: string;
}

