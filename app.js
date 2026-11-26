const STORAGE_KEY = "flowOptima.customProfiles.v1";
const PRESETS = FlowOptimaScenarios.profiles;
let state = FlowOptimaScenarios.getProfile("standard").config;
let activeProfileId = "standard";

const batchInput = document.getElementById("batchSize");
const shiftInput = document.getElementById("shiftHours");
const costInput = document.getElementById("hourlyCost");
const stationsContainer = document.getElementById("stationsContainer");
const presetSelect = document.getElementById("presetSelect");

function readCustomProfiles() {
    try {
        const profiles = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
        return Array.isArray(profiles) ? profiles.filter((profile) =>
            profile && typeof profile.id === "string" && typeof profile.name === "string"
            && FlowOptimaSimulation.validateConfig(profile.config).valid
        ) : [];
    } catch (error) {
        return [];
    }
}

function writeCustomProfiles(profiles) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
        return true;
    } catch (error) {
        alert("Nie można zapisać profilu w tej przeglądarce. Możesz użyć eksportu JSON.");
        return false;
    }
}

function updateProfileOptions() {
    const customGroup = document.getElementById("customProfiles");
    customGroup.replaceChildren();
    readCustomProfiles().forEach((profile) => {
        const option = document.createElement("option");
        option.value = profile.id;
        option.textContent = profile.name;
        customGroup.appendChild(option);
    });
    presetSelect.value = activeProfileId;
}

function persistActiveCustomProfile() {
    if (!activeProfileId.startsWith("custom:")) return;
    const profiles = readCustomProfiles();
    const profile = profiles.find((item) => item.id === activeProfileId);
    if (!profile) return;
    profile.config = JSON.parse(JSON.stringify(state));
    writeCustomProfiles(profiles);
}

function init() {
    updateProfileOptions();
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

function createRange(className, index, min, max, value) {
    const input = document.createElement("input");
    input.type = "range";
    input.className = className;
    input.dataset.idx = index;
    input.min = min;
    input.max = max;
    input.step = 1;
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

function saveAsCustomProfile() {
    const name = prompt("Podaj nazwę własnego profilu:", "Mój proces produkcyjny");
    if (name === null) return;
    const trimmedName = name.trim();
    if (!trimmedName || trimmedName.length > 80) {
        alert("Nazwa profilu musi mieć od 1 do 80 znaków.");
        return;
    }
    const profiles = readCustomProfiles();
    const id = `custom:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`;
    profiles.push({ id, name: trimmedName, config: JSON.parse(JSON.stringify(state)) });
    if (writeCustomProfiles(profiles)) {
        activeProfileId = id;
        updateProfileOptions();
    }
}

function exportConfig() {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "konfiguracja_linii.json";
    anchor.click();
    URL.revokeObjectURL(url);
}

function importConfig(file, input) {
    if (!file) return;
    if (file.size > 1024 * 1024) {
        alert("Plik konfiguracyjny przekracza limit 1 MB.");
        input.value = "";
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
            activeProfileId = "custom:imported";
            const profiles = readCustomProfiles();
            const importedProfile = profiles.find((profile) => profile.id === activeProfileId);
            if (!importedProfile) {
                const id = `custom:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`;
                profiles.push({ id, name: "Zaimportowany profil", config: JSON.parse(JSON.stringify(state)) });
                activeProfileId = id;
                writeCustomProfiles(profiles);
            }
            updateProfileOptions();
            syncGlobalInputs();
            render();
        } catch (error) {
            alert("Nie udało się odczytać pliku JSON.");
        } finally {
            input.value = "";
        }
    };
    reader.onerror = () => {
        alert("Błąd odczytu pliku konfiguracyjnego.");
        input.value = "";
    };
    reader.readAsText(file);
}

function attachEvents() {
    batchInput.addEventListener("input", (event) => {
        state.batchSize = Number(event.target.value);
        document.getElementById("batchSizeVal").textContent = state.batchSize;
        persistActiveCustomProfile();
        render();
    });
    shiftInput.addEventListener("input", (event) => {
        state.shiftMinutes = Number(event.target.value);
        document.getElementById("shiftHoursVal").textContent = state.shiftMinutes;
        persistActiveCustomProfile();
        render();
    });
    costInput.addEventListener("input", (event) => {
        state.hourlyCost = Number(event.target.value);
        document.getElementById("hourlyCostVal").textContent = state.hourlyCost;
        persistActiveCustomProfile();
        render();
    });
    stationsContainer.addEventListener("input", (event) => {
        const index = Number(event.target.dataset.idx);
        if (!Number.isInteger(index) || !state.stations[index]) return;
        if (event.target.classList.contains("cycle-slider")) state.stations[index].cycleTimeSec = Number(event.target.value);
        else if (event.target.classList.contains("setup-slider")) state.stations[index].setupTimeMin = Number(event.target.value);
        else if (event.target.classList.contains("station-name-input")) state.stations[index].name = event.target.value;
        else return;
        persistActiveCustomProfile();
        if (event.target.classList.contains("station-name-input")) {
            document.getElementById("kpiBottleneck").textContent = state.stations[index].name;
        } else {
            render();
        }
    });
    stationsContainer.addEventListener("click", (event) => {
        if (!event.target.classList.contains("remove-btn")) return;
        const index = Number(event.target.dataset.idx);
        if (!Number.isInteger(index) || state.stations.length <= 1) return;
        state.stations.splice(index, 1);
        persistActiveCustomProfile();
        render();
    });
    document.getElementById("addStationBtn").addEventListener("click", () => {
        state.stations.push({ id: Date.now(), name: `${state.stations.length + 1}. Nowe stanowisko`, cycleTimeSec: 60, setupTimeMin: 10 });
        persistActiveCustomProfile();
        render();
    });
    presetSelect.addEventListener("change", (event) => {
        const profile = PRESETS[event.target.value];
        if (profile) {
            state = FlowOptimaScenarios.getProfile(event.target.value).config;
            activeProfileId = event.target.value;
        } else {
            const custom = readCustomProfiles().find((item) => item.id === event.target.value);
            if (!custom) return;
            state = JSON.parse(JSON.stringify(custom.config));
            activeProfileId = custom.id;
        }
        syncGlobalInputs();
        render();
    });
    document.getElementById("saveProfileBtn").addEventListener("click", saveAsCustomProfile);
    document.getElementById("exportBtn").addEventListener("click", exportConfig);
    document.getElementById("importInput").addEventListener("change", (event) => importConfig(event.target.files[0], event.target));
}

init();
