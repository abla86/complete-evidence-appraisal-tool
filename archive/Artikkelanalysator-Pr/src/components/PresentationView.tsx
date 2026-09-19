import React, { useState } from 'react';
import { ArticleData } from '../types';
import { Presentation, Clock, FileText, Download, UserCheck, CheckCircle2 } from 'lucide-react';

interface PresentationViewProps {
  selectedArticle: ArticleData;
}

export const PresentationView: React.FC<PresentationViewProps> = ({ selectedArticle }) => {
  const [activeSlide, setActiveSlide] = useState<number>(1);

  const isOverhaug = selectedArticle.id === 'overhaug-2024';

  const slides = isOverhaug ? [
    {
      id: 1,
      title: 'Tittel, artikkel og disposisjon',
      time: '0:45',
      instruction: 'Innledning & oppbygging (a-g)',
      ppt: [
        'Kritisk vurdering av kvalitativ forskningsartikkel: Øverhaug et al. (2024)',
        'Fastlegers erfaringer med samarbeid med barneverntjenesten',
        'Disposisjon: a–g i oppgaven (Bakgrunn -> Design -> Utvalg -> Analyse -> Funn -> Refleksivitet -> Etikk)'
      ],
      manus: 'Vi skal presentere og kritisk vurdere artikkelen "There’s a will, but not a way: Norwegian GPs’ experiences of collaboration with child welfare services" av Øverhaug og kolleger (2024). Artikkelen er en kvalitativ grounded theory-studie av hvordan fastleger opplever samarbeidet med barneverntjenesten. Vi følger oppgavens punkter a til g i samme rekkefølge. Hovedkonklusjonen er at studien er metodologisk solid som analyse av fastlegenes erfaringer, men at den ikke alene kan beskrive samarbeidsprosessen som bilateral fordi barnevernets perspektiv mangler.'
    },
    {
      id: 2,
      title: 'Vurderingsgrunnlag og metodiske rammer',
      time: '1:10',
      instruction: 'Metodologisk fundament',
      ppt: [
        'COREQ: 32-punkts sjekkliste for rapportering av intervjustudier',
        'Lincoln og Guba (1985): Tillitsverdighet (Credibility, Transferability, Dependability, Confirmability)',
        'Corbin og Strauss (2015): Grounded theory (parallell koding, konstant sammenligning, metning)'
      ],
      manus: 'For å vurdere studien på master-/ph.d.-nivå bruker vi tre komplementære rammer: COREQ for transparens i rapportering, Lincoln og Gubas klassiske tillitsverdighetskriterier, og Corbin & Strauss for grounded theory-prosedyrer. Dette sikrer en systematisk og etterprøvbar vurdering uten vilkårlig kritikk.'
    },
    {
      id: 3,
      title: 'Bakgrunn, formål og vurdering (Punkt a)',
      time: '1:30',
      instruction: 'Bakgrunn og problemstilling (a)',
      ppt: [
        'Bakgrunn: Negative barndomserfaringer (ACE) påvirker helse; fastlegen har langvarig kjennskap',
        'Kunnskapsgap: Fokus har vært på varsling og identifisering, mindre på selve samarbeidsprosessen',
        'Formål: Utforske fastlegers erfaringer med samarbeid med barneverntjenesten',
        'Vurdering: Tydelig og godt begrunnet (Skår: 5/5)'
      ],
      manus: 'Bakgrunnen viser til hvordan negative barndomserfaringer rammer barns helse, og fastlegens unike posisjon. Forfatterne viser at tidligere forskning har fokusert på varslingsfrekvens, mens samarbeidet underveis er lite utforsket. Formålet er presist formulert. En nødvendig avgrensning er likevel at dette kun fanger fastlegenes subjektive opplevelser.'
    },
    {
      id: 4,
      title: 'Forskningsdesign og relevans (Punkt b)',
      time: '1:40',
      instruction: 'Design & metodologisk samsvar (b)',
      ppt: [
        'Design: Kvalitativ grounded theory (Corbin & Strauss)',
        'Datainnsamling: Semistrukturerte intervjuer',
        'Relevans: Egnet til å utforske sosiale prosesser, mening og interaksjon',
        'Kritisk vurdering: Godt egnet, men utvikler en erfaringsmodell, ikke et bilateralt bilde'
      ],
      manus: 'Forfatterne velger grounded theory fordi de vil utforske en sosial prosess: hvordan fastleger opplever samarbeid når barnevernet kobles inn. Designet er svært relevant for å utvikle begreper og modeller (modell med tre stadier). Svakheten er at studien bare undersøker den ene parten i samarbeidet.'
    },
    {
      id: 5,
      title: 'Utvalg og datainnsamling (Punkt c)',
      time: '2:00',
      instruction: 'Utvalg og informasjonskraft (c)',
      ppt: [
        'Utvalg: Målrettet utvalg av 10 fastleger (minst 5 års erfaring, urban/rural variasjon)',
        'Innsamling: 10 semistrukturerte intervjuer (2020–2021), guide justert underveis',
        'Vurdering: God informasjonskraft og variasjon, men nokså lite utvalg (10 informanter)',
        'Refleksjon: 4 informanter var delvis kjent for førsteforfatter (mulig bias)'
      ],
      manus: 'Utvalget besto av ti erfarne fastleger med geografisk spredning. Dette gir god informasjonskraft. Imidlertid var fire informanter kjent for førsteforfatteren, noe som kan ha påvirket åpenheten og sosial ønskverdighet. Intervjuguiden ble fleksibelt justert underveis, i tråd med grounded theory.'
    },
    {
      id: 6,
      title: 'Dataanalyse og prosedyrer (Punkt d)',
      time: '1:45',
      instruction: 'Analyse og transparens (d)',
      ppt: [
        'Prosedyrer: Open coding, memoer, axial coding, konstant komparativ analyse, selective coding',
        'Teamarbeid: Diskusjoner og felles koding i forskergruppen',
        'Vurdering: Hovedprinsipper beskrevet, men mangler konkret analysespor (fra sitat til kategori)'
      ],
      manus: 'Analysen følger klassisk grounded theory med åpne koder, memoer, aksial koding og selektiv koding til en kjernekategori. At flere forskere deltok i analysen er en stor styrke for bekreftbarheten. Svakheten er at artikkelen mangler et transparent eksempel på et faktisk analysespor fra rådata til modell.'
    },
    {
      id: 7,
      title: 'Hovedfunn: «There’s a will, but not a way» (Punkt e - del 1)',
      time: '1:45',
      instruction: 'Empiriske funn (e)',
      ppt: [
        'Hovedkonsept: «There’s a will, but not a way»',
        'Stadier:',
        '1. Familiar territory: Langvarig relasjon, helhetlig (biopsykososial) omsorg',
        '2. Unfamiliar territory: Enveis informasjonsvindu og lukket dør for dialog',
        '3. Fragmented territory: Tapte muligheter og manglende biter i pasienthistorien'
      ],
      manus: 'Hovedfunnet er formulert som "There’s a will, but not a way". Fastlegene vil bidra, men møter strukturelle barrierer. De går fra kjent territorium med pasientrelasjon, til ukjent territorium når barnevernet overtar med taushetsplikt og enveis kommunikasjon, og ender i et fragmentert territorium med tapte muligheter.'
    },
    {
      id: 8,
      title: 'Tillitsverdighet: Troverdighet og overførbarhet (Punkt e - del 2)',
      time: '2:00',
      instruction: 'Kvalitetsvurdering (e)',
      ppt: [
        'Credibility (troverdighet): God (rike sitater, variert utvalg, teamanalyse)',
        'Transferability (overførbarhet): Moderat (tydelig norsk kontekst, men ett perspektiv)',
        'Dependability & Confirmability: Støttes av memoer og åpenhet, men mangler member checking'
      ],
      manus: 'Vurderer vi tillitsverdigheten etter Lincoln og Guba, står studien sterkt på troverdighet gjennom sitater og teamarbeid. Overførbarheten er god til lignende primærhelsetjenester i Norge, men kan ikke generaliseres til barnevernets hverdag. Fravær av medlemsvalidering (member checking) trekker noe ned.'
    },
    {
      id: 9,
      title: 'Refleksivitet og forskerposisjon (Punkt f)',
      time: '1:40',
      instruction: 'Refleksivitet (f)',
      ppt: [
        'Forskerposisjon: Førsteforfatter var fastlege og ph.d.-student med kjennskap til feltet',
        'Tiltak: Refleksive notater og tverrfaglig drøfting',
        'Kritisk blikk: Risiko for felles profesjonell bias (framstille fastleger som helhetlige og barnevern som lukkede)'
      ],
      manus: 'Forfatterne viser god åpenhet om at førsteforfatteren er fastlege med egne erfaringer fra feltet. Dette gir innsikt, men kan også føre til en ubevisst profesjonsskjevhet der fastlegenes rolle idealiseres og barnevernets etiske og juridiske rammer fremstilles ensidig.'
    },
    {
      id: 10,
      title: 'Forskningsetikk og juridiske rammer (Punkt g)',
      time: '1:30',
      instruction: 'Etikk og taushetsplikt (g)',
      ppt: [
        'Ivaretatt: Informert samtykke, anonymisering, opptak og sikre transkripsjoner',
        'Utfordringer: Indirekte gjenkjennelse av sårbare familier i små kommuner',
        'Taushetsplikt vs. opplysningsplikt (helsepersonelloven vs. barnevernsloven)'
      ],
      manus: 'Etiske grunnkrav som samtykke og konfidensialitet er godt ivaretatt. Artikkelen drøfter imidlertid i liten grad risikoen for indirekte identifisering av pasienter eller barnevernsansatte i mindre kommuner, eller spenningen mellom helsepersonellovens taushetsplikt og barnevernets opplysningskrav.'
    },
    {
      id: 11,
      title: 'Styrker og konkrete forbedringspunkter',
      time: '1:35',
      instruction: 'Balansert metodisk kritikk',
      ppt: [
        'Særlig sterkt: Tydelig problemstilling, grounded theory-samsvar, rike sitater og god kontekstbeskrivelse',
        'Forbedringspotensial: Teoretisk metning og sampling bør dokumenteres grundigere; bilateralt design ville styrket gyldigheten'
      ],
      manus: 'Oppsummert er studien sterk på transparens, praksisrelevans og struktur. Forbedringspotensialet ligger i tydeligere dokumentasjon av teoretisk metning og inkludering av barnevernets egne stemmer for å oppnå et helhetlig bilde av samarbeidsprosessen.'
    },
    {
      id: 12,
      title: 'Samlet konklusjon og oppgavesjekk (a–g)',
      time: '1:30',
      instruction: 'Oppsummering & sjekkliste',
      ppt: [
        'Konklusjon: Svært relevant og troverdig studie av fastlegers opplevde barrierer (A-/B+ nivå)',
        'Sjekkliste sjekket: Alle punkter a til g er fullstendig besvart med teoretisk forankring og referanser'
      ],
      manus: 'Vår samlede konklusjon er at Øverhaug et al. (2024) holder et høyt akademisk nivå og gir verdifull innsikt i tverrsektorielle barrierer. Alle punkter fra a til g i instruksen er grundig besvart med støtte i COREQ, Lincoln & Guba og Corbin & Strauss. Takken for oppmerksomheten!'
    }
  ] : [
    {
      id: 1,
      title: 'Sahota et al. (2026) – Tittel og Disposisjon',
      time: '0:45',
      instruction: 'Innledning & oppbygging (a-g)',
      ppt: [
        'Kritisk vurdering av global helseforskning: Sahota et al. (2026)',
        'Maternal nutrition practices and behaviours in the context of a Cash-Plus intervention in Rajasthan, India',
        'Disposisjon: a–g (Bakgrunn -> Design -> Utvalg -> Analyse -> Funn -> Refleksivitet -> Etikk)'
      ],
      manus: 'Vi skal presentere og kritisk vurdere Sahota og kollegers studie fra 2026 i Global Health Action, som undersøker maternelle ernæringspraksiser i en Cash-Plus-intervensjon i Rajasthan, India. Vi følger oppgavens punkter a til g systematisk.'
    },
    {
      id: 2,
      title: 'Vurderingsgrunnlag (SRQR & Lincoln & Guba)',
      time: '1:10',
      instruction: 'Metodisk rammeverk',
      ppt: [
        'SRQR: 21 standarder for rapportering av kvalitativ forskning',
        'Lincoln og Guba: Tillitsverdighet (Credibility, Transferability, Dependability, Confirmability)',
        'Hybrid deduktiv-induktiv tematisk analyse og rammematrise (Framework analysis)'
      ],
      manus: 'For denne studien bruker vi SRQR for rapporteringsstandarder, Lincoln og Gubas tillitsverdighetskriterier, samt rammeverk for hybrid deduktiv-induktiv tematisk analyse i store kvalitative evalueringer.'
    },
    {
      id: 3,
      title: 'Bakgrunn og formål (Punkt a)',
      time: '1:30',
      instruction: 'Bakgrunn og problemstilling (a)',
      ppt: [
        'Bakgrunn: Multippel underernæring og intergenerasjonell syklus i India',
        'Intervensjon: Cash-Plus (kontantoverføringer + strukturert veiledning/SBCC)',
        'Formål: Utforske ernæringspraksiser og atferdsendring blant gravide og mødre i Rajasthan',
        'Vurdering: Meget sterk og samfunnsaktuell problemstilling (Skår: 5/5)'
      ],
      manus: 'Bakgrunnen etablerer det store problemet med underernæring i India. Cash-Plus kombinerer kontanter med atferdsendring (SBCC). Formålet er å forstå mekanismene for atferdsendring, noe som er svært relevant for global helse.'
    },
    {
      id: 4,
      title: 'Forskningsdesign og relevans (Punkt b)',
      time: '1:40',
      instruction: 'Design & metodologisk samsvar (b)',
      ppt: [
        'Design: Omfattende kvalitativ feltstudie innenfor pågående intervensjon',
        'Metode: Kombinasjon av in-depth interviews (IDIs) og focus group discussions (FGDs)',
        'Relevans: Svært egnet til å fange opp komplekse sosiale, økonomiske og familiemessige mekanismer'
      ],
      manus: 'Designet er flerdimensjonalt og kombinerer IDI og FGD med ulike aktører (mødre, fedre, svigermødre, frontlinjearbeidere). Dette gir et bredt empirisk fundament for å evaluere hvordan intervensjonen virker.'
    },
    {
      id: 5,
      title: 'Utvalg og datainnsamling (Punkt c)',
      time: '2:00',
      instruction: 'Utvalg og informasjonskraft (c)',
      ppt: [
        'Utvalg: 46 kvinner (gravide/mødre), 36 fedre, 34 familiemedlemmer, 7 FGDs med 23 frontlinjearbeidere',
        'Datainnsamling: 2024 i fire stammedistrikter i Rajasthan, India',
        'Vurdering: Eksepsjonell bredde og triangulering av aktører (husstands- og lokalsamfunnsnivå)'
      ],
      manus: 'Utvalget er en stor styrke: i stede for bare å intervjue mødrene, involverte de fedre, svigermødre og helsearbeidere. Dette gir en unik innsikt i intra-household dynamics og familiemessige maktforhold.'
    },
    {
      id: 6,
      title: 'Dataanalyse og rammematrise (Punkt d)',
      time: '1:45',
      instruction: 'Analyse og transparens (d)',
      ppt: [
        'Tilnærming: Hybrid deduktiv-induktiv tematisk analyse',
        'Verktøy: Microsoft Excel for rammematrise (Framework matrix)',
        'Vurdering: Systematisk koding av to uavhengige forskere (RS og AD) med konsensusprosedyrer'
      ],
      manus: 'Analysen brukte en hybrid deduktiv-induktiv tilnærming med forhåndsdefinerte temaer kombinert med nye koder fra datamaterialet. Bruken av rammematrise i Excel og uavhengig dobbelkoding sikrer høy transparens og konsistens.'
    },
    {
      id: 7,
      title: 'Hovedfunn: Fire veier til atferdsendring (Punkt e - del 1)',
      time: '1:45',
      instruction: 'Empiriske funn (e)',
      ppt: [
        'Fire mekanismer/veier til endring:',
        '1. Kunnskapsoverføring via veiledning (SBCC)',
        '2. Økonomisk tilrettelegging (Cash transfers som praktisk enabler)',
        '3. Skift i familiens dynamikk (støtte fra menn og svigermødre)',
        '4. Normative endringer og lokalsamfunnsdiffusjon'
      ],
      manus: 'Funnene viser at veiledning skaper motivasjon og bevissthet, mens kontanter fjerner økonomiske barrierer for kjøp av næringsrik mat. Særlig viktig er endringene i familiens dynamikk, der fedre og svigermødre ble involvert, samt lokalsamfunnets normer.'
    },
    {
      id: 8,
      title: 'Tillitsverdighet: Triangulering og validitet (Punkt e - del 2)',
      time: '2:00',
      instruction: 'Kvalitetsvurdering (e)',
      ppt: [
        'Credibility: Svært sterk pga. multippel triangulering (mødre, fedre, svigermødre, arbeidere)',
        'Transferability: God til lignende lav- og middelinntektsland med intervensjonsprogrammer',
        'Confirmability: Støttet av refleksive forskerdiskusjoner rundt posisjon og sosial ønskverdighet'
      ],
      manus: 'Troverdigheten er usedvanlig høy takket være kildetriangulering på tvers av familiemedlemmer. Overførbarheten er relevant for andre Cash-Plus programmer i LMIC, selv om den indiske stammekonteksten har spesifikke kulturelle trekk.'
    },
    {
      id: 9,
      title: 'Refleksivitet og forskerposisjon (Punkt f)',
      time: '1:40',
      instruction: 'Refleksivitet (f)',
      ppt: [
        'Refleksivitet: Forskerteamet diskuterte sin posisjon som eksterne folkehelseforskere',
        'Skjevhetskontroll: Bruk av uavhengige intervjuere og mock-intervju for å unngå ledende spørsmål',
        'Utfordring: Risiko for sosial ønskverdighet fordi intervensjonen var pågående'
      ],
      manus: 'Forfatterne reflekterer åpent over at deltakerne kan ha gitt svar basert på forventninger eller ønske om å fremstå gunstig overfor evaluatorene. Bruken av uavhengige forskere og rollespill/mock-intervju reduserte denne risikoen.'
    },
    {
      id: 10,
      title: 'Forskningsetikk og lokalsamfunn (Punkt g)',
      time: '1:30',
      instruction: 'Etikk og samtykke (g)',
      ppt: [
        'Etiske godkjenninger: Erhvervingsgodkjenning fra institusjoner i India og London',
        'Samtykke: Skriftlig informert samtykke og opptakssikring',
        'Kulturelle hensyn: Respekt for stammetradisjoner («Nata Pratha») og migrasjonsutfordringer'
      ],
      manus: 'Etikken er grundig ivaretatt med formelle komitégodkjenninger i både India og Storbritannia, samt skriftlig samtykke. Studien tar også opp sensitive kulturelle praksiser og grenseoverskridende migrasjon med stor etisk varhet.'
    },
    {
      id: 11,
      title: 'Styrker og forbedringspunkter',
      time: '1:35',
      instruction: 'Balansert metodisk kritikk',
      ppt: [
        'Styrker: Eksepsjonell informasjonsbredde, familiemessig triangulering og klare policy-implikasjoner',
        'Forbedringspunkter: Kan være krevende å skille intervensjonseffekten fra andre pågående statlige programmer'
      ],
      manus: 'Styrken i Sahota et al. er den enorme bredden og dybden i datagrunnlaget. Svakheten, som forfatterne selv påpeker, er at det er vanskelig å isolere nøyaktig hvor mye av atferdsendringen som skyldes akkurat denne Cash-Plus-modellen versus andre samtidige helseinitiativer.'
    },
    {
      id: 12,
      title: 'Samlet konklusjon og oppgavesjekk (a–g)',
      time: '1:30',
      instruction: 'Oppsummering & sjekkliste',
      ppt: [
        'Konklusjon: Internasjonalt forskningsarbeid på toppnivå (A-nivå)',
        'Sjekkliste sjekket: Alle punkter a til g er fullstendig besvart med teoretisk forankring'
      ],
      manus: 'Sahota et al. (2026) representerer kvalitativ global helseforskning av ypperste klasse. Alle oppgavens punkter a til g er grundig besvart med dokumentert rammeverk, triangulering og høy akademisk standard. Takk for oppmerksomheten!'
    }
  ];

  const handleExportMarkdown = () => {
    let md = `# Master-/Ph.d.-presentasjon: ${selectedArticle.title}\n\n`;
    md += `Forfatter(e): ${selectedArticle.authors}\n`;
    md += `Tidsskrift: ${selectedArticle.journal} (${selectedArticle.year})\n\n`;
    md += `## Disposisjon for 20-minutters presentasjon (Svar på a-g):\n\n`;
    
    slides.forEach(s => {
      md += `### Lysbilde ${s.id}: ${s.title} (${s.time})\n`;
      md += `**Fokus:** ${s.instruction}\n\n`;
      md += `**PPT-punkter:**\n`;
      s.ppt.forEach(p => md += `- ${p}\n`);
      md += `\n**Snakkemanus:**\n${s.manus}\n\n---\n\n`;
    });

    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Presentasjon_${selectedArticle.id}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportJson = () => {
    const data = {
      article: selectedArticle,
      slides: slides
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Analyse_Data_${selectedArticle.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const currentSlideData = slides.find(s => s.id === activeSlide) || slides[0];

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 space-y-6">
      {/* Header and export buttons */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800 mb-2">
            Master- / Ph.d.-forsker nivå (20 minutter)
          </span>
          <h2 className="text-xl font-bold text-slate-900">Komplett Presentasjon & Manuskript (Svar på a–g)</h2>
          <p className="text-sm text-slate-600 mt-1">
            Tilpasset for framføring på ca. 18–20 minutter med fullstendig snakkemanus, PPT-punkter, COREQ/Lincoln & Guba-forankring.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleExportMarkdown}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl text-sm transition-colors flex items-center space-x-2 shadow-xs"
          >
            <Download className="w-4 h-4" />
            <span>Last ned manus (.md)</span>
          </button>
          <button
            onClick={handleExportJson}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-medium rounded-xl text-sm transition-colors flex items-center space-x-2 shadow-xs"
          >
            <Download className="w-4 h-4" />
            <span>Eksporter rådata (.json)</span>
          </button>
        </div>
      </div>

      {/* Slide Navigation Thumbnails */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs overflow-x-auto">
        <div className="flex space-x-2 min-w-max pb-2">
          {slides.map(slide => (
            <button
              key={slide.id}
              onClick={() => setActiveSlide(slide.id)}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex flex-col items-center space-y-1 w-24 ${
                activeSlide === slide.id
                  ? 'bg-indigo-600 text-white shadow-md ring-2 ring-indigo-200'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <span>Lysbilde {slide.id}</span>
              <span className="text-[10px] opacity-80 flex items-center">
                <Clock className="w-3 h-3 mr-0.5" /> {slide.time}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Active Slide Detailed View */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
        <div className="flex justify-between items-center border-b border-slate-100 pb-4">
          <div>
            <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">
              Lysbilde {currentSlideData.id} av {slides.length} • Est. tid: {currentSlideData.time}
            </span>
            <h3 className="text-xl font-black text-slate-900 mt-1">{currentSlideData.title}</h3>
          </div>
          <span className="px-3 py-1 bg-slate-100 text-slate-700 text-xs font-semibold rounded-full">
            {currentSlideData.instruction}
          </span>
        </div>

        {/* PPT points box */}
        <div className="bg-slate-900 text-white p-6 rounded-xl shadow-inner space-y-3">
          <div className="flex items-center space-x-2 text-indigo-300 text-xs font-bold uppercase tracking-wider">
            <Presentation className="w-4 h-4" />
            <span>PowerPoint-punkter (Visuelt på lerretet)</span>
          </div>
          <ul className="space-y-2">
            {currentSlideData.ppt.map((pt, i) => (
              <li key={i} className="text-sm sm:text-base flex items-start space-x-2 font-medium">
                <span className="text-indigo-400 font-bold">•</span>
                <span>{pt}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Speaker script box */}
        <div className="bg-indigo-50/50 p-6 rounded-xl border border-indigo-100 space-y-3">
          <div className="flex items-center space-x-2 text-indigo-900 text-xs font-bold uppercase tracking-wider">
            <UserCheck className="w-4 h-4 text-indigo-600" />
            <span>Talemanus (Akademisk og naturlig tale)</span>
          </div>
          <p className="text-sm sm:text-base text-slate-800 leading-relaxed font-serif whitespace-pre-line">
            "{currentSlideData.manus}"
          </p>
        </div>

        {/* Navigation bottom */}
        <div className="flex justify-between pt-4 border-t border-slate-100">
          <button
            onClick={() => setActiveSlide(prev => Math.max(1, prev - 1))}
            disabled={activeSlide === 1}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold disabled:opacity-50 transition-colors"
          >
            Forrige lysbilde
          </button>
          <span className="text-sm text-slate-500 font-medium self-center">
            {activeSlide} / {slides.length}
          </span>
          <button
            onClick={() => setActiveSlide(prev => Math.min(slides.length, prev + 1))}
            disabled={activeSlide === slides.length}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold disabled:opacity-50 transition-colors"
          >
            Neste lysbilde
          </button>
        </div>
      </div>
    </div>
  );
};
