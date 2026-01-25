// ============================================
// STATISTICI.JS - Logică pagina statistici clasă
// ============================================

import CONFIG from './config.js';
import {
  getAbsenteElev,
  getTipAbsenta,
  calculeazaMedia,
  calculeazaClasament,
} from './csv-parser.js';
import { incarcaToateDate, existaDate } from './data-store.js';

// Variabile globale pagină
let dateIncarcate = null;

/**
 * Inițializare pagină
 */
function init() {
  // Verificăm dacă există date
  if (!existaDate()) {
    window.location.href = 'index.html';
    return;
  }

  // Încărcăm datele
  dateIncarcate = incarcaToateDate();

  if (!dateIncarcate.elevi || dateIncarcate.elevi.length === 0) {
    window.location.href = 'index.html';
    return;
  }

  // Inițializăm tab-urile
  initTabs();

  // Afișăm statisticile
  afiseazaStatistici();
}

/**
 * Inițializează tab-urile
 */
function initTabs() {
  const tabs = document.querySelectorAll('.tab');

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const tabId = tab.dataset.tab;

      // Actualizăm tab-uri
      tabs.forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');

      // Actualizăm conținut
      document.querySelectorAll('.tab-content').forEach((content) => {
        content.classList.remove('active');
      });
      document.getElementById(`tab-${tabId}`).classList.add('active');
    });
  });
}

/**
 * Afișează toate statisticile
 */
function afiseazaStatistici() {
  // Header
  document.getElementById('info-clasa').textContent = `Clasa ${dateIncarcate.clasa}`;

  // Calculăm clasamentul
  const clasament = calculeazaClasament(dateIncarcate.note, dateIncarcate.elevi);

  // Calculăm statistici absențe pentru toți elevii
  const statisticiAbsente = calculeazaStatisticiAbsenteClasa();

  // Afișăm sumarul general
  afiseazaSumarGeneral(clasament, statisticiAbsente);

  // Afișăm tabelul clasament
  afiseazaTabelClasament(clasament);

  // Afișăm statisticile absențe
  afiseazaStatisticiAbsenteClasa(statisticiAbsente);

  // Afișăm tabelul absențe pe elevi
  afiseazaTabelAbsenteElevi(statisticiAbsente);

  // Afișăm top absențe nemotivate
  afiseazaTopNemotivate(statisticiAbsente);
}

/**
 * Afișează sumarul general
 */
function afiseazaSumarGeneral(clasament, statisticiAbsente) {
  // Total elevi
  document.getElementById('total-elevi').textContent = dateIncarcate.elevi.length;

  // Media clasei
  const mediiValide = clasament.filter((c) => c.media !== null);
  if (mediiValide.length > 0) {
    const sumaMediai = mediiValide.reduce((acc, c) => acc + c.media, 0);
    const mediaClasa = sumaMediai / mediiValide.length;
    document.getElementById('media-clasa').textContent = mediaClasa.toFixed(2);
  } else {
    document.getElementById('media-clasa').textContent = '-';
  }

  // Total absențe
  document.getElementById('total-absente-clasa').textContent = statisticiAbsente.totalClasa;
}

/**
 * Afișează tabelul clasament
 */
function afiseazaTabelClasament(clasament) {
  const tbody = document.querySelector('#tabel-clasament tbody');
  if (!tbody) return;

  tbody.innerHTML = '';

  clasament.forEach((item, index) => {
    const tr = document.createElement('tr');

    // Coloana poziție
    const tdPozitie = document.createElement('td');
    tdPozitie.className = 'col-pozitie';
    if (item.pozitie !== null) {
      tdPozitie.textContent = item.pozitie;
      if (item.pozitie === 1) tdPozitie.classList.add('pozitie-1');
      else if (item.pozitie === 2) tdPozitie.classList.add('pozitie-2');
      else if (item.pozitie === 3) tdPozitie.classList.add('pozitie-3');
    } else {
      tdPozitie.textContent = '-';
    }
    tr.appendChild(tdPozitie);

    // Coloana elev
    const tdElev = document.createElement('td');
    const linkElev = document.createElement('a');
    linkElev.href = `elev.html?id=${dateIncarcate.elevi.indexOf(item.elev)}`;
    linkElev.className = 'link-elev';
    linkElev.textContent = item.elev;
    tdElev.appendChild(linkElev);
    tr.appendChild(tdElev);

    // Coloana medie
    const tdMedia = document.createElement('td');
    tdMedia.className = 'col-media';
    tdMedia.textContent = item.media !== null ? item.media.toFixed(2) : '-';
    tr.appendChild(tdMedia);

    tbody.appendChild(tr);
  });
}

/**
 * Calculează statisticile absențelor pentru toată clasa
 */
