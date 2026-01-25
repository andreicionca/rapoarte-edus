import CONFIG from './config.js';

function parseCSV(csvText) {
  const lines = [];
  let currentLine = '';
  let insideQuotes = false;

  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    const nextChar = csvText[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        currentLine += '"';
        i++;
      } else {
        insideQuotes = !insideQuotes;
        currentLine += char;
      }
    } else if ((char === '\n' || (char === '\r' && nextChar === '\n')) && !insideQuotes) {
      if (currentLine.trim()) {
        lines.push(currentLine);
      }
      currentLine = '';
      if (char === '\r') i++;
    } else if (char === '\r' && !insideQuotes) {
      if (currentLine.trim()) {
        lines.push(currentLine);
      }
      currentLine = '';
    } else {
      currentLine += char;
    }
  }

  if (currentLine.trim()) {
    lines.push(currentLine);
  }

  if (lines.length === 0) return [];

  const headers = parseLine(lines[0]);
  const data = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseLine(lines[i]);
    if (values.length === headers.length) {
      const obj = {};
      headers.forEach((header, index) => {
        obj[header.trim()] = values[index].trim();
      });
      data.push(obj);
    }
  }

  return data;
}

function parseLine(line) {
  const values = [];
  let currentValue = '';
  let insideQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        currentValue += '"';
        i++;
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === ',' && !insideQuotes) {
      values.push(currentValue);
      currentValue = '';
    } else {
      currentValue += char;
    }
  }

  values.push(currentValue);
  return values;
}

function parseData(dataString) {
  if (!dataString) return null;
  const parts = dataString.split('/');
  if (parts.length !== 3) return null;
  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const year = parseInt(parts[2], 10);
  return new Date(year, month, day);
}

function compareDataAnScolar(dataA, dataB, descrescator = false) {
  const dateA = parseData(dataA);
  const dateB = parseData(dataB);
  if (!dateA && !dateB) return 0;
  if (!dateA) return 1;
  if (!dateB) return -1;
  const diff = dateA.getTime() - dateB.getTime();
  return descrescator ? -diff : diff;
}

function extractElevi(note, absente) {
  const eleviSet = new Set();
  note.forEach((row) => {
    if (row[CONFIG.NOTE.ELEV]) {
      eleviSet.add(row[CONFIG.NOTE.ELEV].trim());
    }
  });
  absente.forEach((row) => {
    if (row[CONFIG.ABSENTE.ELEV]) {
      eleviSet.add(row[CONFIG.ABSENTE.ELEV].trim());
    }
  });
  return Array.from(eleviSet).sort((a, b) => a.localeCompare(b, 'ro'));
}

function extractMaterii(note) {
  const materiiSet = new Set();
  note.forEach((row) => {
    if (row[CONFIG.NOTE.MATERIE]) {
      materiiSet.add(row[CONFIG.NOTE.MATERIE].trim());
    }
  });
  return Array.from(materiiSet).sort((a, b) => a.localeCompare(b, 'ro'));
}

function getNoteElev(note, numeElev) {
  return note
    .filter((row) => row[CONFIG.NOTE.ELEV]?.trim() === numeElev)
    .sort((a, b) => compareDataAnScolar(a[CONFIG.NOTE.DATA], b[CONFIG.NOTE.DATA], false));
}

function getAbsenteElev(absente, numeElev) {
  return absente
    .filter((row) => row[CONFIG.ABSENTE.ELEV]?.trim() === numeElev)
    .sort((a, b) => compareDataAnScolar(a[CONFIG.ABSENTE.DATA], b[CONFIG.ABSENTE.DATA], true));
}

function getTipAbsenta(row) {
  const motivata = row[CONFIG.ABSENTE.MOTIVATA];
  const tipMotivare = row[CONFIG.ABSENTE.TIP_MOTIVARE];

  if (motivata !== CONFIG.MOTIVARE.DA) {
    return { cod: 'NEMOTIVATA', eticheta: CONFIG.ETICHETE.NEMOTIVATA, clasa: 'nemotivata' };
  }
  if (tipMotivare === CONFIG.TIPURI_MOTIVARE.SCUTIRE_MEDICALA) {
    return {
      cod: 'SCUTIRE_MEDICALA',
      eticheta: CONFIG.ETICHETE.SCUTIRE_MEDICALA,
      clasa: 'scutire-medicala',
    };
  }
  if (tipMotivare === CONFIG.TIPURI_MOTIVARE.INVOIRE_PARINTE) {
    return {
      cod: 'INVOIRE_PARINTE',
      eticheta: CONFIG.ETICHETE.INVOIRE_PARINTE,
      clasa: 'invoire-parinte',
    };
  }
  return { cod: 'ALT_MOTIV', eticheta: CONFIG.ETICHETE.ALT_MOTIV, clasa: 'alt-motiv' };
}

