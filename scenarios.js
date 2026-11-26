// Demonstracyjne profile startowe. Parametry są przykładowe i należy je dostosować do zakładu.
(function (root, factory) {
    const scenarios = factory();
    if (typeof module === "object" && module.exports) module.exports = scenarios;
    if (root) root.FlowOptimaScenarios = scenarios;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
    "use strict";

    const profiles = {
        standard: {
            name: "Proces produkcyjny — standardowy",
            config: {
                batchSize: 100,
                shiftMinutes: 450,
                hourlyCost: 250,
                stations: [
                    { id: 1, name: "Przygotowanie materiału", cycleTimeSec: 45, setupTimeMin: 10 },
                    { id: 2, name: "Obróbka", cycleTimeSec: 60, setupTimeMin: 20 },
                    { id: 3, name: "Montaż", cycleTimeSec: 50, setupTimeMin: 15 },
                    { id: 4, name: "Kontrola jakości", cycleTimeSec: 35, setupTimeMin: 5 },
                    { id: 5, name: "Pakowanie", cycleTimeSec: 40, setupTimeMin: 5 }
                ]
            }
        },
        machining: {
            name: "Obróbka — przykład",
            config: {
                batchSize: 60,
                shiftMinutes: 450,
                hourlyCost: 300,
                stations: [
                    { id: 1, name: "Cięcie materiału", cycleTimeSec: 45, setupTimeMin: 15 },
                    { id: 2, name: "Obróbka CNC", cycleTimeSec: 110, setupTimeMin: 25 },
                    { id: 3, name: "Gratowanie i wykończenie", cycleTimeSec: 65, setupTimeMin: 15 },
                    { id: 4, name: "Kontrola jakości", cycleTimeSec: 50, setupTimeMin: 5 },
                    { id: 5, name: "Pakowanie", cycleTimeSec: 40, setupTimeMin: 5 }
                ]
            }
        },
        assembly: {
            name: "Montaż — przykład",
            config: {
                batchSize: 120,
                shiftMinutes: 450,
                hourlyCost: 220,
                stations: [
                    { id: 1, name: "Kompletacja komponentów", cycleTimeSec: 30, setupTimeMin: 10 },
                    { id: 2, name: "Montaż wstępny", cycleTimeSec: 75, setupTimeMin: 5 },
                    { id: 3, name: "Montaż końcowy", cycleTimeSec: 95, setupTimeMin: 15 },
                    { id: 4, name: "Test funkcjonalny", cycleTimeSec: 60, setupTimeMin: 10 },
                    { id: 5, name: "Pakowanie", cycleTimeSec: 40, setupTimeMin: 5 }
                ]
            }
        },
        packaging: {
            name: "Pakowanie — przykład",
            config: {
                batchSize: 200,
                shiftMinutes: 450,
                hourlyCost: 200,
                stations: [
                    { id: 1, name: "Przygotowanie produktu", cycleTimeSec: 25, setupTimeMin: 5 },
                    { id: 2, name: "Etykietowanie", cycleTimeSec: 35, setupTimeMin: 10 },
                    { id: 3, name: "Pakowanie jednostkowe", cycleTimeSec: 40, setupTimeMin: 15 },
                    { id: 4, name: "Pakowanie zbiorcze", cycleTimeSec: 30, setupTimeMin: 10 },
                    { id: 5, name: "Kontrola i paletyzacja", cycleTimeSec: 45, setupTimeMin: 5 }
                ]
            }
        }
    };

    function getProfile(key) {
        const profile = profiles[key];
        return profile ? JSON.parse(JSON.stringify(profile)) : null;
    }

    return { profiles, getProfile };
});
