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
const app = require("../../src/app");

describe("App", () => {
    test("GET /health répond ok (200)", async () => {
        const res = await request(app).get("/health");

        expect(res.status).toBe(200);
        expect(res.body).toEqual({ status: "ok" });
    });

    test("une route inconnue répond 404", async () => {
        const res = await request(app).get("/api/v1/inconnue");

        expect(res.status).toBe(404);
    });

    test("l'ancienne URL sans version n'existe plus (404)", async () => {
        const res = await request(app).get("/api/trucks");

        expect(res.status).toBe(404);
    });

    test("envoie les en-têtes de gouvernance de version", async () => {
        const res = await request(app).get("/health");

        expect(res.headers["x-api-version"]).toBe("2.0.0");
        expect(res.headers["x-api-deprecated"]).toBe("false");
    });
});