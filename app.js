const fileInput = document.getElementById("fileInput");
const dataTable = document.getElementById("data-table");
const dataTableTotals = document.getElementById("data-table-totals");
const elevSelect = document.getElementById("elev-select");
const monthSelect = document.getElementById("month-select");
const motivataSelect = document.getElementById("motivata-select");
const materieSelect = document.getElementById("materie-select");
const showAllTabels = document.getElementById("show-tables");
const gif = document.getElementById("loading-gif");
const sortoptionsSelect = document.getElementById("sort-options");
const tableTotalReset = document.getElementById("tabel-total-reset");
const spinner = document.getElementById("spinner");

let data = [];
let dataMonth = [];
const studentTotals = [];
let studentTotalsOriginal;
spinner.style.display = "none";

fileInput.addEventListener("click", () => {
  spinner.style.display = "block";
  gif.style.display = "none";
});

fileInput.addEventListener("change", (e) => {
  const file = e.target.files[0];
  const reader = new FileReader();
  if (file.name !== "absente.csv") {
    alert(`Puteți încărca doar fișierul care se numește "absente.csv"!`);
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

      let student = studentTotals.find((s) => s.name === studentName);
      if (!student) {
        student = {
          name: studentName,
          motivated: 0,
          notMotivated: 0,
        };
        studentTotals.push(student);
      }

      if (isMotivated) {
        student.motivated++;
      } else {
        student.notMotivated++;
      }
      student.total = student.motivated + student.notMotivated;
    });
    studentTotalsOriginal = [...studentTotals];

    renderTable();
    populateSelect(elevSelect, 0);
    populateSelect(monthSelect, 1);
    populateSelect(motivataSelect, 2);
    populateSelect(materieSelect, 3);
    renderTableTotals(studentTotals);
    showAllTabels.style.display = "block";
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
                <th class="col-centru">Motivata</th>
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
                    <td class="col-centru">${item[2]}</td>
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
  console.log("rendering table totals");
  let count = 0;
  dataTableTotals.innerHTML = "";
  dataTableTotals.innerHTML = `
        <thead>
            <tr>
                <th>Nr.</th>
                <th>Nume</th>
                <th class="col-centru">Absente motivate</th>
                <th class="col-centru">Absente nemotivate</th>
                <th class="col-centru">Total</th>
            </tr>
        </thead>
        <tbody>
            ${dataToRender
              .map((student) => {
                count++;
                return `
                <tr>
                    <td>${count}</td>
                    <td>${student.name}</td>
                    <td class="col-centru">${student.motivated}</td>
                    <td class="col-centru">${student.notMotivated}</td>
                    <td class="col-centru">${student.total}</td>
                </tr>
            `;
              })
              .join("")}
        </tbody>
    `;
}

sortoptionsSelect.addEventListener("change", () => {
  const sortOption = document.getElementById("sort-options").value;
  sortTable(sortOption);
  if (sortOption === "motivate") {
    let motivatedTds = document
      .getElementById("data-table-totals")
      .querySelectorAll("td:nth-child(3)");
    motivatedTds.forEach((element) => {
      element.classList.add("sorted-motivate");
    });
  } else if (sortOption === "nemotivate") {
    let notMotivatedTds = document
      .getElementById("data-table-totals")
      .querySelectorAll("td:nth-child(4)");
    notMotivatedTds.forEach((element) => {
      element.classList.add("sorted-nemotivate");
    });
  } else if (sortOption === "total") {
    let totalTds = document
      .getElementById("data-table-totals")
      .querySelectorAll("td:nth-child(5)");
    totalTds.forEach((element) => {
      element.classList.add("sorted-total");
    });
  }
});

function sortTable(sortOption, dataToRender = studentTotals) {
  let sortedData;

  console.log(dataToRender);
  switch (sortOption) {
    case "motivate":
      sortedData = dataToRender.sort((a, b) => b.motivated - a.motivated);
      //change color for the background of column sorted rgba(255, 255, 255, 0.1);

      break;
    case "nemotivate":
      sortedData = dataToRender.sort((a, b) => b.notMotivated - a.notMotivated);
      //change color for the background of column sorted rgba(255, 255, 255, 0.1);

      break;
    case "total":
      sortedData = dataToRender.sort((a, b) => b.total - a.total);
      //change color for the background of column sorted rgba(255, 255, 255, 0.1);
      break;
  }
  renderTableTotals(sortedData);
}

tableTotalReset.addEventListener("click", () => {
  renderTableTotals(studentTotalsOriginal);
  const select = document.getElementById("sort-options");
  select.options[0].selected = true;
});
