process.env.JWT_SECRET = "test-secret";

jest.mock("../../src/middlewares/rateLimit", () => {
    const pass = (req, res, next) => next();
    return {
        authLimiter: pass,
        standardLimiter: pass,
        analyticsLimiter: pass,
        analyticsSlowDown: pass,
    };
});

jest.mock("../../src/models/MaintenanceRule", () => ({
    findOneAndUpdate: jest.fn(),
    find: jest.fn(),
}));
jest.mock("../../src/models/Alert", () => ({
    find: jest.fn(),
    findById: jest.fn(),
}));
jest.mock("../../src/models/Truck", () => ({
    findById: jest.fn(),
}));

const request = require("supertest");
const jwt = require("jsonwebtoken");
const app = require("../../src/app");
const MaintenanceRule = require("../../src/models/MaintenanceRule");
const Alert = require("../../src/models/Alert");
const Truck = require("../../src/models/Truck");

const adminToken = jwt.sign({ id: "u1", role: "admin" }, "test-secret");
const chauffeurToken = jwt.sign({ id: "u2", role: "chauffeur" }, "test-secret");

beforeEach(() => {
    jest.resetAllMocks();
});

describe("POST /api/v1/maintenance/rules", () => {
    const setRule = (body, token = adminToken) =>
        request(app)
            .post("/api/v1/maintenance/rules")
            .set("Authorization", `Bearer ${token}`)
            .send(body);

    test("refuse un chauffeur (403)", async () => {
        const res = await setRule({ type: "oil_change", thresholdKm: 10000 }, chauffeurToken);
        expect(res.status).toBe(403);
    });

    test("refuse un type inconnu (400)", async () => {
        const res = await setRule({ type: "lavage", thresholdKm: 10000 });
        expect(res.status).toBe(400);
    });

    test("refuse un seuil manquant (400)", async () => {
        const res = await setRule({ type: "oil_change" });
        expect(res.status).toBe(400);
    });

    test("crée ou met à jour une règle (200)", async () => {
        MaintenanceRule.findOneAndUpdate.mockResolvedValue({ type: "oil_change", thresholdKm: 10000 });

        const res = await setRule({ type: "oil_change", thresholdKm: 10000 });

        expect(res.status).toBe(200);
        expect(MaintenanceRule.findOneAndUpdate).toHaveBeenCalledWith(
            { type: "oil_change" },
            { thresholdKm: 10000 },
            { new: true, upsert: true }
        );
    });
});

describe("GET /api/v1/maintenance/rules", () => {
    test("liste les règles pour un utilisateur connecté (200)", async () => {
        MaintenanceRule.find.mockResolvedValue([{ type: "oil_change", thresholdKm: 10000 }]);

        const res = await request(app)
            .get("/api/v1/maintenance/rules")
            .set("Authorization", `Bearer ${chauffeurToken}`);

        expect(res.status).toBe(200);
        expect(res.body.rules).toHaveLength(1);
    });
});

describe("GET /api/v1/maintenance/alerts", () => {
    test("refuse un chauffeur (403)", async () => {
        const res = await request(app)
            .get("/api/v1/maintenance/alerts")
            .set("Authorization", `Bearer ${chauffeurToken}`);
        expect(res.status).toBe(403);
    });

    test("liste uniquement les alertes ouvertes avec ?handled=false (200)", async () => {
        Alert.find.mockReturnValue({ populate: jest.fn().mockResolvedValue([{ _id: "a1" }]) });

        const res = await request(app)
            .get("/api/v1/maintenance/alerts?handled=false")
            .set("Authorization", `Bearer ${adminToken}`);

        expect(res.status).toBe(200);
        expect(res.body.count).toBe(1);
        expect(Alert.find).toHaveBeenCalledWith({ handled: false });
    });

    test("liste toutes les alertes sans filtre (200)", async () => {
        Alert.find.mockReturnValue({ populate: jest.fn().mockResolvedValue([]) });

        await request(app)
            .get("/api/v1/maintenance/alerts")
            .set("Authorization", `Bearer ${adminToken}`);

        expect(Alert.find).toHaveBeenCalledWith({});
    });
});

describe("PATCH /api/v1/maintenance/alerts/:id/resolve", () => {
    const resolve = (token = adminToken) =>
        request(app)
            .patch("/api/v1/maintenance/alerts/a1/resolve")
            .set("Authorization", `Bearer ${token}`);

    test("refuse un chauffeur (403)", async () => {
        const res = await resolve(chauffeurToken);
        expect(res.status).toBe(403);
    });

    test("répond 404 si l'alerte n'existe pas", async () => {
        Alert.findById.mockResolvedValue(null);
        const res = await resolve();
        expect(res.status).toBe(404);
    });

    test("refuse une alerte déjà traitée (400)", async () => {
        Alert.findById.mockResolvedValue({ _id: "a1", handled: true });
        const res = await resolve();
        expect(res.status).toBe(400);
    });

    test("remet à zéro le compteur de vidange et clôt l'alerte (200)", async () => {
        const alert = {
            _id: "a1", vehicleModel: "Truck", vehicle: "truck1", type: "oil_change",
            handled: false, save: jest.fn().mockResolvedValue(),
        };
        const truck = { _id: "truck1", totalKm: 10500, lastOilChangeKm: 0, save: jest.fn().mockResolvedValue() };
        Alert.findById.mockResolvedValue(alert);
        Truck.findById.mockResolvedValue(truck);

        const res = await resolve();

        expect(res.status).toBe(200);
        expect(truck.lastOilChangeKm).toBe(10500);
        expect(alert.handled).toBe(true);
    });

    test("remet à zéro le compteur de révision (200)", async () => {
        const alert = {
            _id: "a1", vehicleModel: "Truck", vehicle: "truck1", type: "inspection",
            handled: false, save: jest.fn().mockResolvedValue(),
        };
        const truck = { _id: "truck1", totalKm: 25000, lastInspectionKm: 0, save: jest.fn().mockResolvedValue() };
        Alert.findById.mockResolvedValue(alert);
        Truck.findById.mockResolvedValue(truck);

        await resolve();

        expect(truck.lastInspectionKm).toBe(25000);
    });
});