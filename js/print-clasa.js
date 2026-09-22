import CONFIG from './config.js';
import { getAbsenteElev, getNoteElev, getTipAbsenta } from './csv-parser.js';
import { incarcaToateDate, existaDate } from './data-store.js';
import {
  calculeazaClasamentComplet,
  calculeazaSituatieElev,
  numarParticipantiClasament,
} from './situatie-scolara.js';
import { suntEticheteCorigentiVizibile } from './examene-ui.js';

let initializat = false;

function element(documentPrint, tag, className, text) {
  const rezultat = documentPrint.createElement(tag);
  if (className) rezultat.className = className;
  if (text !== undefined) rezultat.textContent = text;
  return rezultat;
}

function clasaNota(valoare) {
  if (valoare < 5) return 'nota-mica';
  if (valoare < 7) return 'nota-medie';
  return 'nota-mare';
}

function statisticiAbsente(date, elev) {
  const absente = getAbsenteElev(date.absente || [], elev);
  let nemotivate = 0;
  absente.forEach((absenta) => {
    if (getTipAbsenta(absenta).cod === 'NEMOTIVATA') nemotivate++;
  });
  return { total: absente.length, nemotivate, motivate: absente.length - nemotivate };
}

function adaugaEtapaMedie(documentPrint, container, valoare, eticheta, tip, esec) {
  const etapa = element(documentPrint, 'div', `etapa-medie etapa-medie--${tip}`);
  const cifra = element(documentPrint, 'span', 'valoare-medie',
    Number.isInteger(Number(valoare)) ? String(Number(valoare)) : Number(valoare).toFixed(2));
  if (esec) cifra.classList.add('valoare-medie--esec');
  etapa.appendChild(cifra);
  if (eticheta) {
    etapa.appendChild(element(documentPrint, 'span', `eticheta-medie eticheta-medie--${tip}`, eticheta));
  }
  container.appendChild(etapa);
}

function creeazaCelulaMedie(documentPrint, situatie) {
  const td = element(documentPrint, 'td', 'celula-media');
  if (!situatie || situatie.mediaInitiala === null) {
    td.textContent = '-';
    return td;
  }

  const etape = element(documentPrint, 'div', 'medie-etape');
  const afiseazaCorigent = suntEticheteCorigentiVizibile();
  let etichetaInitiala = '';
  if (situatie.neincheiat) etichetaInitiala = 'Neîncheiat';
  else if (situatie.corigentInitial && afiseazaCorigent) etichetaInitiala = 'Corigent';
  adaugaEtapaMedie(
    documentPrint,
    etape,
    situatie.mediaInitiala,
    etichetaInitiala,
    situatie.neincheiat ? 'neincheiat' : situatie.corigentInitial ? 'corigent' : 'initiala',
    situatie.mediaInitiala < 5 || situatie.neincheiat,
  );
  if (situatie.rezultatIncheiere !== null) {
    adaugaEtapaMedie(
      documentPrint,
      etape,
      situatie.rezultatIncheiere,
      situatie.corigentDupaIncheiere && afiseazaCorigent
        ? 'Rezultat examen de încheiere · Corigent'
        : 'Rezultat examen de încheiere',
      'incheiere',
      situatie.rezultatIncheiere < CONFIG.EXAMENE.NOTA_PROMOVARE,
    );
  }
  if (situatie.rezultatCorigenta !== null) {
    adaugaEtapaMedie(
      documentPrint,
      etape,
      situatie.rezultatCorigenta,
      'Rezultat corigență',
      'corigenta',
      situatie.rezultatCorigenta < CONFIG.EXAMENE.NOTA_PROMOVARE,
    );
  }
  if (situatie.penalizarePurtare > 0) td.classList.add('media-penalizata');
  td.appendChild(etape);
  return td;
}

