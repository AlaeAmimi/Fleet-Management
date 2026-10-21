jest.mock("../../src/models/Alert");
jest.mock("../../src/models/MaintenanceRule");

const Alert = require("../../src/models/Alert");
const MaintenanceRule = require("../../src/models/MaintenanceRule");
const {
    checkTireMaintenance,
    checkTruckMaintenance,
    hasUnhandledAlert,
} = require("../../src/services/maintenance.service");

describe("checkTireMaintenance", () => {
    beforeEach(() => {
        jest.resetAllMocks();
        Alert.findOne.mockResolvedValue(null); // no open alert yet
    });

    test("ne fait rien si le pneu n'est pas lié à un camion", async () => {
        const tire = { truck: null, wearKm: 99999, wearThresholdKm: 100, serialNumber: "SN-001" };

        await checkTireMaintenance(tire);

        expect(Alert.create).not.toHaveBeenCalled();
    });

    test("ne fait rien si l'usure est inférieure au seuil", async () => {
        const tire = { truck: "truck123", wearKm: 50, wearThresholdKm: 100, serialNumber: "SN-002" };

        await checkTireMaintenance(tire);

        expect(Alert.create).not.toHaveBeenCalled();
    });

    test("déclenche l'alerte quand usure === seuil (limite)", async () => {
        const tire = { truck: "truck123", wearKm: 100, wearThresholdKm: 100, serialNumber: "SN-003" };

        await checkTireMaintenance(tire);

        expect(Alert.create).toHaveBeenCalledTimes(1);
    });

    test("crée l'alerte avec la bonne raison", async () => {
        const tire = { truck: "truck123", wearKm: 150, wearThresholdKm: 100, serialNumber: "SN-004" };

        await checkTireMaintenance(tire);

        expect(Alert.create).toHaveBeenCalledWith(
            expect.objectContaining({
                vehicle: "truck123",
                reason: "Pneu à remplacer (série SN-004)",
            })
        );
    });

    test("ne crée pas de doublon si une alerte ouverte existe déjà", async () => {
        Alert.findOne.mockResolvedValue({ _id: "a1" });
        const tire = { truck: "truck123", wearKm: 150, wearThresholdKm: 100, serialNumber: "SN-005" };

        await checkTireMaintenance(tire);

        expect(Alert.create).not.toHaveBeenCalled();
    });
});

// Pretend the database holds these rules, e.g. { oil_change: 10000 }
function setRules(rules) {
    MaintenanceRule.findOne.mockImplementation(async ({ type }) =>
        rules[type] ? { type, thresholdKm: rules[type] } : null
    );
}

describe("checkTruckMaintenance", () => {
    beforeEach(() => {
        jest.resetAllMocks();
        Alert.findOne.mockResolvedValue(null);
    });

    test("crée une alerte de vidange quand le seuil est atteint", async () => {
        setRules({ oil_change: 10000 });
        const truck = { _id: "truck1", totalKm: 10500, lastOilChangeKm: 0, lastInspectionKm: 0 };

        await checkTruckMaintenance(truck);

        expect(Alert.create).toHaveBeenCalledTimes(1);
        expect(Alert.create).toHaveBeenCalledWith(
            expect.objectContaining({ vehicle: "truck1", reason: "Vidange requise" })
        );
    });

    test("ne crée rien sous le seuil", async () => {
        setRules({ oil_change: 10000 });
        const truck = { _id: "truck1", totalKm: 5000, lastOilChangeKm: 0, lastInspectionKm: 0 };

        await checkTruckMaintenance(truck);

        expect(Alert.create).not.toHaveBeenCalled();
    });

    test("déclenche pile au seuil (limite)", async () => {
        setRules({ oil_change: 10000 });
        const truck = { _id: "truck1", totalKm: 10000, lastOilChangeKm: 0, lastInspectionKm: 0 };

        await checkTruckMaintenance(truck);

        expect(Alert.create).toHaveBeenCalledTimes(1);
    });

    test("crée une alerte de révision quand le seuil est atteint", async () => {
        setRules({ inspection: 20000 });
        const truck = { _id: "truck1", totalKm: 25000, lastOilChangeKm: 0, lastInspectionKm: 0 };

        await checkTruckMaintenance(truck);

        expect(Alert.create).toHaveBeenCalledWith(
            expect.objectContaining({ reason: "Révision requise" })
        );
    });

    test("compte les km depuis le dernier entretien", async () => {
        setRules({ oil_change: 10000 });
        const truck = { _id: "truck1", totalKm: 10500, lastOilChangeKm: 9000, lastInspectionKm: 0 };

        await checkTruckMaintenance(truck);

        expect(Alert.create).not.toHaveBeenCalled(); // only 1500 km since the oil change
    });

    test("ne fait rien quand aucune règle n'est configurée", async () => {
        setRules({});
        const truck = { _id: "truck1", totalKm: 999999, lastOilChangeKm: 0, lastInspectionKm: 0 };

        await checkTruckMaintenance(truck);

        expect(Alert.create).not.toHaveBeenCalled();
    });
});

describe("hasUnhandledAlert", () => {
    beforeEach(() => {
        jest.resetAllMocks();
    });

    test("retourne true quand une alerte ouverte existe", async () => {
        Alert.findOne.mockResolvedValue({ _id: "a1" });

        expect(await hasUnhandledAlert("Truck", "truck1")).toBe(true);
    });

    test("retourne false quand il n'y en a pas", async () => {
        Alert.findOne.mockResolvedValue(null);

        expect(await hasUnhandledAlert("Truck", "truck1")).toBe(false);
    });
});