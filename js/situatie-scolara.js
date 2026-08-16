import CONFIG from './config.js';
import {
  calculeazaMediaMaterie,
  getNoteElev,
  getNumarAbsenteNemotivate,
} from './csv-parser.js';
import { incarcaSituatie } from './situatie-store.js';

function determinaAnScolar(dataRaport) {
  const potrivire = String(dataRaport || '').match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  const data = potrivire
    ? { luna: Number(potrivire[2]), an: Number(potrivire[3]) }
    : { luna: new Date().getMonth() + 1, an: new Date().getFullYear() };
  const anInceput = data.luna >= 9 ? data.an : data.an - 1;
  return `${anInceput}-${anInceput + 1}`;
}

function obtineContext(dateIncarcate) {
  return {
    anScolar: dateIncarcate.anScolar || determinaAnScolar(dateIncarcate.dataRaport),
    clasa: dateIncarcate.clasa || '',
  };
}

function esteNotaValida(valoare) {
  const nota = Number(valoare);
  return (
    Number.isFinite(nota) &&
    nota >= CONFIG.EXAMENE.NOTA_MINIMA &&
    nota <= CONFIG.EXAMENE.NOTA_MAXIMA
  );
}

function gasesteMedieSpeciala(dateIncarcate, elev, materie) {
  return (dateIncarcate.mediiSpeciale || []).find(
    (item) => item.elev === elev && item.materie === materie
  );
}

function grupeazaNoteElev(dateIncarcate, elev) {
  const grupate = {};
  getNoteElev(dateIncarcate.note || [], elev).forEach((rand) => {
    const materie = rand[CONFIG.NOTE.MATERIE];
    const nota = Number(rand[CONFIG.NOTE.NOTA]);
    if (!materie || !Number.isFinite(nota)) return;
    if (!grupate[materie]) grupate[materie] = [];
    grupate[materie].push(nota);
  });
  return grupate;
}

function calculeazaSituatieMaterie(dateIncarcate, elev, materie, noteGrupate = null) {
  const context = obtineContext(dateIncarcate);
  const situatieSalvata = incarcaSituatie(context, elev, materie);
  const grupate = noteGrupate || grupeazaNoteElev(dateIncarcate, elev);
  const note = grupate[materie] || [];
  const medieSpeciala = gasesteMedieSpeciala(dateIncarcate, elev, materie);
  const estePurtare = materie === CONFIG.PURTARE.NUME_MATERIE;
  const absenteNemotivate = getNumarAbsenteNemotivate(dateIncarcate.absente || [], elev);

  let mediaExactaInitiala = null;
  let mediaInitiala = null;
  let penalizarePurtare = 0;
  let mediaDisciplinaraRotunjita = null;
  let esteMedieImportata = false;
  let mediaImplicita = false;

  if (medieSpeciala && esteNotaValida(medieSpeciala.media)) {
    mediaExactaInitiala = Number(medieSpeciala.media);
    mediaInitiala = Number(medieSpeciala.media);
    esteMedieImportata = true;
  } else if (note.length > 0) {
    const rezultat = calculeazaMediaMaterie(note, materie, absenteNemotivate);
    mediaExactaInitiala = rezultat.mediaExacta;
    mediaInitiala = rezultat.mediaRotunjita;
    penalizarePurtare = rezultat.penalizare;
    mediaDisciplinaraRotunjita = Math.round(rezultat.mediaExacta);
  } else if (estePurtare) {
    const rezultat = calculeazaMediaMaterie([10], materie, absenteNemotivate);
    mediaExactaInitiala = 10;
    mediaInitiala = rezultat.mediaRotunjita;
    penalizarePurtare = rezultat.penalizare;
    mediaDisciplinaraRotunjita = 10;
    mediaImplicita = true;
  }

  const neincheiat = Boolean(situatieSalvata.neincheiat);
  const rezultatIncheiere = esteNotaValida(situatieSalvata.rezultatIncheiere)
    ? Number(situatieSalvata.rezultatIncheiere)
    : null;
  const rezultatCorigenta = esteNotaValida(situatieSalvata.rezultatCorigenta)
    ? Number(situatieSalvata.rezultatCorigenta)
    : null;

  const corigentCalculat =
    !estePurtare &&
    mediaExactaInitiala !== null &&
    mediaExactaInitiala < CONFIG.EXAMENE.PRAG_CORIGENTA;
  const corigentInitial = corigentCalculat && !neincheiat;
  const corigentDupaIncheiere =
    neincheiat &&
    rezultatIncheiere !== null &&
    rezultatIncheiere < CONFIG.EXAMENE.NOTA_PROMOVARE;
  const necesitaCorigenta = corigentInitial || corigentDupaIncheiere;
  const nepromovat =
    necesitaCorigenta &&
    rezultatCorigenta !== null &&
    rezultatCorigenta < CONFIG.EXAMENE.NOTA_PROMOVARE;

  let mediaPentruGenerala = mediaInitiala;
  if (neincheiat) {
    if (rezultatIncheiere === null) {
      mediaPentruGenerala = null;
    } else if (corigentDupaIncheiere && rezultatCorigenta !== null) {
      mediaPentruGenerala = rezultatCorigenta;
    } else {
      mediaPentruGenerala = rezultatIncheiere;
    }
  } else if (corigentInitial && rezultatCorigenta !== null) {
    mediaPentruGenerala = rezultatCorigenta;
  }

  return {
    elev,
    materie,
    note,
    mediaExactaInitiala,
    mediaInitiala,
    mediaPentruGenerala,
    mediaDisciplinaraRotunjita,
    penalizarePurtare,
    mediaImplicita,
    esteMedieImportata,
    estePurtare,
    neincheiat,
    rezultatIncheiere,
    rezultatCorigenta,
    corigentCalculat,
    corigentInitial,
    corigentDupaIncheiere,
    necesitaCorigenta,
    nepromovat,
  };
}

