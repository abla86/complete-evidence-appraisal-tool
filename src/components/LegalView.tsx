import React from 'react';
import { LEGAL_LAST_UPDATED, SELLER, sellerContactLine } from '../legal/seller';
import { NETWORK_CATEGORIES } from '../services/networkPolicy';
import { APP_VERSION, EDITION } from '../runtime/edition';

export type LegalSection = 'seller' | 'terms' | 'withdrawal' | 'privacy' | 'cookies' | 'disclaimer' | 'accessibility' | 'conduct';

export const LEGAL_SECTIONS: Array<{ id: LegalSection; label: string }> = [
  { id: 'disclaimer', label: 'Ansvarsfraskrivelse' },
  { id: 'terms', label: 'Bruksvilkår og lisens' },
  { id: 'withdrawal', label: 'Angrerett og refusjon' },
  { id: 'privacy', label: 'Personvernerklæring' },
  { id: 'cookies', label: 'Informasjonskapsler og lagring' },
  { id: 'conduct', label: 'Atferdsregler og forskningsetikk' },
  { id: 'accessibility', label: 'Universell utforming' },
  { id: 'seller', label: 'Om selger' },
];

const H = ({ children }: { children: React.ReactNode }) => <h3 className="text-base font-bold text-slate-900 mt-5">{children}</h3>;
const P = ({ children }: { children: React.ReactNode }) => <p className="text-sm leading-6 text-slate-700 mt-2">{children}</p>;
const L = ({ items }: { items: React.ReactNode[] }) => <ul className="list-disc pl-5 mt-2 space-y-1 text-sm leading-6 text-slate-700">{items.map((item, i) => <li key={i}>{item}</li>)}</ul>;

function SellerBlock() {
  return <L items={[
    <>Selger: <strong>{SELLER.name}</strong> (eier: {SELLER.owner})</>,
    <>Organisasjonsnummer: {SELLER.organisationNumber}{SELLER.vatRegistered ? ' MVA' : ''} – <a className="underline" href={SELLER.brregUrl} target="_blank" rel="noreferrer noopener">oppslag i Brønnøysundregistrene</a></>,
    <>Adresse: {SELLER.address}</>,
    <>E-post: {sellerContactLine()}</>,
  ]} />;
}

