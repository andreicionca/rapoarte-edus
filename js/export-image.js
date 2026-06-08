import { incarcaToateDate } from './data-store.js';

let exportInitializat = false;

function initExport() {
  if (exportInitializat) return;
  exportInitializat = true;

  const btnExportNote = document.getElementById('btn-export-note');
  if (btnExportNote) {
    btnExportNote.addEventListener('click', () => exportNote('download'));
  }

  const btnShareNote = document.getElementById('btn-share-note');
  if (btnShareNote) {
    btnShareNote.addEventListener('click', () => exportNote('share'));
  }

  const btnExportAbsente = document.getElementById('btn-export-absente');
  if (btnExportAbsente) {
    btnExportAbsente.addEventListener('click', () => exportAbsentePDF('download'));
  }

  const btnShareAbsente = document.getElementById('btn-share-absente');
  if (btnShareAbsente) {
    btnShareAbsente.addEventListener('click', () => exportAbsentePDF('share'));
  }

  const btnExportClasament = document.getElementById('btn-export-clasament');
  if (btnExportClasament) {
    btnExportClasament.addEventListener('click', () => exportTabelClasament('download'));
  }
}

function getNumeElev() {
  const numeEl = document.getElementById('nume-elev');
  return numeEl ? numeEl.textContent : 'Elev';
}

function getClasa() {
  const clasaEl = document.getElementById('info-clasa');
  return clasaEl ? clasaEl.textContent : 'Clasa';
}

function getMediaGenerala() {
  const el = document.getElementById('media-generala');
  return el ? el.textContent : '-';
}

function getPozitieClasament() {
  const el = document.getElementById('pozitie-clasament');
  return el ? el.textContent : '-';
}

function getTotalAbsente() {
  const el = document.getElementById('total-absente');
  return el ? el.textContent : '0';
}

function getDataRaport() {
  const date = incarcaToateDate();
  return date.dataRaport || 'Nedisponibila';
}

function normalizeazaText(text) {
  if (!text) return '';
  return text
    .replace(/ă/g, 'a')
    .replace(/Ă/g, 'A')
    .replace(/â/g, 'a')
    .replace(/Â/g, 'A')
    .replace(/î/g, 'i')
    .replace(/Î/g, 'I')
    .replace(/ș/g, 's')
    .replace(/Ș/g, 'S')
    .replace(/ş/g, 's')
    .replace(/Ş/g, 'S')
    .replace(/ț/g, 't')
    .replace(/Ț/g, 'T')
    .replace(/ţ/g, 't')
    .replace(/Ţ/g, 'T');
}

function genereazaNumeFisier(numeElev, tip, extensie) {
  const now = new Date();
  const zi = String(now.getDate()).padStart(2, '0');
  const luna = String(now.getMonth() + 1).padStart(2, '0');
  const an = now.getFullYear();
  const ora = String(now.getHours()).padStart(2, '0');
  const min = String(now.getMinutes()).padStart(2, '0');

  const numeNormalizat = normalizeazaText(numeElev).replace(/[^a-zA-Z0-9]/g, '_');
  return `${numeNormalizat}_${tip}_${zi}-${luna}-${an}_${ora}-${min}.${extensie}`;
}

