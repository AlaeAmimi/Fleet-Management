process.env.JWT_SECRET = "test-secret";

// No Redis in tests
jest.mock("../../src/middlewares/rateLimit", () => {
    const pass = (req, res, next) => next();
    return {
        authLimiter: pass,
        standardLimiter: pass,
        analyticsLimiter: pass,
        analyticsSlowDown: pass,
    };
});

// No database in tests: the Truck model is a fake
jest.mock("../../src/models/Truck", () => ({
    find: jest.fn(),
    findOne: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
}));

const request = require("supertest");
const jwt = require("jsonwebtoken");
const app = require("../../src/app");
const Truck = require("../../src/models/Truck");

const adminToken = jwt.sign({ id: "u1", role: "admin" }, "test-secret");
const chauffeurToken = jwt.sign({ id: "u2", role: "chauffeur" }, "test-secret");

const validTruck = { plateNumber: "12345-A-6", brand: "Volvo", model: "FH", year: 2022 };

beforeEach(() => {
    jest.resetAllMocks();
});

describe("POST /api/v1/trucks", () => {
    test("refuse sans token (401)", async () => {
        const res = await request(app).post("/api/v1/trucks").send(validTruck);

        expect(res.status).toBe(401);
    });

    test("refuse un chauffeur (403)", async () => {
        const res = await request(app)
            .post("/api/v1/trucks")
            .set("Authorization", `Bearer ${chauffeurToken}`)
            .send(validTruck);

        expect(res.status).toBe(403);
    });

    test("refuse un corps invalide (400)", async () => {
        const res = await request(app)
            .post("/api/v1/trucks")
            .set("Authorization", `Bearer ${adminToken}`)
            .send({});

        expect(res.status).toBe(400);
    });

    test("refuse une plaque en double (409)", async () => {
        Truck.findOne.mockResolvedValue({ _id: "t1" });

        const res = await request(app)
            .post("/api/v1/trucks")
            .set("Authorization", `Bearer ${adminToken}`)
            .send(validTruck);

        expect(res.status).toBe(409);
    });

    test("crée un camion (201)", async () => {
        Truck.findOne.mockResolvedValue(null);
        Truck.create.mockResolvedValue({ _id: "t1", ...validTruck });

        const res = await request(app)
            .post("/api/v1/trucks")
            .set("Authorization", `Bearer ${adminToken}`)
            .send(validTruck);

        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
    });
});
describe("GET /api/v1/trucks", () => {
    test("refuse sans token (401)", async () => {
        const res = await request(app).get("/api/v1/trucks");

        expect(res.status).toBe(401);
    });

    test("liste les camions pour un chauffeur (200)", async () => {
        Truck.find.mockResolvedValue([{ _id: "t1", ...validTruck }]);

        const res = await request(app)
            .get("/api/v1/trucks?status=available")
            .set("Authorization", `Bearer ${chauffeurToken}`);

        expect(res.status).toBe(200);
        expect(res.body.count).toBe(1);
        expect(Truck.find).toHaveBeenCalledWith({ status: "available", archived: false });
    });
});

describe("GET /api/v1/trucks/:id", () => {
    test("retourne le camion (200)", async () => {
        Truck.findById.mockResolvedValue({ _id: "t1", ...validTruck });

        const res = await request(app)
            .get("/api/v1/trucks/t1")
            .set("Authorization", `Bearer ${adminToken}`);

        expect(res.status).toBe(200);
        expect(res.body.truck.plateNumber).toBe("12345-A-6");
    });

    test("répond 404 si le camion n'existe pas", async () => {
        Truck.findById.mockResolvedValue(null);

        const res = await request(app)
            .get("/api/v1/trucks/t1")
            .set("Authorization", `Bearer ${adminToken}`);

        expect(res.status).toBe(404);
    });
});

describe("PUT /api/v1/trucks/:id", () => {
    test("refuse un chauffeur (403)", async () => {
        const res = await request(app)
            .put("/api/v1/trucks/t1")
            .set("Authorization", `Bearer ${chauffeurToken}`)
            .send({ status: "maintenance" });

        expect(res.status).toBe(403);
    });

    test("refuse un statut invalide (400)", async () => {
        const res = await request(app)
            .put("/api/v1/trucks/t1")
            .set("Authorization", `Bearer ${adminToken}`)
            .send({ status: "inconnu" });

        expect(res.status).toBe(400);
    });

    test("répond 404 si le camion n'existe pas", async () => {
        Truck.findById.mockResolvedValue(null);

        const res = await request(app)
            .put("/api/v1/trucks/t1")
            .set("Authorization", `Bearer ${adminToken}`)
            .send({ status: "maintenance" });

        expect(res.status).toBe(404);
    });

    test("met le camion en maintenance (200)", async () => {
        const truck = { _id: "t1", status: "available", save: jest.fn().mockResolvedValue() };
        Truck.findById.mockResolvedValue(truck);

        const res = await request(app)
            .put("/api/v1/trucks/t1")
            .set("Authorization", `Bearer ${adminToken}`)
            .send({ status: "maintenance" });

        expect(res.status).toBe(200);
        expect(truck.status).toBe("maintenance");
        expect(truck.save).toHaveBeenCalledTimes(1);
    });
});

describe("PATCH /api/v1/trucks/:id/archive", () => {
    test("refuse un chauffeur (403)", async () => {
        const res = await request(app)
            .patch("/api/v1/trucks/t1/archive")
            .set("Authorization", `Bearer ${chauffeurToken}`);

        expect(res.status).toBe(403);
    });

    test("répond 404 si le camion n'existe pas", async () => {
        Truck.findById.mockResolvedValue(null);

        const res = await request(app)
            .patch("/api/v1/trucks/t1/archive")
            .set("Authorization", `Bearer ${adminToken}`);

        expect(res.status).toBe(404);
    });

    test("archive le camion (200)", async () => {
        const truck = { _id: "t1", archived: false, save: jest.fn().mockResolvedValue() };
        Truck.findById.mockResolvedValue(truck);

        const res = await request(app)
            .patch("/api/v1/trucks/t1/archive")
            .set("Authorization", `Bearer ${adminToken}`);

        expect(res.status).toBe(200);
        expect(truck.archived).toBe(true);
    });
});