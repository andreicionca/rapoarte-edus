// ============================================
// ⭐ CONFIGURAȚIE - MODIFICĂ AICI DACĂ SE SCHIMBĂ COLOANELE
// ============================================

const CONFIG = {
  // --- Coloane fișier note.csv ---
  NOTE: {
    ELEV: 'Elev',
    NOTA: 'Nota',
    DATA: 'Data',
    MATERIE: 'Materie',
    CLASA: 'Clasa',
  },

  // --- Coloane fișier absente.csv ---
  ABSENTE: {
    ELEV: 'Elev',
    DATA: 'Data',
    MOTIVATA: 'Motivata', // Valori: 'Da' sau 'Nu'
    TIP_MOTIVARE: 'Tip motivare',
    MATERIE: 'Materie',
    CLASA: 'Clasa',
  },

  // --- Valori pentru motivări ---
  MOTIVARE: {
    DA: 'Da',
    NU: 'Nu',
  },

  // --- Tipuri de motivare (cum apar în CSV) ---
  TIPURI_MOTIVARE: {
    SCUTIRE_MEDICALA: 'Scutire medicala',
    INVOIRE_PARINTE: 'Invoire parinte',
    ALT_MOTIV: 'Alt motiv',
  },

  // --- Etichete afișate în interfață ---
  ETICHETE: {
    SCUTIRE_MEDICALA: 'Scutire medicală',
    INVOIRE_PARINTE: 'Invoiere părinte',
    ALT_MOTIV: 'Alte motive',
    NEMOTIVATA: 'Nemotivată',
  },

  // --- Format dată în CSV (pentru parsare) ---
  // Formatul tău: DD/MM/YYYY
  FORMAT_DATA: 'DD/MM/YYYY',

  // --- Ordinea lunilor în anul școlar (pentru sortare) ---
  // Septembrie = 0, Octombrie = 1, ... Iunie = 9, Iulie = 10, August = 11
  LUNI_AN_SCOLAR: [9, 10, 11, 12, 1, 2, 3, 4, 5, 6, 7, 8],

  PURTARE: {
    NUME_MATERIE: 'Purtare',
    PENALIZARI_ABSENTE: [
      { min: 0, max: 19, puncte: 0 },
      { min: 20, max: 39, puncte: 1 },
      { min: 40, max: 59, puncte: 2 },
      { min: 60, max: 79, puncte: 3 },
      { min: 80, max: 99, puncte: 4 },
      { min: 100, max: Infinity, puncte: 5 },
    ],
    MEDIA_MINIMA: 1,
  },
};

// Nu modifica sub această linie
// ============================================

export default CONFIG;
