import CONFIG from './config.js';
import {
  getNoteElev,
  getAbsenteElev,
  getTipAbsenta,
  calculeazaMedia,
  calculeazaClasament,
  calculeazaMediaMaterie,
  getNumarAbsenteNemotivate,
} from './csv-parser.js';
import { incarcaToateDate, existaDate } from './data-store.js';

let dateIncarcate = null;
let elevCurent = null;
let indexElevCurent = 0;

function init() {
  if (!existaDate()) {
    window.location.href = 'index.html';
    return;
  }

  dateIncarcate = incarcaToateDate();

  if (!dateIncarcate.elevi || dateIncarcate.elevi.length === 0) {
    window.location.href = 'index.html';
    return;
  }

  const urlParams = new URLSearchParams(window.location.search);
  const idElev = parseInt(urlParams.get('id')) || 0;
  indexElevCurent = Math.max(0, Math.min(idElev, dateIncarcate.elevi.length - 1));
  elevCurent = dateIncarcate.elevi[indexElevCurent];

  initNavigatie();
  initTabs();
  initFiltre();
  afiseazaElev();
}

function initNavigatie() {
  const selectElev = document.getElementById('select-elev');
  const btnPrev = document.getElementById('btn-prev');
  const btnNext = document.getElementById('btn-next');

  if (selectElev) {
    selectElev.innerHTML = '';
    dateIncarcate.elevi.forEach((elev, index) => {
      const option = document.createElement('option');
      option.value = index;
      option.textContent = elev;
      selectElev.appendChild(option);
    });
    selectElev.value = indexElevCurent;
    selectElev.addEventListener('change', (e) => {
      navigheazaLaElev(parseInt(e.target.value));
    });
  }

  if (btnPrev) {
    btnPrev.addEventListener('click', () => {
      if (indexElevCurent > 0) {
        navigheazaLaElev(indexElevCurent - 1);
      }
    });
  }

  if (btnNext) {
    btnNext.addEventListener('click', () => {
      if (indexElevCurent < dateIncarcate.elevi.length - 1) {
        navigheazaLaElev(indexElevCurent + 1);
      }
    });
  }

  actualizeazaButoaneNavigatie();
}

function navigheazaLaElev(index) {
  indexElevCurent = index;
  elevCurent = dateIncarcate.elevi[indexElevCurent];
  const newUrl = `elev.html?id=${index}`;
  window.history.pushState({ id: index }, '', newUrl);
  document.getElementById('select-elev').value = index;
  actualizeazaButoaneNavigatie();
  afiseazaElev();
  resetFiltre();
}

function actualizeazaButoaneNavigatie() {
  const btnPrev = document.getElementById('btn-prev');
  const btnNext = document.getElementById('btn-next');
  if (btnPrev) btnPrev.disabled = indexElevCurent === 0;
  if (btnNext) btnNext.disabled = indexElevCurent === dateIncarcate.elevi.length - 1;
}

function initTabs() {
  const tabs = document.querySelectorAll('.tab');
  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const tabId = tab.dataset.tab;
      tabs.forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');
      document.querySelectorAll('.tab-content').forEach((content) => {
        content.classList.remove('active');
      });
      document.getElementById(`tab-${tabId}`).classList.add('active');
    });
  });
}

function initFiltre() {
  const filtre = document.querySelectorAll('.filtru');
  filtre.forEach((filtru) => {
    filtru.addEventListener('click', () => {
      filtre.forEach((f) => f.classList.remove('active'));
      filtru.classList.add('active');
      aplicaFiltru(filtru.dataset.filtru);
    });
  });
}

function resetFiltre() {
  const filtre = document.querySelectorAll('.filtru');
  filtre.forEach((f) => f.classList.remove('active'));
  const filtruToate = document.querySelector('.filtru[data-filtru="toate"]');
  if (filtruToate) filtruToate.classList.add('active');
  aplicaFiltru('toate');
}

