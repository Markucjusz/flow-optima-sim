const PRESETS = {
    cnc: {
        batchSize: 60, shiftMinutes: 450, hourlyCost: 300,
        stations: [
            { id: 1, name: "Cięcie piłą CNC", cycleTimeSec: 45, setupTimeMin: 15, availabilityPct: 95, failureDurationMin: 20, failureFrequencyPct: 8, bufferUnits: 20 },
            { id: 2, name: "Frezowanie otworów", cycleTimeSec: 110, setupTimeMin: 25, availabilityPct: 92, failureDurationMin: 25, failureFrequencyPct: 10, bufferUnits: 20 },
            { id: 3, name: "Gięcie profili", cycleTimeSec: 65, setupTimeMin: 20, availabilityPct: 97, failureDurationMin: 15, failureFrequencyPct: 5, bufferUnits: 20 },
            { id: 4, name: "Kontrola i pakowanie", cycleTimeSec: 50, setupTimeMin: 5, availabilityPct: 99, failureDurationMin: 10, failureFrequencyPct: 3, bufferUnits: 20 }
        ]
    },
    assembly: {
        batchSize: 120, shiftMinutes: 450, hourlyCost: 220,
        stations: [
            { id: 1, name: "Kompletacja detali", cycleTimeSec: 30, setupTimeMin: 10, availabilityPct: 98, failureDurationMin: 10, failureFrequencyPct: 4, bufferUnits: 30 },
            { id: 2, name: "Montaż wstępny", cycleTimeSec: 75, setupTimeMin: 5, availabilityPct: 96, failureDurationMin: 15, failureFrequencyPct: 6, bufferUnits: 30 },
            { id: 3, name: "Nitowanie i zgrzewanie", cycleTimeSec: 95, setupTimeMin: 15, availabilityPct: 94, failureDurationMin: 20, failureFrequencyPct: 8, bufferUnits: 30 },
            { id: 4, name: "Test szczelności", cycleTimeSec: 60, setupTimeMin: 10, availabilityPct: 99, failureDurationMin: 10, failureFrequencyPct: 2, bufferUnits: 30 }
        ]
    }
};

let state = structuredClone(PRESETS.cnc);
let scenarios = loadScenarios();

const $ = (id) => document.getElementById(id);

function clampImportedState(raw) {
    if (!raw || !Array.isArray(raw.stations) || raw.stations.length === 0) throw new Error("Nieprawidłowa konfiguracja");
    return {
        batchSize: clamp(Number(raw.batchSize), 1, 500, 60),
        shiftMinutes: clamp(Number(raw.shiftMinutes), 60, 1440, 450),
        hourlyCost: clamp(Number(raw.hourlyCost), 50, 2000, 300),
        stations: raw.stations.slice(0, 30).map((s, i) => ({
            id: Number(s.id) || Date.now() + i,
            name: String(s.name || `Stanowisko ${i + 1}`).slice(0, 80),
            cycleTimeSec: clamp(Number(s.cycleTimeSec), 1, 300, 60),
            setupTimeMin: clamp(Number(s.setupTimeMin), 0, 240, 10),
            availabilityPct: clamp(Number(s.availabilityPct), 1, 100, 100),
            failureDurationMin: clamp(Number(s.failureDurationMin), 0, 240, 0),
            failureFrequencyPct: clamp(Number(s.failureFrequencyPct), 0, 100, 0),
            bufferUnits: clamp(Number(s.bufferUnits), 0, 1000, 0)
        }))
    };
}

function clamp(value, min, max, fallback) { return Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : fallback; }

