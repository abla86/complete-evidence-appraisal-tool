import type { AppraisalInstrument, InstrumentQuestionItem } from '../types';

const q = (
  id: number,
  shortTitle: string,
  questionText: string,
  allowedAnswers: string[],
  domain?: string,
  isCritical = false,
): InstrumentQuestionItem => ({ id, itemNumber: id, shortTitle, questionText, allowedAnswers, domain, isCritical });

const AMSTAR_2_QUESTIONS: InstrumentQuestionItem[] = [
  q(1,'Protokoll før gjennomføring','Var vurderingsprotokollen fastlagt før oversikten ble gjennomført, og er eventuelle avvik forklart?',['Ja','Delvis ja','Nei','Ingen meta-analyse utført'],'Metode og protokoll'),
  q(2,'PICO og studiedesign','Var inklusjonskriteriene og PICO-komponentene tydelig definert og passende?',['Ja','Delvis ja','Nei','Ingen meta-analyse utført'],'Inklusjonskriterier',true),
  q(3,'Forklaring av ekskluderte studier','Ble de ekskluderte fulltekstartiklene dokumentert med tilstrekkelig begrunnelse?',['Ja','Delvis ja','Nei','Ingen meta-analyse utført'],'Studieutvalg'),
  q(4,'Litteratursøk','Var søket tilstrekkelig omfattende, transparent og reproduserbart?',['Ja','Delvis ja','Nei','Ingen meta-analyse utført'],'Litteratursøk',true),
  q(5,'Duplikatstudier','Ble flere rapporter fra samme studie identifisert og håndtert korrekt?',['Ja','Delvis ja','Nei','Ingen meta-analyse utført'],'Studieutvalg'),
  q(6,'Dataekstraksjon','Ble data ekstrahert på en måte som reduserer feil og utelatelser?',['Ja','Delvis ja','Nei','Ingen meta-analyse utført'],'Dataekstraksjon'),
  q(7,'Risk of Bias','Ble risiko for bias vurdert med en egnet og dokumentert metode?',['Ja','Delvis ja','Nei','Ingen meta-analyse utført'],'Risk of Bias',true),
  q(8,'Finansiering av inkluderte studier','Ble finansieringskilder og relevante interessekonflikter for de inkluderte studiene rapportert?',['Ja','Delvis ja','Nei','Ingen meta-analyse utført'],'Finansiering',true),
  q(9,'Meta-analysemetode','Var den statistiske metoden egnet når en meta-analyse ble gjennomført?',['Ja','Delvis ja','Nei','Ingen meta-analyse utført'],'Syntese',true),
  q(10,'Heterogenitet','Ble statistisk og metodisk heterogenitet undersøkt og håndtert?',['Ja','Delvis ja','Nei','Ingen meta-analyse utført'],'Syntese'),
  q(11,'Publiseringsbias','Ble mulige småstudieeffekter eller publiseringsbias undersøkt på en egnet måte?',['Ja','Delvis ja','Nei','Ingen meta-analyse utført'],'Publiseringsbias',true),
  q(12,'Sensitivitetsanalyser','Ble robustheten av resultatene undersøkt gjennom relevante sensitivitetsanalyser?',['Ja','Delvis ja','Nei','Ingen meta-analyse utført'],'Syntese'),
  q(13,'Risk of Bias i tolkningen','Ble risiko for bias i primærstudiene tatt hensyn til ved tolkning av resultatene?',['Ja','Delvis ja','Nei','Ingen meta-analyse utført'],'Tolkning',true),
  q(14,'Heterogenitet i konklusjonen','Ble årsaker til heterogenitet undersøkt før konklusjoner ble trukket?',['Ja','Delvis ja','Nei','Ingen meta-analyse utført'],'Tolkning'),
  q(15,'Publiseringsbias i konklusjonen','Ble mulig publiseringsbias tatt hensyn til i samlet tolkning?',['Ja','Delvis ja','Nei','Ingen meta-analyse utført'],'Tolkning',true),
  q(16,'Interessekonflikter i oversikten','Ble finansiering av oversikten og forfatternes interessekonflikter rapportert?',['Ja','Delvis ja','Nei','Ingen meta-analyse utført'],'Finansiering'),
];

