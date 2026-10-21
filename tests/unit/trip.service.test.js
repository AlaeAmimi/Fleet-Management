const { calculateDistance, calculateConsumption, assertValidTransition } = require("../../src/services/trip.service");

describe("calculateDistance", () => {
    test("retourne arrivée - départ", () => {
        expect(calculateDistance(100, 250)).toBe(150);
    });

    test("rejette arrivée <= départ", () => {
        expect(() => calculateDistance(100, 100)).toThrow("strictement supérieur");
    });
});
describe("calculateConsumption", () => {
    test("calcule la consommation en litres pour 100 km", () => {
        expect(calculateConsumption(60, 200)).toBe(30);
    });
});
describe("assertValidTransition", () => {
    test("accepte todo vers in_progress", () => {
        expect(() => assertValidTransition("todo", "in_progress")).not.toThrow();
    });

    test("accepte in_progress vers done", () => {
        expect(() => assertValidTransition("in_progress", "done")).not.toThrow();
    });

    test("refuse de sauter une étape", () => {
        expect(() => assertValidTransition("todo", "done")).toThrow("Transition invalide");
    });

    test("refuse de revenir en arrière", () => {
        expect(() => assertValidTransition("in_progress", "todo")).toThrow("Transition invalide");
    });

    test("refuse toute transition depuis done", () => {
        expect(() => assertValidTransition("done", "in_progress")).toThrow("Transition invalide");
    });
});