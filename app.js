const fileInput = document.getElementById("fileInput");
const dataTable = document.getElementById("data-table");
const dataTableTotals = document.getElementById("data-table-totals");
const elevSelect = document.getElementById("elev-select");
const monthSelect = document.getElementById("month-select");
const motivataSelect = document.getElementById("motivata-select");
const materieSelect = document.getElementById("materie-select");
const showAllBtn = document.getElementById("buttons");
const gif = document.getElementById("loading-gif");

let data = [];
let dataMonth = [];
const studentTotals = {};
fileInput.addEventListener("click", () => {
  gif.style.display = "none";
});

fileInput.addEventListener("change", (e) => {
  const file = e.target.files[0];
  const reader = new FileReader();
  if (file.name !== "absente.csv") {
    alert(`Puteți încărca doar fișierul care se numeste:"absente.csv"!`);
    return;
  }

  reader.readAsText(file);
  reader.onload = (e) => {
    const csv = e.target.result;
    data = csv
      .split("\n")
      .slice(1, -1)
      .map((row) => row.split(","));
    dataMonth = data.map((row) =>
      new Date(row[1].split("/").reverse().join("-")).toLocaleString(
        "default",
        { month: "short" }
      )
    );

    data.forEach((row) => {
      const studentName = row[0];
      const isMotivated = row[2] === "Da";

      if (!studentTotals[studentName]) {
        studentTotals[studentName] = {
          motivated: 0,
          notMotivated: 0,
        };
      }

      if (isMotivated) {
        studentTotals[studentName].motivated++;
      } else {
        studentTotals[studentName].notMotivated++;
      }
    });

    renderTable();
    populateSelect(elevSelect, 0);
    populateSelect(monthSelect, 1);
    populateSelect(motivataSelect, 2);
    populateSelect(materieSelect, 3);
    renderTableTotals(studentTotals);
    dataTableTotals.style.display = "table";
    showAllBtn.style.display = "block";
    dataTable.style.display = "table";
  };
});

function renderTable(dataToRender = data) {
  let studendCount = {};

  dataTable.innerHTML = "";
  dataTable.innerHTML = `
        <thead>
            <tr>
                <th>Nr.</th>
                <th>Elev</th>
                <th>Data</th>
                <th>Motivata</th>
                <th>Materie</th>
                <th>Clasa</th>
            </tr>
        </thead>
        <tbody>
            ${dataToRender
              .map((item, index) => {
                if (!studendCount[item[0]]) {
                  studendCount[item[0]] = 1;
                } else {
                  studendCount[item[0]]++;
                }

                return `
                <tr>
                    <td>${studendCount[item[0]]}</td>
                    <td>${item[0]}</td>
                    <td>${item[1]}</td>
                    <td>${item[2]}</td>
                    <td>${item[3]}</td>
                    <td>${item[4]}</td>
                </tr>
            `;
              })
              .join("")}
        </tbody>
    `;
}
const menuSelects = ["Elevi", "Data", "Motivată", "Materie"];
const btnReset = document.getElementById("btn-reset");
btnReset.addEventListener("click", () => {
  populateSelect(elevSelect, 0);
  populateSelect(monthSelect, 1);
  populateSelect(motivataSelect, 2);
  populateSelect(materieSelect, 3);
  updateTable();
});

function populateSelect(select, index) {
  select.innerHTML = "";
  select.innerHTML = `
      <option value="all">${menuSelects[index]}</option>
      ${[...new Set(index === 1 ? dataMonth : data.map((row) => row[index]))]
        .map(
          (item) => `
          <option value="${item}">${item}</option>
      `
        )
        .join("")}
        `;
}

elevSelect.addEventListener("change", updateTable);
monthSelect.addEventListener("change", updateTable);
motivataSelect.addEventListener("change", updateTable);
materieSelect.addEventListener("change", updateTable);

function updateTable() {
  let filteredData = data;
  const selectedElev = elevSelect.value;
  const selectedMonth = monthSelect.value;
  const selectedMotivata = motivataSelect.value;
  const selectedMaterie = materieSelect.value;

  if (selectedElev !== "all") {
    filteredData = filteredData.filter((row) => row[0] === selectedElev);
  }
  if (selectedMonth !== "all") {
    filteredData = filteredData.filter(
      (row) =>
        new Date(row[1].split("/").reverse().join("-")).toLocaleString(
          "default",
          { month: "short" }
        ) === selectedMonth
    );
  }
  if (selectedMotivata !== "all") {
    filteredData = filteredData.filter((row) => row[2] === selectedMotivata);
  }
  if (selectedMaterie !== "all") {
    filteredData = filteredData.filter((row) => row[3] === selectedMaterie);
  }
  renderTable(filteredData);
}

function renderTableTotals(dataToRender = studentTotals) {
  let count = 0;
  dataTableTotals.innerHTML = "";
  dataTableTotals.innerHTML = `
        <thead>
            <tr>
                <th>Nr.</th>
                <th>Nume</th>
                <th>Absente motivate</th>
                <th>Absente nemotivate</th>
                <th>Total</th>
            </tr>
        </thead>
        <tbody>
            ${Object.keys(dataToRender)
              .map((item) => {
                const totals = dataToRender[item];
                count++;
                return `
                <tr>
                    <td>${count}</td>
                    <td>${item}</td>
                    <td>${totals.motivated}</td>
                    <td>${totals.notMotivated}</td>
                    <td>${totals.motivated + totals.notMotivated}</td>
                </tr>
            `;
              })
              .join("")}
        </tbody>
    `;
}
