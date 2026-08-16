import CONFIG from './config.js';
import { normalizeazaCheie } from './situatie-store.js';

function transformaAbsenteCategorie(valoare, motivata, elev, clasa) {
  const elemente = Array.isArray(valoare)
    ? valoare
    : Array.from({ length: Math.max(0, Number.parseInt(valoare, 10) || 0) }, () => ({}));

  return elemente.map((element) => {
    const detalii = typeof element === 'string' ? { data: element } : element || {};
    return {
      [CONFIG.ABSENTE.ELEV]: elev,
      [CONFIG.ABSENTE.DATA]: detalii.data || '',
      [CONFIG.ABSENTE.MOTIVATA]: motivata ? CONFIG.MOTIVARE.DA : CONFIG.MOTIVARE.NU,
      [CONFIG.ABSENTE.TIP_MOTIVARE]: motivata
        ? detalii.tipMotivare || CONFIG.TIPURI_MOTIVARE.ALT_MOTIV
        : '',
      [CONFIG.ABSENTE.MATERIE]: CONFIG.RELIGIE_PENTICOSTALA.NUME_MATERIE,
      [CONFIG.ABSENTE.CLASA]: clasa,
      _sursa: 'religie-penticostala',
    };
  });
}

function proceseazaDateReligiePenticostala(json, { elevi, clasa, anScolar }) {
  const rezultat = {
    mediiSpeciale: [],
    absente: [],
    eleviGasiti: 0,
    avertismente: [],
  };
  if (!json || !Array.isArray(json.elevi)) {
    rezultat.avertismente.push('Fișierul pentru Religie penticostală nu conține lista „elevi”.');
    return rezultat;
  }
  if (json.anScolar && normalizeazaCheie(json.anScolar) !== normalizeazaCheie(anScolar)) {
    rezultat.avertismente.push(
      `Fișierul pentru Religie penticostală este pentru anul ${json.anScolar}, nu ${anScolar}.`
    );
    return rezultat;
  }

  const eleviCatalog = new Map(elevi.map((elev) => [normalizeazaCheie(elev), elev]));
  const vazuti = new Set();

  json.elevi.forEach((intrare, index) => {
    if (normalizeazaCheie(intrare.clasa) !== normalizeazaCheie(clasa)) return;
    const elevCatalog = eleviCatalog.get(normalizeazaCheie(intrare.nume));
    if (!elevCatalog) {
      rezultat.avertismente.push(
        `Religie penticostală: elevul „${intrare.nume || `înregistrarea ${index + 1}`}” nu a fost găsit în clasa ${clasa}.`
      );
      return;
    }
    const cheie = normalizeazaCheie(elevCatalog);
    if (vazuti.has(cheie)) {
      rezultat.avertismente.push(`Religie penticostală: elevul „${elevCatalog}” apare de mai multe ori.`);
      return;
    }
    vazuti.add(cheie);

    const media = Number(intrare.media);
    if (!Number.isFinite(media) || media < 1 || media > 10) {
      rezultat.avertismente.push(
        `Religie penticostală: media elevului „${elevCatalog}” trebuie să fie între 1 și 10.`
      );
      return;
    }

    rezultat.eleviGasiti += 1;
    rezultat.mediiSpeciale.push({
      elev: elevCatalog,
      materie: CONFIG.RELIGIE_PENTICOSTALA.NUME_MATERIE,
      media,
      sursa: 'religie-penticostala',
    });

    const absente = intrare.absente || {};
    rezultat.absente.push(
      ...transformaAbsenteCategorie(absente.motivate || 0, true, elevCatalog, clasa),
      ...transformaAbsenteCategorie(absente.nemotivate || 0, false, elevCatalog, clasa)
    );
  });
  return rezultat;
}

async function incarcaReligiePenticostala(context) {
  if (!CONFIG.RELIGIE_PENTICOSTALA.ACTIV) {
    return { mediiSpeciale: [], absente: [], eleviGasiti: 0, avertismente: [] };
  }
  try {
    const raspuns = await fetch(CONFIG.RELIGIE_PENTICOSTALA.FISIER, { cache: 'no-store' });
    if (!raspuns.ok) {
      throw new Error(`HTTP ${raspuns.status}`);
    }
    return proceseazaDateReligiePenticostala(await raspuns.json(), context);
  } catch (error) {
    console.warn('Nu s-a putut încărca fișierul pentru Religie penticostală:', error);
    return {
      mediiSpeciale: [],
      absente: [],
      eleviGasiti: 0,
      avertismente: ['Fișierul pentru Religie penticostală nu a putut fi citit. Datele ZIP au fost totuși încărcate.'],
    };
  }
}

export { proceseazaDateReligiePenticostala, incarcaReligiePenticostala };
