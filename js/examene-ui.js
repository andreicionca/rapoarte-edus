import CONFIG from './config.js';
import {
  calculeazaSituatieElev,
  esteInPerioadaExamene,
  esteNotaValida,
  obtineContext,
} from './situatie-scolara.js';
import {
  citestePreferinte,
  salveazaPreferinta,
  salveazaSituatie,
  exportaSituatiiContext,
  importaSituatiiContext,
} from './situatie-store.js';

let dateCurente = null;
let callbackSchimbare = () => {};
let anulareModal = null;

function creeazaButon(text, clasa = 'btn-modal btn-modal-secundar') {
  const buton = document.createElement('button');
  buton.type = 'button';
  buton.className = clasa;
  buton.textContent = text;
  return buton;
}

function asiguraModal() {
  let overlay = document.getElementById('modal-situatii-scolare');
  if (overlay) return overlay;

  overlay = document.createElement('div');
  overlay.id = 'modal-situatii-scolare';
  overlay.className = 'modal-overlay hidden';
  overlay.innerHTML = `
    <section class="modal-card" role="dialog" aria-modal="true" aria-labelledby="modal-situatii-titlu">
      <header class="modal-header">
        <h2 id="modal-situatii-titlu"></h2>
        <button type="button" class="modal-inchide" aria-label="Închide">×</button>
      </header>
      <div class="modal-body"></div>
      <footer class="modal-footer"></footer>
    </section>`;
  document.body.appendChild(overlay);

  overlay.querySelector('.modal-inchide').addEventListener('click', () => inchideModal());
  overlay.addEventListener('click', (event) => {
    if (event.target === overlay) inchideModal();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !overlay.classList.contains('hidden')) inchideModal();
  });
  return overlay;
}

function deschideModal(titlu) {
  const overlay = asiguraModal();
  overlay.querySelector('#modal-situatii-titlu').textContent = titlu;
  overlay.querySelector('.modal-body').innerHTML = '';
  overlay.querySelector('.modal-footer').innerHTML = '';
  overlay.classList.remove('hidden');
  document.body.classList.add('modal-deschis');
  overlay.querySelector('.modal-inchide').focus();
  return overlay;
}

function inchideModal(declanseazaAnularea = true) {
  const overlay = document.getElementById('modal-situatii-scolare');
  if (!overlay) return;
  overlay.classList.add('hidden');
  document.body.classList.remove('modal-deschis');
  if (declanseazaAnularea && anulareModal) anulareModal();
  anulareModal = null;
}

function adaugaAvertismentLocal(container) {
  const mesaj = document.createElement('p');
  mesaj.className = 'avertisment-local';
  mesaj.textContent = 'Datele introduse se salvează numai în acest browser și pe acest dispozitiv.';
  container.appendChild(mesaj);
}

function obtineCandidati(tip) {
  return (dateCurente.elevi || [])
    .map((elev) => {
      const situatieElev = calculeazaSituatieElev(dateCurente, elev);
      const materii = situatieElev.materii.filter((situatie) =>
        tip === 'corigente' ? situatie.necesitaCorigenta : situatie.neincheiat
      );
      return { elev, materii };
    })
    .filter((item) => item.materii.length > 0);
}

function formateazaNota(nota) {
  if (nota === null || nota === undefined) return '—';
  return Number.isInteger(Number(nota)) ? String(Number(nota)) : Number(nota).toFixed(2);
}

