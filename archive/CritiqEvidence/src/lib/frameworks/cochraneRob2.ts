import { ChecklistCriterion } from '@/types/frameworks';

export const COCHRANE_ROB_2_CRITERIA: ChecklistCriterion[] = [
  {
    id: 'rob2_d1',
    code: 'ROB2_D1',
    questionText: 'Domene 1: Skjevhet som oppstår fra randomiseringsprosessen (Randomization)',
    helpText: 'Var allokeringssekvensen tilfeldig og tilstrekkelig skjult (allocation concealment)? Fantes det baseline-ubalanse?',
    mandatory: true,
  },
  {
    id: 'rob2_d2',
    code: 'ROB2_D2',
    questionText: 'Domene 2: Skjevhet på grunn av avvik fra tiltenkte intervensjoner (Deviations)',
    helpText: 'Ble deltakere og behandlere blindet? Ble protokollavvik håndtert med intention-to-treat (ITT)?',
    mandatory: true,
  },
  {
    id: 'rob2_d3',
    code: 'ROB2_D3',
    questionText: 'Domene 3: Skjevhet som skyldes manglende utfallsdata (Missing outcome data)',
    helpText: 'Var data tilgjengelig for nesten alle randomiserte? Er årsaker til frafall balansert og drøftet?',
    mandatory: true,
  },
  {
    id: 'rob2_d4',
    code: 'ROB2_D4',
    questionText: 'Domene 4: Skjevhet i måling av utfallet (Measurement of outcome)',
    helpText: 'Var utfallsvurdererne blindet for intervensjonen? Var målemetoden valid og lik mellom grupper?',
    mandatory: true,
  },
  {
    id: 'rob2_d5',
    code: 'ROB2_D5',
    questionText: 'Domene 5: Skjevhet i seleksjon av det rapporterte resultatet (Selective reporting)',
    helpText: 'Ble resultatene analysert i tråd med en forhåndsdefinert plan/protokoll før avblinding?',
    mandatory: true,
  },
];