function creeazaRanduri(date, elev, situatieElev) {
  const documentTemporar = document.implementation.createHTMLDocument('randuri');
  const notePeMaterie = {};
  (date.materii || []).forEach((materie) => { notePeMaterie[materie] = []; });
  getNoteElev(date.note || [], elev).forEach((nota) => {
    const materie = nota[CONFIG.NOTE.MATERIE];
    const valoare = Number(nota[CONFIG.NOTE.NOTA]);
    if (notePeMaterie[materie] && Number.isFinite(valoare)) notePeMaterie[materie].push(valoare);
  });

  return (date.materii || []).map((materie) => {
    const tr = documentTemporar.createElement('tr');
    tr.appendChild(element(documentTemporar, 'td', '', materie));
    const tdNote = element(documentTemporar, 'td', 'celula-note');
    const note = notePeMaterie[materie] || [];
    if (note.length === 0) tdNote.appendChild(element(documentTemporar, 'span', 'fara-note', '-'));
    note.forEach((nota) => tdNote.appendChild(element(documentTemporar, 'span', `nota ${clasaNota(nota)}`, nota)));
    tr.appendChild(tdNote);
    tr.appendChild(creeazaCelulaMedie(
      documentTemporar,
      situatieElev.materii.find((item) => item.materie === materie),
    ));
    return tr;
  });
}

function creeazaTabel(documentPrint, randuri) {
  const tabel = element(documentPrint, 'table', 'tabel-note-print');
  const thead = documentPrint.createElement('thead');
  const header = documentPrint.createElement('tr');
  ['Disciplina', 'Note', 'Media'].forEach((titlu) => header.appendChild(element(documentPrint, 'th', '', titlu)));
  thead.appendChild(header);
  tabel.appendChild(thead);
  const tbody = documentPrint.createElement('tbody');
  randuri.forEach((rand) => tbody.appendChild(documentPrint.importNode(rand, true)));
  tabel.appendChild(tbody);
  return tabel;
}

function adaugaHeader(documentPrint, pagina, elev, clasa) {
  const header = element(documentPrint, 'header', 'print-header');
  header.appendChild(element(documentPrint, 'h1', 'print-title', elev));
  header.appendChild(element(documentPrint, 'p', 'print-subtitle', clasa));
  pagina.appendChild(header);
}

function adaugaSumar(documentPrint, pagina, situatie, pozitie, participanti, absente) {
  const sumar = element(documentPrint, 'section', 'print-summary');
  const valori = [
    ['Media generală', situatie.mediaGenerala !== null ? situatie.mediaGenerala.toFixed(2) : '-', ''],
    ['Nr. corigențe', situatie.nrCorigente, 'danger'],
    ['Poziția în clasament', pozitie !== null ? `${pozitie}/${participanti}` : '-', ''],
    ['Total absențe', absente.total, 'neutral'],
    ['Absențe nemotivate', absente.nemotivate, 'danger'],
    ['Absențe motivate', absente.motivate, 'success'],
  ];
  valori.forEach(([eticheta, valoare, tip]) => {
    const card = element(documentPrint, 'div', `print-card ${tip ? `print-card--${tip}` : ''}`.trim());
    card.appendChild(element(documentPrint, 'div', 'print-label', eticheta));
    card.appendChild(element(documentPrint, 'div', 'print-value', valoare));
    sumar.appendChild(card);
  });
  pagina.appendChild(sumar);
}

function adaugaFooter(documentPrint, pagina, dataRaport, numarPagina) {
  const footer = element(documentPrint, 'footer', 'print-footer');
  footer.appendChild(element(documentPrint, 'span', 'print-page-number', `Pagina ${numarPagina}/2`));
  footer.appendChild(element(documentPrint, 'span', '', `Raport generat din datele din: ${dataRaport || 'Nedisponibilă'}`));
  pagina.appendChild(footer);
}

