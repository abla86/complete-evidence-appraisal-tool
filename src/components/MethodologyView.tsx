import React from 'react';
import { 
  GitCompare, 
  AlertTriangle, 
  HelpCircle, 
  BookOpen, 
  CheckCircle2, 
  Sparkles, 
  GraduationCap, 
  Scale, 
  ArrowRight,
  FileCheck,
  Target
} from 'lucide-react';

interface MethodologyViewProps {
  onGoToThesis: () => void;
}

export const MethodologyView: React.FC<MethodologyViewProps> = ({ onGoToThesis }) => {
  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-2xs">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-teal-800 mb-2">
          <Scale className="w-4 h-4 text-teal-700" />
          Vitenskapsteori & Kvalitativ Validitet
        </div>
        <h2 className="text-xl sm:text-2xl font-bold font-serif text-slate-900 leading-snug">
          Det Viktigste Metodiske Skillet i Kvalitativ Forskning
        </h2>
        <p className="text-sm text-slate-600 mt-2 max-w-3xl leading-relaxed">
          Når man gjør en kunnskapsoppsummering i en masteroppgave eller vitenskapelig artikkel, er det avgjørende å forstå <strong>hvilken type kunnskap</strong> et forskningsdesign produserer, og hvor langt forfatterne kan trekke sine konklusjoner.
        </p>
      </div>

      {/* Main Core Distinction Callout */}
      <div className="bg-amber-50 border-2 border-amber-300/80 rounded-xl p-6 sm:p-8 shadow-xs">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <AlertTriangle className="w-6 h-6 text-amber-50" />
          </div>
          <div className="space-y-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-amber-900">
                Avgjørende Feilslutning å Unngå
              </span>
              <h3 className="text-lg sm:text-xl font-bold text-slate-900 font-serif mt-1">
                Kvalitative studier kan IKKE alene etablere kausal effekt
              </h3>
            </div>

            <p className="text-sm text-slate-800 leading-relaxed">
              Det er en vanlig metodisk fallgruve å hevde at en kvalitativ studie «viser effekten av et tiltak». 
              Kvalitativ forskning undersøker <strong>opplevelser, meningsdanning, kontekstuelle nyanser og sosiale prosesser</strong>, ikke kontrollerte årsakssammenhenger (kausalitet).
            </p>

            {/* Two Column Case Comparison */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="bg-white p-5 rounded-lg border border-amber-200 shadow-2xs space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-900 font-serif">
                    Studie A – Kvalitativ Intervensjonsevaluering
                  </h4>
                  <span className="text-[10px] font-bold uppercase bg-amber-100 text-amber-800 px-2 py-0.5 rounded">
                    Folkehelse / Framework
                  </span>
                </div>
                <div className="text-xs text-slate-700 space-y-2">
                  <p>
                    <strong className="text-rose-700">Feil konklusjon:</strong> «Kvalitative intervjuer dokumenterer at helseprogrammet beviselig forbedrer ernæringsstatus og reduserer sykdom.»
                  </p>
                  <p>
                    <strong className="text-emerald-800">Riktig metodisk tolkning:</strong> Studien undersøker <em>hvordan deltakere, familier og helsearbeidere beskriver og erfarer</em> tiltaket og mulige barrierer for etterlevelse. Studien kan ikke isolere tiltakets kausale effekt fra andre samtidige sosiale, økonomiske eller kulturelle faktorer.
                  </p>
                </div>
              </div>

              <div className="bg-white p-5 rounded-lg border border-amber-200 shadow-2xs space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-900 font-serif">
                    Studie B – Tverretatlig Samhandling
                  </h4>
                  <span className="text-[10px] font-bold uppercase bg-teal-100 text-teal-800 px-2 py-0.5 rounded">
                    Allmennmedisin / GT
                  </span>
                </div>
                <div className="text-xs text-slate-700 space-y-2">
                  <p>
                    <strong className="text-rose-700">Feil konklusjon:</strong> «Studien viser hvilke tiltak som objektivt sett forbedrer samhandlingskvalitet i helse- og omsorgstjenesten.»
                  </p>
                  <p>
                    <strong className="text-emerald-800">Riktig metodisk tolkning:</strong> Studien belyser <em>hvordan helsepersonell opplever, forstår og navigerer samhandlingsprosesser</em>. Siden kun én profesjonsgruppe ble intervjuet, reflekterer funnene denne gruppens erfaringer, ikke et objektivt målt samarbeidsresultat på tvers av etater.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Grounded Theory vs Framework Analysis Comparison */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-2xs space-y-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-teal-800 mb-1">
            <GitCompare className="w-4 h-4 text-teal-700" />
            Analytiske Tradisjoner
          </div>
          <h3 className="text-lg font-bold text-slate-900 font-serif">
            Grounded Theory vs. Framework Analysis
          </h3>
          <p className="text-xs text-slate-600">
            Hvordan valg av analysemetode former studiens epistemologiske bidrag
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Grounded Theory Column */}
          <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-900 font-serif">
                Grounded Theory (f.eks. Charmaz / Strauss)
              </h4>
              <span className="text-[11px] font-bold text-teal-800 bg-teal-100/70 px-2 py-0.5 rounded">
                Teoriutviklende
              </span>
            </div>
            <ul className="text-xs text-slate-700 space-y-2 list-disc list-inside leading-relaxed">
              <li><strong>Formål:</strong> Utvikle en begrepsmessig modell eller teori forankret i empiriske data om sosiale prosesser.</li>
              <li><strong>Prosess:</strong> Konstant sammenligning (constant comparative method) og parallell datainnsamling og koding.</li>
              <li><strong>Resultat:</strong> En syntetisert modell med kjernekategori (f.eks. «relasjonell forhandling») som forklarer dynamikker i samhandling.</li>
              <li><strong>Styrke:</strong> Dyp innsikt i sosiale interaksjonsmønstre og profesjonskultur.</li>
            </ul>
          </div>

          {/* Framework Analysis Column */}
          <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-900 font-serif">
                Framework Analysis (f.eks. Gale / Ritchie & Spencer)
              </h4>
              <span className="text-[11px] font-bold text-teal-800 bg-teal-100/70 px-2 py-0.5 rounded">
                Strukturert & Anvendt
              </span>
            </div>
            <ul className="text-xs text-slate-700 space-y-2 list-disc list-inside leading-relaxed">
              <li><strong>Formål:</strong> Gi systematisk og policy-relevant innsikt i spesifikke spørsmål, ofte i evalueringer og folkehelse.</li>
              <li><strong>Prosess:</strong> Kombinerer forhåndsdefinerte (deduktive) tematiske rammeverk med nye (induktive) funn fra dataene.</li>
              <li><strong>Resultat:</strong> En strukturert matrise på tvers av ulike informantgrupper (brukere, pårørende, helsepersonell).</li>
              <li><strong>Styrke:</strong> Høy transparens, egnet for flerfaglig samarbeid og sammenligning på tvers av grupper.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* The JBI "Uklart" Rule Explained */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-2xs space-y-4">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-teal-800">
          <HelpCircle className="w-4 h-4 text-teal-700" />
          Metodisk Presisjon i JBI Sjekklisten
        </div>
        <h3 className="text-lg font-bold text-slate-900 font-serif">
          Hvorfor bruke «Uklart» i stedet for å anta eller gjette?
        </h3>
        <p className="text-sm text-slate-700 leading-relaxed">
          I henhold til Joanna Briggs Institutes (2017) retningslinjer skal vurderingen <strong>kun baseres på den informasjonen som faktisk fremgår av den publiserte artikkelen</strong>.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div className="p-4 rounded-lg bg-emerald-50/70 border border-emerald-200">
            <h4 className="text-xs font-bold text-emerald-900 mb-1 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" /> Ja
            </h4>
            <p className="text-xs text-emerald-800">
              Kriteriet er eksplisitt beskrevet, tilstrekkelig dokumentert og faglig begrunnet i artikkelen.
            </p>
          </div>

          <div className="p-4 rounded-lg bg-amber-50/70 border border-amber-200">
            <h4 className="text-xs font-bold text-amber-900 mb-1 flex items-center gap-1">
              <HelpCircle className="w-3.5 h-3.5 text-amber-700" /> Uklart
            </h4>
            <p className="text-xs text-amber-800">
              Artikkelen gir utilstrekkelig eller mangelfull informasjon til å konkludere sikkert. Betyr ikke nødvendigvis at studien er dårlig, men at rapporteringen er ufullstendig.
            </p>
          </div>

          <div className="p-4 rounded-lg bg-rose-50/70 border border-rose-200">
            <h4 className="text-xs font-bold text-rose-900 mb-1 flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-700" /> Nei
            </h4>
            <p className="text-xs text-rose-800">
              Kriteriet er direkte fraværende, metodisk feilaktig gjennomført eller i direkte strid med god kvalitativ praksis.
            </p>
          </div>
        </div>
      </div>

      {/* Guidance for Master Thesis / Academic Paper */}
      <div className="bg-slate-900 text-white rounded-xl p-6 sm:p-8 shadow-md space-y-4">
        <div className="flex items-center gap-2 text-teal-300 text-xs font-bold uppercase tracking-wider">
          <GraduationCap className="w-4 h-4 text-teal-400" />
          Råd til Masteroppgaven
        </div>
        <h3 className="text-lg font-bold font-serif text-white">
          Hvordan formulere kritisk vurdering og drøfting i oppgaven
        </h3>
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
          Sensorer legger stor vekt på at studenten forstår <strong>kunnskapens rekkevidde</strong>. 
          Bruk gjerne følgende formuleringer i drøftingskapitlet:
        </p>

        <div className="bg-slate-800/90 p-4 rounded-lg border border-slate-700 text-xs sm:text-sm text-slate-200 space-y-2 font-mono">
          <p className="text-teal-200">
            «Funnene fra de kvalitative studiene gir verdifull dybdeinnsikt i deltakernes erfaringer og sosiale prosesser, men må tolkes med forbehold om at kvalitativ metodologi ikke kan dokumentere kausale intervensjonseffekter (Joanna Briggs Institute, 2017).»
          </p>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            onClick={onGoToThesis}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-900 bg-teal-300 hover:bg-teal-200 rounded-md transition-colors"
          >
            <span>Gå til ferdig konklusjonstekst</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