function simulate() {
    let maxEffectiveLoad = 0;
    let bottleneckIndex = 0;
    let totalSetup = 0;
    let totalDowntime = 0;
    let weightedAvailability = 0;

    const stations = state.stations.map((st, i) => {
        const processing = st.cycleTimeSec * state.batchSize / 60;
        const availabilityFactor = st.availabilityPct / 100;
        const estimatedFailureCount = Math.ceil(state.batchSize * st.failureFrequencyPct / 100);
        const failureDowntime = estimatedFailureCount * st.failureDurationMin;
        const effectiveProcessing = processing / availabilityFactor;
        const totalLoad = effectiveProcessing + st.setupTimeMin + failureDowntime;
        const effectiveCycle = (st.cycleTimeSec / 60) / availabilityFactor;
        totalSetup += st.setupTimeMin;
        totalDowntime += failureDowntime;
        weightedAvailability += st.availabilityPct;
        if (totalLoad > maxEffectiveLoad) { maxEffectiveLoad = totalLoad; bottleneckIndex = i; }
        return { ...st, processing, effectiveProcessing, failureDowntime, totalLoad, effectiveCycle };
    });

    const bottleneck = stations[bottleneckIndex];
    let leadTime = 0;
    stations.forEach((st, i) => {
        const stationTime = st.setupTimeMin + st.effectiveProcessing + st.failureDowntime;
        leadTime += i === bottleneckIndex ? stationTime : st.effectiveCycle;
    });

    const lineAvailability = weightedAvailability / stations.length;
    const effectiveThroughput = bottleneck.effectiveCycle > 0 ? 60 / bottleneck.effectiveCycle : 0;
    const bottleneckBuffer = bottleneck.bufferUnits + Math.max(0, stations[bottleneckIndex - 1]?.effectiveProcessing * 60 / bottleneck.effectiveCycle - state.batchSize * 0.1 || 0);
    const wip = clamp(Math.floor(bottleneckBuffer), 0, 100000, 0);
    const totalCost = leadTime / 60 * state.hourlyCost;

    return { stations, bottleneck, bottleneckIndex, maxEffectiveLoad, leadTime, lineAvailability, effectiveThroughput, wip, totalSetup, totalDowntime, totalCost };
}

function formatMinutes(minutes) { return `${Math.round(minutes)} min (${(minutes / 60).toFixed(1)} h)`; }

function render() {
    syncGlobalInputs();
    const r = simulate();
    $("kpiBottleneck").textContent = r.bottleneck.name;
    $("kpiBottleneckTime").textContent = `Obciążenie: ${formatMinutes(r.maxEffectiveLoad)}`;
    $("kpiLeadTime").textContent = formatMinutes(r.leadTime);
    $("kpiThroughput").textContent = `Wydajność: ${r.effectiveThroughput.toFixed(1)} szt./h`;
    $("kpiAvailability").textContent = `${r.lineAvailability.toFixed(1)}%`;
    $("kpiDowntime").textContent = `Przestoje: ${Math.round(r.totalDowntime)} min • SMED: ${Math.round(r.totalSetup)} min`;
    $("kpiWip").textContent = `${r.wip} szt.`;
    $("kpiCost").textContent = `Koszt: ${Math.round(r.totalCost).toLocaleString("pl-PL")} PLN`;

    $("stationsContainer").innerHTML = r.stations.map((st, i) => {
        const utilization = r.maxEffectiveLoad ? Math.min(100, Math.round(st.totalLoad / r.maxEffectiveLoad * 100)) : 0;
        return `<article class="station-card ${i === r.bottleneckIndex ? "is-bottleneck" : "}">
            <div class="station-header"><input class="station-name-input" aria-label="Nazwa stanowiska" value="${escapeHtml(st.name)}" data-field="name" data-index="${i}"><button class="remove-btn" data-index="${i}" title="Usuń stanowisko">Usuń</button></div>
            ${numberField(i, "Czas cyklu", "cycleTimeSec", st.cycleTimeSec, 1, 300, 1, "s")}
            ${numberField(i, "Przezbrojenie SMED", "setupTimeMin", st.setupTimeMin, 0, 240, 1, "min")}
            ${numberField(i, "Dostępność", "availabilityPct", st.availabilityPct, 1, 100, 1, "%")}
            ${numberField(i, "Częstość awarii", "failureFrequencyPct", st.failureFrequencyPct, 0, 100, 1, "%")}
            ${numberField(i, "Czas awarii", "failureDurationMin", st.failureDurationMin, 0, 240, 1, "min")}
            ${numberField(i, "Bufor", "bufferUnits", st.bufferUnits, 0, 1000, 1, "szt.")}
            <div class="station-stats"><span>Obciążenie: <strong>${utilization}%</strong></span><span>Przestoje: <strong>${Math.round(st.failureDowntime)} min</strong></span></div>
            ${i === r.bottleneckIndex ? '<span class="bottleneck-tag">WĄSKIE GARDŁO</span>' : ""}
        </article>`;
    }).join("");
}

function numberField(index, label, field, value, min, max, step, unit) {
    return `<div class="station-field"><label>${label}: <strong>${value} ${unit}</strong></label><input type="range" min="${min}" max="${max}" step="${step}" value="${value}" data-field="${field}" data-index="${index}"></div>`;
}

function escapeHtml(value) { const div = document.createElement("div"); div.textContent = value; return div.innerHTML; }