function aplicaFiltru(tipFiltru) {
  const randuri = document.querySelectorAll('#tabel-absente tbody tr');
  randuri.forEach((rand) => {
    if (tipFiltru === 'toate') {
      rand.classList.remove('row-hidden');
    } else {
      const statusEl = rand.querySelector('.status-absenta');
      if (statusEl && statusEl.classList.contains(tipFiltru)) {
        rand.classList.remove('row-hidden');
      } else {
        rand.classList.add('row-hidden');
      }
    }
  });

  const randuriVizibile = document.querySelectorAll('#tabel-absente tbody tr:not(.row-hidden)');
  const mesajGol = document.getElementById('absente-goale');
  const tabelContainer = document.querySelector('#tab-absente .tabel-container');

  if (randuriVizibile.length === 0) {
    if (mesajGol) mesajGol.classList.remove('hidden');
    if (tabelContainer) tabelContainer.style.display = 'none';
  } else {
    if (mesajGol) mesajGol.classList.add('hidden');
    if (tabelContainer) tabelContainer.style.display = 'block';
  }
}

function afiseazaElev() {
  document.getElementById('nume-elev').textContent = elevCurent;
  document.getElementById('info-clasa').textContent = `Clasa ${dateIncarcate.clasa}`;
  document.title = `${elevCurent} - Catalog Digital`;

  const noteElev = getNoteElev(dateIncarcate.note, elevCurent);
  const absenteElev = getAbsenteElev(dateIncarcate.absente, elevCurent);
  const absenteNemotivate = getNumarAbsenteNemotivate(dateIncarcate.absente, elevCurent);

  const media = calculeazaMedia(dateIncarcate.note, elevCurent, dateIncarcate.absente);
  const clasament = calculeazaClasament(
    dateIncarcate.note,
    dateIncarcate.elevi,
    dateIncarcate.absente
  );
  const pozitieElev = clasament.find((c) => c.elev === elevCurent);

  const statsAbsente = calculeazaStatisticiAbsente(absenteElev);

  afiseazaSumar(media, pozitieElev, statsAbsente.total);
  afiseazaTabelNote(noteElev, absenteNemotivate);
  afiseazaTabelAbsente(absenteElev);
  afiseazaStatisticiAbsenteUI(statsAbsente);
}

function afiseazaSumar(media, pozitieElev, totalAbsente) {
  const mediaEl = document.getElementById('media-generala');
  const pozitieEl = document.getElementById('pozitie-clasament');
  const absenteEl = document.getElementById('total-absente');

  if (mediaEl) mediaEl.textContent = media !== null ? media.toFixed(2) : '-';
  if (pozitieEl) {
    pozitieEl.textContent =
      pozitieElev?.pozitie !== null ? `${pozitieElev.pozitie}/${dateIncarcate.elevi.length}` : '-';
  }
  if (absenteEl) absenteEl.textContent = totalAbsente;
}

function afiseazaTabelNote(noteElev, absenteNemotivate) {
  const tbody = document.querySelector('#tabel-note tbody');
  if (!tbody) return;

  tbody.innerHTML = '';

  const notePerMaterie = {};
  dateIncarcate.materii.forEach((materie) => {
    notePerMaterie[materie] = [];
  });

  noteElev.forEach((nota) => {
    const materie = nota[CONFIG.NOTE.MATERIE];
    if (notePerMaterie[materie]) {
      notePerMaterie[materie].push({
        valoare: parseFloat(nota[CONFIG.NOTE.NOTA]),
        data: nota[CONFIG.NOTE.DATA],
      });
    }
  });

  dateIncarcate.materii.forEach((materie) => {
    const note = notePerMaterie[materie];
    const tr = document.createElement('tr');

    // Coloana disciplină
    const tdMaterie = document.createElement('td');
    tdMaterie.className = 'celula-materie';
    tdMaterie.textContent = materie;
    tr.appendChild(tdMaterie);

    // Coloana note
    const tdNote = document.createElement('td');
    tdNote.className = 'celula-note';
    if (note.length > 0) {
      note.forEach((n) => {
        const span = document.createElement('span');
        span.className = 'nota ' + getClasaNota(n.valoare);
        span.textContent = n.valoare;
        span.title = n.data;
        tdNote.appendChild(span);
      });
    } else {
      tdNote.innerHTML = '<span class="fara-note">-</span>';
    }
    tr.appendChild(tdNote);

    // Coloana medie
    const tdMedia = document.createElement('td');
    tdMedia.className = 'celula-media';

    const estePurtare = materie === CONFIG.PURTARE.NUME_MATERIE;

    if (note.length > 0) {
      const noteValori = note.map((n) => n.valoare);
      const rezultat = calculeazaMediaMaterie(noteValori, materie, absenteNemotivate);
      tdMedia.textContent = rezultat.mediaRotunjita;

      if (estePurtare && rezultat.penalizare > 0) {
        tdMedia.title = `Media notelor: ${Math.round(rezultat.mediaExacta)} | Penalizare: -${rezultat.penalizare} | Final: ${rezultat.mediaRotunjita}`;
        tdMedia.classList.add('media-penalizata');
      } else {
        tdMedia.title = `Media exactă: ${rezultat.mediaExacta.toFixed(2)}`;
      }
    } else if (estePurtare) {
      // Purtare fără note = 10 by default, apoi penalizare
      const rezultat = calculeazaMediaMaterie([10], materie, absenteNemotivate);
      tdMedia.textContent = rezultat.mediaRotunjita;

      if (rezultat.penalizare > 0) {
        tdMedia.title = `Media implicită: 10 | Penalizare: -${rezultat.penalizare} | Final: ${rezultat.mediaRotunjita}`;
        tdMedia.classList.add('media-penalizata');
      } else {
        tdMedia.title = 'Media implicită: 10';
      }
      tdMedia.classList.add('media-implicita');
    } else {
      tdMedia.innerHTML = '<span class="fara-note">-</span>';
    }
    tr.appendChild(tdMedia);

    tbody.appendChild(tr);
  });
}