function calculeazaStatisticiAbsenteClasa() {
  const stats = {
    totalClasa: 0,
    nemotivateClasa: 0,
    scutireMedicalaClasa: 0,
    invoireParinteClasa: 0,
    altMotivClasa: 0,
    perElev: [],
  };

  dateIncarcate.elevi.forEach((elev) => {
    const absenteElev = getAbsenteElev(dateIncarcate.absente, elev);

    const statsElev = {
      elev: elev,
      total: absenteElev.length,
      nemotivate: 0,
      motivate: 0,
      scutireMedicala: 0,
      invoireParinte: 0,
      altMotiv: 0,
    };

    absenteElev.forEach((absenta) => {
      const tipAbsenta = getTipAbsenta(absenta);

      if (tipAbsenta.cod === 'NEMOTIVATA') {
        statsElev.nemotivate++;
        stats.nemotivateClasa++;
      } else {
        statsElev.motivate++;

        if (tipAbsenta.cod === 'SCUTIRE_MEDICALA') {
          statsElev.scutireMedicala++;
          stats.scutireMedicalaClasa++;
        } else if (tipAbsenta.cod === 'INVOIRE_PARINTE') {
          statsElev.invoireParinte++;
          stats.invoireParinteClasa++;
        } else if (tipAbsenta.cod === 'ALT_MOTIV') {
          statsElev.altMotiv++;
          stats.altMotivClasa++;
        }
      }
    });

    stats.totalClasa += statsElev.total;
    stats.perElev.push(statsElev);
  });

  // Sortăm elevii descrescător după nemotivate
  stats.perElev.sort((a, b) => b.nemotivate - a.nemotivate);

  return stats;
}

/**
 * Afișează statisticile absențelor pentru clasă
 */
function afiseazaStatisticiAbsenteClasa(stats) {
  document.getElementById('abs-total-clasa').textContent = stats.totalClasa;
  document.getElementById('abs-nemotivate-clasa').textContent = stats.nemotivateClasa;
  document.getElementById('abs-scutire-clasa').textContent = stats.scutireMedicalaClasa;
  document.getElementById('abs-invoire-clasa').textContent = stats.invoireParinteClasa;
  document.getElementById('abs-altele-clasa').textContent = stats.altMotivClasa;
}

/**
 * Afișează tabelul cu absențe pe elevi
 */
function afiseazaTabelAbsenteElevi(stats) {
  const tbody = document.querySelector('#tabel-absente-elevi tbody');
  if (!tbody) return;

  tbody.innerHTML = '';

  stats.perElev.forEach((item) => {
    const tr = document.createElement('tr');

    // Coloana elev
    const tdElev = document.createElement('td');
    const linkElev = document.createElement('a');
    linkElev.href = `elev.html?id=${dateIncarcate.elevi.indexOf(item.elev)}`;
    linkElev.className = 'link-elev';
    linkElev.textContent = item.elev;
    tdElev.appendChild(linkElev);
    tr.appendChild(tdElev);

    // Coloana total
    const tdTotal = document.createElement('td');
    tdTotal.className = 'col-numar';
    tdTotal.textContent = item.total;
    tr.appendChild(tdTotal);

    // Coloana nemotivate
    const tdNemotivate = document.createElement('td');
    tdNemotivate.className = 'col-numar celula-nemotivate';
    if (item.nemotivate > 0) {
      tdNemotivate.classList.add('are-nemotivate');
    }
    tdNemotivate.textContent = item.nemotivate;
    tr.appendChild(tdNemotivate);

    // Coloana motivate
    const tdMotivate = document.createElement('td');
    tdMotivate.className = 'col-numar';
    tdMotivate.textContent = item.motivate;
    tr.appendChild(tdMotivate);

    tbody.appendChild(tr);
  });
}

/**
 * Afișează top elevi cu absențe nemotivate
 */
function afiseazaTopNemotivate(stats) {
  const container = document.getElementById('top-nemotivate');
  if (!container) return;

  container.innerHTML = '';

  // Luăm doar elevii cu absențe nemotivate, maxim 10
  const topElevi = stats.perElev.filter((item) => item.nemotivate > 0).slice(0, 10);

  if (topElevi.length === 0) {
    container.innerHTML = '<p class="mesaj-gol">Nu există absențe nemotivate.</p>';
    return;
  }

  topElevi.forEach((item) => {
    const div = document.createElement('div');
    div.className = 'top-item';

    const numeSpan = document.createElement('span');
    numeSpan.className = 'top-item-nume';
    numeSpan.textContent = item.elev;

    const numarSpan = document.createElement('span');
    numarSpan.className = 'top-item-numar';
    numarSpan.textContent = item.nemotivate;

    div.appendChild(numeSpan);
    div.appendChild(numarSpan);
    container.appendChild(div);
  });
}

// Inițializăm la încărcarea paginii
document.addEventListener('DOMContentLoaded', init);
