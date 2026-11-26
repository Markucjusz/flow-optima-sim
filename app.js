// Built-in synthetic examples; no confidential factory data is included.
const PRESETS = {
    standard: {
        batchSize: 100,
        shiftMinutes: 450,
        hourlyCost: 250,
        stations: [
            { id: 1, name: "1. Przyjęcie i przygotowanie materiału", cycleTimeSec: 35, setupTimeMin: 10 },
            { id: 2, name: "2. Obróbka / produkcja", cycleTimeSec: 75, setupTimeMin: 20 },
            { id: 3, name: "3. Montaż", cycleTimeSec: 55, setupTimeMin: 15 },
            { id: 4, name: "4. Kontrola jakości", cycleTimeSec: 25, setupTimeMin: 5 },
            { id: 5, name: "5. Pakowanie i przygotowanie wysyłki", cycleTimeSec: 30, setupTimeMin: 5 }
        ]
    },
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

// Start from a general-purpose production flow; every profile remains editable.
let state = JSON.parse(JSON.stringify(PRESETS.standard));
const batchInput = document.getElementById("batchSize");
const shiftInput = document.getElementById("shiftHours");
const costInput = document.getElementById("hourlyCost");
const stationsContainer = document.getElementById("stationsContainer");

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

function createElement(tag, className, text) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
}

function createRange(className, index, min, max, value, step = 1) {
    const input = document.createElement("input");
    input.type = "range";
    input.className = className;
    input.dataset.idx = index;
    input.min = min;
    input.max = max;
    input.step = step;
    input.value = value;
    return input;
}

function render() {
    const result = FlowOptimaSimulation.calculateMetrics(state);
    const { stations, bottleneckIndex } = result;

    document.getElementById("kpiBottleneck").textContent = result.bottleneck.name;
    document.getElementById("kpiBottleneckTime").textContent = `Obciążenie partią: ${Math.round(result.bottleneck.totalMin)} min`;
    document.getElementById("kpiLeadTime").textContent = `${Math.round(result.leadTimeMin)} min (${(result.leadTimeMin / 60).toFixed(1)} h)`;
    document.getElementById("kpiThroughput").textContent = `Wydajność linii: ${result.throughputPerHour.toFixed(1)} szt./h`;
    document.getElementById("kpiSetupShare").textContent = `${result.setupSharePercent.toFixed(1)}%`;
    document.getElementById("kpiSetupCost").textContent = `${result.totalSetupMin} min łącznie · koszt: ${result.setupCost.toFixed(2)} PLN`;
    document.getElementById("kpiWip").textContent = `${result.wipUnits} szt.`;
    document.getElementById("kpiShiftCapacity").textContent = `${result.unitsPerShift} szt.`;
    document.getElementById("kpiShiftCapacityDesc").textContent = `Szacunek dla ${state.shiftMinutes} min; odjęto setup wąskiego gardła`;

    stationsContainer.replaceChildren();
    stations.forEach((station, index) => {
        const isBottleneck = index === bottleneckIndex;
        const utilization = Math.min(100, Math.round((station.totalMin / result.bottleneck.totalMin) * 100));
        const card = createElement("div", `station-card${isBottleneck ? " is-bottleneck" : ""}`);
        const header = createElement("div", "station-header");
        const name = document.createElement("input");
        name.type = "text";
        name.className = "station-name-input";
        name.value = station.name;
        name.maxLength = FlowOptimaSimulation.LIMITS.stationNameLength;
        name.dataset.idx = index;
        name.setAttribute("aria-label", `Nazwa stanowiska ${index + 1}`);
        header.appendChild(name);
        if (stations.length > 1) {
            const remove = createElement("button", "remove-btn", "✕");
            remove.type = "button";
            remove.dataset.idx = index;
            remove.title = "Usuń stanowisko";
            remove.setAttribute("aria-label", `Usuń stanowisko ${index + 1}`);
            header.appendChild(remove);
        }
        card.appendChild(header);

        const cycleField = createElement("div", "station-field");
        const cycleLabel = createElement("label");
        cycleLabel.append("Czas cyklu (szt.): ", createElement("strong", "", `${station.cycleTimeSec} sek.`));
        cycleField.append(cycleLabel, createRange("cycle-slider", index, 1, 3600, station.cycleTimeSec));
        card.appendChild(cycleField);

        const setupField = createElement("div", "station-field");
        const setupLabel = createElement("label");
        setupLabel.append("Przezbrojenie (SMED): ", createElement("strong", "", `${station.setupTimeMin} min`));
        setupField.append(setupLabel, createRange("setup-slider", index, 0, 1440, station.setupTimeMin));
        card.appendChild(setupField);

        const stats = createElement("div", "station-stats");
        stats.appendChild(createElement("span", "", `Obciążenie: ${utilization}% (${Math.round(station.totalMin)} min)`));
        if (isBottleneck) stats.appendChild(createElement("span", "bottleneck-tag", "WĄSKIE GARDŁO"));
        card.appendChild(stats);
        stationsContainer.appendChild(card);
    });
}

