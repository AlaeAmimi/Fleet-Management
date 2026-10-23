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

jest.mock("../../src/models/Tire", () => ({
    find: jest.fn(),
    findOne: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
}));

jest.mock("../../src/models/Truck", () => ({
    findById: jest.fn(),
}));

// The alert logic has its own unit tests: no database needed here
jest.mock("../../src/services/maintenance.service", () => ({
    checkTruckMaintenance: jest.fn(),
    checkTireMaintenance: jest.fn(),
    hasUnhandledAlert: jest.fn(),
}));

const request = require("supertest");
const jwt = require("jsonwebtoken");
const app = require("../../src/app");
const Tire = require("../../src/models/Tire");
const Truck = require("../../src/models/Truck");

const adminToken = jwt.sign({ id: "u1", role: "admin" }, "test-secret");
const chauffeurToken = jwt.sign({ id: "u2", role: "chauffeur" }, "test-secret");

const validTire = { serialNumber: "TIRE-001", brand: "Michelin", position: "front-left", treadDepthMm: 9 };
const truckId = "6acdfdb1257886610ec802aa"; // 24 hex characters, as the Joi schema expects

beforeEach(() => {
    jest.resetAllMocks();
});

describe("POST /api/v1/tires", () => {
    test("refuse sans token (401)", async () => {
        const res = await request(app).post("/api/v1/tires").send(validTire);
        expect(res.status).toBe(401);
    });

    test("refuse un chauffeur (403)", async () => {
        const res = await request(app)
            .post("/api/v1/tires")
            .set("Authorization", `Bearer ${chauffeurToken}`)
            .send(validTire);
        expect(res.status).toBe(403);
    });

    test("refuse un corps invalide (400)", async () => {
        const res = await request(app)
            .post("/api/v1/tires")
            .set("Authorization", `Bearer ${adminToken}`)
            .send({});
        expect(res.status).toBe(400);
        expect(Tire.create).not.toHaveBeenCalled();
    });

    test("refuse un numéro de série en double (409)", async () => {
        Tire.findOne.mockResolvedValue({ _id: "p1" });

        const res = await request(app)
            .post("/api/v1/tires")
            .set("Authorization", `Bearer ${adminToken}`)
            .send(validTire);
        expect(res.status).toBe(409);
    });

    test("crée un pneu (201)", async () => {
        Tire.findOne.mockResolvedValue(null);
        Tire.create.mockResolvedValue({ _id: "p1", ...validTire });

        const res = await request(app)
            .post("/api/v1/tires")
            .set("Authorization", `Bearer ${adminToken}`)
            .send(validTire);

        expect(res.status).toBe(201);
        expect(Tire.create).toHaveBeenCalledWith(
            expect.objectContaining({ serialNumber: "TIRE-001", treadDepthMm: 9 })
        );
    });
});

describe("GET /api/v1/tires", () => {
    test("liste les pneus avec les filtres de la requête (200)", async () => {
        Tire.find.mockReturnValue({ populate: jest.fn().mockResolvedValue([{ _id: "p1" }]) });

        const res = await request(app)
            .get("/api/v1/tires?state=worn&truck=abc")
            .set("Authorization", `Bearer ${chauffeurToken}`);

        expect(res.status).toBe(200);
        expect(res.body.count).toBe(1);
        expect(Tire.find).toHaveBeenCalledWith({ state: "worn", truck: "abc" });
    });

    test("retourne un pneu par id (200)", async () => {
        Tire.findById.mockReturnValue({ populate: jest.fn().mockResolvedValue({ _id: "p1", ...validTire }) });

        const res = await request(app)
            .get("/api/v1/tires/p1")
            .set("Authorization", `Bearer ${adminToken}`);
        expect(res.status).toBe(200);
    });

    test("répond 404 si le pneu n'existe pas", async () => {
        Tire.findById.mockReturnValue({ populate: jest.fn().mockResolvedValue(null) });

        const res = await request(app)
            .get("/api/v1/tires/p1")
            .set("Authorization", `Bearer ${adminToken}`);
        expect(res.status).toBe(404);
    });
});

describe("PUT /api/v1/tires/:id", () => {
    test("refuse un chauffeur (403)", async () => {
        const res = await request(app)
            .put("/api/v1/tires/p1")
            .set("Authorization", `Bearer ${chauffeurToken}`)
            .send({ wearKm: 100 });
        expect(res.status).toBe(403);
    });

    test("refuse un état invalide (400)", async () => {
        const res = await request(app)
            .put("/api/v1/tires/p1")
            .set("Authorization", `Bearer ${adminToken}`)
            .send({ state: "inconnu" });
        expect(res.status).toBe(400);
    });

    test("refuse un corps vide (400)", async () => {
        const res = await request(app)
            .put("/api/v1/tires/p1")
            .set("Authorization", `Bearer ${adminToken}`)
            .send({});
        expect(res.status).toBe(400);
    });

    test("répond 404 si le pneu n'existe pas", async () => {
        Tire.findById.mockResolvedValue(null);

        const res = await request(app)
            .put("/api/v1/tires/p1")
            .set("Authorization", `Bearer ${adminToken}`)
            .send({ wearKm: 100 });
        expect(res.status).toBe(404);
    });

    test("met à jour le pneu, y compris une valeur 0 (200)", async () => {
        const tire = { _id: "p1", wearKm: 500, treadDepthMm: 8, save: jest.fn().mockResolvedValue() };
        Tire.findById.mockResolvedValue(tire);

        const res = await request(app)
            .put("/api/v1/tires/p1")
            .set("Authorization", `Bearer ${adminToken}`)
            .send({ wearKm: 0, treadDepthMm: 5 });

        expect(res.status).toBe(200);
        expect(tire.wearKm).toBe(0); // 0 is a valid value and must not be skipped
        expect(tire.treadDepthMm).toBe(5);
        expect(tire.save).toHaveBeenCalledTimes(1);
    });
});

describe("PATCH /api/v1/tires/:id/assign", () => {
    test("refuse un truckId invalide (400)", async () => {
        const res = await request(app)
            .patch("/api/v1/tires/p1/assign")
            .set("Authorization", `Bearer ${adminToken}`)
            .send({ truckId: "pas-un-id" });
        expect(res.status).toBe(400);
    });

    test("répond 404 si le pneu n'existe pas", async () => {
        Tire.findById.mockResolvedValue(null);

        const res = await request(app)
            .patch("/api/v1/tires/p1/assign")
            .set("Authorization", `Bearer ${adminToken}`)
            .send({ truckId });
        expect(res.status).toBe(404);
    });

    test("répond 404 si le camion n'existe pas", async () => {
        Tire.findById.mockResolvedValue({ _id: "p1", save: jest.fn() });
        Truck.findById.mockResolvedValue(null);

        const res = await request(app)
            .patch("/api/v1/tires/p1/assign")
            .set("Authorization", `Bearer ${adminToken}`)
            .send({ truckId });
        expect(res.status).toBe(404);
    });

    test("associe le pneu au camion (200)", async () => {
        const tire = { _id: "p1", truck: null, save: jest.fn().mockResolvedValue() };
        Tire.findById.mockResolvedValue(tire);
        Truck.findById.mockResolvedValue({ _id: truckId });

        const res = await request(app)
            .patch("/api/v1/tires/p1/assign")
            .set("Authorization", `Bearer ${adminToken}`)
            .send({ truckId });

        expect(res.status).toBe(200);
        expect(tire.truck).toBe(truckId);
        expect(tire.save).toHaveBeenCalledTimes(1);
    });
});