function deschideEditorRezultate(tip) {
  const esteCorigente = tip === 'corigente';
  const candidati = obtineCandidati(tip);
  const overlay = deschideModal(
    esteCorigente ? 'Rezultate corigențe' : 'Situație elevi neîncheiați'
  );
  const body = overlay.querySelector('.modal-body');
  const footer = overlay.querySelector('.modal-footer');

  if (candidati.length === 0) {
    const mesaj = document.createElement('p');
    mesaj.className = 'mesaj-modal-gol';
    mesaj.textContent = esteCorigente
      ? 'Nu există elevi cu corigențe pentru clasa și anul școlar încărcate.'
      : 'Nu există elevi marcați ca neîncheiați pentru clasa și anul școlar încărcate.';
    body.appendChild(mesaj);
    footer.appendChild(creeazaButon('Închide'));
    footer.lastChild.addEventListener('click', () => inchideModal(false));
    return;
  }

  let indexCurent = 0;
  const btnAnterior = creeazaButon('← Anterior');
  const btnSalveaza = creeazaButon('Salvează', 'btn-modal btn-modal-principal');
  const btnUrmator = creeazaButon('Următor →');
  const btnInchide = creeazaButon('Închide');
  footer.append(btnAnterior, btnSalveaza, btnUrmator, btnInchide);

  function salveazaFormular() {
    const eroare = body.querySelector('.eroare-formular');
    eroare.textContent = '';
    const intrari = Array.from(body.querySelectorAll('input[data-materie]'));
    const valori = [];
    for (const input of intrari) {
      const text = input.value.trim();
      const nota = text === '' ? null : Number(text);
      if (nota !== null && !esteNotaValida(nota)) {
        eroare.textContent = 'Notele trebuie să fie numere între 1 și 10.';
        input.focus();
        return false;
      }
      valori.push({ materie: input.dataset.materie, nota });
    }

    const candidat = candidati[indexCurent];
    const context = obtineContext(dateCurente);
    const camp = esteCorigente ? 'rezultatCorigenta' : 'rezultatIncheiere';
    let succes = true;
    valori.forEach(({ materie, nota }) => {
      succes = salveazaSituatie(context, candidat.elev, materie, { [camp]: nota }) && succes;
    });
    if (!succes) {
      eroare.textContent = 'Datele nu au putut fi salvate în browser.';
      return false;
    }
    const confirmare = body.querySelector('.confirmare-salvare');
    confirmare.textContent = 'Rezultatele au fost salvate local.';
    callbackSchimbare();
    return true;
  }

  function redaCandidat() {
    const candidat = candidati[indexCurent];
    const situatieActuala = calculeazaSituatieElev(dateCurente, candidat.elev);
    const materiiActuale = candidat.materii
      .map((veche) => situatieActuala.materii.find((item) => item.materie === veche.materie))
      .filter(Boolean);
    body.innerHTML = '';

    const progres = document.createElement('p');
    progres.className = 'modal-progres';
    progres.textContent = `Elev ${indexCurent + 1} din ${candidati.length}`;
    const nume = document.createElement('h3');
    nume.className = 'modal-nume-elev';
    nume.textContent = candidat.elev;
    body.append(progres, nume);

    materiiActuale.forEach((situatie) => {
      const card = document.createElement('div');
      card.className = 'examen-card';
      const titlu = document.createElement('h4');
      titlu.textContent = situatie.materie;
      const rezumat = document.createElement('p');
      rezumat.className = 'examen-rezumat';
      rezumat.textContent = esteCorigente
        ? situatie.corigentDupaIncheiere
          ? `Rezultatul obținut la examenul de încheiere a situației școlare: ${formateazaNota(situatie.rezultatIncheiere)}`
          : `Media inițială: ${formateazaNota(situatie.mediaInitiala)}`
        : `Media provizorie: ${formateazaNota(situatie.mediaInitiala)}`;

      const label = document.createElement('label');
      label.textContent = esteCorigente
        ? 'Rezultat la corigență'
        : 'Rezultatul obținut la examenul de încheiere a situației școlare';
      const input = document.createElement('input');
      input.type = 'number';
      input.min = String(CONFIG.EXAMENE.NOTA_MINIMA);
      input.max = String(CONFIG.EXAMENE.NOTA_MAXIMA);
      input.step = '1';
      input.inputMode = 'numeric';
      input.dataset.materie = situatie.materie;
      const valoare = esteCorigente ? situatie.rezultatCorigenta : situatie.rezultatIncheiere;
      input.value = valoare === null ? '' : String(valoare);
      input.placeholder = '1–10';
      label.appendChild(input);
      card.append(titlu, rezumat, label);
      body.appendChild(card);
    });

    const eroare = document.createElement('p');
    eroare.className = 'eroare-formular';
    eroare.setAttribute('role', 'alert');
    const confirmare = document.createElement('p');
    confirmare.className = 'confirmare-salvare';
    body.append(eroare, confirmare);
    adaugaAvertismentLocal(body);

    btnAnterior.disabled = indexCurent === 0;
    btnUrmator.disabled = indexCurent === candidati.length - 1;
  }

  btnAnterior.addEventListener('click', () => {
    if (salveazaFormular() && indexCurent > 0) {
      indexCurent -= 1;
      redaCandidat();
    }
  });
  btnUrmator.addEventListener('click', () => {
    if (salveazaFormular() && indexCurent < candidati.length - 1) {
      indexCurent += 1;
      redaCandidat();
    }
  });
  btnSalveaza.addEventListener('click', salveazaFormular);
  btnInchide.addEventListener('click', () => inchideModal(false));
  redaCandidat();
}
function existaRezultateNeintroduse(corigenti, neincheiati) {
  const existaCorigentaFaraRezultat = corigenti.some((candidat) =>
    candidat.materii.some((materie) => materie.rezultatCorigenta === null)
  );

  const existaNeincheiatFaraRezultat = neincheiati.some((candidat) =>
    candidat.materii.some((materie) => materie.rezultatIncheiere === null)
  );

  return existaCorigentaFaraRezultat || existaNeincheiatFaraRezultat;
}
function propuneRezultateAutomat() {
  if (!CONFIG.EXAMENE.PROPUNERE_AUTOMATA || !esteInPerioadaExamene()) return;
  const corigenti = obtineCandidati('corigente');
  const neincheiati = obtineCandidati('neincheiati');
  if (!existaRezultateNeintroduse(corigenti, neincheiati)) return;

  const overlay = deschideModal('Rezultate examene de corigență și încheiere a situației școlare');
  const body = overlay.querySelector('.modal-body');
  const footer = overlay.querySelector('.modal-footer');
  const mesaj = document.createElement('p');
  mesaj.textContent =
    'Puteți introduce rezultate pentru situațiile speciale de final de an școlar: elevi corigenți sau elevi care au participat la examenele de încheiere a situației școlare. Doriți să le completați acum?';
  body.appendChild(mesaj);
  adaugaAvertismentLocal(body);

  if (corigenti.length > 0) {
    const btn = creeazaButon(
      `Rezultate corigențe (${corigenti.length} elevi)`,
      'btn-modal btn-modal-principal'
    );
    btn.addEventListener('click', () => deschideEditorRezultate('corigente'));
    footer.appendChild(btn);
  }
  if (neincheiati.length > 0) {
    const btn = creeazaButon(
      `Situație neîncheiați (${neincheiati.length} elevi)`,
      'btn-modal btn-modal-principal'
    );
    btn.addEventListener('click', () => deschideEditorRezultate('neincheiati'));
    footer.appendChild(btn);
  }
  const maiTarziu = creeazaButon('Mai târziu');
  maiTarziu.addEventListener('click', () => inchideModal(false));
  footer.appendChild(maiTarziu);
}

