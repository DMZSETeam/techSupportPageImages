// ✅ Cleaned and fixed script.js (deep linking, stable slide loading)

const sheetDataArray = [];
const url =
  "https://docs.google.com/spreadsheets/d/1SFM2os72yBHs1k3nQfY2TAr_pNVrU_ePNuDcGR_LJlQ/gviz/tq?tqx=out:json";

let nameColumnIndex = -1;
let osColumnIndex = -1;
let typeColumnIndex = -1;
let stepsColumnIndex = -1;
let currentCarouselSlide = 0;
let currentOS = "";
let currentTopic = "";
let deepLinkParams = {};

console.log(deepLinkParams);

/* ========== 1. Fetch and Initialize ========== */
document.addEventListener("DOMContentLoaded", () => {
  /* setupCollapsibles(); */

  fetch(url)
    .then((response) => response.text())
    .then(processSheetData)
    .catch((error) => console.error("Error fetching data:", error));
});

function getQueryParam(key) {
  console.log(`Querying Params with ${key}`);
  const params = new URLSearchParams(window.location.search);
  const value = params.get(key);
  return value ? decodeURIComponent(value) : null;
}

function updateURL(topic, os, slide) {
  console.log(`Updating URL: ${topic},${os},${slide}`);
  const currentParams = new URLSearchParams(window.location.search);
  if (topic) currentParams.set("topic", topic);
  if (os) currentParams.set("os", os);
  if (!isNaN(slide)) currentParams.set("slide", slide);

  const newUrl = `${window.location.pathname}?${currentParams.toString()}`;
  history.pushState(null, "", newUrl);
}

/* ========== 2. Data Processing ========== */
function processSheetData(data) {
  console.log("Processing all Data");
  const jsonData = JSON.parse(data.substring(47).slice(0, -2));
  const rows = jsonData.table.rows;

  const headerRow = rows[0].c.map((cell) => cell?.v || "");
  sheetDataArray.push(headerRow);

  for (let i = 0; i < headerRow.length; i++) {
    const header = headerRow[i].trim();
    if (header === "Name") nameColumnIndex = i;
    if (header === "OS") osColumnIndex = i;
    if (header === "Type") typeColumnIndex = i;
    if (header === "Steps") stepsColumnIndex = i;
  }

  deepLinkParams.topic = getQueryParam("topic");
  deepLinkParams.os = getQueryParam("os");
  deepLinkParams.slide = parseInt(getQueryParam("slide"), 10);

  rows.slice(1).forEach((row) => {
    if (row.c[typeColumnIndex]?.v === "imageDrive") return;

    const rowData = row.c.map((cell, index) => {
      const cellValue = cell?.v || "";
      if (
        row.c[typeColumnIndex]?.v === "image" &&
        index > typeColumnIndex &&
        cellValue
      ) {
        return `<img src="${cellValue}" style="width:100%" alt="Image">`;
      }
      return cellValue;
    });

    while (rowData.length > 0 && rowData[rowData.length - 1] === "")
      rowData.pop();
    sheetDataArray.push(rowData);
  });

  console.log("Imported Sheet:");
  console.table(sheetDataArray);
  //renderFullTable();
  populateButtons();
  handleDeepLink();
}

/*
function renderFullTable() {
    const table = sheetDataArray.map((row, i) =>
      `<tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>`
    ).join('');
  
    const headers = `<tr>${sheetDataArray[0].map((_, i) => `<th>Column ${i + 1}</th>`).join('')}</tr>`;
    document.getElementById('sheet-data').innerHTML = `<table border="1">${headers}${table}</table>`;
  }
*/

/* ========== 3. Deep Linking ========== */
function handleDeepLink() {
  console.log("DeepLink Handling");
  const { topic, os } = deepLinkParams;
  if (!topic || !os) return;

  const tryActivate = setInterval(() => {
    const topicButtons = Array.from(
      document.querySelectorAll("#topic-buttons .nav-link")
    );
    const matchButton = topicButtons.find(
      (btn) => btn.textContent.trim() === topic
    );

    if (matchButton) {
      const rows = matchButton.getAttribute("data-rows").split(",").map(Number);
      populateOSButtons(rows, os);
      showContent(rows, os);

      clearInterval(tryActivate);
    }
  }, 100);
}

