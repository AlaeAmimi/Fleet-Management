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

jest.mock("../../src/models/Trailer", () => ({
    find: jest.fn(),
    findOne: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
}));

const request = require("supertest");
const jwt = require("jsonwebtoken");
const app = require("../../src/app");
const Trailer = require("../../src/models/Trailer");

const adminToken = jwt.sign({ id: "u1", role: "admin" }, "test-secret");
const chauffeurToken = jwt.sign({ id: "u2", role: "chauffeur" }, "test-secret");

const validTrailer = { plateNumber: "REM-001", type: "flatbed" };

beforeEach(() => {
    jest.resetAllMocks();
});

describe("POST /api/v1/trailers", () => {
    test("refuse sans token (401)", async () => {
        const res = await request(app).post("/api/v1/trailers").send(validTrailer);
        expect(res.status).toBe(401);
    });

    test("refuse un chauffeur (403)", async () => {
        const res = await request(app)
            .post("/api/v1/trailers")
            .set("Authorization", `Bearer ${chauffeurToken}`)
            .send(validTrailer);
        expect(res.status).toBe(403);
    });

    test("refuse un corps invalide (400)", async () => {
        const res = await request(app)
            .post("/api/v1/trailers")
            .set("Authorization", `Bearer ${adminToken}`)
            .send({});
        expect(res.status).toBe(400);
    });

    test("refuse une plaque en double (409)", async () => {
        Trailer.findOne.mockResolvedValue({ _id: "r1" });

        const res = await request(app)
            .post("/api/v1/trailers")
            .set("Authorization", `Bearer ${adminToken}`)
            .send(validTrailer);
        expect(res.status).toBe(409);
    });

    test("crée une remorque (201)", async () => {
        Trailer.findOne.mockResolvedValue(null);
        Trailer.create.mockResolvedValue({ _id: "r1", ...validTrailer });

        const res = await request(app)
            .post("/api/v1/trailers")
            .set("Authorization", `Bearer ${adminToken}`)
            .send(validTrailer);
        expect(res.status).toBe(201);
    });
});

describe("GET /api/v1/trailers", () => {
    test("liste les remorques (200)", async () => {
        Trailer.find.mockResolvedValue([{ _id: "r1", ...validTrailer }]);

        const res = await request(app)
            .get("/api/v1/trailers?status=available")
            .set("Authorization", `Bearer ${chauffeurToken}`);

        expect(res.status).toBe(200);
        expect(res.body.count).toBe(1);
        expect(Trailer.find).toHaveBeenCalledWith({ status: "available", archived: false });
    });

    test("retourne une remorque par id (200)", async () => {
        Trailer.findById.mockResolvedValue({ _id: "r1", ...validTrailer });

        const res = await request(app)
            .get("/api/v1/trailers/r1")
            .set("Authorization", `Bearer ${adminToken}`);
        expect(res.status).toBe(200);
    });

    test("répond 404 si la remorque n'existe pas", async () => {
        Trailer.findById.mockResolvedValue(null);

        const res = await request(app)
            .get("/api/v1/trailers/r1")
            .set("Authorization", `Bearer ${adminToken}`);
        expect(res.status).toBe(404);
    });
});

describe("PUT /api/v1/trailers/:id", () => {
    test("refuse un chauffeur (403)", async () => {
        const res = await request(app)
            .put("/api/v1/trailers/r1")
            .set("Authorization", `Bearer ${chauffeurToken}`)
            .send({ status: "maintenance" });
        expect(res.status).toBe(403);
    });

    test("refuse un statut invalide (400)", async () => {
        const res = await request(app)
            .put("/api/v1/trailers/r1")
            .set("Authorization", `Bearer ${adminToken}`)
            .send({ status: "inconnu" });
        expect(res.status).toBe(400);
    });

    test("répond 404 si la remorque n'existe pas", async () => {
        Trailer.findById.mockResolvedValue(null);

        const res = await request(app)
            .put("/api/v1/trailers/r1")
            .set("Authorization", `Bearer ${adminToken}`)
            .send({ status: "maintenance" });
        expect(res.status).toBe(404);
    });

    test("met la remorque en maintenance (200)", async () => {
        const trailer = { _id: "r1", status: "available", save: jest.fn().mockResolvedValue() };
        Trailer.findById.mockResolvedValue(trailer);

        const res = await request(app)
            .put("/api/v1/trailers/r1")
            .set("Authorization", `Bearer ${adminToken}`)
            .send({ status: "maintenance" });

        expect(res.status).toBe(200);
        expect(trailer.status).toBe("maintenance");
        expect(trailer.save).toHaveBeenCalledTimes(1);
    });
});

describe("PATCH /api/v1/trailers/:id/archive", () => {
    test("répond 404 si la remorque n'existe pas", async () => {
        Trailer.findById.mockResolvedValue(null);

        const res = await request(app)
            .patch("/api/v1/trailers/r1/archive")
            .set("Authorization", `Bearer ${adminToken}`);
        expect(res.status).toBe(404);
    });

    test("archive la remorque (200)", async () => {
        const trailer = { _id: "r1", archived: false, save: jest.fn().mockResolvedValue() };
        Trailer.findById.mockResolvedValue(trailer);

        const res = await request(app)
            .patch("/api/v1/trailers/r1/archive")
            .set("Authorization", `Bearer ${adminToken}`);

        expect(res.status).toBe(200);
        expect(trailer.archived).toBe(true);
    });
});