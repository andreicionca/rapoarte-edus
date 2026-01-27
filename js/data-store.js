const STORAGE_KEYS = {
  NOTE: 'catalog_note',
  ABSENTE: 'catalog_absente',
  ELEVI: 'catalog_elevi',
  MATERII: 'catalog_materii',
  CLASA: 'catalog_clasa',
  DATA_RAPORT: 'catalog_data_raport',
};

function salveazaDate(note, absente, elevi, materii, clasa, dataRaport = null) {
  try {
    sessionStorage.setItem(STORAGE_KEYS.NOTE, JSON.stringify(note));
    sessionStorage.setItem(STORAGE_KEYS.ABSENTE, JSON.stringify(absente));
    sessionStorage.setItem(STORAGE_KEYS.ELEVI, JSON.stringify(elevi));
    sessionStorage.setItem(STORAGE_KEYS.MATERII, JSON.stringify(materii));
    sessionStorage.setItem(STORAGE_KEYS.CLASA, clasa);
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
  existaDate,
  stergeDate,
  incarcaToateDate,
};
