const numberofGradesCells = 10;
const fileInput = document.getElementById("fileInput");
const dataTable = document.getElementById("data-table");
const dataTableTotals = document.getElementById("data-table-totals");
const elevSelect = document.getElementById("elev-select");
const monthSelect = document.getElementById("month-select");
const motivataSelect = document.getElementById("motivata-select");
const materieSelect = document.getElementById("materie-select");
const clasaSelect = document.getElementById("clasa-select");
const showAllTabels = document.getElementById("show-tables");
const gif = document.getElementById("loading-gif");
const sortoptionsSelect = document.getElementById("sort-options");
const tableTotalReset = document.getElementById("tabel-total-reset");
const spinner = document.getElementById("spinner");
const msgDisplayDate = document.getElementById("msg-display-date");
const selectStudentGradesElement = document.querySelector("#student-grades");
const gradesTable = document.getElementById("grades-table");

let discipline = [];
const gradesData = {};
let data = [];
let dataMonth = [];
const studentTotals = [];
let studentTotalsOriginal;
spinner.style.display = "none";
let gradesTableDate;

let fileInputClicked = false;

fileInput.addEventListener("click", () => {
  if (fileInputClicked) {
    location.reload();
    return;
  }
  fileInputClicked = true;
  spinner.style.display = "block";
  gif.style.display = "none";
  setTimeout(() => {
    spinner.style.display = "none";
  }, 3000);
});

fileInput.addEventListener("change", (e) => {
  const file = e.target.files[0];
  //   if (file.type !== "application/x-zip-compressed") {
  //     alert(
  //       `Acesta nu este un fișier zip! Vă rugăm să încărcați fișierul zip
  // "raport-complet" descărcat de pe site-ul app.edus.ro!
  // Urmați pașii din tutorial.`
  //     );
  //     location.reload();
  //     return;
  //   }

  // 1. create a new Date object passing the lastModified property of the file as an argument
  const date = new Date(file.lastModified);

  // 2. create an object with the options for formatting the date
  const options = {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
    timezone: "UTC",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
  };
  const optionsday = {
    year: "numeric",
    month: "long",
    day: "numeric",
  };
  // 3. create a new variable with the Romanian date using the toLocaleDateString method
  const romanianDate = date.toLocaleDateString("ro-RO", options);
  gradesTableDate = date.toLocaleDateString("ro-RO", optionsday);
  // 4. display the Romanian date using the innerHTML property
  msgDisplayDate.innerHTML = `<p>Fișierul  pe care tocmai l-ați incărcat aici, a fost descărcat de pe Edus <strong>${romanianDate}</strong></p>`;

  // added code starts here
  const zip = new JSZip();
  zip
    .loadAsync(file)
    .then((zip) => {
      // if (
      //   !zip.file("absente.csv") ||
      //   !zip.file("orar.csv") ||
      //   !zip.file("note.csv")
      // ) {
      //   alert(
      //     `Folderul zip nu conține fișierele din raport-general.zip! Vă rugăm să încărcați folderul corect!`
      //   );
      //   location.reload();
      //   return;
      // }
      return Promise.all([
        zip.file("absente.csv").async("blob"),
        zip.file("orar.csv").async("blob"),
        zip.file("note.csv").async("blob"),
      ]);
    })
    .then(([absenteBlob, orarBlob, noteBlob]) => {
      const absenteReader = new FileReader();
      absenteReader.readAsText(absenteBlob);
      absenteReader.onload = (e) => {
        const absenteCsv = e.target.result;
        data = absenteCsv
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
        populateSelect(clasaSelect, 4);
        renderTableTotals(studentTotals);
        showAllTabels.style.display = "block";
        document
          .getElementById("grades-table")
          .scrollIntoView({ behavior: "smooth" });
      };
      const orarReader = new FileReader();
      orarReader.readAsText(orarBlob);
      orarReader.onload = (e) => {
        const orarCsv = e.target.result;
        const orarRows = orarCsv.split("\n").slice(1, -1);
        const orarData = orarRows.map((row) => row.split(",")[3]);

        discipline = Array.from(new Set(orarData)).sort();
      };
      const noteReader = new FileReader();
      noteReader.readAsText(noteBlob);
      noteReader.onload = (e) => {
        const noteCsv = e.target.result;
        const noteRows = noteCsv.split("\n").slice(1, -1);
        const noteData = noteRows.map((row) => [
          row.split(",")[0],
          row.split(",")[1],
          row.split(",")[3],
        ]);

        noteData.forEach((row) => {
          const [studentName, grade, disciplineName] = row;
          if (!gradesData[studentName]) {
            gradesData[studentName] = {};
            discipline.forEach((disciplin) => {
              gradesData[studentName][disciplin] = [];
            });
          }
          if (gradesData[studentName][disciplineName]) {
            gradesData[studentName][disciplineName].push(grade);
          }
        });
        renderStudentGradesTable();
        populateStudentSelect();
        //end
      };
    });

  // added code ends here
});

function populateStudentSelect() {
  Object.keys(gradesData).forEach((studentName) => {
    const optionElement = document.createElement("option");
    optionElement.value = studentName;
    optionElement.textContent = studentName;
    selectStudentGradesElement.appendChild(optionElement);
  });
}

