import test from 'node:test';
import assert from 'node:assert/strict';

class MemoryStorage {
  constructor() {
    this.date = new Map();
  }
  getItem(cheie) {
    return this.date.has(cheie) ? this.date.get(cheie) : null;
  }
  setItem(cheie, valoare) {
    this.date.set(cheie, String(valoare));
  }
  removeItem(cheie) {
    this.date.delete(cheie);
  }
  clear() {
    this.date.clear();
  }
}

globalThis.localStorage = new MemoryStorage();

const {
  calculeazaClasamentComplet,
  calculeazaSituatieElev,
  calculeazaSituatieMaterie,
  determinaAnScolar,
  esteInPerioadaExamene,
  obtineContext,
} = await import('../js/situatie-scolara.js');
const { salveazaSituatie } = await import('../js/situatie-store.js');
const { proceseazaDateReligiePenticostala } = await import('../js/religie-penticostala.js');

function nota(elev, valoare, materie) {
  return { Elev: elev, Nota: String(valoare), Data: '10/10/2025', Materie: materie, Clasa: 'XI D' };
}

function absenta(elev, motivata = 'Nu') {
  return {
    Elev: elev,
    Data: '10/10/2025',
    Motivata: motivata,
    'Tip motivare': motivata === 'Da' ? 'Alt motiv' : '',
    Materie: 'Matematică',
    Clasa: 'XI D',
  };
}

function dateDeTest() {
  return {
    clasa: 'XI D',
    anScolar: '2025-2026',
    dataRaport: '08/08/2026 23:16',
    elevi: ['Elev A', 'Elev B'],
    materii: ['Limba română', 'Matematică', 'Purtare'],
    note: [
      nota('Elev A', 10, 'Limba română'),
      nota('Elev A', 4, 'Matematică'),
      nota('Elev A', 4, 'Matematică'),
      nota('Elev A', 5, 'Matematică'),
      nota('Elev A', 10, 'Purtare'),
      nota('Elev A', 10, 'Purtare'),
      nota('Elev A', 10, 'Purtare'),
      nota('Elev A', 10, 'Purtare'),
      nota('Elev A', 7, 'Purtare'),
      nota('Elev B', 10, 'Limba română'),
      nota('Elev B', 4, 'Matematică'),
      nota('Elev B', 5, 'Matematică'),
    ],
    absente: Array.from({ length: 20 }, () => absenta('Elev A')),
    mediiSpeciale: [],
  };
}

test.beforeEach(() => localStorage.clear());

test('determină anul școlar din data raportului', () => {
  assert.equal(determinaAnScolar('08/08/2026 23:16'), '2025-2026');
  assert.equal(determinaAnScolar('15/09/2026 08:00'), '2026-2027');
});

test('nota la purtare combină media disciplinară cu penalizarea absențelor', () => {
  const date = dateDeTest();
  const situatie = calculeazaSituatieMaterie(date, 'Elev A', 'Purtare');
  assert.equal(situatie.mediaExactaInitiala, 9.4);
  assert.equal(situatie.mediaDisciplinaraRotunjita, 9);
  assert.equal(situatie.penalizarePurtare, 1);
  assert.equal(situatie.mediaInitiala, 8);
});

test('100 sau mai multe absențe duc nota 10 la purtare la 5', () => {
  const date = dateDeTest();
  date.absente = Array.from({ length: 100 }, () => absenta('Elev B'));
  const situatie = calculeazaSituatieMaterie(date, 'Elev B', 'Purtare');
  assert.equal(situatie.penalizarePurtare, 5);
  assert.equal(situatie.mediaInitiala, 5);
  assert.equal(calculeazaSituatieElev(date, 'Elev B').nepromovatPrinPurtare, true);
  assert.equal(calculeazaSituatieElev(date, 'Elev B').mediaGenerala, null);
});

test('pragul de corigență folosește media exactă sub 4,50', () => {
  const date = dateDeTest();
  assert.equal(calculeazaSituatieMaterie(date, 'Elev A', 'Matematică').corigentInitial, true);
  assert.equal(calculeazaSituatieMaterie(date, 'Elev B', 'Matematică').corigentInitial, false);
});

