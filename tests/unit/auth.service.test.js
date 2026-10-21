jest.mock("../../src/models/User");
jest.mock("bcryptjs");
jest.mock("jsonwebtoken");

const User = require("../../src/models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { login } = require("../../src/services/auth.service");

process.env.JWT_SECRET = "test-secret";
process.env.JWT_EXPIRES_IN = "1h";

const activeUser = {
    _id: "u1",
    email: "a@b.com",
    role: "admin",
    password: "hashed",
    suspended: false,
};

beforeEach(() => {
    jest.resetAllMocks();
});

describe("AuthService.login", () => {
    test("rejette un email ou mot de passe manquant (400)", async () => {
        await expect(login(undefined, "pwd")).rejects.toMatchObject({ statusCode: 400 });
        await expect(login("a@b.com", "")).rejects.toMatchObject({ statusCode: 400 });
    });

    test("rejette un email inconnu (401)", async () => {
        User.findOne.mockResolvedValue(null);

        await expect(login("x@y.com", "pwd")).rejects.toMatchObject({ statusCode: 401 });
        expect(bcrypt.compare).not.toHaveBeenCalled();
    });

    test("rejette un mauvais mot de passe (401)", async () => {
        User.findOne.mockResolvedValue(activeUser);
        bcrypt.compare.mockResolvedValue(false);

        await expect(login("a@b.com", "wrong")).rejects.toMatchObject({ statusCode: 401 });
    });

    test("rejette un compte suspendu (403)", async () => {
        User.findOne.mockResolvedValue({ ...activeUser, suspended: true });
        bcrypt.compare.mockResolvedValue(true);

        await expect(login("a@b.com", "pwd")).rejects.toMatchObject({ statusCode: 403 });
    });

    test("retourne le token et l'utilisateur quand tout est valide", async () => {
        User.findOne.mockResolvedValue(activeUser);
        bcrypt.compare.mockResolvedValue(true);
        jwt.sign.mockReturnValue("fake-token");

        const result = await login("a@b.com", "pwd");

        expect(result).toEqual({
            token: "fake-token",
            user: { id: "u1", email: "a@b.com", role: "admin" },
        });
        expect(jwt.sign).toHaveBeenCalledWith(
            { id: "u1", role: "admin" },
            "test-secret",
            { expiresIn: "1h" }
        );
    });
});