function calculeazaSituatieElev(dateIncarcate, elev) {
  const grupate = grupeazaNoteElev(dateIncarcate, elev);
  const materii = Array.from(new Set(dateIncarcate.materii || []));
  const situatiiMaterii = materii.map((materie) =>
    calculeazaSituatieMaterie(dateIncarcate, elev, materie, grupate)
  );
  const nepromovatPrinCorigenta = situatiiMaterii.some((situatie) => situatie.nepromovat);
  const nepromovatPrinPurtare = situatiiMaterii.some(
    (situatie) =>
      situatie.estePurtare && situatie.mediaInitiala !== null && situatie.mediaInitiala < 6
  );
  const nepromovat = nepromovatPrinCorigenta || nepromovatPrinPurtare;
  const medii = situatiiMaterii
    .map((situatie) => situatie.mediaPentruGenerala)
    .filter((media) => media !== null && Number.isFinite(media));
  const mediaGenerala =
    nepromovat || medii.length === 0
      ? null
      : medii.reduce((suma, media) => suma + media, 0) / medii.length;

  const nrCorigente = situatiiMaterii.filter((situatie) => situatie.necesitaCorigenta).length;
  const nrNeincheiate = situatiiMaterii.filter((situatie) => situatie.neincheiat).length;
  const areRezultateInAsteptare = situatiiMaterii.some(
    (situatie) =>
      (situatie.neincheiat && situatie.rezultatIncheiere === null) ||
      (situatie.necesitaCorigenta && situatie.rezultatCorigenta === null)
  );

  return {
    elev,
    materii: situatiiMaterii,
    mediaGenerala,
    nrCorigente,
    nrNeincheiate,
    nepromovat,
    nepromovatPrinCorigenta,
    nepromovatPrinPurtare,
    areRezultateInAsteptare,
    participaClasament: !nepromovat && mediaGenerala !== null,
  };
}

function calculeazaClasamentComplet(dateIncarcate) {
  const rezultate = (dateIncarcate.elevi || []).map((elev) => calculeazaSituatieElev(dateIncarcate, elev));
  rezultate.sort((a, b) => {
    const grupaA = a.nepromovat ? 2 : a.participaClasament ? 0 : 1;
    const grupaB = b.nepromovat ? 2 : b.participaClasament ? 0 : 1;
    if (grupaA !== grupaB) return grupaA - grupaB;
    if (grupaA === 0 && a.mediaGenerala !== b.mediaGenerala) {
      return b.mediaGenerala - a.mediaGenerala;
    }
    return a.elev.localeCompare(b.elev, 'ro');
  });

  let pozitie = 0;
  let mediaAnterioara = null;
  rezultate.forEach((rezultat) => {
    if (!rezultat.participaClasament) {
      rezultat.pozitie = null;
      return;
    }
    if (mediaAnterioara === null || Math.abs(rezultat.mediaGenerala - mediaAnterioara) > 1e-9) {
      pozitie += 1;
      mediaAnterioara = rezultat.mediaGenerala;
    }
    rezultat.pozitie = pozitie;
  });
  return rezultate;
}

function numarParticipantiClasament(clasament) {
  return clasament.filter((item) => item.participaClasament).length;
}

function esteInPerioadaExamene(data = new Date()) {
  const valoare = (data.getMonth() + 1) * 100 + data.getDate();
  const inceput =
    CONFIG.EXAMENE.PERIOADA.INCEPUT.luna * 100 + CONFIG.EXAMENE.PERIOADA.INCEPUT.zi;
  const sfarsit =
    CONFIG.EXAMENE.PERIOADA.SFARSIT.luna * 100 + CONFIG.EXAMENE.PERIOADA.SFARSIT.zi;
  return inceput <= sfarsit
    ? valoare >= inceput && valoare <= sfarsit
    : valoare >= inceput || valoare <= sfarsit;
}

export {
  determinaAnScolar,
  obtineContext,
  esteNotaValida,
  grupeazaNoteElev,
  calculeazaSituatieMaterie,
  calculeazaSituatieElev,
  calculeazaClasamentComplet,
  numarParticipantiClasament,
  esteInPerioadaExamene,
};