function getClasaNota(valoare) {
  if (valoare < 5) return 'nota-mica';
  if (valoare < 7) return 'nota-medie';
  return 'nota-mare';
}

function afiseazaTabelAbsente(absenteElev) {
  const tbody = document.querySelector('#tabel-absente tbody');
  const mesajGol = document.getElementById('absente-goale');
  const tabelContainer = document.querySelector('#tab-absente .tabel-container');

  if (!tbody) return;
  tbody.innerHTML = '';

  if (absenteElev.length === 0) {
    if (mesajGol) mesajGol.classList.remove('hidden');
    if (tabelContainer) tabelContainer.style.display = 'none';
    return;
  }

  if (mesajGol) mesajGol.classList.add('hidden');
  if (tabelContainer) tabelContainer.style.display = 'block';

  absenteElev.forEach((absenta) => {
    const tr = document.createElement('tr');
    const tipAbsenta = getTipAbsenta(absenta);

    const tdData = document.createElement('td');
    tdData.textContent = absenta[CONFIG.ABSENTE.DATA];
    tr.appendChild(tdData);

    const tdMaterie = document.createElement('td');
    tdMaterie.textContent = absenta[CONFIG.ABSENTE.MATERIE];
    tr.appendChild(tdMaterie);

    const tdStatus = document.createElement('td');
    const spanStatus = document.createElement('span');
    spanStatus.className = `status-absenta ${tipAbsenta.clasa}`;
    spanStatus.textContent = tipAbsenta.eticheta;
    tdStatus.appendChild(spanStatus);
    tr.appendChild(tdStatus);

    tbody.appendChild(tr);
  });
}

function calculeazaStatisticiAbsente(absenteElev) {
  const stats = {
    total: absenteElev.length,
    nemotivate: 0,
    motivate: 0,
  };

  absenteElev.forEach((absenta) => {
    const tipAbsenta = getTipAbsenta(absenta);
    if (tipAbsenta.cod === 'NEMOTIVATA') {
      stats.nemotivate++;
    } else {
      stats.motivate++;
    }
  });

  return stats;
}

function afiseazaStatisticiAbsenteUI(stats) {
  const totalEl = document.getElementById('abs-total');
  const nemotivateEl = document.getElementById('abs-nemotivate');
  const motivateEl = document.getElementById('abs-motivate');

  if (totalEl) totalEl.textContent = stats.total;
  if (nemotivateEl) nemotivateEl.textContent = stats.nemotivate;
  if (motivateEl) motivateEl.textContent = stats.motivate;
}

window.addEventListener('popstate', (e) => {
  if (e.state && typeof e.state.id === 'number') {
    indexElevCurent = e.state.id;
    elevCurent = dateIncarcate.elevi[indexElevCurent];
    document.getElementById('select-elev').value = indexElevCurent;
    actualizeazaButoaneNavigatie();
    afiseazaElev();
    resetFiltre();
  }
});

document.addEventListener('DOMContentLoaded', init);
