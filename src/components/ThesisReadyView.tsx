import React, { useState, useMemo } from 'react';
import { ArticleAppraisal } from '../types';
import { JbiQualitativeValidationService } from '../services/jbiValidationService';
import { MethodIntegrityGate } from '../services/methodIntegrityGate';
import { useToast } from './Toast';
import { 
  FileText, 
  Copy, 
  Download, 
  Check, 
  Quote, 
  BookOpen, 
  Scale, 
  AlertTriangle, 
  Sparkles,
  Layers,
  GraduationCap,
  ShieldCheck
} from 'lucide-react';

interface ThesisReadyViewProps {
  articles: ArticleAppraisal[];
  onOpenImportExport?: (tab?: 'import' | 'export') => void;
}

export const ThesisReadyView: React.FC<ThesisReadyViewProps> = ({ articles, onOpenImportExport }) => {
  const { showToast } = useToast();
  const [activeFormat, setActiveFormat] = useState<'formatted' | 'plain' | 'markdown' | 'bibtex'>('formatted');

  const libraryGateCheck = useMemo(() => {
    return MethodIntegrityGate.checkAllActiveAppraisals(articles);
  }, [articles]);

  const includedArticles = articles.filter(a => a.overallVerdict === 'Inkluder' || a.overallVerdict === 'Vurder videre');

  // Dynamically generate synthesis text
  const generateDynamicThesisText = () => {
    let text = `### Kritisk vurdering av de inkluderte kvalitative studiene\n\n`;
    text += `De kvalitative studiene (${articles.map(a => a.shortCitation).join(', ')}) ble vurdert ved hjelp av Joanna Briggs Institutes (JBI) Critical Appraisal Checklist for Qualitative Research (Joanna Briggs Institute, 2017). Sjekklisten består av ti standardiserte metodiske kriterier som evaluerer samsvar mellom ontologisk/filosofisk perspektiv, forskningsmetodologi, problemstilling, datainnsamling, dataanalyse og fortolkning, samt forskerens posisjon (refleksivitet), representasjon av informantenes stemmer, forskningsetikk og sammenheng mellom empirisk materiale og konklusjoner.\n\n`;

    articles.forEach(art => {
      const artScore = JbiQualitativeValidationService.summarizeResponses(art.items, 10);
      text += `**${art.shortCitation}** oppnådde ${artScore.ja} «Ja»`;
      if (artScore.uklart > 0) text += `, ${artScore.uklart} «Uklart»`;
      if (artScore.nei > 0) text += ` og ${artScore.nei} «Nei»`;
      text += ` av 10 JBI-kriterier. JBI-resultatet fortolkes kvalitativt og ikke som en numerisk kvalitetsskår. `;
      text += `Studien benyttet ${art.design.toLowerCase()} med ${art.dataCollection.toLowerCase()} blant ${art.participants.toLowerCase()}. `;
      text += `${art.verdictNote || 'Studien demonstrerer god metodisk konsistens og transparent analyse.'} `;
      if (art.keyStrength) text += `En sentral metodisk styrke er ${art.keyStrength.toLowerCase()}. `;
      if (art.mainLimitation) text += `Hovedbegrensningen knytter seg til ${art.mainLimitation.toLowerCase()}. `;
      text += `Studien vurderes samlet som ${art.overallVerdict === 'Inkluder' ? 'metodisk solid og inkluderes' : art.overallVerdict.toLowerCase()} i kunnskapsgrunnlaget.\n\n`;
    });

    text += `### Metodisk rekkevidde og epistemologisk tolkning\n\n`;
    text += `Studiene i kunnskapsgrunnlaget bidrar med dypgående forståelse for deltakernes erfaringer, meningsdanning og sosiale prosesser. Det er imidlertid et avgjørende vitenskapsteoretisk poeng at kvalitative undersøkelser ikke alene kan isolere eller bevise kausale effekter av intervensjoner eller ordninger. Funnene må derfor tolkes som kontekstspesifikke beskrivelser av opplevelser og mulige mekanismer, og overførbarheten må vurderes i lys av studienes kontekst, utvalg og forskerposisjon.\n\n`;

    text += `### Referanser (APA 7th Edition)\n\n`;
    text += `Joanna Briggs Institute. (2017). JBI critical appraisal checklist for qualitative research. Joanna Briggs Institute. https://jbi.global/critical-appraisal-tools\n\n`;
    articles.forEach(art => {
      text += `${art.apaReference}\n\n`;
    });

    return text;
  };

  const generateBibTeX = () => {
    let bib = `@misc{jbi2017qualitative,
  title={JBI critical appraisal checklist for qualitative research},
  author={{Joanna Briggs Institute}},
  year={2017},
  publisher={Joanna Briggs Institute Adelaide},
  url={https://jbi.global/critical-appraisal-tools}
}\n\n`;

    articles.forEach((art, idx) => {
      const citeKey = `${art.id.replace(/[^a-zA-Z0-9]/g, '')}_${art.year}`;
      bib += `@article{${citeKey},
  title={${art.title}},
  author={${art.authors}},
  journal={${art.journal}},
  year={${art.year}},
  doi={${art.doi || ''}},
  url={${art.sourceUrl || ''}}
}\n\n`;
    });

    return bib;
  };

  const fullText = generateDynamicThesisText();
  const bibtexText = generateBibTeX();

  const copyToClipboard = (content: string, label: string) => {
    try {
      MethodIntegrityGate.assertCanExport(articles);
      navigator.clipboard.writeText(content);
      showToast(`${label} validert mot MethodIntegrityGate og kopiert til utklippstavlen!`);
    } catch (err: any) {
      showToast(`Eksport blokkert av MethodIntegrityGate: ${err.message}`, 'error');
    }
  };

  const downloadTextFile = (content: string, filename: string) => {
    try {
      MethodIntegrityGate.assertCanExport(articles);
      const element = document.createElement('a');
      const file = new Blob([content], { type: 'text/plain;charset=utf-8' });
      element.href = URL.createObjectURL(file);
      element.download = filename;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
      showToast(`Filen ${filename} ble validert mot MethodIntegrityGate og lastet ned!`);
    } catch (err: any) {
      showToast(`Eksport blokkert av MethodIntegrityGate: ${err.message}`, 'error');
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* MethodIntegrityGate Banner */}
      <div className={`border rounded-2xl p-4 flex items-center justify-between gap-4 ${libraryGateCheck.allPassed ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-amber-50 border-amber-200 text-amber-900'}`}>
        <div className="flex items-center gap-3">
          <ShieldCheck className={`w-5 h-5 ${libraryGateCheck.allPassed ? 'text-emerald-700' : 'text-amber-700'}`} />
          <div>
            <div className="text-xs font-bold uppercase tracking-wider">
              MethodIntegrityGate: {libraryGateCheck.allPassed ? 'Validering Godkjent' : 'Integritetsavvik Registrert'}
            </div>
            <p className="text-xs text-slate-600 mt-0.5">
              {libraryGateCheck.allPassed 
                ? `Alle ${articles.length} artikler er kontrollert mot MethodologyRegistry (JBI 2017 standard, 10 items, autorisert scoring). Klar for eksport.` 
                : `${libraryGateCheck.blockedCount} av ${articles.length} artikler har metodiske mangler som blokkerer eksport.`}
            </p>
          </div>
        </div>
        <div className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 shrink-0">
          {libraryGateCheck.passedCount}/{articles.length} godkjent
        </div>
      </div>

      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-teal-900 mb-1">
              <GraduationCap className="w-4 h-4 text-teal-700" />
              <span>Syntese & Masteroppgavetekst</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold font-serif text-slate-900 leading-snug">
              Metodedrøfting & Oppgavesyntese
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              Auto-generert metodesyntese og drøftingskapittel basert på alle {articles.length} artikler i biblioteket ditt.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {onOpenImportExport && (
              <button
                type="button"
                id="btn-open-export-hub-thesis"
                onClick={() => onOpenImportExport('export')}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-teal-950 bg-teal-100 hover:bg-teal-200 border border-teal-300 rounded-xl shadow-xs transition-colors"
                title="Eksporter til Word, Excel, RIS, BibTeX, PDF, LaTeX eller JSON"
              >
                <Download className="w-4 h-4 text-teal-800" />
                <span>Eksport i Alle Formater</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => copyToClipboard(fullText, 'Oppgavetekst')}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-teal-800 hover:bg-teal-900 rounded-xl shadow-xs transition-colors"
            >
              <Copy className="w-4 h-4 text-teal-200" />
              <span>Kopier Syntesetekst</span>
            </button>

            <button
              type="button"
              onClick={() => downloadTextFile(fullText, 'jbi_oppgave_syntese.md')}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 hover:text-slate-900 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors shadow-2xs"
            >
              <Download className="w-4 h-4 text-slate-600" />
              <span>Last ned .md</span>
            </button>
          </div>
        </div>

        {/* Format Selector Tabs */}
        <div className="flex items-center space-x-2 mt-6 border-b border-slate-200 pb-2">
          <button
            type="button"
            onClick={() => setActiveFormat('formatted')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
              activeFormat === 'formatted'
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Formatert oppgavetekst
          </button>
          <button
            type="button"
            onClick={() => setActiveFormat('plain')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
              activeFormat === 'plain'
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Ren tekst (Word)
          </button>
          <button
            type="button"
            onClick={() => setActiveFormat('markdown')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
              activeFormat === 'markdown'
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Markdown
          </button>
          <button
            type="button"
            onClick={() => setActiveFormat('bibtex')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
              activeFormat === 'bibtex'
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            BibTeX / LaTeX
          </button>
        </div>
      </div>

      {/* Epistemology Callout */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 sm:p-6 shadow-xs flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center shrink-0">
          <Scale className="w-5 h-5" />
        </div>
        <div className="space-y-1 text-xs sm:text-sm">
          <h3 className="font-bold text-amber-950 font-serif text-sm sm:text-base">
            Metodisk Presisjon: Kvalitative Funn vs. Kausale Påstander
          </h3>
          <p className="text-amber-900/90 leading-relaxed">
            I en kunnskapsoppsummering eller masteroppgave må man skille skarpt mellom deltakernes <em>opplevelser og meningsdanning</em> (kvalitativ empiri) og <em>effekt av intervensjoner</em> (kausalitet). Kvalitativ forskning belyser hvordan og hvorfor mekanismer oppleves, men kan ikke isolere kausalitet.
          </p>
        </div>
      </div>

      {articles.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center space-y-3 shadow-xs">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <FileText className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900 font-serif">Ingen vurderte artikler i prosjektet ennå</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Når du legger til og vurderer artikler i arbeidsområdet ditt, vil denne modulen automatisk syntetisere en publiseringsklar metodetekst, tabelloversikt og APA 7-referanseliste.
          </p>
        </div>
      ) : (
        <>
          {/* Main Content Area */}
          {activeFormat === 'formatted' && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-10 shadow-xs space-y-6 max-w-4xl mx-auto">
              <div className="border-b border-slate-200 pb-4">
                <h3 className="text-lg sm:text-xl font-bold font-serif text-slate-900 tracking-tight">
                  Kritisk vurdering og syntese av {articles.length} kvalitative studier
                </h3>
                <span className="text-xs text-slate-500 font-sans">
                  Strukturert syntese i henhold til JBI Qualitative Checklist (2017)
                </span>
              </div>

              <div className="text-slate-800 space-y-5 text-sm sm:text-base leading-relaxed font-serif">
                <p>
                  De kvalitative studiene i kunnskapsgrunnlaget ({articles.map(a => a.shortCitation).join(', ')}) ble vurdert ved hjelp av Joanna Briggs Institutes (JBI) Critical Appraisal Checklist for Qualitative Research (Joanna Briggs Institute, 2017). Sjekklisten vurderer ti metodologiske nøkkelkriterier for vitenskapelig stringens og transparens.
                </p>

                {articles.map(art => (
                  <div key={art.id} className="bg-slate-50/70 p-4 rounded-xl border border-slate-200/80 font-sans text-xs sm:text-sm space-y-2">
                    <div className="flex items-center justify-between">
                      <strong className="text-slate-900 font-serif text-sm sm:text-base font-bold">
                        {art.shortCitation} — {art.title}
                      </strong>
                      <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                        {art.summaryScore.ja}/10 Ja
                      </span>
                    </div>
                    <p className="text-slate-700 leading-relaxed font-serif">
                      Studien benytter {art.design.toLowerCase()} med {art.dataCollection.toLowerCase()} blant {art.participants.toLowerCase()}. {art.verdictNote}
                    </p>
                    <div className="text-[11px] text-slate-500 flex flex-wrap gap-3 pt-1 border-t border-slate-200/60">
                      <span>Styrke: <strong className="text-slate-700">{art.keyStrength}</strong></span>
                      <span>Begrensning: <strong className="text-slate-700">{art.mainLimitation}</strong></span>
                      <span>Beslutning: <strong className="text-emerald-800">{art.overallVerdict}</strong></span>
                    </div>
                    {art.items && art.items.length > 0 && (
                      <div className="pt-2 flex flex-wrap gap-1.5 text-[10px]">
                        {art.items.slice(0, 10).map((it) => (
                          <span key={it.questionId} className="px-2 py-0.5 rounded bg-white border border-slate-200 font-mono text-slate-700">
                            Q{it.questionId}: <strong>{it.status}</strong> {it.location?.page ? `[s. ${it.location.page}]` : ''}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                <p>
                  Samlet vurdering viser at de inkluderte studiene oppfyller JBI-kriteriene for metodologisk konsistens og transparent analyse. Funnene må likevel fortolkes i tråd med det kvalitative designets epistemologiske forutsetninger.
                </p>
              </div>

              {/* References */}
              <div className="pt-6 border-t border-slate-200 font-sans space-y-3">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Referanser (APA 7th Edition)
                </h4>
                <div className="text-xs text-slate-700 space-y-2 font-serif pl-6 -indent-6 leading-relaxed">
                  <p>
                    Joanna Briggs Institute. (2017). <em>JBI critical appraisal checklist for qualitative research</em>. Joanna Briggs Institute. https://jbi.global/critical-appraisal-tools
                  </p>
                  {articles.map(art => (
                    <p key={art.id}>
                      {art.apaReference}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeFormat === 'plain' && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs max-w-4xl mx-auto space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500">Klar til å limes inn i Word / Google Docs</span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(fullText, 'Ren tekst')}
                  className="text-xs font-bold text-teal-800 hover:text-teal-950 flex items-center gap-1"
                >
                  <Copy className="w-3.5 h-3.5" /> Kopier
                </button>
              </div>
              <textarea
                readOnly
                value={fullText}
                rows={18}
                className="w-full font-mono text-xs p-4 bg-slate-50 border border-slate-300 rounded-xl focus:outline-hidden"
              />
            </div>
          )}

          {activeFormat === 'markdown' && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs max-w-4xl mx-auto space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500">Markdown format (.md)</span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(fullText, 'Markdown')}
                  className="text-xs font-bold text-teal-800 hover:text-teal-950 flex items-center gap-1"
                >
                  <Copy className="w-3.5 h-3.5" /> Kopier
                </button>
              </div>
              <textarea
                readOnly
                value={fullText}
                rows={18}
                className="w-full font-mono text-xs p-4 bg-slate-50 border border-slate-300 rounded-xl focus:outline-hidden"
              />
            </div>
          )}

          {activeFormat === 'bibtex' && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs max-w-4xl mx-auto space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500">BibTeX Bibliography (.bib)</span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(bibtexText, 'BibTeX')}
                  className="text-xs font-bold text-teal-800 hover:text-teal-950 flex items-center gap-1"
                >
                  <Copy className="w-3.5 h-3.5" /> Kopier
                </button>
              </div>
              <textarea
                readOnly
                value={bibtexText}
                rows={18}
                className="w-full font-mono text-xs p-4 bg-slate-50 border border-slate-300 rounded-xl focus:outline-hidden"
              />
            </div>
          )}
        </>
      )}
    </div>
  );
};
