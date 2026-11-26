// Wbudowane dane syntetyczne (bez poufnych danych zakładowych)
const PRESETS = {
    cnc: {
        batchSize: 60,
        shiftMinutes: 450,
        hourlyCost: 300,
        stations: [
            { id: 1, name: "1. Cięcie piłą CNC", cycleTimeSec: 45, setupTimeMin: 15 },
            { id: 2, name: "2. Frezowanie otworów", cycleTimeSec: 110, setupTimeMin: 25 },
            { id: 3, name: "3. Gięcie profili", cycleTimeSec: 65, setupTimeMin: 20 },
            { id: 4, name: "4. Kontrola i pakowanie", cycleTimeSec: 50, setupTimeMin: 5 }
        ]
    },
    assembly: {
        batchSize: 120,
        shiftMinutes: 450,
        hourlyCost: 220,
        stations: [
            { id: 1, name: "1. Kompletacja detali", cycleTimeSec: 30, setupTimeMin: 10 },
            { id: 2, name: "2. Montaż wstępny", cycleTimeSec: 75, setupTimeMin: 5 },
            { id: 3, name: "3. Nitowanie i zgrzewanie", cycleTimeSec: 95, setupTimeMin: 15 },
            { id: 4, name: "4. Test szczelności", cycleTimeSec: 60, setupTimeMin: 10 }
        ]
    }
};

// Aktualny stan symulacji
let state = JSON.parse(JSON.stringify(PRESETS.cnc));

// Elementy DOM
const batchInput = document.getElementById("batchSize");
const shiftInput = document.getElementById("shiftHours");
const costInput = document.getElementById("hourlyCost");
const stationsContainer = document.getElementById("stationsContainer");

// Inicjalizacja
function init() {
    syncGlobalInputs();
    render();
    attachEvents();
}

function syncGlobalInputs() {
    batchInput.value = state.batchSize;
    shiftInput.value = state.shiftMinutes;
    costInput.value = state.hourlyCost;

    document.getElementById("batchSizeVal").textContent = state.batchSize;
    document.getElementById("shiftHoursVal").textContent = state.shiftMinutes;
    document.getElementById("hourlyCostVal").textContent = state.hourlyCost;
}

// Główna funkcja obliczeniowa i renderująca
function render() {
    if (state.stations.length === 0) return;

    // 1. Obliczenia dla każdego stanowiska
    let maxTotalTimeMin = 0;
    let bottleneckStation = null;
    let bottleneckIndex = 0;

    const calculatedStations = state.stations.map((st, index) => {
        const processingMin = (st.cycleTimeSec * state.batchSize) / 60;
        const totalMin = processingMin + st.setupTimeMin;

        if (totalMin > maxTotalTimeMin) {
            maxTotalTimeMin = totalMin;
            bottleneckStation = st;
            bottleneckIndex = index;
        }

        return { ...st, processingMin, totalMin };
    });

    // 2. Obliczenia KPI linii
    // Całkowity czas partii (uproszczony przepływ potokowy: czas najwolniejszego + czas wypełnienia linii)
    const bottleneckCycleMin = bottleneckStation.cycleTimeSec / 60;
    const otherCyclesSumMin = calculatedStations
        .filter((_, idx) => idx !== bottleneckIndex)
        .reduce((acc, st) => acc + (st.cycleTimeSec / 60), 0);
    const totalSetupMin = calculatedStations.reduce((acc, st) => acc + st.setupTimeMin, 0);

    const leadTimeMin = (state.batchSize * bottleneckCycleMin) + otherCyclesSumMin + bottleneckStation.setupTimeMin;
    const throughputPerHour = Math.round(60 / bottleneckCycleMin);
    const setupSharePercent = Math.round((totalSetupMin / (leadTimeMin * state.stations.length)) * 100);
    const setupCostPln = Math.round((totalSetupMin / 60) * state.hourlyCost);

    // Zapas WIP (ile sztuk wyprodukuje stanowisko poprzedzające, zanim wąskie gardło przerobi partię)
    let wipUnits = 0;
    if (bottleneckIndex > 0) {
        const prevStation = calculatedStations[bottleneckIndex - 1];
        if (prevStation.cycleTimeSec < bottleneckStation.cycleTimeSec) {
            const diffPerUnitSec = bottleneckStation.cycleTimeSec - prevStation.cycleTimeSec;
            wipUnits = Math.floor((diffPerUnitSec * state.batchSize) / bottleneckStation.cycleTimeSec);
        }
    }

    // 3. Aktualizacja kart KPI
    document.getElementById("kpiBottleneck").textContent = bottleneckStation.name;
    document.getElementById("kpiBottleneckTime").textContent = `Obciążenie partią: ${Math.round(maxTotalTimeMin)} min`;
    document.getElementById("kpiLeadTime").textContent = `${Math.round(leadTimeMin)} min (${(leadTimeMin / 60).toFixed(1)} h)`;
    document.getElementById("kpiThroughput").textContent = `Wydajność linii: ${throughputPerHour} szt./h`;
    document.getElementById("kpiSetupShare").textContent = `${totalSetupMin} min łącznie`;
    document.getElementById("kpiSetupCost").textContent = `Koszt przezbrojeń: ${setupCostPln} PLN`;
    document.getElementById("kpiWip").textContent = `${wipUnits} szt.`;

    // 4. Renderowanie kart stanowisk
    stationsContainer.innerHTML = "";
    calculatedStations.forEach((st, idx) => {
        const isBottleneck = st.id === bottleneckStation.id;
        const utilization = Math.min(100, Math.round((st.totalMin / maxTotalTimeMin) * 100));

        const card = document.createElement("div");
        card.className = `station-card ${isBottleneck ? "is-bottleneck" : ""}`;
        card.innerHTML = `
            <div class="station-header">
                <input type="text" class="station-name-input" value="${st.name}" data-idx="${idx}">
                ${state.stations.length > 1 ? `<button class="remove-btn" data-idx="${idx}" title="Usuń stanowisko">✕</button>` : ""}
            </div>
            <div class="station-field">
                <label>Czas cyklu (szt.): <strong>${st.cycleTimeSec} sek.</strong></label>
                <input type="range" class="cycle-slider" data-idx="${idx}" min="5" max="300" step="5" value="${st.cycleTimeSec}">
            </div>
            <div class="station-field">
                <label>Przezbrojenie (SMED): <strong>${st.setupTimeMin} min</strong></label>
                <input type="range" class="setup-slider" data-idx="${idx}" min="0" max="90" step="5" value="${st.setupTimeMin}">
            </div>
            <div class="station-stats">
                <span>Obciążenie: <strong>${utilization}%</strong> (${Math.round(st.totalMin)} min)</span>
                ${isBottleneck ? `<span class="bottleneck-tag">WĄSKIE GARDŁO</span>` : ""}
            </div>
        `;
        stationsContainer.appendChild(card);
    });
}