function syncGlobalInputs() {
    $("batchSize").value = state.batchSize; $("shiftMinutes").value = state.shiftMinutes; $("hourlyCost").value = state.hourlyCost;
    $("batchSizeVal").textContent = state.batchSize; $("shiftMinutesVal").textContent = state.shiftMinutes; $("hourlyCostVal").textContent = state.hourlyCost;
}

function toast(message) { const el = $("toast"); el.textContent = message; el.classList.add("show"); setTimeout(() => el.classList.remove("show"), 2600); }

function loadScenarios() { try { return JSON.parse(localStorage.getItem("flowoptima-scenarios") || "[]"); } catch { return []; } }
function saveScenarios() { localStorage.setItem("flowoptima-scenarios", JSON.stringify(scenarios)); }

function renderScenarios() {
    $("scenariosContainer").innerHTML = scenarios.length ? scenarios.map((s, i) => `<div class="scenario-row"><button class="scenario-load" data-index="${i}">${escapeHtml(s.name)}</button><button class="scenario-delete" data-index="${i}" title="Usuń scenariusz">Usuń</button></div>`).join("") : '<p class="empty-state">Brak zapisanych scenariuszy.</p>';
}

function attachEvents() {
    [["batchSize", "batchSize"], ["shiftMinutes", "shiftMinutes"], ["hourlyCost", "hourlyCost"]].forEach(([id, field]) => $(id).addEventListener("input", e => { state[field] = Number(e.target.value); render(); }));

    $("stationsContainer").addEventListener("input", e => {
        const input = e.target; const i = Number(input.dataset.index); if (!Number.isInteger(i)) return;
        if (input.dataset.field === "name") state.stations[i].name = input.value;
        else if (input.dataset.field) state.stations[i][input.dataset.field] = Number(input.value);
        render();
    });

    $("stationsContainer").addEventListener("click", e => {
        if (!e.target.classList.contains("remove-btn")) return;
        const i = Number(e.target.dataset.index);
        if (state.stations.length > 1) { state.stations.splice(i, 1); render(); }
        else toast("Linia musi mieć co najmniej jedno stanowisko.");
    });

    $("addStationBtn").addEventListener("click", () => {
        if (state.stations.length >= 30) return toast("Osiągnięto limit 30 stanowisk.");
        state.stations.push({ id: Date.now(), name: `Stanowisko ${state.stations.length + 1}`, cycleTimeSec: 60, setupTimeMin: 10, availabilityPct: 95, failureDurationMin: 15, failureFrequencyPct: 5, bufferUnits: 20 });
        render();
    });

    $("presetSelect").addEventListener("change", e => { state = structuredClone(PRESETS[e.target.value]); render(); });

    $("exportBtn").addEventListener("click", () => {
        const url = URL.createObjectURL(new Blob([JSON.stringify(state, null, 2)], { type: "application/json" }));
        const a = document.createElement("a"); a.href = url; a.download = "flowoptima-scenariusz.json"; a.click(); URL.revokeObjectURL(url); toast("Eksport JSON zakończony.");
    });

    $("importInput").addEventListener("change", async e => {
        const file = e.target.files[0]; if (!file) return;
        try { state = clampImportedState(JSON.parse(await file.text())); render(); toast("Konfiguracja została zaimportowana."); }
        catch { toast("Nieprawidłowy plik konfiguracji JSON."); }
        e.target.value = "";
    });

    $("saveScenarioBtn").addEventListener("click", () => {
        const name = prompt("Nazwa scenariusza:", `Scenariusz ${scenarios.length + 1}`);
        if (!name?.trim()) return;
        scenarios.push({ name: name.trim(), state: structuredClone(state) });
        saveScenarios(); renderScenarios(); toast("Scenariusz zapisano lokalnie.");
    });

    $("scenariosContainer").addEventListener("click", e => {
        const i = Number(e.target.dataset.index); if (!Number.isInteger(i)) return;
        if (e.target.classList.contains("scenario-load")) { state = clampImportedState(scenarios[i].state); render(); toast("Scenariusz wczytany."); }
        if (e.target.classList.contains("scenario-delete")) { scenarios.splice(i, 1); saveScenarios(); renderScenarios(); }
    });

    $("clearScenariosBtn").addEventListener("click", () => { if (scenarios.length && confirm("Usunąć wszystkie zapisane scenariusze?")) { scenarios = []; saveScenarios(); renderScenarios(); } });
}

renderScenarios(); attachEvents(); render();