/* ========== 4. UI Rendering ========== */
function populateButtons() {
  console.log("Populating Topic buttons");
  const buttonsContainer = document.getElementById("topic-buttons");
  const groupedRows = {};

  sheetDataArray.forEach((row, index) => {
    if (index === 0) return;
    const key = row[nameColumnIndex];
    if (!groupedRows[key]) groupedRows[key] = [];
    groupedRows[key].push(index);
  });

  Object.entries(groupedRows).forEach(([text, indices], groupIndex) => {
    const button = document.createElement("button");
    button.textContent = text;
    button.setAttribute("data-rows", indices.join(","));
    button.classList.add("nav-link");

    const tabValues = [
      ...new Set(indices.map((i) => sheetDataArray[i][osColumnIndex])),
    ];
    const defaultTab = tabValues[0];

    button.onclick = () => {
      console.log("~");
      console.log(`Clicked on Topic ${text}`);

      // Remove active from all topic buttons
      document.querySelectorAll("#topic-buttons .nav-link").forEach((btn) => {
        btn.classList.remove("active");
      });
      // Set active for this button
      button.classList.add("active");

      populateOSButtons(indices, defaultTab);
      goToCarouselSlide(0);
      showContent(indices, defaultTab);
    };

    /* if (!deepLinkParams.topic && groupIndex === 0) {
      button.classList.remove('btn-dmz-purple');
      button.classList.add('active', 'btn-dmz-purple');
      showContent(indices, defaultTab);
      populateOSButtons(indices, defaultTab);
    } */

    buttonsContainer.appendChild(button);
  });
}

function populateOSButtons(rowIndices, activeOSValue = null) {
  console.log("Populating OS buttons");
  const osContainer = document.getElementById("os-buttons");
  osContainer.innerHTML = "";
  const osValues = [
    ...new Set(rowIndices.map((i) => sheetDataArray[i][osColumnIndex])),
  ];

  console.log(`Creating OS Button for: ${osValues}`);
  osValues.forEach((osValue, index) => {
    let button;

    // Create new button
    button = document.createElement("button");
    button.textContent = osValue;
    button.classList.add("nav-link", "os-button");
    button.classList.remove("active");
    button.setAttribute("data-os", osValue);
    osContainer.appendChild(button);

    button.addEventListener("click", function () {
      const topic = document.querySelector(
        "#topic-buttons .active"
      )?.textContent;
      console.log("~~");
      console.log(`Clicked on ${button.textContent} for Topic: ${topic}`);

      // Handle class toggle
      document.querySelectorAll("#os-buttons .nav-link").forEach((btn) => {
        btn.classList.remove("active");
      });
      button.classList.add("active");

      goToCarouselSlide(0);
      showContent(rowIndices, osValue);
    });

    // Set active state
    /*   if (osValue === activeOSValue || (!activeOSValue && index === 0)) {
      button.classList.remove("btn-dmz-purple");
      button.classList.add("active", "btn-dmz-purple");
    } else {
      button.classList.remove("active");
      button.classList.add("btn-dmz-purple");
    } */
  });
}

function showContent(rowIndices, osValue) {
  console.log(`Showing Content for rows ${rowIndices} and OS ${osValue}`);
  document
    .querySelectorAll("#topic-buttons .nav-link")
    .forEach((btn) => btn.classList.remove("active"));
  const matchBtn = document.querySelector(
    `button[data-rows="${rowIndices.join(",")}"]`
  );

  if (matchBtn) matchBtn.classList.add("active");

  document
    .querySelectorAll("#os-button .nav-link")
    .forEach((btn) => btn.classList.remove("active"));
  const osMatchBtn = document.querySelector(`button[data-os="${osValue}"]`);

  if (osMatchBtn) osMatchBtn.classList.add("active");

  const filteredIndices = rowIndices.filter(
    (index) => sheetDataArray[index][osColumnIndex] === osValue
  );
  const tableData = filteredIndices.map((rowIndex) =>
    sheetDataArray[rowIndex].slice(stepsColumnIndex)
  );
  const tableType = filteredIndices.map(
    (rowIndex) => sheetDataArray[rowIndex][typeColumnIndex]
  );

  const tableHTML = tableData
    .map((row) => `<tr>${row.map((cell) => `<td>${cell}</td>`).join("")}</tr>`)
    .join("");
  //document.getElementById('instruction-table').innerHTML = `<table border="1">${tableHTML}</table>`;

  buildCarousel(tableData, tableType);
}