function getNumarAbsenteNemotivate(absente, numeElev) {
  const absenteElev = getAbsenteElev(absente, numeElev);
  let count = 0;
  absenteElev.forEach((absenta) => {
    if (absenta[CONFIG.ABSENTE.MOTIVATA] !== CONFIG.MOTIVARE.DA) {
      count++;
    }
  });
  return count;
}

function calculeazaPenalizarePurtare(numarAbsenteNemotivate) {
  for (const interval of CONFIG.PURTARE.PENALIZARI_ABSENTE) {
    if (numarAbsenteNemotivate >= interval.min && numarAbsenteNemotivate <= interval.max) {
      return interval.puncte;
    }
  }
  return 0;
}

function calculeazaMediaMaterie(noteMaterie, numeMaterie, absenteNemotivate = 0) {
  if (!noteMaterie || noteMaterie.length === 0) {
    return { mediaExacta: null, mediaRotunjita: null, penalizare: 0 };
  }

  const suma = noteMaterie.reduce((acc, n) => acc + n, 0);
  const mediaExacta = suma / noteMaterie.length;
  let mediaRotunjita = Math.round(mediaExacta);
  let penalizare = 0;

  if (numeMaterie === CONFIG.PURTARE.NUME_MATERIE) {
    penalizare = calculeazaPenalizarePurtare(absenteNemotivate);
    mediaRotunjita = mediaRotunjita - penalizare;
    if (mediaRotunjita < CONFIG.PURTARE.MEDIA_MINIMA) {
      mediaRotunjita = CONFIG.PURTARE.MEDIA_MINIMA;
    }
  }

  return { mediaExacta, mediaRotunjita, penalizare };
}

function calculeazaMedia(note, numeElev, absente = []) {
  const noteElev = getNoteElev(note, numeElev);
  if (noteElev.length === 0) return null;

  const absenteNemotivate = getNumarAbsenteNemotivate(absente, numeElev);

  const notePerMaterie = {};
  noteElev.forEach((row) => {
    const materie = row[CONFIG.NOTE.MATERIE];
    const nota = parseFloat(row[CONFIG.NOTE.NOTA]);
    if (!isNaN(nota)) {
      if (!notePerMaterie[materie]) {
        notePerMaterie[materie] = [];
      }
      notePerMaterie[materie].push(nota);
    }
  });

  const mediiRotunjite = [];
  for (const materie in notePerMaterie) {
    const noteMaterie = notePerMaterie[materie];
    if (noteMaterie.length > 0) {
      const rezultat = calculeazaMediaMaterie(noteMaterie, materie, absenteNemotivate);
      mediiRotunjite.push(rezultat.mediaRotunjita);
    }
  }

  if (mediiRotunjite.length === 0) return null;

  const sumaMediai = mediiRotunjite.reduce((acc, m) => acc + m, 0);
  return sumaMediai / mediiRotunjite.length;
}

function calculeazaClasament(note, elevi, absente = []) {
  const medii = elevi.map((elev) => ({
    elev,
    media: calculeazaMedia(note, elev, absente),
  }));

  medii.sort((a, b) => {
    if (a.media === null && b.media === null) return 0;
    if (a.media === null) return 1;
    if (b.media === null) return -1;
    return b.media - a.media;
  });

  let pozitie = 1;
  return medii.map((item, index) => {
    if (index > 0 && item.media !== medii[index - 1].media) {
      pozitie = index + 1;
    }
    return {
      ...item,
      pozitie: item.media !== null ? pozitie : null,
    };
  });
}

export {
  parseCSV,
  parseData,
  compareDataAnScolar,
  extractElevi,
  extractMaterii,
  getNoteElev,
  getAbsenteElev,
  getTipAbsenta,
  getNumarAbsenteNemotivate,
  calculeazaPenalizarePurtare,
  calculeazaMediaMaterie,
  calculeazaMedia,
  calculeazaClasament,
};