test('rezultatul corigenței înlocuiește media, iar o notă sub 5 elimină elevul din clasament', () => {
  const date = dateDeTest();
  const context = obtineContext(date);
  salveazaSituatie(context, 'Elev A', 'Matematică', { rezultatCorigenta: 7 });
  assert.equal(calculeazaSituatieElev(date, 'Elev A').mediaGenerala.toFixed(2), '8.33');

  salveazaSituatie(context, 'Elev A', 'Matematică', { rezultatCorigenta: 4 });
  const situatie = calculeazaSituatieElev(date, 'Elev A');
  assert.equal(situatie.nepromovat, true);
  assert.equal(situatie.mediaGenerala, null);
  const clasament = calculeazaClasamentComplet(date);
  assert.equal(clasament.at(-1).elev, 'Elev A');
  assert.equal(clasament.at(-1).pozitie, null);
});

test('materia neîncheiată este exclusă provizoriu și poate genera apoi corigență', () => {
  const date = dateDeTest();
  const context = obtineContext(date);
  salveazaSituatie(context, 'Elev B', 'Limba română', { neincheiat: true });
  assert.equal(calculeazaSituatieElev(date, 'Elev B').mediaGenerala.toFixed(2), '7.50');

  salveazaSituatie(context, 'Elev B', 'Limba română', { rezultatIncheiere: 4 });
  let materia = calculeazaSituatieMaterie(date, 'Elev B', 'Limba română');
  assert.equal(materia.corigentDupaIncheiere, true);
  assert.equal(materia.mediaPentruGenerala, 4);

  salveazaSituatie(context, 'Elev B', 'Limba română', { rezultatCorigenta: 8 });
  materia = calculeazaSituatieMaterie(date, 'Elev B', 'Limba română');
  assert.equal(materia.mediaPentruGenerala, 8);
  assert.equal(materia.neincheiat, true);
});

test('salvările sunt izolate pe an școlar', () => {
  const date = dateDeTest();
  salveazaSituatie(obtineContext(date), 'Elev B', 'Limba română', { neincheiat: true });
  const anulUrmator = { ...date, anScolar: '2026-2027' };
  assert.equal(calculeazaSituatieMaterie(anulUrmator, 'Elev B', 'Limba română').neincheiat, false);
});

test('importul Religiei penticostale acceptă totaluri și liste cu date', () => {
  const importat = proceseazaDateReligiePenticostala(
    {
      anScolar: '2025-2026',
      elevi: [
        {
          clasa: 'XI D',
          nume: 'Elev A',
          media: 10,
          absente: { motivate: [{ data: '12/10/2025' }], nemotivate: 2 },
        },
      ],
    },
    { elevi: ['Elev A'], clasa: 'XI D', anScolar: '2025-2026' }
  );
  assert.equal(importat.eleviGasiti, 1);
  assert.equal(importat.mediiSpeciale[0].media, 10);
  assert.equal(importat.absente.length, 3);
  assert.equal(importat.absente.filter((item) => item.Motivata === 'Nu').length, 2);
});

test('media penticostală intră în media generală, iar absențele ei penalizează purtarea', () => {
  const date = dateDeTest();
  date.materii.push('Religie penticostală');
  date.mediiSpeciale = [
    { elev: 'Elev B', materie: 'Religie penticostală', media: 9, sursa: 'religie-penticostala' },
  ];
  date.absente = Array.from({ length: 20 }, () => ({
    ...absenta('Elev B'),
    Materie: 'Religie penticostală',
    _sursa: 'religie-penticostala',
  }));

  assert.equal(calculeazaSituatieMaterie(date, 'Elev B', 'Purtare').mediaInitiala, 9);
  assert.equal(calculeazaSituatieElev(date, 'Elev B').mediaGenerala.toFixed(2), '8.25');
});

test('perioada configurată include limitele 15 iunie și 15 septembrie', () => {
  assert.equal(esteInPerioadaExamene(new Date(2026, 5, 15)), true);
  assert.equal(esteInPerioadaExamene(new Date(2026, 8, 15)), true);
  assert.equal(esteInPerioadaExamene(new Date(2026, 5, 14)), false);
  assert.equal(esteInPerioadaExamene(new Date(2026, 8, 16)), false);
});
