const test = require("node:test");
const assert = require("node:assert/strict");
const { calculateMetrics, validateConfig } = require("./simulation.js");

const sample = {
    batchSize: 20,
    shiftMinutes: 60,
    hourlyCost: 120,
    stations: [
        { id: 1, name: "Cięcie", cycleTimeSec: 30, setupTimeMin: 10 },
        { id: 2, name: "Montaż", cycleTimeSec: 60, setupTimeMin: 20 }
    ]
};

test("wybiera stanowisko o największym obciążeniu partii", () => {
    const metrics = calculateMetrics(sample);
    assert.equal(metrics.bottleneckIndex, 1);
    assert.equal(metrics.bottleneck.name, "Montaż");
    assert.equal(metrics.bottleneck.totalMin, 40);
});

test("oblicza czas partii, przepustowość i szacowaną produkcję na zmianę", () => {
    const metrics = calculateMetrics(sample);
    assert.equal(metrics.leadTimeMin, 20.5);
    assert.equal(metrics.throughputPerHour, 60);
    assert.equal(metrics.unitsPerShift, 40);
});

test("pokazuje udział setupu i jego koszt na podstawie wszystkich stanowisk", () => {
    const metrics = calculateMetrics(sample);
    assert.equal(metrics.totalSetupMin, 30);
    assert.equal(metrics.setupSharePercent, (30 / 70) * 100);
    assert.equal(metrics.setupCost, 60);
});

test("zmiana dostępnego czasu zmiany wpływa na prognozę produkcji", () => {
    const shortShift = calculateMetrics({ ...sample, shiftMinutes: 30 });
    const longShift = calculateMetrics({ ...sample, shiftMinutes: 60 });
    assert.equal(shortShift.unitsPerShift, 10);
    assert.equal(longShift.unitsPerShift, 40);
});

test("waliduje zakresy, wymagane pola i co najmniej jedno stanowisko", () => {
    assert.equal(validateConfig(sample).valid, true);
    assert.equal(validateConfig({ ...sample, stations: [] }).valid, false);
    assert.equal(validateConfig({ ...sample, batchSize: 0 }).valid, false);
    assert.equal(validateConfig({ ...sample, stations: [{ name: "", cycleTimeSec: -1, setupTimeMin: 0 }] }).valid, false);
});

test("nie mutuje konfiguracji wejściowej i odrzuca złośliwe/niepoprawne nazwy jako nieprawidłowe", () => {
    const original = JSON.parse(JSON.stringify(sample));
    const validated = validateConfig(sample);
    assert.deepEqual(sample, original);
    assert.equal(validated.valid, true);
    assert.throws(() => calculateMetrics({ ...sample, stations: [{ name: " ", cycleTimeSec: 10, setupTimeMin: 0 }] }), TypeError);
});
