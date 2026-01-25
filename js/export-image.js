// ============================================
// EXPORT-IMAGE.JS - Export tabele ca imagine PNG
// ============================================

/**
 * Inițializează butoanele de export
 */
function initExport() {
  // Export note
  const btnExportNote = document.getElementById('btn-export-note');
  if (btnExportNote) {
    btnExportNote.addEventListener('click', () => {
      exportTabel('tabel-note', getNumeElev() + ' - Note');
    });
  }

  // Export absențe
  const btnExportAbsente = document.getElementById('btn-export-absente');
  if (btnExportAbsente) {
    btnExportAbsente.addEventListener('click', () => {
      exportTabel('tabel-absente', getNumeElev() + ' - Absente');
    });
  }

  // Export clasament
  const btnExportClasament = document.getElementById('btn-export-clasament');
  if (btnExportClasament) {
    btnExportClasament.addEventListener('click', () => {
      exportTabel('tabel-clasament', getNumeClasa() + ' - Clasament');
    });
  }

  // Export absențe clasă
  const btnExportAbsenteClasa = document.getElementById('btn-export-absente');
  if (btnExportAbsenteClasa && document.getElementById('tabel-absente-elevi')) {
    btnExportAbsenteClasa.addEventListener('click', () => {
      exportTabel('tabel-absente-elevi', getNumeClasa() + ' - Absente');
    });
  }
}

/**
 * Obține numele elevului curent din pagină
 */
function getNumeElev() {
  const numeEl = document.getElementById('nume-elev');
  return numeEl ? numeEl.textContent : 'Elev';
}

/**
 * Obține numele clasei din pagină
 */
function getNumeClasa() {
  const clasaEl = document.getElementById('info-clasa');
  return clasaEl ? clasaEl.textContent : 'Clasa';
}

/**
 * Exportă un tabel ca imagine PNG
 */
async function exportTabel(tabelId, numeFisier) {
  const tabel = document.getElementById(tabelId);
  if (!tabel) {
    alert('Tabelul nu a fost găsit.');
    return;
  }

  // Afișăm mesaj de loading
  const btn = event.target;
  const textOriginal = btn.textContent;
  btn.textContent = '⏳ Se generează...';
  btn.disabled = true;

  try {
    // Creăm un container temporar pentru export
    const container = document.createElement('div');
    container.style.cssText = `
            position: absolute;
            left: -9999px;
            top: 0;
            background: white;
            padding: 20px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        `;

    // Adăugăm titlul
    const titlu = document.createElement('h2');
    titlu.textContent = numeFisier;
    titlu.style.cssText = `
            margin: 0 0 16px 0;
            font-size: 18px;
            color: #111827;
            text-align: center;
        `;
    container.appendChild(titlu);

    // Adăugăm data generării
    const dataEl = document.createElement('p');
    const now = new Date();
    dataEl.textContent = `Generat: ${now.toLocaleDateString('ro-RO')} ${now.toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' })}`;
    dataEl.style.cssText = `
            margin: 0 0 16px 0;
            font-size: 12px;
            color: #6b7280;
            text-align: center;
        `;
    container.appendChild(dataEl);

    // Clonăm tabelul
    const tabelClonat = tabel.cloneNode(true);
    tabelClonat.style.cssText = `
            width: 100%;
            border-collapse: collapse;
            font-size: 14px;
        `;

    // Stilizăm celulele clonate
    const celule = tabelClonat.querySelectorAll('th, td');
    celule.forEach((celula) => {
      celula.style.cssText = `
                padding: 10px 12px;
                border: 1px solid #e5e7eb;
                text-align: left;
            `;
    });

    // Stilizăm header-ul
    const headerCelule = tabelClonat.querySelectorAll('th');
    headerCelule.forEach((celula) => {
      celula.style.cssText += `
                background-color: #f3f4f6;
                font-weight: 600;
                color: #374151;
            `;
    });

    // Ascundem rândurile filtrate (dacă există)
    const randuriAscunse = tabelClonat.querySelectorAll('.row-hidden');
    randuriAscunse.forEach((rand) => rand.remove());

    // Stilizăm notele
    const note = tabelClonat.querySelectorAll('.nota');
    note.forEach((nota) => {
      nota.style.cssText = `
                display: inline-block;
                min-width: 24px;
                padding: 2px 6px;
                margin: 2px;
                border-radius: 4px;
                font-weight: 600;
                text-align: center;
            `;

      if (nota.classList.contains('nota-mica')) {
        nota.style.backgroundColor = '#fee2e2';
        nota.style.color = '#dc2626';
      } else if (nota.classList.contains('nota-medie')) {
        nota.style.backgroundColor = '#fef3c7';
        nota.style.color = '#92400e';
      } else if (nota.classList.contains('nota-mare')) {
        nota.style.backgroundColor = '#dcfce7';
        nota.style.color = '#16a34a';
      }
    });

    // Stilizăm statusurile absențelor
    const statusuri = tabelClonat.querySelectorAll('.status-absenta');
    statusuri.forEach((status) => {
      status.style.cssText = `
                display: inline-block;
                padding: 4px 10px;
                border-radius: 20px;
                font-size: 12px;
                font-weight: 500;
            `;

      if (status.classList.contains('nemotivata')) {
        status.style.backgroundColor = '#fee2e2';
        status.style.color = '#dc2626';
      } else if (status.classList.contains('scutire-medicala')) {
        status.style.backgroundColor = '#dcfce7';
        status.style.color = '#16a34a';
      } else if (status.classList.contains('invoire-parinte')) {
        status.style.backgroundColor = '#dbeafe';
        status.style.color = '#2563eb';
      } else if (status.classList.contains('alt-motiv')) {
        status.style.backgroundColor = '#f3e8ff';
        status.style.color = '#9333ea';
      }
    });

    // Stilizăm celulele speciale
    const celuleMedia = tabelClonat.querySelectorAll('.celula-media, .col-media');
    celuleMedia.forEach((celula) => {
      celula.style.fontWeight = '700';
      celula.style.color = '#2563eb';
    });

    const celuleFaraNote = tabelClonat.querySelectorAll('.celula-fara-note');
    celuleFaraNote.forEach((celula) => {
      celula.style.color = '#6b7280';
      celula.style.fontStyle = 'italic';
    });

    const celuleNemotivate = tabelClonat.querySelectorAll('.celula-nemotivate.are-nemotivate');
    celuleNemotivate.forEach((celula) => {
      celula.style.color = '#dc2626';
      celula.style.fontWeight = '600';
    });

    container.appendChild(tabelClonat);
    document.body.appendChild(container);

    // Generăm imaginea cu html2canvas
    const canvas = await html2canvas(container, {
      backgroundColor: '#ffffff',
      scale: 2,
      logging: false,
      useCORS: true,
    });

    // Ștergem containerul temporar
    document.body.removeChild(container);

    // Descărcăm imaginea
    const link = document.createElement('a');
    link.download = `${numeFisier.replace(/[^a-zA-Z0-9]/g, '_')}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  } catch (error) {
    console.error('Eroare la generarea imaginii:', error);
    alert('Eroare la generarea imaginii. Verifică consola pentru detalii.');
  } finally {
    // Resetăm butonul
    btn.textContent = textOriginal;
    btn.disabled = false;
  }
}

export { initExport };
