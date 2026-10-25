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

const request = require("supertest");
const jwt = require("jsonwebtoken");
const app = require("../../src/app");

// Any protected route works: the token is rejected before the controller runs
const getTrucks = (authorization) => {
    const req = request(app).get("/api/v1/trucks");
    return authorization ? req.set("Authorization", authorization) : req;
};

describe("authenticateToken", () => {
    test("refuse un header qui n'est pas Bearer (401)", async () => {
        const res = await getTrucks("Basic abc");
        expect(res.status).toBe(401);
    });

    test("refuse un header Bearer sans token (401)", async () => {
        const res = await getTrucks("Bearer");
        expect(res.status).toBe(401);
    });

    test("refuse un token expiré (403)", async () => {
        const token = jwt.sign({ id: "u1", role: "admin" }, "test-secret", { expiresIn: -10 });

        const res = await getTrucks(`Bearer ${token}`);

        expect(res.status).toBe(403);
        expect(res.body.message).toContain("expiré");
    });

    test("refuse une mauvaise signature (403)", async () => {
        const token = jwt.sign({ id: "u1", role: "admin" }, "autre-secret");

        const res = await getTrucks(`Bearer ${token}`);

        expect(res.status).toBe(403);
    });

    test("refuse un token mal formé (403)", async () => {
        const res = await getTrucks("Bearer pas.un.jwt");
        expect(res.status).toBe(403);
    });
});