/* ========== 5. Carousel Logic ========== */
/*function buildCarousel(tableData, tableType) {
  console.log("building carousel");
  const container = document.getElementById("column-carousel");
  const navContainer = document.getElementById("column-carousel-nav");
  const infoContainer = document.getElementById("column-carousel-info");
  const numCols = tableData[0]?.length || 0;

  const headers = tableData[tableType.indexOf("header")] || [];
  const imageRows = tableData.filter((_, i) => tableType[i] === "image");
  const instructionRows = tableData.filter(
    (_, i) => tableType[i] === "instruction"
  );

  // Set slide index before rendering
  if (!isNaN(deepLinkParams.slide)) {
    currentCarouselSlide = deepLinkParams.slide;
    deepLinkParams.slide = NaN;
  }

  let navhtml = `
      <div class="carousel-nav">
        ${headers
          .map(
            (header, i) =>
              `<button class="btn btn-dmz-purple w-100 mb-2${
                i === currentCarouselSlide ? " active btn-dmz-purple" : ""
              }" onclick="goToCarouselSlide(${i})">${header}</button>`
          )
          .join("")}
      </div>`;

  let infohtml = `
      <div class="carousel">
        ${[...Array(numCols)]
          .map(
            (_, col) => `
          <div class="carousel-slide${
            col === currentCarouselSlide ? " active" : ""
          }" data-index="${col}">
            <div class="image-section">${imageRows
              .map((row) => `<div>${row[col] || ""}</div>`)
              .join("")}</div>
            <div class="instruction-section">${instructionRows
              .map((row) => `<div>${row[col] || ""}</div>`)
              .join("")}</div>
            <div class="carousel-controls">
              <button class="btn btn-dmz-purple" onclick="prevCarouselSlide()">←</button>
              <button class="btn btn-dmz-purple" onclick="nextCarouselSlide()">→</button>
            </div>
          </div>`
          )
          .join("")}
      </div>`;

  navContainer.innerHTML = navhtml;
  infoContainer.innerHTML = infohtml;
  updateCarousel();
}*/

