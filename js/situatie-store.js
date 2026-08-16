const STORAGE_KEY = 'rapoarte_edus_situatii_v1';
const PREFERINTE_KEY = 'rapoarte_edus_preferinte_v1';

function normalizeazaCheie(valoare) {
  return String(valoare || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('ro')
    .replace(/\s+/g, ' ')
    .trim();
}

function construiesteCheie(context, elev, materie) {
  return [context.anScolar, context.clasa, elev, materie]
    .map((parte) => encodeURIComponent(normalizeazaCheie(parte)))
    .join('|');
}

function citesteToateSituatiile() {
  try {
    const valoare = localStorage.getItem(STORAGE_KEY);
    const date = valoare ? JSON.parse(valoare) : {};
    return date && typeof date === 'object' && !Array.isArray(date) ? date : {};
  } catch (error) {
    console.error('Nu s-au putut citi situațiile școlare salvate local:', error);
    return {};
  }
}

function scrieToateSituatiile(situatii) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(situatii));
    return true;
  } catch (error) {
    console.error('Nu s-au putut salva situațiile școlare local:', error);
    return false;
  }
}

function incarcaSituatie(context, elev, materie) {
  const toate = citesteToateSituatiile();
  return (
    toate[construiesteCheie(context, elev, materie)] || {
      anScolar: context.anScolar,
      clasa: context.clasa,
      elev,
      materie,
      neincheiat: false,
      rezultatIncheiere: null,
      rezultatCorigenta: null,
    }
  );
}

function salveazaSituatie(context, elev, materie, modificari) {
  const toate = citesteToateSituatiile();
  const cheie = construiesteCheie(context, elev, materie);
  const existenta = incarcaSituatie(context, elev, materie);
  const situatie = {
    ...existenta,
    ...modificari,
    anScolar: context.anScolar,
    clasa: context.clasa,
    elev,
    materie,
    actualizatLa: new Date().toISOString(),
  };

  const esteGoala =
    !situatie.neincheiat &&
    situatie.rezultatIncheiere === null &&
    situatie.rezultatCorigenta === null;

  if (esteGoala) {
    delete toate[cheie];
  } else {
    toate[cheie] = situatie;
  }
  return scrieToateSituatiile(toate);
}

function listeazaSituatiiContext(context) {
  return Object.values(citesteToateSituatiile()).filter(
    (situatie) =>
      normalizeazaCheie(situatie.anScolar) === normalizeazaCheie(context.anScolar) &&
      normalizeazaCheie(situatie.clasa) === normalizeazaCheie(context.clasa)
  );
}

function citestePreferinte() {
  try {
    const valoare = localStorage.getItem(PREFERINTE_KEY);
    return valoare ? JSON.parse(valoare) : {};
  } catch (error) {
    return {};
  }
}

function salveazaPreferinta(nume, valoare) {
  const preferinte = citestePreferinte();
  preferinte[nume] = valoare;
  try {
    localStorage.setItem(PREFERINTE_KEY, JSON.stringify(preferinte));
    return true;
  } catch (error) {
    console.error('Nu s-a putut salva preferința:', error);
    return false;
  }
}

function exportaSituatiiContext(context) {
  return {
    tip: 'rapoarte-edus-situatii',
    versiune: 1,
    anScolar: context.anScolar,
    clasa: context.clasa,
    exportatLa: new Date().toISOString(),
    situatii: listeazaSituatiiContext(context).map((situatie) => ({
      elev: situatie.elev,
      materie: situatie.materie,
      neincheiat: Boolean(situatie.neincheiat),
      rezultatIncheiere: situatie.rezultatIncheiere ?? null,
      rezultatCorigenta: situatie.rezultatCorigenta ?? null,
    })),
  };
}

function importaSituatiiContext(context, textCopiat, eleviValizi = [], materiiValide = []) {
  let pachet;

  try {
    pachet = JSON.parse(textCopiat);
  } catch {
    throw new Error('Textul lipit nu este un cod JSON valid.');
  }

  const estePachetValid =
    pachet?.tip === 'rapoarte-edus-situatii' && Array.isArray(pachet.situatii);

  if (!estePachetValid) {
    throw new Error('Textul lipit nu este un export de situații Rapoarte EDUS.');
  }

  const acelasiContext =
    normalizeazaCheie(pachet.anScolar) === normalizeazaCheie(context.anScolar) &&
    normalizeazaCheie(pachet.clasa) === normalizeazaCheie(context.clasa);

  if (!acelasiContext) {
    throw new Error(
      `Exportul este pentru clasa ${pachet.clasa}, anul ${pachet.anScolar}, nu pentru raportul încărcat.`
    );
  }

  const eleviAcceptati = new Set(eleviValizi.map(normalizeazaCheie));
  const materiiAcceptate = new Set(materiiValide.map(normalizeazaCheie));

  const notaValidaSauNula = (valoare) => {
    if (valoare === null || valoare === undefined || valoare === '') return null;

    const nota = Number(valoare);
    return Number.isFinite(nota) && nota >= 1 && nota <= 10 ? nota : null;
  };

  let importate = 0;
  let ignorate = 0;

  pachet.situatii.forEach((situatie) => {
    const elev = String(situatie?.elev || '').trim();
    const materie = String(situatie?.materie || '').trim();

    if (
      !elev ||
      !materie ||
      !eleviAcceptati.has(normalizeazaCheie(elev)) ||
      !materiiAcceptate.has(normalizeazaCheie(materie))
    ) {
      ignorate++;
      return;
    }

    const salvat = salveazaSituatie(context, elev, materie, {
      neincheiat: Boolean(situatie.neincheiat),
      rezultatIncheiere: notaValidaSauNula(situatie.rezultatIncheiere),
      rezultatCorigenta: notaValidaSauNula(situatie.rezultatCorigenta),
    });

    if (salvat) importate++;
    else ignorate++;
  });

  return { importate, ignorate };
}

export {
  normalizeazaCheie,
  construiesteCheie,
  incarcaSituatie,
  salveazaSituatie,
  listeazaSituatiiContext,
  citestePreferinte,
  salveazaPreferinta,
  exportaSituatiiContext,
  importaSituatiiContext,
};
