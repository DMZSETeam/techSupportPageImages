// ✅ Cleaned and fixed script.js (deep linking, stable slide loading)

const sheetDataArray = [];
const url = 'https://docs.google.com/spreadsheets/d/1SFM2os72yBHs1k3nQfY2TAr_pNVrU_ePNuDcGR_LJlQ/gviz/tq?tqx=out:json';

let nameColumnIndex = -1;
let osColumnIndex = -1;
let typeColumnIndex = -1;
let stepsColumnIndex = -1;
let currentCarouselSlide = 0;
let deepLinkParams = {};

/* ========== 1. Fetch and Initialize ========== */
document.addEventListener('DOMContentLoaded', () => {
  setupCollapsibles();

  fetch(url)
    .then(response => response.text())
    .then(processSheetData)
    .catch(error => console.error('Error fetching data:', error));
});

function getQueryParam(key) {
  const params = new URLSearchParams(window.location.search);
  const value = params.get(key);
  return value ? decodeURIComponent(value) : null;
}

function updateURL(topic, os, slide) {
  const currentParams = new URLSearchParams(window.location.search);
  if (topic) currentParams.set('topic', topic);
  if (os) currentParams.set('os', os);
  if (!isNaN(slide)) currentParams.set('slide', slide);

  const newUrl = `${window.location.pathname}?${currentParams.toString()}`;
  history.pushState(null, '', newUrl);
}

/* ========== 2. Data Processing ========== */
function processSheetData(data) {
  const jsonData = JSON.parse(data.substring(47).slice(0, -2));
  const rows = jsonData.table.rows;

  const headerRow = rows[0].c.map(cell => cell?.v || '');
  sheetDataArray.push(headerRow);

  for (let i = 0; i < headerRow.length; i++) {
    const header = headerRow[i].trim();
    if (header === "Name") nameColumnIndex = i;
    if (header === "OS") osColumnIndex = i;
    if (header === "Type") typeColumnIndex = i;
    if (header === "Steps") stepsColumnIndex = i;
  }

  deepLinkParams.topic = getQueryParam('topic');
  deepLinkParams.os = getQueryParam('os');
  deepLinkParams.slide = parseInt(getQueryParam('slide'), 10);

  rows.slice(1).forEach(row => {
    if (row.c[typeColumnIndex]?.v === "imageDrive") return;

    const rowData = row.c.map((cell, index) => {
      const cellValue = cell?.v || '';
      if (row.c[typeColumnIndex]?.v === 'image' && index > typeColumnIndex && cellValue) {
        return `<img src="${cellValue}" alt="Image">`;
      }
      return cellValue;
    });

    while (rowData.length > 0 && rowData[rowData.length - 1] === '') rowData.pop();
    sheetDataArray.push(rowData);
  });

  renderFullTable();
  populateButtons();
  handleDeepLink();
}

function renderFullTable() {
    const table = sheetDataArray.map((row, i) =>
      `<tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>`
    ).join('');
  
    const headers = `<tr>${sheetDataArray[0].map((_, i) => `<th>Column ${i + 1}</th>`).join('')}</tr>`;
    document.getElementById('sheet-data').innerHTML = `<table border="1">${headers}${table}</table>`;
  }

/* ========== 3. Deep Linking ========== */
function handleDeepLink() {
  const { topic, os } = deepLinkParams;
  if (!topic || !os) return;

  const tryActivate = setInterval(() => {
    const topicButtons = Array.from(document.querySelectorAll('#topic-buttons button'));
    const matchButton = topicButtons.find(btn => btn.textContent.trim() === topic);

    if (matchButton) {
      const rows = matchButton.getAttribute('data-rows').split(',').map(Number);
      showContent(rows, os);
      populateTabs(rows, os);
      clearInterval(tryActivate);
    }
  }, 100);
}

/* ========== 4. UI Rendering ========== */
function populateButtons() {
  const buttonsContainer = document.getElementById('topic-buttons');
  const groupedRows = {};

  sheetDataArray.forEach((row, index) => {
    if (index === 0) return;
    const key = row[nameColumnIndex];
    if (!groupedRows[key]) groupedRows[key] = [];
    groupedRows[key].push(index);
  });

  Object.entries(groupedRows).forEach(([text, indices], groupIndex) => {
    const button = document.createElement('button');
    button.textContent = text;
    button.setAttribute('data-rows', indices.join(','));

    const tabValues = [...new Set(indices.map(i => sheetDataArray[i][osColumnIndex]))];
    const defaultTab = tabValues[0];

    button.onclick = () => {
      showContent(indices, defaultTab);
      populateTabs(indices, defaultTab);
      updateURL(text, defaultTab, currentCarouselSlide);
    };

    if (!deepLinkParams.topic && groupIndex === 0) {
      button.classList.add('active');
      showContent(indices, defaultTab);
      populateTabs(indices, defaultTab);
    }

    buttonsContainer.appendChild(button);
  });
}

