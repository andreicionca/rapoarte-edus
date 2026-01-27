import CONFIG from './config.js';
import { parseCSV, extractElevi, extractMaterii } from './csv-parser.js';
import { salveazaDate } from './data-store.js';

function initUpload() {
  const dropZone = document.getElementById('drop-zone');
  const fileInput = document.getElementById('file-input');
  const statusEl = document.getElementById('upload-status');

  if (!dropZone || !fileInput) {
    console.error('Elementele pentru upload nu au fost găsite');
    return;
  }

  dropZone.addEventListener('click', () => {
    fileInput.click();
  });

  fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      proceseazaFisier(file, statusEl);
    }
  });

  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('drag-over');
  });

  dropZone.addEventListener('dragleave', (e) => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
  });

  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');

    const file = e.dataTransfer.files[0];
    if (file) {
      proceseazaFisier(file, statusEl);
    }
  });
}

async function proceseazaFisier(file, statusEl) {
  if (!file.name.toLowerCase().endsWith('.zip')) {
    afiseazaStatus(statusEl, 'Eroare: Te rog încarcă un fișier ZIP.', 'error');
    return;
  }

  afiseazaStatus(statusEl, 'Se procesează arhiva...', 'loading');

  try {
    const zip = await JSZip.loadAsync(file);

    let noteCSV = null;
    let absenteCSV = null;
    let dataRaport = null;

    for (const [filename, zipEntry] of Object.entries(zip.files)) {
      if (zipEntry.dir) continue;

      const numeFisier = filename.toLowerCase();

      if (numeFisier.includes('note') && numeFisier.endsWith('.csv')) {
        noteCSV = await zipEntry.async('string');
        if (zipEntry.date) {
          const d = zipEntry.date;
          if (!dataRaport || d > dataRaport) {
            dataRaport = d;
          }
        }
      } else if (numeFisier.includes('absente') && numeFisier.endsWith('.csv')) {
        absenteCSV = await zipEntry.async('string');
        if (zipEntry.date) {
          const d = zipEntry.date;
          if (!dataRaport || d > dataRaport) {
            dataRaport = d;
          }
        }
      }
    }

    if (!noteCSV) {
      afiseazaStatus(statusEl, 'Eroare: Nu am găsit fișierul note.csv în arhivă.', 'error');
      return;
    }

    if (!absenteCSV) {
      afiseazaStatus(statusEl, 'Eroare: Nu am găsit fișierul absente.csv în arhivă.', 'error');
      return;
    }

    const note = parseCSV(noteCSV);
    const absente = parseCSV(absenteCSV);

    if (note.length === 0) {
      afiseazaStatus(statusEl, 'Eroare: Fișierul note.csv este gol sau invalid.', 'error');
      return;
    }

    const elevi = extractElevi(note, absente);
    const materii = extractMaterii(note);
    const clasa = note[0]?.[CONFIG.NOTE.CLASA] || 'Necunoscută';

    const dataRaportString = dataRaport ? formateazaData(dataRaport) : formateazaData(new Date());

    const salvat = salveazaDate(note, absente, elevi, materii, clasa, dataRaportString);

    if (!salvat) {
      afiseazaStatus(statusEl, 'Eroare: Nu s-au putut salva datele.', 'error');
      return;
    }

    afiseazaStatus(
      statusEl,
      `Succes! ${elevi.length} elevi încărcați. Raport din ${dataRaportString}.`,
      'success'
    );

    afiseazaListaElevi(elevi, clasa);
  } catch (error) {
    console.error('Eroare la procesarea arhivei:', error);
    afiseazaStatus(statusEl, 'Eroare: Nu s-a putut procesa arhiva.', 'error');
  }
}

function formateazaData(data) {
  const d = new Date(data);
  const zi = String(d.getUTCDate()).padStart(2, '0');
  const luna = String(d.getUTCMonth() + 1).padStart(2, '0');
  const an = d.getUTCFullYear();
  const ora = String(d.getUTCHours()).padStart(2, '0');
  const min = String(d.getUTCMinutes()).padStart(2, '0');
  return `${zi}/${luna}/${an} ${ora}:${min}`;
}

function afiseazaStatus(element, mesaj, tip) {
  if (!element) return;

  element.textContent = mesaj;
  element.className = 'upload-status';

  if (tip) {
    element.classList.add(`status-${tip}`);
  }
}

function afiseazaListaElevi(elevi, clasa) {
  const uploadSection = document.querySelector('.upload-section');
  if (uploadSection) {
    uploadSection.classList.add('hidden');
  }

  const subtitlu = document.getElementById('subtitlu');
  if (subtitlu) {
    subtitlu.classList.add('hidden');
  }

  const container = document.getElementById('elevi-container');
  if (!container) return;

  container.classList.remove('hidden');

  const titlu = container.querySelector('.elevi-titlu');
  if (titlu) {
    titlu.textContent = `Clasa ${clasa} - ${elevi.length} elevi`;
  }

  const lista = container.querySelector('.elevi-lista');
  if (!lista) return;

  lista.innerHTML = '';

  elevi.forEach((elev, index) => {
    const item = document.createElement('a');
    item.href = `elev.html?id=${index}`;
    item.className = 'elev-item';
    item.textContent = elev;
    lista.appendChild(item);
  });

  const btnNoua = document.getElementById('btn-arhiva-noua');
  if (btnNoua) {
    btnNoua.classList.remove('hidden');
  }
}

function verificaDateExistente() {
  return false;
}

export { initUpload, verificaDateExistente };