function umplePrimaPagina(paginaUnu, paginaDoi) {
  const corpUnu = paginaUnu.querySelector('tbody');
  const corpDoi = paginaDoi.querySelector('tbody');
  const tabelUnu = paginaUnu.querySelector('table');
  const footerUnu = paginaUnu.querySelector('.print-footer');

  while (
    corpUnu.rows.length > 0 &&
    tabelUnu.getBoundingClientRect().bottom > footerUnu.getBoundingClientRect().top - 10
  ) {
    corpDoi.insertBefore(corpUnu.rows[corpUnu.rows.length - 1], corpDoi.firstChild);
  }

  if (corpDoi.rows.length === 0) {
    paginaDoi.querySelector('table').remove();
    paginaDoi.insertBefore(
      element(paginaDoi.ownerDocument, 'p', 'pagina-goala', 'Pagină rezervată acestui elev.'),
      paginaDoi.querySelector('.print-footer'),
    );
  }
}

function creeazaPaginiElev(documentPrint, date, elev, clasament) {
  const situatie = calculeazaSituatieElev(date, elev);
  const absente = statisticiAbsente(date, elev);
  const pozitie = clasament.find((item) => item.elev === elev)?.pozitie ?? null;
  const participanti = numarParticipantiClasament(clasament);
  const randuri = creeazaRanduri(date, elev, situatie);
  const paginaUnu = element(documentPrint, 'section', 'print-page');
  const paginaDoi = element(documentPrint, 'section', 'print-page');

  adaugaHeader(documentPrint, paginaUnu, elev, `Clasa ${date.clasa}`);
  adaugaSumar(documentPrint, paginaUnu, situatie, pozitie, participanti, absente);
  paginaUnu.appendChild(creeazaTabel(documentPrint, randuri));
  adaugaFooter(documentPrint, paginaUnu, date.dataRaport, 1);

  adaugaHeader(documentPrint, paginaDoi, elev, `Clasa ${date.clasa}`);
  paginaDoi.appendChild(creeazaTabel(documentPrint, []));
  adaugaFooter(documentPrint, paginaDoi, date.dataRaport, 2);

  documentPrint.body.append(paginaUnu, paginaDoi);
  umplePrimaPagina(paginaUnu, paginaDoi);
}