// Obsługa zdarzeń
function attachEvents() {
    batchInput.addEventListener("input", (e) => {
        state.batchSize = Number(e.target.value);
        document.getElementById("batchSizeVal").textContent = state.batchSize;
        render();
    });

    shiftInput.addEventListener("input", (e) => {
        state.shiftMinutes = Number(e.target.value);
        document.getElementById("shiftHoursVal").textContent = state.shiftMinutes;
        render();
    });

    costInput.addEventListener("input", (e) => {
        state.hourlyCost = Number(e.target.value);
        document.getElementById("hourlyCostVal").textContent = state.hourlyCost;
        render();
    });

    // Delegacja zdarzeń dla dynamicznych stanowisk
    stationsContainer.addEventListener("input", (e) => {
        const idx = e.target.dataset.idx;
        if (e.target.classList.contains("cycle-slider")) {
            state.stations[idx].cycleTimeSec = Number(e.target.value);
            render();
        } else if (e.target.classList.contains("setup-slider")) {
            state.stations[idx].setupTimeMin = Number(e.target.value);
            render();
        } else if (e.target.classList.contains("station-name-input")) {
            state.stations[idx].name = e.target.value;
        }
    });

    stationsContainer.addEventListener("click", (e) => {
        if (e.target.classList.contains("remove-btn")) {
            const idx = Number(e.target.dataset.idx);
            state.stations.splice(idx, 1);
            render();
        }
    });

    // Dodawanie stanowiska
    document.getElementById("addStationBtn").addEventListener("click", () => {
        const nextNum = state.stations.length + 1;
        state.stations.push({
            id: Date.now(),
            name: `${nextNum}. Nowe stanowisko`,
            cycleTimeSec: 60,
            setupTimeMin: 10
        });
        render();
    });

    // Zmiana scenariusza demo
    document.getElementById("presetSelect").addEventListener("change", (e) => {
        const key = e.target.value;
        state = JSON.parse(JSON.stringify(PRESETS[key]));
        syncGlobalInputs();
        render();
    });

    // Eksport konfiguracji do pliku JSON
    document.getElementById("exportBtn").addEventListener("click", () => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state, null, 2));
        const downloadAnchor = document.createElement("a");
        downloadAnchor.setAttribute("href", dataStr);
        downloadAnchor.setAttribute("download", "konfiguracja_linii.json");
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
    });

    // Import własnej konfiguracji z pliku JSON
    document.getElementById("importInput").addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const imported = JSON.parse(event.target.result);
                if (imported.stations && Array.isArray(imported.stations)) {
                    state = imported;
                    syncGlobalInputs();
                    render();
                } else {
                    alert("Nieprawidłowy format pliku konfiguracyjnego.");
                }
            } catch (err) {
                alert("Błąd odczytu pliku JSON.");
            }
        };
        reader.readAsText(file);
    });
}

init();