function populateTabs(rowIndices, activeTabValue = null) {
  const tabContainer = document.getElementById('os-buttons');
  tabContainer.innerHTML = '';

  const tabValues = [...new Set(rowIndices.map(i => sheetDataArray[i][osColumnIndex]))];

  tabValues.forEach((tabValue, index) => {
    const button = document.createElement('button');
    button.textContent = tabValue;
    button.classList.add('tab-button');
    button.setAttribute('data-tab', tabValue);
    button.onclick = () => {
      showContent(rowIndices, tabValue);
      populateTabs(rowIndices, tabValue);
      const topic = document.querySelector('.buttons-column button.active')?.textContent;
      updateURL(topic, tabValue, currentCarouselSlide);
    };

    if (tabValue === activeTabValue || (!activeTabValue && index === 0)) {
      button.classList.add('active');
    }

    tabContainer.appendChild(button);
  });
}

function showContent(rowIndices, tabValue) {
  document.querySelectorAll('.buttons-column button').forEach(btn => btn.classList.remove('active'));
  const matchBtn = document.querySelector(`button[data-rows="${rowIndices.join(',')}"]`);
  if (matchBtn) matchBtn.classList.add('active');

  document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
  const tabMatchBtn = document.querySelector(`button[data-tab="${tabValue}"]`);
  if (tabMatchBtn) tabMatchBtn.classList.add('active');

  const filteredIndices = rowIndices.filter(index => sheetDataArray[index][osColumnIndex] === tabValue);
  const tableData = filteredIndices.map(rowIndex => sheetDataArray[rowIndex].slice(stepsColumnIndex));
  const tableType = filteredIndices.map(rowIndex => sheetDataArray[rowIndex][typeColumnIndex]);

  const tableHTML = tableData.map(row => `<tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>`).join('');
  document.getElementById('instruction-table').innerHTML = `<table border="1">${tableHTML}</table>`;

  buildCarousel(tableData, tableType);
}

/* ========== 5. Carousel Logic ========== */
function buildCarousel(tableData, tableType) {
  const container = document.getElementById("column-carousel");
  const numCols = tableData[0]?.length || 0;

  const headers = tableData[tableType.indexOf('header')] || [];
  const imageRows = tableData.filter((_, i) => tableType[i] === 'image');
  const instructionRows = tableData.filter((_, i) => tableType[i] === 'instruction');

  // Set slide index before rendering
  if (!isNaN(deepLinkParams.slide)) {
    currentCarouselSlide = deepLinkParams.slide;
    deepLinkParams.slide = NaN;
  }

  let html = `
    <div style="display: flex;">
      <div class="carousel-nav">
        ${headers.map((header, i) => `<button class="nav-btn" onclick="goToCarouselSlide(${i})">${header}</button>`).join('')}
      </div>
      <div class="carousel">
        ${[...Array(numCols)].map((_, col) => `
          <div class="carousel-slide${col === currentCarouselSlide ? ' active' : ''}" data-index="${col}">
            <div class="image-section">${imageRows.map(row => `<div>${row[col] || ''}</div>`).join('')}</div>
            <div class="instruction-section">${instructionRows.map(row => `<div>${row[col] || ''}</div>`).join('')}</div>
            <div class="carousel-controls">
              <button onclick="prevCarouselSlide()">←</button>
              <button onclick="nextCarouselSlide()">→</button>
            </div>
          </div>`).join('')}
      </div>
    </div>`;

  container.innerHTML = html;
  updateCarousel();
}

function updateCarousel() {
  const slides = document.querySelectorAll(".carousel-slide");
  slides.forEach((slide, i) => {
    slide.classList.toggle("active", i === currentCarouselSlide);
  });

  const nextButton = document.querySelector(".carousel-controls button:last-child");
  const prevButton = document.querySelector(".carousel-controls button:first-child");

  if (nextButton) nextButton.disabled = currentCarouselSlide === slides.length - 1;
  if (prevButton) prevButton.disabled = currentCarouselSlide === 0;

  const topic = document.querySelector('.buttons-column button.active')?.textContent;
  const os = document.querySelector('.tab-button.active')?.textContent;
  updateURL(topic, os, currentCarouselSlide);
}

function goToCarouselSlide(index) {
  currentCarouselSlide = index;
  updateCarousel();
}

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
}

/* ========== 6. Collapsible Toggle ========== */
function setupCollapsibles() {
  document.querySelectorAll(".collapsible").forEach(coll => {
    coll.addEventListener("click", function () {
      this.classList.toggle("active");
      const content = this.nextElementSibling;
      content.style.maxHeight = content.style.maxHeight ? null : `${content.scrollHeight}px`;
    });
  });
}
