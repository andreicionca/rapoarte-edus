// js/data-store.js

const STORAGE_KEYS = {
  NOTE: 'catalog_note',
  ABSENTE: 'catalog_absente',
  ELEVI: 'catalog_elevi',
  MATERII: 'catalog_materii',
  CLASA: 'catalog_clasa',
  DATA_RAPORT: 'catalog_data_raport',
  AN_SCOLAR: 'catalog_an_scolar',
  MEDII_SPECIALE: 'catalog_medii_speciale',
  INFO_IMPORT: 'catalog_info_import',
};

function salveazaDate(
  note,
  absente,
  elevi,
  materii,
  clasa,
  dataRaport = null,
  anScolar = '',
  mediiSpeciale = [],
  infoImport = null
) {
  try {
    sessionStorage.setItem(STORAGE_KEYS.NOTE, JSON.stringify(note));
    sessionStorage.setItem(STORAGE_KEYS.ABSENTE, JSON.stringify(absente));
    sessionStorage.setItem(STORAGE_KEYS.ELEVI, JSON.stringify(elevi));
    sessionStorage.setItem(STORAGE_KEYS.MATERII, JSON.stringify(materii));
    sessionStorage.setItem(STORAGE_KEYS.CLASA, clasa);
    sessionStorage.setItem(STORAGE_KEYS.AN_SCOLAR, anScolar);
    sessionStorage.setItem(STORAGE_KEYS.MEDII_SPECIALE, JSON.stringify(mediiSpeciale));
    sessionStorage.setItem(STORAGE_KEYS.INFO_IMPORT, JSON.stringify(infoImport || {}));
    if (dataRaport) {
      sessionStorage.setItem(STORAGE_KEYS.DATA_RAPORT, dataRaport);
    }
    return true;
  } catch (error) {
    console.error('Eroare la salvarea datelor:', error);
    return false;
  }
}

function incarcaNote() {
  try {
    const data = sessionStorage.getItem(STORAGE_KEYS.NOTE);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Eroare la încărcarea notelor:', error);
    return [];
  }
}

function incarcaAbsente() {
  try {
    const data = sessionStorage.getItem(STORAGE_KEYS.ABSENTE);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Eroare la încărcarea absențelor:', error);
    return [];
  }
}

function incarcaElevi() {
  try {
    const data = sessionStorage.getItem(STORAGE_KEYS.ELEVI);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Eroare la încărcarea elevilor:', error);
    return [];
  }
}

function incarcaMaterii() {
  try {
    const data = sessionStorage.getItem(STORAGE_KEYS.MATERII);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Eroare la încărcarea materiilor:', error);
    return [];
  }
}

function incarcaClasa() {
  try {
    return sessionStorage.getItem(STORAGE_KEYS.CLASA) || '';
  } catch (error) {
    console.error('Eroare la încărcarea clasei:', error);
    return '';
  }
}

function incarcaDataRaport() {
  try {
    return sessionStorage.getItem(STORAGE_KEYS.DATA_RAPORT) || '';
  } catch (error) {
    console.error('Eroare la încărcarea datei raportului:', error);
    return '';
  }
}

function incarcaAnScolar() {
  try {
    return sessionStorage.getItem(STORAGE_KEYS.AN_SCOLAR) || '';
  } catch (error) {
    console.error('Eroare la încărcarea anului școlar:', error);
    return '';
  }
}

function incarcaMediiSpeciale() {
  try {
    const data = sessionStorage.getItem(STORAGE_KEYS.MEDII_SPECIALE);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Eroare la încărcarea mediilor speciale:', error);
    return [];
  }
}

function incarcaInfoImport() {
  try {
    const data = sessionStorage.getItem(STORAGE_KEYS.INFO_IMPORT);
    return data ? JSON.parse(data) : {};
  } catch (error) {
    console.error('Eroare la încărcarea informațiilor de import:', error);
    return {};
  }
}

function existaDate() {
  return sessionStorage.getItem(STORAGE_KEYS.ELEVI) !== null;
}

function stergeDate() {
  Object.values(STORAGE_KEYS).forEach((key) => {
    sessionStorage.removeItem(key);
  });
}

function incarcaToateDate() {
  return {
    note: incarcaNote(),
    absente: incarcaAbsente(),
    elevi: incarcaElevi(),
    materii: incarcaMaterii(),
    clasa: incarcaClasa(),
    dataRaport: incarcaDataRaport(),
    anScolar: incarcaAnScolar(),
    mediiSpeciale: incarcaMediiSpeciale(),
    infoImport: incarcaInfoImport(),
  };
}

export {
  salveazaDate,
  incarcaNote,
  incarcaAbsente,
  incarcaElevi,
  incarcaMaterii,
  incarcaClasa,
  incarcaDataRaport,
  incarcaAnScolar,
  incarcaMediiSpeciale,
  incarcaInfoImport,
  existaDate,
  stergeDate,
  incarcaToateDate,
};
