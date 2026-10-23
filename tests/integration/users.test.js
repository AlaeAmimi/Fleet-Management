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

jest.mock("../../src/models/User", () => ({
    findOne: jest.fn(),
    create: jest.fn(),
}));

// Skip the real (slow) password hashing
jest.mock("bcryptjs", () => ({
    hash: jest.fn().mockResolvedValue("hashed-password"),
    compare: jest.fn(),
}));

const request = require("supertest");
const jwt = require("jsonwebtoken");
const app = require("../../src/app");
const User = require("../../src/models/User");

const adminToken = jwt.sign({ id: "u1", role: "admin" }, "test-secret");
const chauffeurToken = jwt.sign({ id: "u2", role: "chauffeur" }, "test-secret");

const validChauffeur = {
    firstName: "Ahmed",
    lastName: "Bennani",
    email: "ahmed@fleet.com",
    password: "Chauffeur123",
};

beforeEach(() => {
    jest.clearAllMocks();
});

describe("POST /api/v1/users/chauffeurs", () => {
    test("refuse sans token (401)", async () => {
        const res = await request(app).post("/api/v1/users/chauffeurs").send(validChauffeur);

        expect(res.status).toBe(401);
    });

    test("refuse un chauffeur (403)", async () => {
        const res = await request(app)
            .post("/api/v1/users/chauffeurs")
            .set("Authorization", `Bearer ${chauffeurToken}`)
            .send(validChauffeur);

        expect(res.status).toBe(403);
    });

    test("refuse un mot de passe trop court (400)", async () => {
        const res = await request(app)
            .post("/api/v1/users/chauffeurs")
            .set("Authorization", `Bearer ${adminToken}`)
            .send({ ...validChauffeur, password: "short" });

        expect(res.status).toBe(400);
        expect(User.create).not.toHaveBeenCalled();
    });

    test("refuse un email déjà utilisé (409)", async () => {
        User.findOne.mockResolvedValue({ _id: "u9" });

        const res = await request(app)
            .post("/api/v1/users/chauffeurs")
            .set("Authorization", `Bearer ${adminToken}`)
            .send(validChauffeur);

        expect(res.status).toBe(409);
    });

    test("crée un chauffeur avec le mot de passe haché (201)", async () => {
        User.findOne.mockResolvedValue(null);
        User.create.mockResolvedValue({ _id: "u3", email: "ahmed@fleet.com", role: "chauffeur" });

        const res = await request(app)
            .post("/api/v1/users/chauffeurs")
            .set("Authorization", `Bearer ${adminToken}`)
            .send(validChauffeur);

        expect(res.status).toBe(201);
        expect(res.body.user.role).toBe("chauffeur");
        expect(User.create).toHaveBeenCalledWith(
            expect.objectContaining({ role: "chauffeur", password: "hashed-password" })
        );
    });
});