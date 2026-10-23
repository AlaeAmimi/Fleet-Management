const errorHandler = require("../../src/middlewares/errorHandler");

function mockRes() {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
}

function run(err) {
    const res = mockRes();
    errorHandler(err, {}, res, jest.fn());
    return res;
}

describe("errorHandler", () => {
    test("utilise le statusCode porté par l'erreur", () => {
        const err = Object.assign(new Error("Introuvable"), { statusCode: 404 });

        const res = run(err);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ status: "error", message: "Introuvable" });
    });

    test("convertit un doublon MongoDB en 409", () => {
        const err = Object.assign(new Error("E11000"), { code: 11000, keyValue: { email: "a@b.com" } });

        const res = run(err);

        expect(res.status).toHaveBeenCalledWith(409);
        expect(res.json.mock.calls[0][0].message).toContain("email");
    });

    test("convertit une erreur de validation Mongoose en 400", () => {
        const err = Object.assign(new Error("invalid"), {
            name: "ValidationError",
            errors: { a: { message: "a requis" }, b: { message: "b invalide" } },
        });

        const res = run(err);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json.mock.calls[0][0].message).toBe("a requis, b invalide");
    });

    test("convertit un JWT invalide en 401", () => {
        const err = Object.assign(new Error("bad"), { name: "JsonWebTokenError" });

        const res = run(err);

        expect(res.status).toHaveBeenCalledWith(401);
    });

    test("convertit un JWT expiré en 401", () => {
        const err = Object.assign(new Error("old"), { name: "TokenExpiredError" });

        const res = run(err);

        expect(res.status).toHaveBeenCalledWith(401);
    });

    test("répond 500 par défaut, avec un message générique, et journalise", () => {
        const spy = jest.spyOn(console, "error").mockImplementation(() => {});

        const res = run(new Error());

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json.mock.calls[0][0].message).toBe("Internal server error");
        expect(spy).toHaveBeenCalledTimes(1);
        spy.mockRestore();
    });
});