function buildCarousel(tableData, tableType) {
  console.log("building carousel (Bootstrap version)");

  const carouselInner = document.getElementById("carousel-inner");
  carouselInner.innerHTML = "";

  const numCols = tableData[0]?.length || 0;
  const headers = tableData[tableType.indexOf("header")] || [];
  const imageRows = tableData.filter((_, i) => tableType[i] === "image");
  const instructionRows = tableData.filter(
    (_, i) => tableType[i] === "instruction"
  );

  // Use deep link slide if set
  if (!isNaN(deepLinkParams.slide)) {
    currentCarouselSlide = deepLinkParams.slide;
    deepLinkParams.slide = NaN;
  }

  for (let col = 0; col < numCols; col++) {
    const slide = document.createElement("div");
    slide.classList.add("carousel-item");
    if (col === currentCarouselSlide) slide.classList.add("active");

    const imageSection = imageRows
      .map((row) => `<div>${row[col] || ""}</div>`)
      .join("");
    const instructionSection = instructionRows
      .map((row) => `<div>${row[col] || ""}</div>`)
      .join("");

    slide.innerHTML = `
      <div class="d-flex flex-column align-items-center justify-content-center text-center p-4" style="min-height: 300px;">
        <div class="mb-3 image-section">${imageSection}</div>
        <div class="instruction-section">${instructionSection}</div>
      </div>
    `;

    carouselInner.appendChild(slide);

    const indicatorsContainer = document.getElementById("carousel-indicators");
    indicatorsContainer.innerHTML = "";

    for (let col = 0; col < numCols; col++) {
      const indicator = document.createElement("button");
      indicator.type = "button";
      indicator.setAttribute("data-bs-target", "#dmzCarousel");
      indicator.setAttribute("data-bs-slide-to", col);
      indicator.setAttribute("aria-label", `Slide ${col + 1}`);
      if (col === currentCarouselSlide) {
        indicator.classList.add("active");
        indicator.setAttribute("aria-current", "true");
      }
      indicatorsContainer.appendChild(indicator);
    }
  }

  // Track current slide index via Bootstrap events (optional but nice)
  const carouselElement = document.getElementById("dmzCarousel");

  carouselElement.addEventListener("slid.bs.carousel", (event) => {
    currentCarouselSlide = event.to;

      console.log("Carousel Element listener");
    const topic = document.querySelector("#topic-buttons .active")?.textContent;
    const os = document.querySelector("#os-buttons .active")?.textContent;
    updateURL(topic, os, currentCarouselSlide);

    updateArrowState(currentCarouselSlide);

    const navButtons = document.querySelectorAll("#column-carousel-nav .btn");
    navButtons.forEach((btn, i) => {
      btn.classList.toggle("active", i === currentCarouselSlide);
    });
  });

  const prevBtn = document.querySelector("#dmzCarousel .carousel-control-prev");
  const nextBtn = document.querySelector("#dmzCarousel .carousel-control-next");

  function updateArrowState(index) {
    console.log(`Slide # ${index} of ${numCols - 1}`);
    if (prevBtn) prevBtn.disabled = index === 0;
    if (nextBtn) nextBtn.disabled = index === numCols - 1;
  }

  updateArrowState(currentCarouselSlide);

  const navContainer = document.getElementById("column-carousel-nav");
  navContainer.innerHTML = "";

  const navGroup = document.createElement("div");
  navGroup.classList.add("carousel-nav");

  headers.forEach((header, i) => {
    const button = document.createElement("button");
    button.classList.add("btn", "btn-dmz-purple", "w-100", "mb-2");
    if (i === currentCarouselSlide) button.classList.add("active");

    button.textContent = header;
    button.addEventListener("click", () => goToCarouselSlide(i));

    navGroup.appendChild(button);
  });

  navContainer.appendChild(navGroup);
}

/*

function updateCarousel() {
  console.log("Updating Carousel");
  const slides = document.querySelectorAll(".carousel-slide");
  slides.forEach((slide, i) => {
    slide.classList.toggle("active", i === currentCarouselSlide);
  });
  const navButtons = document.querySelectorAll(".carousel-nav .btn");
  navButtons.forEach((button, i) => {
    button.classList.toggle("active", i === currentCarouselSlide);
  });

  const nextButton = document.querySelector(
    ".carousel-controls button:last-child"
  );
  const prevButton = document.querySelector(
    ".carousel-controls button:first-child"
  );

  if (nextButton)
    nextButton.disabled = currentCarouselSlide === slides.length - 1;
  if (prevButton) prevButton.disabled = currentCarouselSlide === 0;

  const topic = document.querySelector("#topic-buttons .active")?.textContent;
  const os = document.querySelector("#os-buttons .active")?.textContent;
  updateURL(topic, os, currentCarouselSlide);
}*/

function goToCarouselSlide(index) {
  console.log(`Switching to slide ${index}`);
  currentCarouselSlide = index;
  const topic = document.querySelector("#topic-buttons .active")?.textContent;
  const os = document.querySelector("#os-buttons .active")?.textContent;
  updateURL(topic, os, currentCarouselSlide);
  const carouselElement = document.querySelector("#dmzCarousel");
  const carousel = new bootstrap.Carousel(carouselElement);
  carousel.to(index);
}
/*
function prevCarouselSlide() {
  if (currentCarouselSlide > 0) {
    currentCarouselSlide--;
    updateCarousel();
  }
}

function nextCarouselSlide() {
  const slides = document.querySelectorAll(".carousel-slide");
  if (currentCarouselSlide < slides.length - 1) {
    currentCarouselSlide++;
    updateCarousel();
  }
}*/

/* ========== 6. Collapsible Toggle ========== */
/* function setupCollapsibles() {
  document.querySelectorAll(".collapsible").forEach((coll) => {
    coll.addEventListener("click", function () {
      this.classList.toggle("active");
      const content = this.nextElementSibling;
      content.style.maxHeight = content.style.maxHeight
        ? null
        : `${content.scrollHeight}px`;
    });
  });
} */