async function exportNote(actiune) {
  const tabel = document.getElementById('tabel-note');
  if (!tabel) {
    alert('Tabelul nu a fost gasit.');
    return;
  }

  const btnId = actiune === 'share' ? 'btn-share-note' : 'btn-export-note';
  const btn = document.getElementById(btnId);
  const textOriginal = btn.textContent;
  btn.textContent = '⏳ Se genereaza...';
  btn.disabled = true;

  try {
    const container = document.createElement('div');
    container.style.cssText = `
      position: absolute;
      left: -9999px;
      top: 0;
      background: white;
      padding: 24px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      width: 600px;
    `;

    const header = document.createElement('div');
    header.style.cssText =
      'margin-bottom: 20px; border-bottom: 2px solid #e5e7eb; padding-bottom: 16px;';
    header.innerHTML = `
      <h2 style="margin: 0 0 4px 0; font-size: 20px; color: #111827;">${getNumeElev()}</h2>
      <p style="margin: 0; font-size: 14px; color: #6b7280;">${getClasa()}</p>
    `;
    container.appendChild(header);

    const sumar = document.createElement('div');
    sumar.style.cssText = 'margin-bottom: 20px;';
    sumar.innerHTML = `
  <div style="display: flex; gap: 12px; margin-bottom: 8px;">
    <div style="flex: 1; background: #f3f4f6; border-radius: 8px; padding: 12px; text-align: center;">
      <div style="font-size: 11px; color: #6b7280; text-transform: uppercase; margin-bottom: 4px;">Media generala</div>
      <div style="font-size: 24px; font-weight: 700; color: #2563eb;">${getMediaGenerala()}</div>
    </div>
 <div style="flex: 1; background: #f3f4f6; border-radius: 8px; padding: 12px; text-align: center;">
      <div style="font-size: 11px; color: #6b7280; text-transform: uppercase; margin-bottom: 4px;">Nr. corigente</div>
      <div style="font-size: 24px; font-weight: 700; color: #dc2626;">${document.getElementById('nr-corigente')?.textContent || '0'}</div>
    </div>
    <div style="flex: 1; background: #f3f4f6; border-radius: 8px; padding: 12px; text-align: center;">
      <div style="font-size: 11px; color: #6b7280; text-transform: uppercase; margin-bottom: 4px;">Pozitia in clasament</div>
      <div style="font-size: 24px; font-weight: 700; color: #2563eb;">${getPozitieClasament()}</div>
    </div>
  </div>
  <div style="display: flex; gap: 12px;">
    <div style="flex: 1; background: #f3f4f6; border-radius: 8px; padding: 12px; text-align: center;">
      <div style="font-size: 11px; color: #6b7280; text-transform: uppercase; margin-bottom: 4px;">Total absente</div>
      <div style="font-size: 24px; font-weight: 700; color: #374151;">${getTotalAbsente()}</div>
    </div>
    <div style="flex: 1; background: #f3f4f6; border-radius: 8px; padding: 12px; text-align: center;">
      <div style="font-size: 11px; color: #6b7280; text-transform: uppercase; margin-bottom: 4px;">Absente nemotivate</div>
      <div style="font-size: 24px; font-weight: 700; color: #dc2626;">${document.getElementById('abs-nemotivate')?.textContent || '0'}</div>
    </div>
    <div style="flex: 1; background: #f3f4f6; border-radius: 8px; padding: 12px; text-align: center;">
      <div style="font-size: 11px; color: #6b7280; text-transform: uppercase; margin-bottom: 4px;">Absente motivate</div>
      <div style="font-size: 24px; font-weight: 700; color: #16a34a;">${document.getElementById('abs-motivate')?.textContent || '0'}</div>
    </div>
  </div>
`;
    container.appendChild(sumar);

    const tabelClonat = tabel.cloneNode(true);
    stilizeazaTabel(tabelClonat);
    container.appendChild(tabelClonat);

    const footer = document.createElement('div');
    footer.style.cssText =
      'margin-top: 16px; padding-top: 12px; border-top: 1px solid #e5e7eb; font-size: 11px; color: #9ca3af; text-align: right;';
    footer.textContent = `Raport generat din datele din: ${getDataRaport()}`;
    container.appendChild(footer);

    document.body.appendChild(container);

    const canvas = await html2canvas(container, {
      backgroundColor: '#ffffff',
      scale: 2,
      logging: false,
      useCORS: true,
    });

    document.body.removeChild(container);

    const numeFisier = genereazaNumeFisier(getNumeElev(), 'Note', 'png');

    if (actiune === 'share' && navigator.share) {
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
      const file = new File([blob], numeFisier, { type: 'image/png' });

      try {
        await navigator.share({
          files: [file],
          title: `Note - ${getNumeElev()}`,
        });
      } catch (err) {
        if (err.name !== 'AbortError') {
          downloadCanvas(canvas, numeFisier);
        }
      }
    } else {
      downloadCanvas(canvas, numeFisier);
    }
  } catch (error) {
    console.error('Eroare la generarea imaginii:', error);
    alert('Eroare la generarea imaginii.');
  } finally {
    btn.textContent = textOriginal;
    btn.disabled = false;
  }
}

function downloadCanvas(canvas, numeFisier) {
  const link = document.createElement('a');
  link.download = numeFisier;
  link.href = canvas.toDataURL('image/png');
  link.click();
}