async function copiazaSituatiiCurente() {
  const context = obtineContext(dateCurente);
  const pachet = exportaSituatiiContext(context);
  const text = JSON.stringify(pachet);

  if (pachet.situatii.length === 0) {
    alert('Nu există situații de corigență sau neîncheiat salvate pentru această clasă.');
    return;
  }

  try {
    await navigator.clipboard.writeText(text);
    alert(
      `Au fost copiate ${pachet.situatii.length} situații. Pe celălalt browser, încarcă același ZIP, apoi apasă „Lipește situațiile”.`
    );
  } catch {
    window.prompt('Selectează și copiază tot textul de mai jos cu Ctrl + C:', text);
  }
}

function lipesteSituatiiCurente() {
  const text = window.prompt('Lipește aici codul copiat din celălalt browser, apoi apasă OK:', '');

  if (!text?.trim()) return;

  if (
    !window.confirm(
      'Importul poate înlocui rezultate deja introduse pentru aceiași elevi și materii. Continui?'
    )
  ) {
    return;
  }

  try {
    const context = obtineContext(dateCurente);
    const rezultat = importaSituatiiContext(context, text, dateCurente.elevi, dateCurente.materii);

    callbackSchimbare();

    alert(
      `Import finalizat: ${rezultat.importate} situații importate` +
        (rezultat.ignorate > 0
          ? `, ${rezultat.ignorate} ignorate deoarece elevul sau materia nu apar în raportul încărcat.`
          : '.')
    );
  } catch (error) {
    alert(`Importul nu s-a realizat: ${error.message}`);
  }
}

