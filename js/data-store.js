// ============================================
// DATA STORE - Stocare date în sessionStorage
// ============================================

const STORAGE_KEYS = {
  NOTE: 'catalog_note',
  ABSENTE: 'catalog_absente',
  ELEVI: 'catalog_elevi',
  MATERII: 'catalog_materii',
  CLASA: 'catalog_clasa',
};

/**
 * Salvează datele în sessionStorage
 */
function salveazaDate(note, absente, elevi, materii, clasa) {
  try {
    sessionStorage.setItem(STORAGE_KEYS.NOTE, JSON.stringify(note));
    sessionStorage.setItem(STORAGE_KEYS.ABSENTE, JSON.stringify(absente));
    sessionStorage.setItem(STORAGE_KEYS.ELEVI, JSON.stringify(elevi));
    sessionStorage.setItem(STORAGE_KEYS.MATERII, JSON.stringify(materii));
    sessionStorage.setItem(STORAGE_KEYS.CLASA, clasa);
    return true;
  } catch (error) {
    console.error('Eroare la salvarea datelor:', error);
    return false;
  }
}

/**
 * Încarcă notele din sessionStorage
 */
function incarcaNote() {
  try {
    const data = sessionStorage.getItem(STORAGE_KEYS.NOTE);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Eroare la încărcarea notelor:', error);
    return [];
  }
}

/**
 * Încarcă absențele din sessionStorage
 */
function incarcaAbsente() {
  try {
    const data = sessionStorage.getItem(STORAGE_KEYS.ABSENTE);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Eroare la încărcarea absențelor:', error);
    return [];
  }
}

/**
 * Încarcă lista de elevi din sessionStorage
 */
function incarcaElevi() {
  try {
    const data = sessionStorage.getItem(STORAGE_KEYS.ELEVI);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Eroare la încărcarea elevilor:', error);
    return [];
  }
}

/**
 * Încarcă lista de materii din sessionStorage
 */
function incarcaMaterii() {
  try {
    const data = sessionStorage.getItem(STORAGE_KEYS.MATERII);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Eroare la încărcarea materiilor:', error);
    return [];
  }
}

/**
 * Încarcă numele clasei din sessionStorage
 */
function incarcaClasa() {
  try {
    return sessionStorage.getItem(STORAGE_KEYS.CLASA) || '';
  } catch (error) {
    console.error('Eroare la încărcarea clasei:', error);
    return '';
  }
}

/**
 * Verifică dacă există date încărcate
 */
function existaDate() {
  return sessionStorage.getItem(STORAGE_KEYS.ELEVI) !== null;
}

/**
 * Șterge toate datele din sessionStorage
 */
function stergeDate() {
  Object.values(STORAGE_KEYS).forEach((key) => {
    sessionStorage.removeItem(key);
  });
}

/**
 * Încarcă toate datele odată
 */
function incarcaToateDate() {
  return {
    note: incarcaNote(),
    absente: incarcaAbsente(),
    elevi: incarcaElevi(),
    materii: incarcaMaterii(),
    clasa: incarcaClasa(),
  };
}

export {
  salveazaDate,
  incarcaNote,
  incarcaAbsente,
  incarcaElevi,
  incarcaMaterii,
  incarcaClasa,
  existaDate,
  stergeDate,
  incarcaToateDate,
};