function stilizeazaTabel(tabel) {
  tabel.style.cssText = 'width: 100%; border-collapse: collapse; font-size: 13px;';

  const celule = tabel.querySelectorAll('th, td');
  celule.forEach((celula) => {
    celula.style.cssText = 'padding: 10px 8px; border: 1px solid #e5e7eb; text-align: left;';
  });

  const headerCelule = tabel.querySelectorAll('th');
  headerCelule.forEach((celula) => {
    celula.style.cssText +=
      'background-color: #f3f4f6; font-weight: 600; color: #374151; font-size: 11px; text-transform: uppercase;';
  });

  const note = tabel.querySelectorAll('.nota');
  note.forEach((nota) => {
    nota.style.cssText =
      'display: inline-block; min-width: 24px; padding: 2px 6px; margin: 2px; border-radius: 4px; font-weight: 600; text-align: center; font-size: 12px;';

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

  const medii = tabel.querySelectorAll('.celula-media');
  medii.forEach((celula) => {
    celula.style.fontWeight = '700';
    celula.style.color = '#2563eb';
    celula.style.textAlign = 'center';
  });

  const faraNote = tabel.querySelectorAll('.fara-note');
  faraNote.forEach((el) => {
    el.style.color = '#9ca3af';
    el.style.fontStyle = 'italic';
  });

  const penalizate = tabel.querySelectorAll('.media-penalizata');
  penalizate.forEach((el) => {
    el.style.color = '#f59e0b';
  });
}

async function exportAbsentePDF(actiune) {
  const btnId = actiune === 'share' ? 'btn-share-absente' : 'btn-export-absente';
  const btn = document.getElementById(btnId);
  const textOriginal = btn.textContent;
  btn.textContent = '⏳ Se genereaza...';
  btn.disabled = true;

  try {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('p', 'mm', 'a4');

    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;
    let y = 20;

    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(normalizeazaText(getNumeElev()), margin, y);
    y += 7;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100);
    doc.text(normalizeazaText(getClasa()), margin, y);
    y += 12;

    doc.setDrawColor(200);
    doc.line(margin, y, pageWidth - margin, y);
    y += 10;

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0);
    doc.text('Sumar Absente', margin, y);
    y += 8;

    const absTotal = document.getElementById('total-absente')?.textContent || '0';
    const absNemotivate = document.getElementById('abs-nemotivate')?.textContent || '0';
    const absMotivate = document.getElementById('abs-motivate')?.textContent || '0';

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0);
    doc.text(`Total: ${absTotal}`, margin, y);
    doc.setTextColor(220, 38, 38);
    doc.text(`Nemotivate: ${absNemotivate}`, margin + 35, y);
    doc.setTextColor(22, 163, 74);
    doc.text(`Motivate: ${absMotivate}`, margin + 80, y);
    doc.setTextColor(0);
    y += 12;

    const tabelLuni = document.getElementById('tabel-stats-luni');
    if (tabelLuni && tabelLuni.querySelector('tbody tr')) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Absente pe luni', margin, y);
      y += 6;

      const headerLuni = ['Luna', 'Total', 'Motivate', 'Nemotivate'];
      const dataLuni = [];
      tabelLuni.querySelectorAll('tbody tr').forEach((row) => {
        const cells = row.querySelectorAll('td');
        if (cells.length >= 4) {
          dataLuni.push([
            normalizeazaText(cells[0].textContent),
            cells[1].textContent,
            cells[2].textContent,
            cells[3].textContent,
          ]);
        }
      });

      doc.autoTable({
        startY: y,
        head: [headerLuni],
        body: dataLuni,
        margin: { left: margin, right: margin },
        styles: { fontSize: 10, cellPadding: 3 },
        headStyles: { fillColor: [243, 244, 246], textColor: [55, 65, 81], fontStyle: 'bold' },
        columnStyles: {
          1: { halign: 'center' },
          2: { halign: 'center', textColor: [22, 163, 74] },
          3: { halign: 'center', textColor: [220, 38, 38] },
        },
      });

      y = doc.lastAutoTable.finalY + 10;
    }

    const tabelMotive = document.getElementById('tabel-stats-motive');
    if (tabelMotive && tabelMotive.querySelector('tbody tr')) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Absente motivate pe motive', margin, y);
      y += 6;

      const headerMotive = ['Motiv', 'Total'];
      const dataMotive = [];
      tabelMotive.querySelectorAll('tbody tr').forEach((row) => {
        const cells = row.querySelectorAll('td');
        if (cells.length >= 2) {
          dataMotive.push([normalizeazaText(cells[0].textContent), cells[1].textContent]);
        }
      });

      doc.autoTable({
        startY: y,
        head: [headerMotive],
        body: dataMotive,
        margin: { left: margin, right: margin },
        styles: { fontSize: 10, cellPadding: 3 },
        headStyles: { fillColor: [243, 244, 246], textColor: [55, 65, 81], fontStyle: 'bold' },
        columnStyles: { 1: { halign: 'center', fontStyle: 'bold' } },
      });

      y = doc.lastAutoTable.finalY + 10;
    }

    const tabelAbsente = document.getElementById('tabel-absente');
    if (tabelAbsente && tabelAbsente.querySelector('tbody tr:not(.row-hidden)')) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Lista absentelor', margin, y);
      y += 6;

      const headerAbsente = ['Data', 'Materia', 'Status', 'Motiv'];
      const dataAbsente = [];
      tabelAbsente.querySelectorAll('tbody tr:not(.row-hidden)').forEach((row) => {
        const cells = row.querySelectorAll('td');
        if (cells.length >= 4) {
          dataAbsente.push([
            cells[0].textContent,
            normalizeazaText(cells[1].textContent),
            normalizeazaText(cells[2].textContent.trim()),
            normalizeazaText(cells[3].textContent.trim()),
          ]);
        }
      });

      doc.autoTable({
        startY: y,
        head: [headerAbsente],
        body: dataAbsente,
        margin: { left: margin, right: margin },
        styles: { fontSize: 9, cellPadding: 2 },
        headStyles: { fillColor: [243, 244, 246], textColor: [55, 65, 81], fontStyle: 'bold' },
        columnStyles: {
          0: { cellWidth: 22 },
          2: { cellWidth: 22, halign: 'center' },
        },
        didParseCell: function (data) {
          if (data.section === 'body' && data.column.index === 2) {
            if (data.cell.raw === 'Nemotivata') {
              data.cell.styles.textColor = [220, 38, 38];
            } else if (data.cell.raw === 'Motivata') {
              data.cell.styles.textColor = [22, 163, 74];
            }
          }
        },
      });
    }

    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(9);
      doc.setTextColor(150);
      doc.text(
        `Raport generat din datele din: ${getDataRaport()}`,
        margin,
        doc.internal.pageSize.getHeight() - 10
      );
      doc.text(
        `Pagina ${i} din ${pageCount}`,
        pageWidth - margin - 25,
        doc.internal.pageSize.getHeight() - 10
      );
    }

    const numeFisier = genereazaNumeFisier(getNumeElev(), 'Absente', 'pdf');

    if (actiune === 'share' && navigator.share) {
      const pdfBlob = doc.output('blob');
      const file = new File([pdfBlob], numeFisier, { type: 'application/pdf' });

      try {
        await navigator.share({
          files: [file],
          title: `Absente - ${getNumeElev()}`,
        });
      } catch (err) {
        if (err.name !== 'AbortError') {
          doc.save(numeFisier);
        }
      }
    } else {
      doc.save(numeFisier);
    }
  } catch (error) {
    console.error('Eroare la generarea PDF:', error);
    alert('Eroare la generarea PDF.');
  } finally {
    btn.textContent = textOriginal;
    btn.disabled = false;
  }
}

