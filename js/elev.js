import CONFIG from './config.js';
import {
  getNoteElev,
  getAbsenteElev,
  getTipAbsenta,
  calculeazaMedia,
  calculeazaClasament,
  calculeazaMediaMaterie,
  getNumarAbsenteNemotivate,
  parseData,
} from './csv-parser.js';
import { incarcaToateDate, existaDate } from './data-store.js';

const LUNI_NUME = {
  9: 'Sep',
  10: 'Oct',
  11: 'Nov',
  12: 'Dec',
  1: 'Ian',
  2: 'Feb',
  3: 'Mar',
  4: 'Apr',
  5: 'Mai',
  6: 'Iun',
  7: 'Iul',
};

const LUNI_NUME_COMPLET = {
  9: 'Septembrie',
  10: 'Octombrie',
  11: 'Noiembrie',
  12: 'Decembrie',
  1: 'Ianuarie',
  2: 'Februarie',
  3: 'Martie',
  4: 'Aprilie',
  5: 'Mai',
  6: 'Iunie',
  7: 'Iulie',
};

const ORDINE_LUNI = [9, 10, 11, 12, 1, 2, 3, 4, 5, 6, 7];

let dateIncarcate = null;
let elevCurent = null;
let indexElevCurent = 0;
let absenteElevCurent = [];
let filtruStatusActiv = 'toate';
let filtruLunaActiva = 'toate';

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
  initFiltreStatus();
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
      if (indexElevCurent > 0) navigheazaLaElev(indexElevCurent - 1);
    });
  }

  if (btnNext) {
    btnNext.addEventListener('click', () => {
      if (indexElevCurent < dateIncarcate.elevi.length - 1) navigheazaLaElev(indexElevCurent + 1);
    });
  }

  actualizeazaButoaneNavigatie();
}