const sections: Record<LegalSection, () => React.ReactElement> = {
  seller: () => <>
    <SellerBlock />
    <P>Programvareversjon {APP_VERSION} ({EDITION === 'offline' ? 'nedlastbar utgave' : 'nettutgave'}).</P>
  </>,

  disclaimer: () => <>
    <P><strong>Verktøyet støtter kritisk vurdering av forskning. Det erstatter ikke faglig skjønn, veiledning eller en fagfellevurdering.</strong></P>
    <L items={[
      'Resultater, klassifiseringer, instrumentforslag og tolkninger må kontrolleres mot originalartikkelen og den offisielle versjonen av instrumentet før de brukes i studier, publikasjoner, undervisning, kliniske beslutninger eller forvaltning.',
      'Verktøyet er ikke medisinsk utstyr og skal ikke brukes til diagnostikk, behandling eller beslutninger om enkeltpasienter.',
      'Instrumentregisteret inneholder flere verktøy enn det som er ferdig implementert. Bare instrumenter med registrerte vurderingspunkter kan fylles ut; de øvrige vises med tydelig merking og blir ikke presentert som fullt implementert.',
      'Vurderingspunktene er norske arbeidsformuleringer/parafraser laget for dette verktøyet. De er ikke offisielle oversettelser. Bruk originalinstrumentet som fasit og oppgi det i metodebeskrivelsen.',
      'KI-forslag er valgfrie, kan være feil og skal alltid verifiseres av en person før bruk. KI brukes bare når du selv slår det på.',
      'Data lagres lokalt i nettleseren på enheten din. Låste vurderinger kan ikke endres i appen, og revisjonsloggen er hash-kjedet slik at endringer kan oppdages, men lokal lagring er ikke manipulasjonssikker. Ta jevnlig sikkerhetskopi (zip).',
      'Tester og automatiske kontroller reduserer feil, men beviser ikke at all funksjonalitet er feilfri.',
    ]} />
  </>,

  terms: () => <>
    <P>Sist oppdatert {LEGAL_LAST_UPDATED}. Vilkårene gjelder bruk av Evidence Appraisal Tool («verktøyet»), levert av selger angitt under «Om selger».</P>
    <H>1. Lisenstyper</H>
    <L items={[
      <><strong>Prøvetilgang:</strong> tidsbegrenset tilgang til nettutgaven for én innlogget bruker, én gang per konto.</>,
      <><strong>Nettilgang (abonnement):</strong> tilgang til nettutgaven så lenge abonnementet er aktivt. Nettutgaven kan installeres som app og brukes uten nett frem til lisensen må fornyes.</>,
      <><strong>Nedlastingslisens (engangskjøp):</strong> varig rett til å bruke den nedlastbare utgaven av den versjonen som ble kjøpt, for det antall brukere lisensen angir. Den virker uten nett og uten server.</>,
    ]} />
    <P>Pris, betalingsmåte og hva som inngår vises før kjøp. Betaling skjer via Stripe. Lisensnøkkelen er personlig for lisensinnehaveren (eller institusjonen) og skal ikke deles utover antall brukere lisensen gjelder.</P>
    <H>2. Bruksrett og begrensninger</H>
    <L items={[
      'Du får en ikke-eksklusiv, ikke-overførbar rett til å bruke verktøyet i samsvar med lisensen.',
      'Det er ikke tillatt å videreselge, dele ut eller publisere den nedlastbare filen eller lisensnøkler, eller å omgå lisenskontrollen.',
      'Tredjeparts vurderingsinstrumenter (f.eks. JBI, CASP, AMSTAR 2, RoB 2, ROBINS-I, AGREE II, GRADE) tilhører sine rettighetshavere. Lisensen til verktøyet gir ingen rettigheter til selve instrumentene. Du er selv ansvarlig for å følge vilkårene til instrumentene du bruker, særlig ved kommersiell bruk.',
      'Innhold du legger inn (artikler, PDF-er, notater) er ditt. Du er ansvarlig for at du har rett til å behandle det, inkludert opphavsrett og personvern.',
    ]} />
    <H>3. Ansvar</H>
    <P>Se «Ansvarsfraskrivelse». Selger er ikke ansvarlig for indirekte tap, tap av data eller følgeskader som skyldes bruk av verktøyet, så langt dette er tillatt etter norsk lov. Begrensningene gjelder ikke ansvar som følger av ufravikelige forbrukerregler, eller skade voldt forsettlig eller grovt uaktsomt.</P>
    <H>4. Mangler og reklamasjon</H>
    <P>Forbrukere har rettigheter etter forbrukerkjøpsloven kapittel 5 a om digitale ytelser. Meld fra om feil til selger innen rimelig tid etter at du oppdaget dem.</P>
    <H>5. Endringer og oppsigelse</H>
    <P>Abonnement kan sies opp når som helst med virkning fra neste fornyelse. Vesentlige endringer i vilkårene varsles før de trer i kraft for løpende abonnement.</P>
    <H>6. Lovvalg og tvister</H>
    <P>Norsk rett gjelder. Tvister søkes løst i minnelighet. Forbrukere kan klage til Forbrukertilsynet/Forbrukerrådet og har rett til å bringe saken inn for Forbrukerklageutvalget eller domstolene.</P>
  </>,

  withdrawal: () => <>
    <P>Forbrukere har 14 dagers angrerett ved kjøp på nett etter angrerettloven.</P>
    <L items={[
      <><strong>Nettilgang (abonnement):</strong> Du kan gå fra avtalen innen 14 dager. Har du bedt om at tjenesten skal starte i angrefristen, kan selger kreve betaling for den delen av perioden du har brukt (angrerettloven § 25).</>,
      <><strong>Nedlastingslisens (digitalt innhold):</strong> Angreretten bortfaller når levering (nedlasting/lisensnøkkel) har startet, men bare dersom du uttrykkelig har samtykket i at leveringen starter i angrefristen og bekreftet at angreretten da går tapt (angrerettloven § 22 bokstav n). Uten slikt samtykke gjelder full 14 dagers angrerett.</>,
      <><strong>Prøvetilgang</strong> er gratis og forplikter ikke til kjøp.</>,
    ]} />
    <P>Slik bruker du angreretten: send en utvetydig melding til selger (e-post: {sellerContactLine()}) med navn, kjøpsdato og lisens-ID eller kvittering. Du kan bruke standard angreskjema. Tilbakebetaling skjer uten unødig opphold og senest 14 dager etter at meldingen er mottatt, med samme betalingsmiddel. Lisensen deaktiveres ved tilbakebetaling.</P>
    <P>Utover lovpålagt angrerett gis refusjon ved feil som selger ikke retter innen rimelig tid.</P>
  </>,

  privacy: () => <>
    <P>Sist oppdatert {LEGAL_LAST_UPDATED}. Behandlingsansvarlig for personopplysninger knyttet til kjøp, lisens og konto er selger (se «Om selger»).</P>
    <H>Forskningsdata blir på din enhet</H>
    <P>Artikler, PDF-er, vurderinger, referanser, notater og revisjonslogg lagres lokalt i nettleseren din. PDF-er og dokumenter tolkes lokalt og lastes aldri opp. Selger har ikke tilgang til disse dataene med mindre du selv slår på skysynkronisering eller KI-analyse.</P>
    <H>Nettverksbruk du styrer selv (standard: av)</H>
    <L items={Object.values(NETWORK_CATEGORIES).map(c => <><strong>{c.label}:</strong> sender {c.sends.charAt(0).toLowerCase() + c.sends.slice(1)} Mottakere: {c.recipients}</>)} />
    <P>Under Personvern → Nettverk ser du en logg over alle utgående forespørsler (adresse og tidspunkt, ikke innhold).</P>
    <H>Opplysninger selger behandler</H>
    <L items={[
      'Lisens og kjøp: e-post/navn på lisensinnehaver, lisens-ID, produkt, gyldighet og abonnement-ID. Grunnlag: avtale (GDPR art. 6 nr. 1 b). Regnskapsopplysninger oppbevares i 5 år etter bokføringsloven.',
      'Betaling håndteres av Stripe. Selger mottar ikke kortnummer. Stripe behandler opplysninger etter egne vilkår og personvernerklæring.',
      'Innlogging (kun nettutgaven, valgfritt): Google-konto-ID, navn og e-post. Grunnlag: avtale. Prøveperioden registreres som en enveis-hash av konto-ID-en for å hindre gjentatt prøvetilgang.',
      'KI-analyse (valgfritt): dokumenttekst sendes til Google Gemini API bare når du har slått på KI og bekrefter hver analyse. Grunnlag: samtykke (art. 6 nr. 1 a), som kan trekkes tilbake når som helst.',
      'Teknisk drift: IP-adresse brukes i minnet til rate-begrensning og lagres ikke av appen. Driftsleverandøren kan føre egne tilgangslogger.',
    ]} />
    <P>Google og Stripe kan overføre opplysninger til USA. Overføringen skjer på grunnlag av EUs beslutning om tilstrekkelig beskyttelsesnivå (EU–US Data Privacy Framework) og/eller EUs standard personvernbestemmelser.</P>
    <H>Dine rettigheter</H>
    <P>Du har rett til innsyn, retting, sletting, begrensning, dataportabilitet og å protestere, og til å trekke tilbake samtykke. Lokale data sletter du selv under Personvern i appen. Du kan klage til Datatilsynet (datatilsynet.no).</P>
    <H>Personopplysninger i forskningen din</H>
    <P>Ikke legg inn identifiserbare pasient- eller deltakeropplysninger. Behandler du personopplysninger i eget prosjekt, er du eller institusjonen din behandlingsansvarlig og må følge GDPR, helseforskningsloven og institusjonens regler.</P>
  </>,

  cookies: () => <>
    <P>Nettutgaven bruker bare informasjonskapsler som er strengt nødvendige for tjenesten du ber om: innloggingsøkt, beskyttelse av innloggingsflyten (state) og lisensøkt for serverfunksjoner. De er ikke brukt til sporing, statistikk eller markedsføring, og krever derfor ikke samtykke etter ekomlovens regler om informasjonskapsler.</P>
    <P>Arbeidsdata lagres i nettleserens lokale lagring på enheten din. Den nedlastbare utgaven bruker ingen informasjonskapsler.</P>
  </>,

  conduct: () => <>
    <P>Verktøyet skal brukes i tråd med god vitenskapelig praksis, forskningsetikkloven og De nasjonale forskningsetiske komiteenes retningslinjer.</P>
    <L items={[
      'Ikke bruk verktøyet til å fabrikere, forfalske eller plagiere data eller vurderinger. Oppgi at vurderingene er gjort med dette verktøyet og hvilket instrument og hvilken versjon som er brukt.',
      'Respekter opphavsrett: last bare inn artikler og PDF-er du har lovlig tilgang til, og del dem ikke videre i strid med lisensen.',
      'Ikke legg inn identifiserbare pasient- eller deltakeropplysninger eller annen taushetsbelagt informasjon.',
      'Ved uenighet i dobbel vurdering skal konsensus dokumenteres med begrunnelse, ikke overskrives stille.',
      'Sikkerhetsfeil meldes privat til selger (se SECURITY.md i kildekoden), ikke offentlig.',
    ]} />
    <P>For bidrag til kildekoden gjelder Contributor Covenant (CODE_OF_CONDUCT.md).</P>
  </>,

  accessibility: () => <>
    <P>Målet er å oppfylle WCAG 2.1 nivå AA i tråd med likestillings- og diskrimineringsloven om universell utforming av IKT. Verktøyet er ikke revidert av en uavhengig part ennå, og vi kjenner til at enkelte avanserte visninger (diagrammer, PDF-markering) kan være vanskelige å bruke med skjermleser.</P>
    <P>Meld fra om tilgjengelighetsproblemer til {sellerContactLine()}.</P>
  </>,
};

export const LegalView: React.FC<{ section: LegalSection; onSelect: (section: LegalSection) => void }> = ({ section, onSelect }) => {
  const Section = sections[section];
  const label = LEGAL_SECTIONS.find(s => s.id === section)?.label ?? '';
  return <section className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-8 mb-10">
    <nav aria-label="Juridisk informasjon" className="flex flex-wrap gap-2 mb-6">{LEGAL_SECTIONS.map(s => <button key={s.id} type="button" aria-current={s.id === section ? 'page' : undefined} onClick={() => onSelect(s.id)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${s.id === section ? 'bg-teal-800 text-white' : 'bg-slate-100 text-slate-700'}`}>{s.label}</button>)}</nav>
    <h2 className="text-2xl font-bold font-serif text-slate-900">{label}</h2>
    <Section />
    <div className="mt-8 border-t border-slate-200 pt-4"><SellerBlock /></div>
  </section>;
};