let studentMsgAbsente = document.getElementById("student-msg-absente");
let studendMsgDate = document.getElementById("student-msg-date");
function renderStudentGradesTable(gradesDataToRender = gradesData) {
  const firstStudentGrades = Object.keys(gradesDataToRender)[0];

  let tableGradesCols = "";
  for (let i = 0; i < numberofGradesCells; i++) {
    tableGradesCols += `<th class="col-centru">Nota</th>`;
  }

  gradesTable.innerHTML = "";
  gradesTable.innerHTML = `
          <thead>
            <tr>
              <th class="student-upper">${firstStudentGrades}</th>
              ${tableGradesCols}
            </tr>
          </thead>
          <tbody>
         ${Object.keys(gradesDataToRender[firstStudentGrades])
           .map((discipline) => {
             let tableGradesRows = `<td>${discipline}</td>`;
             for (let i = 0; i < numberofGradesCells; i++) {
               tableGradesRows += `<td class="col-centru">${
                 gradesDataToRender[firstStudentGrades][discipline][i] || ""
               }</td>`;
             }
             return `<tr>${tableGradesRows}</tr>`;
           })
           .join("")}
          </tbody>
  
  `;
  const student = studentTotalsOriginal.find(
    (s) => s.name === firstStudentGrades
  );
  if (student) {
    const stdMsg = `SITUAȚIA ABSENȚELOR: <span style="color:red">${student.notMotivated} absențe nemotivate,</span> <span style="color:#05c46b">${student.motivated} absențe motivate,</span> <span style="color:#373f3f">TOTAL = ${student.total}</span>.`;
    studentMsgAbsente.innerHTML = stdMsg;
  } else {
    const stdMsg = `SITUAȚIA ABSENȚELOR: <span style="color:red">0 absențe nemotivate,</span> <span style="color:#05c46b">0 absențe motivate,</span> <span style="color:#373f3f">TOTAL = 0</span>.`;
    studentMsgAbsente.innerHTML = stdMsg;
  }
  studendMsgDate.textContent = gradesTableDate;
}
selectStudentGradesElement.addEventListener("change", updateStudentGradesTable);

const prevButton = document.querySelector("#prevButton");
const nextButton = document.querySelector("#nextButton");

prevButton.addEventListener("click", function () {
  updateStudentGradesTable("prev");
});

nextButton.addEventListener("click", function () {
  updateStudentGradesTable("next");
});

function updateStudentGradesTable(direction) {
  let selectedIndex = selectStudentGradesElement.selectedIndex;
  if (direction === "prev" && selectedIndex > 0) {
    selectStudentGradesElement.selectedIndex = selectedIndex - 1;
  } else if (
    direction === "next" &&
    selectedIndex < selectStudentGradesElement.options.length - 1
  ) {
    selectStudentGradesElement.selectedIndex = selectedIndex + 1;
  }

  const studentName = selectStudentGradesElement.value;
  renderStudentGradesTable({ [studentName]: gradesData[studentName] });
  const student = studentTotalsOriginal.find((s) => s.name === studentName);
  if (student) {
    const stdMsg = `SITUAȚIA ABSENȚELOR: <span style="color:red">${student.notMotivated} absențe nemotivate,</span> <span style="color:#05c46b">${student.motivated} absențe motivate,</span> <span style="color:#373f3f">TOTAL = ${student.total}</span>.`;
    studentMsgAbsente.innerHTML = stdMsg;
  } else {
    const stdMsg = `SITUAȚIA ABSENȚELOR: <span style="color:red">0 absențe nemotivate,</span> <span style="color:#05c46b">0 absențe motivate,</span> <span style="color:#373f3f">TOTAL = 0</span>.`;
    studentMsgAbsente.innerHTML = stdMsg;
  }
  studendMsgDate.textContent = gradesTableDate;
}

function renderTable(dataToRender = data) {
  let studendCount = {};

  dataTable.innerHTML = "";
  dataTable.innerHTML = `
        <thead>
            <tr>
                <th class="col-centru">Nr.</th>
                <th>Elev</th>
                <th class="col-centru">Data</th>
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
                    <td class="col-centru">${studendCount[item[0]]}</td>
                    <td>${item[0]}</td>
                    <td class="col-centru">${item[1]}</td>
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
const menuSelects = ["Elevi", "Data", "Motivată", "Materie", "Clasa"];
const btnReset = document.getElementById("btn-reset");
btnReset.addEventListener("click", () => {
  populateSelect(elevSelect, 0);
  populateSelect(monthSelect, 1);
  populateSelect(motivataSelect, 2);
  populateSelect(materieSelect, 3);
  populateSelect(clasaSelect, 4);
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
clasaSelect.addEventListener("change", updateTable);

function updateTable() {
  let filteredData = data;
  const selectedElev = elevSelect.value;
  const selectedMonth = monthSelect.value;
  const selectedMotivata = motivataSelect.value;
  const selectedMaterie = materieSelect.value;
  const selectedClasa = clasaSelect.value;

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
  if (selectedClasa !== "all") {
    filteredData = filteredData.filter(
      (row) => row[4].trim() === selectedClasa.trim()
    );
  }
  renderTable(filteredData);
}

function renderTableTotals(dataToRender = studentTotals) {
  let count = 0;
  dataTableTotals.innerHTML = "";
  dataTableTotals.innerHTML = `
        <thead>
            <tr>
                <th class="col-centru">Nr.</th>
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
                    <td class="col-centru">${count}</td>
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

let nextTableReached = false;

document
  .getElementById("next-table-button")
  .addEventListener("click", scrollToNextTable);

function scrollToNextTable() {
  if (!nextTableReached) {
    document
      .getElementById("elev-select")
      .scrollIntoView({ behavior: "smooth" });
    nextTableReached = true;
    document.getElementById(
      "next-table-button"
    ).innerHTML = ` <ion-icon name="arrow-up-outline"></ion-icon>`;
  } else {
    document
      .getElementById("show-tables")
      .scrollIntoView({ behavior: "smooth" });
    nextTableReached = false;
    document.getElementById(
      "next-table-button"
    ).innerHTML = ` <ion-icon name="arrow-down-outline"></ion-icon>`;
  }
}