function navigheazaLaElev(index) {
  indexElevCurent = index;
  elevCurent = dateIncarcate.elevi[indexElevCurent];
  window.history.pushState({ id: index }, '', `elev.html?id=${index}`);
  document.getElementById('select-elev').value = index;
  actualizeazaButoaneNavigatie();
  resetFiltre();
  afiseazaElev();
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

function initFiltreStatus() {
  const container = document.getElementById('filtre-status');
  if (!container) return;

  container.addEventListener('click', (e) => {
    if (e.target.classList.contains('filtru')) {
      container.querySelectorAll('.filtru').forEach((f) => f.classList.remove('active'));
      e.target.classList.add('active');
      filtruStatusActiv = e.target.dataset.filtru;
      aplicaFiltre();
    }
  });
}

function initFiltreLuni(absente) {
  const container = document.getElementById('filtre-luni');
  if (!container) return;

  container.innerHTML = '';

  const luniCuAbsente = calculeazaAbsentePeLuni(absente);

  const btnToate = document.createElement('button');
  btnToate.className = 'filtru filtru-luna active';
  btnToate.dataset.filtru = 'toate';
  btnToate.textContent = `Toate (${absente.length} abs.)`;
  container.appendChild(btnToate);

  ORDINE_LUNI.forEach((luna) => {
    if (luniCuAbsente[luna] && luniCuAbsente[luna].total > 0) {
      const btn = document.createElement('button');
      btn.className = 'filtru filtru-luna';
      btn.dataset.filtru = luna;
      btn.textContent = `${LUNI_NUME[luna]} (${luniCuAbsente[luna].total} abs.)`;
      container.appendChild(btn);
    }
  });

  container.addEventListener('click', (e) => {
    if (e.target.classList.contains('filtru-luna')) {
      container.querySelectorAll('.filtru-luna').forEach((f) => f.classList.remove('active'));
      e.target.classList.add('active');
      filtruLunaActiva = e.target.dataset.filtru;
      aplicaFiltre();
    }
  });
}

function resetFiltre() {
  filtruStatusActiv = 'toate';
  filtruLunaActiva = 'toate';

  const statusBtns = document.querySelectorAll('#filtre-status .filtru');
  statusBtns.forEach((f) => f.classList.remove('active'));
  const btnToateStatus = document.querySelector('#filtre-status .filtru[data-filtru="toate"]');
  if (btnToateStatus) btnToateStatus.classList.add('active');
}

function aplicaFiltre() {
  const randuri = document.querySelectorAll('#tabel-absente tbody tr');
  let vizibile = 0;

  randuri.forEach((rand) => {
    const status = rand.dataset.status;
    const luna = parseInt(rand.dataset.luna);

    let vizibil = true;

    if (filtruStatusActiv !== 'toate' && status !== filtruStatusActiv) {
      vizibil = false;
    }

    if (filtruLunaActiva !== 'toate' && luna !== parseInt(filtruLunaActiva)) {
      vizibil = false;
    }

    if (vizibil) {
      rand.classList.remove('row-hidden');
      vizibile++;
    } else {
      rand.classList.add('row-hidden');
    }
  });

  const mesajGol = document.getElementById('absente-goale');
  const tabelContainer = document.querySelector('.tabel-absente-lista');

  if (vizibile === 0) {
    if (mesajGol) mesajGol.classList.remove('hidden');
    if (tabelContainer) tabelContainer.style.display = 'none';
  } else {
    if (mesajGol) mesajGol.classList.add('hidden');
    if (tabelContainer) tabelContainer.style.display = 'block';
  }
}

function calculeazaAbsentePeLuni(absente) {
  const luni = {};

  ORDINE_LUNI.forEach((luna) => {
    luni[luna] = { total: 0, motivate: 0, nemotivate: 0 };
  });

  absente.forEach((absenta) => {
    const data = parseData(absenta[CONFIG.ABSENTE.DATA]);
    if (!data) return;

    const luna = data.getMonth() + 1;
    const tipAbsenta = getTipAbsenta(absenta);

    if (luni[luna]) {
      luni[luna].total++;
      if (tipAbsenta.cod === 'NEMOTIVATA') {
        luni[luna].nemotivate++;
      } else {
        luni[luna].motivate++;
      }
    }
  });

  return luni;
}

function calculeazaAbsentePeMotive(absente) {
  const motive = {
    scutireMedicala: 0,
    invoireParinte: 0,
    altMotiv: 0,
  };

  absente.forEach((absenta) => {
    const tipAbsenta = getTipAbsenta(absenta);
    if (tipAbsenta.cod === 'SCUTIRE_MEDICALA') {
      motive.scutireMedicala++;
    } else if (tipAbsenta.cod === 'INVOIRE_PARINTE') {
      motive.invoireParinte++;
    } else if (tipAbsenta.cod === 'ALT_MOTIV') {
      motive.altMotiv++;
    }
  });

  return motive;
}

function afiseazaElev() {
  document.getElementById('nume-elev').textContent = elevCurent;
  document.getElementById('info-clasa').textContent = `Clasa ${dateIncarcate.clasa}`;
  document.title = `${elevCurent} - Catalog Digital`;

  const noteElev = getNoteElev(dateIncarcate.note, elevCurent);
  absenteElevCurent = getAbsenteElev(dateIncarcate.absente, elevCurent);
  const absenteNemotivate = getNumarAbsenteNemotivate(dateIncarcate.absente, elevCurent);

  const media = calculeazaMedia(dateIncarcate.note, elevCurent, dateIncarcate.absente);
  const clasament = calculeazaClasament(
    dateIncarcate.note,
    dateIncarcate.elevi,
    dateIncarcate.absente
  );
  const pozitieElev = clasament.find((c) => c.elev === elevCurent);

  const statsAbsente = calculeazaStatisticiAbsente(absenteElevCurent);

  afiseazaSumar(media, pozitieElev, statsAbsente.total);
  afiseazaTabelNote(noteElev, absenteNemotivate);
  afiseazaTabelAbsente(absenteElevCurent);
  afiseazaStatisticiAbsenteUI(statsAbsente);
  afiseazaTabelStatisticiLuni(absenteElevCurent);
  afiseazaTabelStatisticiMotive(absenteElevCurent);
  initFiltreLuni(absenteElevCurent);
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

    const tdMaterie = document.createElement('td');
    tdMaterie.textContent = materie;
    tr.appendChild(tdMaterie);

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
  const tabelContainer = document.querySelector('.tabel-absente-lista');
  const tabelLuni = document.querySelector('.tabel-luni');
  const tabelMotive = document.querySelector('.tabel-motive');

  if (!tbody) return;
  tbody.innerHTML = '';

  if (absenteElev.length === 0) {
    if (mesajGol) mesajGol.classList.remove('hidden');
    if (tabelContainer) tabelContainer.style.display = 'none';
    if (tabelLuni) tabelLuni.style.display = 'none';
    if (tabelMotive) tabelMotive.style.display = 'none';
    return;
  }

  if (mesajGol) mesajGol.classList.add('hidden');
  if (tabelContainer) tabelContainer.style.display = 'block';
  if (tabelLuni) tabelLuni.style.display = 'block';
  if (tabelMotive) tabelMotive.style.display = 'block';

  absenteElev.forEach((absenta) => {
    const tr = document.createElement('tr');
    const tipAbsenta = getTipAbsenta(absenta);
    const data = parseData(absenta[CONFIG.ABSENTE.DATA]);
    const luna = data ? data.getMonth() + 1 : 0;

    const statusSimplificat = tipAbsenta.cod === 'NEMOTIVATA' ? 'nemotivata' : 'motivata';
    tr.dataset.status = statusSimplificat;
    tr.dataset.luna = luna;

    const tdData = document.createElement('td');
    tdData.textContent = absenta[CONFIG.ABSENTE.DATA];
    tr.appendChild(tdData);

    const tdMaterie = document.createElement('td');
    tdMaterie.textContent = absenta[CONFIG.ABSENTE.MATERIE];
    tr.appendChild(tdMaterie);

    const tdStatus = document.createElement('td');
    const spanStatus = document.createElement('span');
    spanStatus.className = `status-absenta ${statusSimplificat}`;
    spanStatus.textContent = tipAbsenta.cod === 'NEMOTIVATA' ? 'Nemotivată' : 'Motivată';
    tdStatus.appendChild(spanStatus);
    tr.appendChild(tdStatus);

    const tdMotiv = document.createElement('td');
    if (tipAbsenta.cod === 'NEMOTIVATA') {
      tdMotiv.innerHTML = '<span class="motiv-text fara-motiv">-</span>';
    } else {
      tdMotiv.innerHTML = `<span class="motiv-text">${tipAbsenta.eticheta}</span>`;
    }
    tr.appendChild(tdMotiv);

    tbody.appendChild(tr);
  });
}

function afiseazaTabelStatisticiLuni(absenteElev) {
  const tbody = document.querySelector('#tabel-stats-luni tbody');
  if (!tbody) return;

  tbody.innerHTML = '';

  const luniStats = calculeazaAbsentePeLuni(absenteElev);

  ORDINE_LUNI.forEach((luna) => {
    if (luniStats[luna] && luniStats[luna].total > 0) {
      const tr = document.createElement('tr');

      const tdLuna = document.createElement('td');
      tdLuna.textContent = LUNI_NUME_COMPLET[luna];
      tr.appendChild(tdLuna);

      const tdTotal = document.createElement('td');
      tdTotal.textContent = luniStats[luna].total;
      tr.appendChild(tdTotal);

      const tdMotivate = document.createElement('td');
      tdMotivate.textContent = luniStats[luna].motivate;
      tdMotivate.style.color = 'var(--motivata)';
      tr.appendChild(tdMotivate);

      const tdNemotivate = document.createElement('td');
      tdNemotivate.textContent = luniStats[luna].nemotivate;
      tdNemotivate.style.color = 'var(--nemotivata)';
      tr.appendChild(tdNemotivate);

      tbody.appendChild(tr);
    }
  });
}

function afiseazaTabelStatisticiMotive(absenteElev) {
  const tbody = document.querySelector('#tabel-stats-motive tbody');
  const tabelMotive = document.querySelector('.tabel-motive');
  if (!tbody) return;

  tbody.innerHTML = '';

  const motive = calculeazaAbsentePeMotive(absenteElev);
  const totalMotivate = motive.scutireMedicala + motive.invoireParinte + motive.altMotiv;

  if (totalMotivate === 0) {
    if (tabelMotive) tabelMotive.style.display = 'none';
    return;
  }

  const date = [
    { nume: CONFIG.ETICHETE.SCUTIRE_MEDICALA, valoare: motive.scutireMedicala },
    { nume: CONFIG.ETICHETE.INVOIRE_PARINTE, valoare: motive.invoireParinte },
    { nume: CONFIG.ETICHETE.ALT_MOTIV, valoare: motive.altMotiv },
  ];

  date.forEach((item) => {
    if (item.valoare > 0) {
      const tr = document.createElement('tr');

      const tdMotiv = document.createElement('td');
      tdMotiv.textContent = item.nume;
      tr.appendChild(tdMotiv);

      const tdTotal = document.createElement('td');
      tdTotal.textContent = item.valoare;
      tdTotal.style.fontWeight = '600';
      tr.appendChild(tdTotal);

      tbody.appendChild(tr);
    }
  });
}

function calculeazaStatisticiAbsente(absenteElev) {
  const stats = { total: absenteElev.length, nemotivate: 0, motivate: 0 };

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
    resetFiltre();
    afiseazaElev();
  }
});

document.addEventListener('DOMContentLoaded', init);
