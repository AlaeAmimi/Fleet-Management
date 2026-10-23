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

jest.mock("../../src/models/Trip", () => ({ aggregate: jest.fn() }));
jest.mock("../../src/models/Tire", () => ({ aggregate: jest.fn() }));

const request = require("supertest");
const jwt = require("jsonwebtoken");
const app = require("../../src/app");
const Trip = require("../../src/models/Trip");
const Tire = require("../../src/models/Tire");

const adminToken = jwt.sign({ id: "u1", role: "admin" }, "test-secret");
const chauffeurToken = jwt.sign({ id: "u2", role: "chauffeur" }, "test-secret");

beforeEach(() => {
    jest.resetAllMocks();
});

describe("GET /api/v2/analytics/drivers/eco-performance", () => {
    test("refuse sans token (401)", async () => {
        const res = await request(app).get("/api/v2/analytics/drivers/eco-performance");
        expect(res.status).toBe(401);
    });

    test("refuse un chauffeur (403)", async () => {
        const res = await request(app)
            .get("/api/v2/analytics/drivers/eco-performance")
            .set("Authorization", `Bearer ${chauffeurToken}`);
        expect(res.status).toBe(403);
    });

    test("retourne le classement des chauffeurs (200)", async () => {
        Trip.aggregate.mockResolvedValue([
            { firstName: "Ahmed", lastName: "Bennani", avgConsumption: 25, ecoScore: 100 },
        ]);

        const res = await request(app)
            .get("/api/v2/analytics/drivers/eco-performance")
            .set("Authorization", `Bearer ${adminToken}`);

        expect(res.status).toBe(200);
        expect(res.body.count).toBe(1);
        expect(res.body.data[0]).toHaveProperty("ecoScore", 100);
    });

    test("le pipeline commence par le filtre des trajets terminés", async () => {
        Trip.aggregate.mockResolvedValue([]);

        await request(app)
            .get("/api/v2/analytics/drivers/eco-performance")
            .set("Authorization", `Bearer ${adminToken}`);

        const pipeline = Trip.aggregate.mock.calls[0][0];
        expect(pipeline[0].$match.status).toBe("done");
        expect(pipeline.some((stage) => stage.$group)).toBe(true);
        expect(pipeline.some((stage) => stage.$lookup)).toBe(true);
    });
});

describe("GET /api/v2/analytics/tires/health-matrix", () => {
    test("refuse un chauffeur (403)", async () => {
        const res = await request(app)
            .get("/api/v2/analytics/tires/health-matrix")
            .set("Authorization", `Bearer ${chauffeurToken}`);
        expect(res.status).toBe(403);
    });

    test("retourne la matrice par position (200)", async () => {
        Tire.aggregate.mockResolvedValue([
            { _id: "front-left", tiresCount: 3, avgKm: 42000, criticalCount: 2, estimatedBudget: 7600 },
        ]);

        const res = await request(app)
            .get("/api/v2/analytics/tires/health-matrix")
            .set("Authorization", `Bearer ${adminToken}`);

        expect(res.status).toBe(200);
        expect(res.body.data[0]).toEqual(
            expect.objectContaining({ _id: "front-left", estimatedBudget: 7600 })
        );
    });
});