const AGREE_II_QUESTIONS: InstrumentQuestionItem[] = [
  q(1,'Formål','Retningslinjens overordnede mål er klart beskrevet.',['1','2','3','4','5','6','7'],'Omfang og formål'),
  q(2,'Helsespørsmål','De kliniske spørsmålene som retningslinjen gjelder er tydelig formulert.',['1','2','3','4','5','6','7'],'Omfang og formål'),
  q(3,'Målgruppe','Populasjonen som retningslinjen gjelder for er tydelig definert.',['1','2','3','4','5','6','7'],'Omfang og formål'),
  q(4,'Interessenter','Den relevante faglige ekspertisen og målgruppen er involvert i utviklingen.',['1','2','3','4','5','6','7'],'Interessentinvolvering'),
  q(5,'Pasientperspektiv','Pasienters og brukeres perspektiver og preferanser er innhentet.',['1','2','3','4','5','6','7'],'Interessentinvolvering'),
  q(6,'Målgruppeforventninger','Målgruppens synspunkter er dokumentert og tatt hensyn til.',['1','2','3','4','5','6','7'],'Interessentinvolvering'),
  q(7,'Systematisk metode','Systematiske metoder ble brukt for å finne evidensen.',['1','2','3','4','5','6','7'],'Metodisk stringens',true),
  q(8,'Evidensutvelgelse','Kriteriene for å velge evidens er tydelig beskrevet.',['1','2','3','4','5','6','7'],'Metodisk stringens',true),
  q(9,'Styrker og begrensninger','Evidensens styrker og begrensninger er tydelig beskrevet.',['1','2','3','4','5','6','7'],'Metodisk stringens',true),
  q(10,'Metode for anbefalinger','Metoden for å formulere anbefalingene er tydelig beskrevet.',['1','2','3','4','5','6','7'],'Metodisk stringens',true),
  q(11,'Helsegevinster og risiko','Helsegevinster, bivirkninger og risiko er vurdert ved formulering av anbefalingene.',['1','2','3','4','5','6','7'],'Metodisk stringens',true),
  q(12,'Kobling evidens-anbefaling','Det finnes en tydelig kobling mellom anbefalingene og evidensen som støtter dem.',['1','2','3','4','5','6','7'],'Metodisk stringens',true),
  q(13,'Ekstern fagfellevurdering','Retningslinjen er vurdert av eksterne eksperter før publisering.',['1','2','3','4','5','6','7'],'Metodisk stringens',true),
  q(14,'Oppdateringsprosedyre','Det er beskrevet hvordan retningslinjen skal oppdateres.',['1','2','3','4','5','6','7'],'Metodisk stringens',true),
  q(15,'Spesifikke anbefalinger','Anbefalingene er konkrete og entydige.',['1','2','3','4','5','6','7'],'Klarhet'),
  q(16,'Ulike alternativer','Ulike muligheter for håndtering av tilstanden er tydelig presentert.',['1','2','3','4','5','6','7'],'Klarhet'),
  q(17,'Nøkkelanbefalinger','De viktigste anbefalingene er lett å identifisere.',['1','2','3','4','5','6','7'],'Klarhet'),
  q(18,'Implementeringsbarrierer','Retningslinjen beskriver faktorer som kan fremme eller hindre bruk.',['1','2','3','4','5','6','7'],'Anvendelighet'),
  q(19,'Kostnader og ressurser','Mulige ressursmessige konsekvenser ved å følge anbefalingene er vurdert.',['1','2','3','4','5','6','7'],'Anvendelighet'),
  q(20,'Monitorering','Det er beskrevet kriterier for å følge med på bruk og effekt.',['1','2','3','4','5','6','7'],'Anvendelighet'),
  q(21,'Verktøy for bruk','Retningslinjen støttes av praktiske verktøy eller råd for implementering.',['1','2','3','4','5','6','7'],'Anvendelighet'),
  q(22,'Redaksjonell uavhengighet','Finansiering har ikke styrt eller påvirket anbefalingene.',['1','2','3','4','5','6','7'],'Redaksjonell uavhengighet',true),
  q(23,'Interessekonflikter','Interessekonflikter hos utviklingsgruppen er dokumentert og håndtert.',['1','2','3','4','5','6','7'],'Redaksjonell uavhengighet',true),
];

