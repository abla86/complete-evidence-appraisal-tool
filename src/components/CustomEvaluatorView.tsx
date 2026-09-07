import React, { useState } from 'react';
import { ArticleAppraisal, AssessmentStatus, JBIEvaluationItem } from '../types';
import { JBI_QUESTIONS } from '../data/jbiData';
import { StatusBadge } from './StatusBadge';
import { 
  CheckSquare, 
  Plus, 
  Save, 
  Sparkles, 
  Copy, 
  FileText, 
  BookOpen, 
  CheckCircle2, 
  AlertCircle,
  Trash2
} from 'lucide-react';
import { useToast } from './Toast';

interface CustomEvaluatorViewProps {
  onSaveNewArticle: (article: ArticleAppraisal) => void;
}

export const CustomEvaluatorView: React.FC<CustomEvaluatorViewProps> = ({ onSaveNewArticle }) => {
  const { showToast } = useToast();

  const [title, setTitle] = useState('');
  const [authors, setAuthors] = useState('');
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [journal, setJournal] = useState('');
  const [doi, setDoi] = useState('');
  const [design, setDesign] = useState('');
  const [dataCollection, setDataCollection] = useState('');
  const [participants, setParticipants] = useState('');
  const [analyticMethod, setAnalyticMethod] = useState('');
  const [studyContext, setStudyContext] = useState('');
  const [overallVerdict, setOverallVerdict] = useState<'Inkluder' | 'Ekskluder' | 'Vurder videre'>('Vurder videre');
  const [verdictNote, setVerdictNote] = useState('');
  const [keyStrength, setKeyStrength] = useState('');
  const [mainLimitation, setMainLimitation] = useState('');

  // 10 items state
  const [items, setItems] = useState<JBIEvaluationItem[]>(
    JBI_QUESTIONS.map(q => ({
      questionId: q.id,
      status: 'Uklart' as AssessmentStatus,
      justification: '',
      notes: ''
    }))
  );

  const updateItemStatus = (qId: number, status: AssessmentStatus) => {
    setItems(prev => prev.map(i => i.questionId === qId ? { ...i, status } : i));
  };

  const updateItemJustification = (qId: number, justification: string) => {
    setItems(prev => prev.map(i => i.questionId === qId ? { ...i, justification } : i));
  };

  // Live tally
  const jaCount = items.filter(i => i.status === 'Ja' || i.status === 'Ja, med forbehold').length;
  const uklartCount = items.filter(i => i.status === 'Uklart').length;
  const neiCount = items.filter(i => i.status === 'Nei').length;

  const shortCitation = authors ? `${authors.split(',')[0].trim()} et al.${year ? ` (${year})` : ''}` : 'Ny artikkel';

  // Auto generated thesis paragraph
  const generatedParagraph = `${shortCitation} oppnÃ¥dde ${jaCount} Ã‚Â«JaÃ‚Â»${uklartCount > 0 ? `, ${uklartCount} Ã‚Â«UklartÃ‚Â»` : ''}${neiCount > 0 ? ` og ${neiCount} Ã‚Â«NeiÃ‚Â»` : ''}. Studien benyttet ${design.toLowerCase()} og samlet data via ${dataCollection.toLowerCase()}. Analysen ble gjennomfÃ¸rt ved hjelp av ${analyticMethod.toLowerCase()}. Samlet vurderes studien til Ã¥ holde ${jaCount >= 8 ? 'god metodisk kvalitet' : 'akseptabel metodisk kvalitet'}, og ${overallVerdict === 'Inkluder' ? 'inkluderes i kunnskapsgrunnlaget' : 'vurderes videre fÃ¸r eventuell inklusjon'}.`;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !authors.trim()) {
      showToast('Vennligst fyll ut minst tittel og forfattere.', 'warning');
      return;
    }

    const newArticle: ArticleAppraisal = {
      id: `custom-${Date.now()}`,
      authors,
      shortCitation,
      year,
      title,
      journal,
      doi: doi || '',
      doiUrl: doi ? `https://doi.org/${doi}` : undefined,
      sourceUrl: doi ? `https://doi.org/${doi}` : '',
      sourceName: journal || 'Manuelt registrert',
      studyContext: studyContext || '',
      design,
      dataCollection,
      participants,
      analyticMethod,
      summaryScore: {
        ja: jaCount,
        uklart: uklartCount,
        nei: neiCount,
        ikkeRelevant: 0,
        total: 10
      },
      overallVerdict,
      verdictNote: verdictNote || undefined,
      keyStrength: keyStrength || undefined,
      mainLimitation: mainLimitation || undefined,
      apaReference: `${authors} (${year}). ${title}. ${journal || 'Tidsskrift'}.${doi ? ` https://doi.org/${doi}` : ''}`,
      items
    };

    onSaveNewArticle(newArticle);
    showToast(`Artikkelen Ã‚Â«${shortCitation}Ã‚Â» ble lagret i listen!`, 'success');
  };

  const copyParagraph = () => {
    navigator.clipboard.writeText(generatedParagraph);
    showToast('Generert avsnitt kopiert!');
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-2xs">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-teal-800 mb-1">
          <CheckSquare className="w-4 h-4 text-teal-700" />
          Interaktivt JBI VurderingsverktÃ¸y
        </div>
        <h2 className="text-xl sm:text-2xl font-bold font-serif text-slate-900 leading-snug">
          Vurder Din Egen Kvalitative Artikkel (JBI 2017)
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 mt-1">
          Fyll inn artikkeldata og vurder de 10 JBI-kriteriene. VerktÃ¸yet beregner scoren automatisk og genererer ferdig tekst til oppgaven.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-8">
        {/* Article Metadata Fields */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-2xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
            1. Artikkelopplysninger
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Artikkelens tittel *</label>
              <input
                type="text"
                required
                placeholder="F.eks. Fastlegers erfaringer med..."
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded focus:bg-white focus:ring-2 focus:ring-teal-600 focus:outline-hidden"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Forfattere (Etternavn, Initialer) *</label>
              <input
                type="text"
                required
                placeholder="F.eks. Hansen, K., & Olsen, T."
                value={authors}
                onChange={e => setAuthors(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded focus:bg-white focus:ring-2 focus:ring-teal-600 focus:outline-hidden"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">PublikasjonsÃ¥r</label>
              <input
                type="number"
                value={year}
                onChange={e => setYear(Number(e.target.value))}
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded focus:bg-white focus:ring-2 focus:ring-teal-600 focus:outline-hidden"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Tidsskrift / Publikasjonssted</label>
              <input
                type="text"
                placeholder="F.eks. Sykepleien Forskning / BMC Health Services"
                value={journal}
                onChange={e => setJournal(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded focus:bg-white focus:ring-2 focus:ring-teal-600 focus:outline-hidden"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Kvalitativt Design</label>
              <input
                type="text"
                placeholder="F.eks. Fenomenologi / Grounded Theory / Deskriptiv"
                value={design}
                onChange={e => setDesign(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded focus:bg-white focus:ring-2 focus:ring-teal-600 focus:outline-hidden"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Datainnsamlingsmetode</label>
              <input
                type="text"
                placeholder="F.eks. Dybdeintervjuer / Fokusgrupper"
                value={dataCollection}
                onChange={e => setDataCollection(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded focus:bg-white focus:ring-2 focus:ring-teal-600 focus:outline-hidden"
              />
            </div>
          </div>
        </div>

        {/* 10 JBI Questions Interactive Checklist */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              2. JBI 10-SpÃ¸rsmÃ¥ls Sjekkliste
            </h3>
            <div className="flex items-center gap-3 text-xs font-bold">
              <span className="text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">{jaCount} Ja</span>
              <span className="text-amber-700 bg-amber-100 px-2 py-0.5 rounded">{uklartCount} Uklart</span>
              <span className="text-rose-700 bg-rose-100 px-2 py-0.5 rounded">{neiCount} Nei</span>
            </div>
          </div>

          <div className="divide-y divide-slate-200">
            {JBI_QUESTIONS.map((q) => {
              const currentItem = items.find(i => i.questionId === q.id)!;

              return (
                <div key={q.id} className="p-4 sm:p-6 space-y-3 hover:bg-slate-50/50">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <span className="font-bold text-slate-900 text-sm">{q.shortTitle}</span>
                      <p className="text-xs text-slate-600 mt-0.5">{q.officialQuestion}</p>
                    </div>

                    {/* Status Button Toggle */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      {(['Ja', 'Uklart', 'Nei'] as AssessmentStatus[]).map((statusOption) => (
                        <button
                          key={statusOption}
                          type="button"
                          onClick={() => updateItemStatus(q.id, statusOption)}
                          className={`px-3 py-1 text-xs font-semibold rounded transition-colors ${
                            currentItem.status === statusOption
                              ? statusOption === 'Ja'
                                ? 'bg-emerald-600 text-white'
                                : statusOption === 'Uklart'
                                ? 'bg-amber-500 text-white'
                                : 'bg-rose-600 text-white'
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          }`}
                        >
                          {statusOption}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Justification input */}
                  <div>
                    <input
                      type="text"
                      placeholder={`Begrunnelse for spÃ¸rsmÃ¥l ${q.id}...`}
                      value={currentItem.justification}
                      onChange={(e) => updateItemJustification(q.id, e.target.value)}
                      className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded focus:bg-white focus:ring-1 focus:ring-teal-600 focus:outline-hidden"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Live Auto-Generated Synthesis Paragraph */}
        <div className="bg-slate-900 text-white rounded-xl p-6 shadow-md space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-teal-300 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-4 h-4 text-teal-400" />
              Automatisk Generert Oppgavetekst
            </div>
            <button
              type="button"
              onClick={copyParagraph}
              className="inline-flex items-center gap-1 text-xs font-semibold text-teal-300 hover:text-white"
            >
              <Copy className="w-3.5 h-3.5" /> Kopier avsnitt
            </button>
          </div>

          <p className="text-xs sm:text-sm text-slate-200 font-serif leading-relaxed bg-slate-800/80 p-4 rounded-lg border border-slate-700">
            {generatedParagraph}
          </p>
        </div>

        {/* Submit & Save */}
        <div className="flex justify-end gap-3">
          <button
            type="submit"
            className="inline-flex items-center gap-2 px-6 py-2.5 text-xs sm:text-sm font-bold text-white bg-teal-700 hover:bg-teal-800 rounded-lg shadow-sm transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>Lagre Vurdering i Oversikten</span>
          </button>
        </div>
      </form>
    </div>
  );
};


