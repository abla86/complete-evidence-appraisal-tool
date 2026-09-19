import React from 'react';
import { HelpCircle, BookOpen, CheckSquare, Layers, Search, ShieldCheck, FileText, ArrowRightLeft, Sparkles, Award, ExternalLink, CheckCircle2 } from 'lucide-react';

export const HelpGuideComponent: React.FC = () => {
  return (
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 space-y-8">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-md">
            <HelpCircle className="w-6 h-6" />
          </div>
          <div>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800 mb-1">
              Brukerveiledning & Hjelpeside
            </span>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Hvordan bruke Artikkelanalysator Pro</h2>
          </div>
        </div>
        <p className="text-sm text-slate-600 leading-relaxed max-w-3xl">
          Denne guiden forklarer hele arbeidsflyten i verktøyet, hva de ulike knappene gjør, hvilket neste steg du bør ta, og hvor de vitenskapelige sjekklistene og verktøyene kommer fra.
        </p>
      </div>

      {/* Workflow Step-by-Step */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
        <h3 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
          <Sparkles className="w-5 h-5 text-indigo-600" />
          <span>Steg-for-steg Arbeidsflyt</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-2">
            <div className="flex items-center space-x-2 text-indigo-700 font-bold text-sm">
              <span className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs">1</span>
              <span>Bibliotek & Kildevalg</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Start i <strong>Bibliotek</strong>. Her velger du en eksisterende studie (f.eks. Øverhaug et al. 2024 eller Sahota et al. 2026) eller laster opp din egen artikkel (`.txt`, `.md`, `.doc`, `.docx`).
            </p>
          </div>

          <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-2">
            <div className="flex items-center space-x-2 text-indigo-700 font-bold text-sm">
              <span className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs">2</span>
              <span>Klassifisering & Studiedesign</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Gå til <strong>Klassifisering</strong> for å identifisere studiedesign (RCT, kvalitativ, systematisk oversikt) og PICO-elementer (Populasjon, Intervensjon, Sammenligning, Utfall).
            </p>
          </div>

          <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-2">
            <div className="flex items-center space-x-2 text-indigo-700 font-bold text-sm">
              <span className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs">3</span>
              <span>Kritisk Vurdering (Sjekkliste)</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Velg riktig sjekkliste under <strong>Sjekkliste</strong> basert på studiedesign. Fyll inn Ja/Nei/Ukjent med begrunnelser, sitater og usikkerheter for hvert spørsmål.
            </p>
          </div>

          <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-2">
            <div className="flex items-center space-x-2 text-indigo-700 font-bold text-sm">
              <span className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs">4</span>
              <span>QA, Verifisering & Rapport</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Bruk <strong>QA-søk</strong> til å stille spørsmål med fargekodede sitater, <strong>Kildeverifisering</strong> mot åpne registre, og generer en komplett samlet <strong>Rapport</strong> for eksport til Word.
            </p>
          </div>
        </div>
      </div>

      {/* Checklists & Academic Origins */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
        <h3 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
          <BookOpen className="w-5 h-5 text-indigo-600" />
          <span>Hvor kommer sjekklistene og verktøyene fra?</span>
        </h3>
        <p className="text-sm text-slate-600 leading-relaxed">
          Alle sjekklistene i programmet er hentet direkte fra internasjonalt anerkjente metodiske standarder for kunnskapsbasert praksis og forskningsmetodikk:
        </p>

        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <div className="flex justify-between items-center">
              <h4 className="text-sm font-bold text-slate-900">CASP (Critical Appraisal Skills Programme)</h4>
              <span className="text-xs font-mono text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-md">Kvalitative studier & RCT</span>
            </div>
            <p className="text-xs text-slate-600">
              Brukt internasjonalt for systematisk vurdering av troverdighet, overføringsverdi og pålitelighet i kvalitative intervjustudier og randomiserte kontrollerte forsøk.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <div className="flex justify-between items-center">
              <h4 className="text-sm font-bold text-slate-900">JBI (Joanna Briggs Institute Critical Appraisal Tools)</h4>
              <span className="text-xs font-mono text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-md">Observasjons- & Tverrsnittsstudier</span>
            </div>
            <p className="text-xs text-slate-600">
              Utviklet av Joanna Briggs Institute ved University of Adelaide for vurdering av metodisk kvalitet og skjevhet (bias) i observasjonsstudier.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <div className="flex justify-between items-center">
              <h4 className="text-sm font-bold text-slate-900">AMSTAR 2 & Cochrane RoB 2</h4>
              <span className="text-xs font-mono text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-md">Systematiske oversikter & RCT</span>
            </div>
            <p className="text-xs text-slate-600">
              AMSTAR 2 vurderer metodisk kvalitet i systematiske oversikter. Cochrane Risk of Bias 2 (RoB 2) vurderer randomiserte studier på tvers av 5 spesifikke domener.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <div className="flex justify-between items-center">
              <h4 className="text-sm font-bold text-slate-900">COREQ & SRQR</h4>
              <span className="text-xs font-mono text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-md">Rapporteringsstandarder</span>
            </div>
            <p className="text-xs text-slate-600">
              Sjekklister for rapportering av henholdsvis kvalitative forskningsintervjuer (COREQ) og kvalitative studier generelt (SRQR).
            </p>
          </div>
        </div>
      </div>

      {/* Buttons Guide */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
        <h3 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
          <ShieldCheck className="w-5 h-5 text-indigo-600" />
          <span>Knappeforklaring & Funksjoner</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-700">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1.5">
            <strong className="text-slate-900 block text-sm">«Analyser artikkel / AI-assistanse»</strong>
            <p className="text-slate-600">Henter automatisk strukturert sammendrag, forskningsspørsmål, metode og funn fra den valgte artikkelen.</p>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1.5">
            <strong className="text-slate-900 block text-sm">«Verifiser referanser»</strong>
            <p className="text-slate-600">Sjekker artikkeltitler, DOI og publiseringsår mot åpne registre og søker etter nyere relaterte studier.</p>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1.5">
            <strong className="text-slate-900 block text-sm">«Utfør AI-originalitetsanalyse»</strong>
            <p className="text-slate-600">Kjører lokal statistisk tekstanalyse for å beregne perplexity, burstiness og tillitsskår for originalitet i oppgaver.</p>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1.5">
            <strong className="text-slate-900 block text-sm">«Eksporter som Word / PDF»</strong>
            <p className="text-slate-600">Genererer fullstendige dokumenter med alle vurderinger, begrunnelser, sitater og APA 7-referanser.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