const ROB2_QUESTIONS = [
  q(1,'Randomiseringsprosessen','Er randomiseringen og allokeringsskjulingen tilstrekkelig til å begrense bias?',['Low risk','Some concerns','High risk'],'D1 Randomiseringsprosess',true),
  q(2,'Avvik fra planlagt intervensjon','Kan avvik fra den planlagte intervensjonen ha påvirket estimatet?',['Low risk','Some concerns','High risk'],'D2 Avvik fra intervensjon',true),
  q(3,'Manglende utfallsdata','Er mengden og håndteringen av manglende utfallsdata tilstrekkelig?',['Low risk','Some concerns','High risk'],'D3 Manglende data',true),
  q(4,'Måling av utfallet','Er utfallet målt på en måte som begrenser risiko for målebias?',['Low risk','Some concerns','High risk'],'D4 Måling av utfall',true),
  q(5,'Valg av rapportert resultat','Er det lite grunnlag for at resultatet ble valgt selektivt blant analyser eller målinger?',['Low risk','Some concerns','High risk'],'D5 Selektiv rapportering',true),
];

const ROBINS_I_QUESTIONS = [
  q(1,'Konfundering','Er viktige prognostiske faktorer og potensielle konfoundere tilstrekkelig håndtert?',['Low risk','Moderate risk','Serious risk','Critical risk','No information'],'D1 Konfundering',true),
  q(2,'Studieutvalg','Er det liten risiko for bias i hvordan deltakerne kom inn i studien?',['Low risk','Moderate risk','Serious risk','Critical risk','No information'],'D2 Utvalg'),
  q(3,'Klassifisering av intervensjon','Er intervensjonen klassifisert korrekt uten systematiske feil?',['Low risk','Moderate risk','Serious risk','Critical risk','No information'],'D3 Intervensjonsklassifisering'),
  q(4,'Avvik fra intervensjon','Er det liten risiko for bias på grunn av avvik fra tiltenkt intervensjon?',['Low risk','Moderate risk','Serious risk','Critical risk','No information'],'D4 Avvik'),
  q(5,'Manglende data','Er manglende utfallsdata håndtert slik at resultatet ikke systematisk skjevfordeles?',['Low risk','Moderate risk','Serious risk','Critical risk','No information'],'D5 Manglende data'),
  q(6,'Måling av utfall','Er utfallet målt uten systematiske forskjeller mellom gruppene?',['Low risk','Moderate risk','Serious risk','Critical risk','No information'],'D6 Utfallsmåling'),
  q(7,'Valg av rapportert resultat','Er det liten risiko for selektiv rapportering av resultatet?',['Low risk','Moderate risk','Serious risk','Critical risk','No information'],'D7 Rapportert resultat'),
];

const RUNTIME_QUESTIONS: Record<string, InstrumentQuestionItem[]> = {
  'amstar-2': AMSTAR_2_QUESTIONS,
  'agree-ii': AGREE_II_QUESTIONS,
  'rob-2': ROB2_QUESTIONS,
  'robins-i': ROBINS_I_QUESTIONS,
};

export function getInstrumentQuestions(instrument: AppraisalInstrument): InstrumentQuestionItem[] {
  return instrument.questions?.length ? instrument.questions : (RUNTIME_QUESTIONS[instrument.id] ?? []);
}