function initExameneUI(dateIncarcate, optiuni = {}) {
  dateCurente = dateIncarcate;
  callbackSchimbare = optiuni.onChange || (() => {});
  asiguraModal();

  const btnCorigente = document.getElementById('btn-rezultate-corigente');
  if (btnCorigente && !btnCorigente.dataset.initializat) {
    btnCorigente.dataset.initializat = 'true';
    btnCorigente.addEventListener('click', () => deschideEditorRezultate('corigente'));
  }
  const btnNeincheiati = document.getElementById('btn-situatie-neincheiati');
  if (btnNeincheiati && !btnNeincheiati.dataset.initializat) {
    btnNeincheiati.dataset.initializat = 'true';
    btnNeincheiati.addEventListener('click', () => deschideEditorRezultate('neincheiati'));
  }
  const btnCopiaza = document.getElementById('btn-copiaza-situatii');
  if (btnCopiaza && !btnCopiaza.dataset.initializat) {
    btnCopiaza.dataset.initializat = 'true';
    btnCopiaza.addEventListener('click', copiazaSituatiiCurente);
  }

  const btnLipeste = document.getElementById('btn-lipeste-situatii');
  if (btnLipeste && !btnLipeste.dataset.initializat) {
    btnLipeste.dataset.initializat = 'true';
    btnLipeste.addEventListener('click', lipesteSituatiiCurente);
  }
  if (optiuni.propuneAutomat) setTimeout(propuneRezultateAutomat, 0);
}

function confirmaSchimbareNeincheiat(dateIncarcate, elev, materie, esteMarcat) {
  dateCurente = dateIncarcate;
  const overlay = deschideModal(esteMarcat ? 'Anulare marcaj' : 'Marcare elev neîncheiat');
  const body = overlay.querySelector('.modal-body');
  const footer = overlay.querySelector('.modal-footer');
  const intrebare = document.createElement('p');
  intrebare.textContent = esteMarcat
    ? `Elevul ${elev} este marcat ca neîncheiat la materia ${materie}. Anulați marcarea?`
    : `Marcați elevul ${elev} ca neîncheiat la materia ${materie}?`;
  body.appendChild(intrebare);
  if (esteMarcat) {
    const nota = document.createElement('p');
    nota.className = 'text-secundar';
    nota.textContent = 'Rezultatele asociate acestei marcări vor fi șterse.';
    body.appendChild(nota);
  }

  return new Promise((resolve) => {
    anulareModal = () => resolve(false);
    const da = creeazaButon('Da', 'btn-modal btn-modal-principal');
    const nu = creeazaButon('Nu');
    da.addEventListener('click', () => {
      const context = obtineContext(dateIncarcate);
      const modificari = esteMarcat
        ? { neincheiat: false, rezultatIncheiere: null, rezultatCorigenta: null }
        : { neincheiat: true };
      const succes = salveazaSituatie(context, elev, materie, modificari);
      inchideModal(false);
      resolve(succes);
    });
    nu.addEventListener('click', () => {
      inchideModal(false);
      resolve(false);
    });
    footer.append(da, nu);
  });
}

function suntEticheteCorigentiVizibile() {
  return Boolean(citestePreferinte().afiseazaEticheteCorigenti);
}

function seteazaEticheteCorigentiVizibile(vizibile) {
  return salveazaPreferinta('afiseazaEticheteCorigenti', Boolean(vizibile));
}

export {
  initExameneUI,
  confirmaSchimbareNeincheiat,
  suntEticheteCorigentiVizibile,
  seteazaEticheteCorigentiVizibile,
};