function attachEvents() {
    batchInput.addEventListener("input", (event) => {
        state.batchSize = Number(event.target.value);
        document.getElementById("batchSizeVal").textContent = state.batchSize;
        render();
    });
    shiftInput.addEventListener("input", (event) => {
        state.shiftMinutes = Number(event.target.value);
        document.getElementById("shiftHoursVal").textContent = state.shiftMinutes;
        render();
    });
    costInput.addEventListener("input", (event) => {
        state.hourlyCost = Number(event.target.value);
        document.getElementById("hourlyCostVal").textContent = state.hourlyCost;
        render();
    });

    stationsContainer.addEventListener("input", (event) => {
        const index = Number(event.target.dataset.idx);
        if (!Number.isInteger(index) || !state.stations[index]) return;
        if (event.target.classList.contains("cycle-slider")) {
            state.stations[index].cycleTimeSec = Number(event.target.value);
            render();
        } else if (event.target.classList.contains("setup-slider")) {
            state.stations[index].setupTimeMin = Number(event.target.value);
            render();
        } else if (event.target.classList.contains("station-name-input")) {
            state.stations[index].name = event.target.value;
            document.getElementById("kpiBottleneck").textContent = state.stations[index].name;
        }
    });

    stationsContainer.addEventListener("click", (event) => {
        if (!event.target.classList.contains("remove-btn")) return;
        const index = Number(event.target.dataset.idx);
        if (!Number.isInteger(index) || state.stations.length <= 1) return;
        state.stations.splice(index, 1);
        render();
    });

    document.getElementById("addStationBtn").addEventListener("click", () => {
        state.stations.push({
            id: Date.now(),
            name: `${state.stations.length + 1}. Nowe stanowisko`,
            cycleTimeSec: 60,
            setupTimeMin: 10
        });
        render();
    });

    document.getElementById("presetSelect").addEventListener("change", (event) => {
        const preset = PRESETS[event.target.value];
        if (!preset) return;
        state = JSON.parse(JSON.stringify(preset));
        syncGlobalInputs();
        render();
    });

    document.getElementById("exportBtn").addEventListener("click", () => {
        const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = "konfiguracja_linii.json";
        anchor.click();
        URL.revokeObjectURL(url);
    });

    document.getElementById("importInput").addEventListener("change", (event) => {
        const file = event.target.files[0];
        if (!file) return;
        if (file.size > 1024 * 1024) {
            alert("Plik konfiguracyjny przekracza limit 1 MB.");
            event.target.value = "";
            return;
        }
        const reader = new FileReader();
        reader.onload = () => {
            try {
                const imported = JSON.parse(reader.result);
                const validation = FlowOptimaSimulation.validateConfig(imported);
                if (!validation.valid) {
                    alert(`Nieprawidłowa konfiguracja:\n${validation.errors.join("\n")}`);
                    return;
                }
                state = validation.config;
                syncGlobalInputs();
                render();
            } catch (error) {
                alert("Nie udało się odczytać pliku JSON.");
            } finally {
                event.target.value = "";
            }
        };
        reader.onerror = () => {
            alert("Błąd odczytu pliku konfiguracyjnego.");
            event.target.value = "";
        };
        reader.readAsText(file);
    });
}

init();
