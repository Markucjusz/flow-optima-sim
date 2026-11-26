/* Pure simulation and configuration logic; usable in browser and Node.js tests. */
(function (root, factory) {
    const simulation = factory();
    if (typeof module === "object" && module.exports) {
        module.exports = simulation;
    }
    if (root) {
        root.FlowOptimaSimulation = simulation;
    }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
    "use strict";

    const LIMITS = {
        batchSize: { min: 1, max: 10000 },
        shiftMinutes: { min: 1, max: 1440 },
        hourlyCost: { min: 0, max: 1000000 },
        cycleTimeSec: { min: 1, max: 3600 },
        setupTimeMin: { min: 0, max: 1440 },
        stationNameLength: 80
    };

    function validateConfig(config) {
        const errors = [];
        if (!config || typeof config !== "object" || Array.isArray(config)) {
            return { valid: false, errors: ["Konfiguracja musi być obiektem JSON."], config: null };
        }

        for (const field of ["batchSize", "shiftMinutes", "hourlyCost"]) {
            const value = config[field];
            const { min, max } = LIMITS[field];
            if (typeof value !== "number" || !Number.isFinite(value) || value < min || value > max) {
                errors.push(`Pole „${field}” musi być liczbą z zakresu ${min}–${max}.`);
            }
        }

        if (!Array.isArray(config.stations) || config.stations.length === 0) {
            errors.push("Konfiguracja musi zawierać co najmniej jedno stanowisko.");
        } else {
            config.stations.forEach((station, index) => {
                const prefix = `Stanowisko ${index + 1}`;
                if (!station || typeof station !== "object" || Array.isArray(station)) {
                    errors.push(`${prefix}: oczekiwano obiektu.`);
                    return;
                }
                if (typeof station.name !== "string" || !station.name.trim() || station.name.length > LIMITS.stationNameLength) {
                    errors.push(`${prefix}: nazwa musi mieć od 1 do ${LIMITS.stationNameLength} znaków.`);
                }
                for (const field of ["cycleTimeSec", "setupTimeMin"]) {
                    const value = station[field];
                    const { min, max } = LIMITS[field];
                    if (typeof value !== "number" || !Number.isFinite(value) || value < min || value > max) {
                        errors.push(`${prefix}: „${field}” musi być liczbą z zakresu ${min}–${max}.`);
                    }
                }
            });
        }

        if (errors.length) return { valid: false, errors, config: null };

        const safeConfig = {
            batchSize: config.batchSize,
            shiftMinutes: config.shiftMinutes,
            hourlyCost: config.hourlyCost,
            stations: config.stations.map((station, index) => ({
                id: station.id ?? index + 1,
                name: station.name.trim(),
                cycleTimeSec: station.cycleTimeSec,
                setupTimeMin: station.setupTimeMin
            }))
        };
        return { valid: true, errors: [], config: safeConfig };
    }

    function calculateMetrics(config) {
        const validation = validateConfig(config);
        if (!validation.valid) {
            throw new TypeError(validation.errors.join(" "));
        }
        const safeConfig = validation.config;
        const stations = safeConfig.stations.map((station) => {
            const processingMin = (station.cycleTimeSec * safeConfig.batchSize) / 60;
            return { ...station, processingMin, totalMin: processingMin + station.setupTimeMin };
        });

        let bottleneckIndex = 0;
        stations.forEach((station, index) => {
            if (station.totalMin > stations[bottleneckIndex].totalMin) bottleneckIndex = index;
        });
        const bottleneck = stations[bottleneckIndex];
        const otherCyclesMin = stations.reduce((total, station, index) =>
            total + (index === bottleneckIndex ? 0 : station.cycleTimeSec / 60), 0);
        // Deterministic, simplified pipeline estimate: bottleneck run time plus line fill time.
        const leadTimeMin = safeConfig.batchSize * (bottleneck.cycleTimeSec / 60)
            + otherCyclesMin + bottleneck.setupTimeMin;
        const totalSetupMin = stations.reduce((total, station) => total + station.setupTimeMin, 0);
        const totalWorkloadMin = stations.reduce((total, station) => total + station.totalMin, 0);
        const setupSharePercent = totalWorkloadMin === 0 ? 0 : (totalSetupMin / totalWorkloadMin) * 100;
        const setupCost = (totalSetupMin / 60) * safeConfig.hourlyCost;
        // Shift capacity assumes one setup at the bottleneck during the shift.
        const productiveShiftMin = Math.max(0, safeConfig.shiftMinutes - bottleneck.setupTimeMin);
        const unitsPerShift = Math.floor((productiveShiftMin * 60) / bottleneck.cycleTimeSec);
        const throughputPerHour = 3600 / bottleneck.cycleTimeSec;

        let wipUnits = 0;
        if (bottleneckIndex > 0) {
            const previous = stations[bottleneckIndex - 1];
            if (previous.cycleTimeSec < bottleneck.cycleTimeSec) {
                wipUnits = Math.floor(
                    ((bottleneck.cycleTimeSec - previous.cycleTimeSec) * safeConfig.batchSize)
                    / bottleneck.cycleTimeSec
                );
            }
        }

        return {
            config: safeConfig,
            stations,
            bottleneckIndex,
            bottleneck,
            leadTimeMin,
            throughputPerHour,
            totalSetupMin,
            setupSharePercent,
            setupCost,
            unitsPerShift,
            wipUnits
        };
    }

    return { LIMITS, validateConfig, calculateMetrics };
});