function stiluriPrint() {
  return `
    @page { size: A4 portrait; margin: 0; }
    * { box-sizing: border-box; }
    html, body { margin: 0; padding: 0; font-family: Arial, Helvetica, sans-serif; color: #111827; }
    .print-page { position: relative; width: 210mm; height: 297mm; padding: 10mm; overflow: hidden; break-after: page; page-break-after: always; }
    .print-page:last-child { break-after: auto; page-break-after: auto; }
    .print-header { border-bottom: 1px solid #d1d5db; margin-bottom: 4mm; padding-bottom: 3mm; }
    .print-title { margin: 0 0 1.2mm; font-size: 17pt; line-height: 1.15; }
    .print-subtitle { margin: 0; color: #6b7280; font-size: 10pt; }
    .print-summary { display: grid; grid-template-columns: repeat(3, 1fr); gap: 2.5mm; margin-bottom: 4mm; }
    .print-card { border-radius: 2.5mm; background: #f3f4f6 !important; padding: 2.5mm 2mm; text-align: center; print-color-adjust: exact; -webkit-print-color-adjust: exact; }
    .print-label { color: #6b7280; font-size: 7pt; text-transform: uppercase; }
    .print-value { color: #2563eb; font-size: 15pt; font-weight: 700; line-height: 1.25; }
    .print-card--danger .print-value { color: #dc2626; }
    .print-card--success .print-value { color: #16a34a; }
    .print-card--neutral .print-value { color: #374151; }
    table { width: 100%; border-collapse: collapse; table-layout: fixed; font-size: 9pt; }
    thead { display: table-header-group; }
    tr { break-inside: avoid; page-break-inside: avoid; }
    th, td { border: 1px solid #dbe1e8; padding: 2mm 2.2mm; text-align: left; vertical-align: middle; }
    th { background: #f3f4f6 !important; color: #374151; font-size: 7.5pt; text-transform: uppercase; print-color-adjust: exact; -webkit-print-color-adjust: exact; }
    th:nth-child(1), td:nth-child(1) { width: 40%; }
    th:nth-child(2), td:nth-child(2) { width: 45%; }
    th:nth-child(3), td:nth-child(3) { width: 15%; text-align: center; }
    .celula-note { display: table-cell; }
    .nota { display: inline-flex; min-width: 6.2mm; height: 6.2mm; margin: .7mm; padding: 0 1.2mm; align-items: center; justify-content: center; border-radius: 1.2mm; font-size: 8pt; font-weight: 600; print-color-adjust: exact; -webkit-print-color-adjust: exact; }
    .nota-mica { background: #fee2e2 !important; color: #dc2626; }
    .nota-medie { background: #fef3c7 !important; color: #92400e; }
    .nota-mare { background: #dcfce7 !important; color: #059669; }
    .celula-media { padding: 0; color: #2563eb; font-weight: 700; }
    .medie-etape { display: flex; flex-direction: column; }
    .etapa-medie { display: flex; min-height: 11mm; padding: 1.5mm 1mm; align-items: center; justify-content: center; flex-direction: column; gap: .8mm; }
    .etapa-medie + .etapa-medie { border-top: 1px solid #e5e7eb; }
    .valoare-medie { color: #2563eb; font-size: 11pt; font-weight: 800; line-height: 1; }
    .valoare-medie--esec, .etapa-medie--neincheiat .valoare-medie { color: #dc2626; }
    .eticheta-medie { color: #6b7280; font-size: 6pt; font-weight: 700; line-height: 1.15; text-align: center; }
    .eticheta-medie--corigent, .eticheta-medie--neincheiat { border-radius: 999px; background: #fee2e2 !important; color: #dc2626; padding: .5mm 1.2mm; print-color-adjust: exact; -webkit-print-color-adjust: exact; }
    .media-penalizata .etapa-medie--initiala .valoare-medie { color: #d97706; }
    .fara-note { color: #9ca3af; }
    .pagina-goala { margin-top: 80mm; color: #9ca3af; text-align: center; font-size: 9pt; }
    .print-footer { position: absolute; right: 10mm; bottom: 7mm; left: 10mm; display: flex; justify-content: space-between; gap: 8mm; border-top: 1px solid #d1d5db; padding-top: 2mm; color: #9ca3af; font-size: 8pt; }
    .print-page-number { color: #6b7280; font-weight: 700; }
  `;
}

function printClasa() {
  if (!existaDate()) return;
  const date = incarcaToateDate();
  if (!date.elevi?.length) return;
  const buton = document.getElementById('btn-print-note-clasa');
  const textInitial = buton.textContent;
  buton.disabled = true;
  buton.textContent = '⏳ Se pregătesc paginile...';

  const iframe = document.createElement('iframe');
  iframe.setAttribute('title', 'Tipărire note clasă');
  iframe.style.cssText = 'position:fixed;right:100%;bottom:100%;width:1px;height:1px;border:0;';
  document.body.appendChild(iframe);
  const documentPrint = iframe.contentDocument;
  documentPrint.open();
  documentPrint.write(`<!doctype html><html lang="ro"><head><meta charset="UTF-8"><title>Note - ${date.clasa}</title><style>${stiluriPrint()}</style></head><body></body></html>`);
  documentPrint.close();

  const clasament = calculeazaClasamentComplet(date);
  date.elevi.forEach((elev) => creeazaPaginiElev(documentPrint, date, elev, clasament));

  const curata = () => {
    window.setTimeout(() => iframe.remove(), 500);
    buton.disabled = false;
    buton.textContent = textInitial;
  };
  iframe.contentWindow.addEventListener('afterprint', curata, { once: true });
  window.setTimeout(() => {
    iframe.contentWindow.focus();
    iframe.contentWindow.print();
    window.setTimeout(curata, 120_000);
  }, 200);
}

function initPrintClasa() {
  if (initializat) return;
  const buton = document.getElementById('btn-print-note-clasa');
  if (!buton) return;
  initializat = true;
  buton.addEventListener('click', printClasa);
}

export { initPrintClasa };