async function exportTabelClasament(actiune) {
  const tabel = document.getElementById('tabel-clasament');
  if (!tabel) {
    alert('Tabelul nu a fost gasit.');
    return;
  }

  const btn = document.getElementById('btn-export-clasament');
  const textOriginal = btn.textContent;
  btn.textContent = '⏳ Se genereaza...';
  btn.disabled = true;

  try {
    const container = document.createElement('div');
    container.style.cssText = `
      position: absolute;
      left: -9999px;
      top: 0;
      background: white;
      padding: 24px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      width: 500px;
    `;

    const header = document.createElement('div');
    header.style.cssText =
      'margin-bottom: 16px; border-bottom: 2px solid #e5e7eb; padding-bottom: 12px;';
    header.innerHTML = `<h2 style="margin: 0 0 4px 0; font-size: 18px; color: #111827;">Clasament ${getClasa()}</h2>`;
    container.appendChild(header);

    const tabelClonat = tabel.cloneNode(true);
    stilizeazaTabel(tabelClonat);
    container.appendChild(tabelClonat);

    const footer = document.createElement('div');
    footer.style.cssText = 'margin-top: 12px; font-size: 10px; color: #9ca3af; text-align: right;';
    footer.textContent = `Raport din: ${getDataRaport()}`;
    container.appendChild(footer);

    document.body.appendChild(container);

    const canvas = await html2canvas(container, {
      backgroundColor: '#ffffff',
      scale: 2,
      logging: false,
    });

    document.body.removeChild(container);

    const numeFisier = genereazaNumeFisier(getClasa(), 'Clasament', 'png');
    downloadCanvas(canvas, numeFisier);
  } catch (error) {
    console.error('Eroare la generarea imaginii:', error);
    alert('Eroare la generarea imaginii.');
  } finally {
    btn.textContent = textOriginal;
    btn.disabled = false;
  }
}

export { initExport };
