// ============================================
// UPLOAD - Logică upload ZIP + drag & drop
// ============================================

import CONFIG from './config.js';
import { parseCSV, extractElevi, extractMaterii } from './csv-parser.js';
import { salveazaDate } from './data-store.js';

/**
 * Inițializează funcționalitatea de upload
 */
function initUpload() {
  const dropZone = document.getElementById('drop-zone');
  const fileInput = document.getElementById('file-input');
  const statusEl = document.getElementById('upload-status');

  if (!dropZone || !fileInput) {
    console.error('Elementele pentru upload nu au fost găsite');
    return;
  }

  // Click pe zona de drop deschide file picker
  dropZone.addEventListener('click', () => {
    fileInput.click();
  });

  // Selectare fișier prin input
  fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      proceseazaFisier(file, statusEl);
    }
  });

  // Drag & drop events
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

/**
 * Procesează fișierul încărcat (ZIP)
 */
async function proceseazaFisier(file, statusEl) {
  // Verificăm extensia
  if (!file.name.toLowerCase().endsWith('.zip')) {
    afiseazaStatus(statusEl, 'Eroare: Te rog încarcă un fișier ZIP.', 'error');
    return;
  }

  afiseazaStatus(statusEl, 'Se procesează arhiva...', 'loading');

  try {
    // Folosim JSZip pentru a extrage fișierele
    const zip = await JSZip.loadAsync(file);

    // Căutăm fișierele CSV
    let noteCSV = null;
    let absenteCSV = null;

    for (const [filename, zipEntry] of Object.entries(zip.files)) {
      if (zipEntry.dir) continue;

      const numeFisier = filename.toLowerCase();

      if (numeFisier.includes('note') && numeFisier.endsWith('.csv')) {
        noteCSV = await zipEntry.async('string');
      } else if (numeFisier.includes('absente') && numeFisier.endsWith('.csv')) {
        absenteCSV = await zipEntry.async('string');
      }
    }

    // Verificăm dacă am găsit fișierele necesare
    if (!noteCSV) {
      afiseazaStatus(statusEl, 'Eroare: Nu am găsit fișierul note.csv în arhivă.', 'error');
      return;
    }

    if (!absenteCSV) {
      afiseazaStatus(statusEl, 'Eroare: Nu am găsit fișierul absente.csv în arhivă.', 'error');
      return;
    }

    // Parsăm CSV-urile
    const note = parseCSV(noteCSV);
    const absente = parseCSV(absenteCSV);

    if (note.length === 0) {
      afiseazaStatus(statusEl, 'Eroare: Fișierul note.csv este gol sau invalid.', 'error');
      return;
    }

    // Extragem lista de elevi și materii
    const elevi = extractElevi(note, absente);
    const materii = extractMaterii(note);

    // Extragem clasa (din prima notă)
    const clasa = note[0]?.[CONFIG.NOTE.CLASA] || 'Necunoscută';

    // Salvăm datele
    const salvat = salveazaDate(note, absente, elevi, materii, clasa);

    if (!salvat) {
      afiseazaStatus(statusEl, 'Eroare: Nu s-au putut salva datele.', 'error');
      return;
    }

    afiseazaStatus(
      statusEl,
      `Succes! ${elevi.length} elevi încărcați. Apasă pe un elev pentru a vedea situația detaliată: note și absențe.`,
      'success'
    );

    // Afișăm lista de elevi
    afiseazaListaElevi(elevi, clasa);
  } catch (error) {
    console.error('Eroare la procesarea arhivei:', error);
    afiseazaStatus(statusEl, 'Eroare: Nu s-a putut procesa arhiva.', 'error');
  }
}

/**
 * Afișează un mesaj de status
 */
function afiseazaStatus(element, mesaj, tip) {
  if (!element) return;

  element.textContent = mesaj;
  element.className = 'upload-status';

  if (tip) {
    element.classList.add(`status-${tip}`);
  }
}
/**
 * Afișează lista de elevi după încărcare
 */
function afiseazaListaElevi(elevi, clasa) {
  // Ascundem zona de upload
  const uploadSection = document.querySelector('.upload-section');
  if (uploadSection) {
    uploadSection.classList.add('hidden');
  }

  // Ascundem subtitlul
  const subtitlu = document.getElementById('subtitlu');
  if (subtitlu) {
    subtitlu.classList.add('hidden');
  }

  const container = document.getElementById('elevi-container');
  if (!container) return;

  // Afișăm containerul
  container.classList.remove('hidden');

  // Titlu
  const titlu = container.querySelector('.elevi-titlu');
  if (titlu) {
    titlu.textContent = `Clasa ${clasa} - ${elevi.length} elevi`;
  }

  // Lista
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

  // Afișăm butonul pentru arhivă nouă
  const btnNoua = document.getElementById('btn-arhiva-noua');
  if (btnNoua) {
    btnNoua.classList.remove('hidden');
  }
}

/**
 * Verifică dacă există date și le afișează
 */
function verificaDateExistente() {
  const { elevi, clasa } = window.dataStore?.incarcaToateDate() || {};

  if (elevi && elevi.length > 0) {
    afiseazaListaElevi(elevi, clasa);
  }
}

export { initUpload, verificaDateExistente };
