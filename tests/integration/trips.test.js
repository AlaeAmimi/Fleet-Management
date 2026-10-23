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

jest.mock("../../src/models/Trip", () => ({
    find: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
}));
jest.mock("../../src/models/Truck", () => ({
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
}));
jest.mock("../../src/models/Trailer", () => ({
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
}));
jest.mock("../../src/models/User", () => ({
    findById: jest.fn(),
}));
jest.mock("../../src/models/Tire", () => ({
    find: jest.fn(),
}));

// Services with their own unit tests: faked here
jest.mock("../../src/services/availability.service", () => ({ findConflict: jest.fn() }));
jest.mock("../../src/services/reference.service", () => ({ generateTripReference: jest.fn() }));
jest.mock("../../src/services/maintenance.service", () => ({
    checkTruckMaintenance: jest.fn(),
    checkTireMaintenance: jest.fn(),
    hasUnhandledAlert: jest.fn(),
}));

const request = require("supertest");
const jwt = require("jsonwebtoken");
const Tire = require("../../src/models/Tire");
const app = require("../../src/app");
const Trip = require("../../src/models/Trip");
const Truck = require("../../src/models/Truck");
const Trailer = require("../../src/models/Trailer");
const User = require("../../src/models/User");
const { findConflict } = require("../../src/services/availability.service");
const { generateTripReference } = require("../../src/services/reference.service");
const { hasUnhandledAlert } = require("../../src/services/maintenance.service");

const adminToken = jwt.sign({ id: "u1", role: "admin" }, "test-secret");
const chauffeurToken = jwt.sign({ id: "u2", role: "chauffeur" }, "test-secret");

const validTrip = {
    departureSite: "Youssoufia",
    arrivalSite: "Casablanca",
    cargo: "Ciment",
    plannedStartDate: "2026-10-20T08:00:00.000Z",
    plannedEndDate: "2026-10-20T18:00:00.000Z",
    truckId: "6acdfdb1257886610ec802aa",
    trailerId: "6acdfdcf257886610ec802ab",
    driverId: "6acdfdf1257886610ec802ac",
};

// Everything is free and valid: each test then breaks one thing
beforeEach(() => {
    jest.resetAllMocks();
    Truck.findById.mockResolvedValue({
        _id: "truck1",
        status: "available",
        totalKm: 0,
        save: jest.fn().mockResolvedValue(),
    });
    Trailer.findById.mockResolvedValue({
        _id: "trailer1",
        status: "available",
        totalKm: 0,
        save: jest.fn().mockResolvedValue(),
    });
    Tire.find.mockResolvedValue([]);
    User.findById.mockResolvedValue({ _id: "driver1", role: "chauffeur", suspended: false });
    hasUnhandledAlert.mockResolvedValue(false);
    findConflict.mockResolvedValue(null);
    generateTripReference.mockResolvedValue("TRP-2026-0001");
    Trip.create.mockResolvedValue({ _id: "trip1", reference: "TRP-2026-0001" });
});

function postTrip(body, token = adminToken) {
    return request(app)
        .post("/api/v1/trips")
        .set("Authorization", `Bearer ${token}`)
        .send(body);
}

describe("POST /api/v1/trips", () => {
    test("refuse sans token (401)", async () => {
        const res = await request(app).post("/api/v1/trips").send(validTrip);
        expect(res.status).toBe(401);
    });

    test("refuse un chauffeur (403)", async () => {
        const res = await postTrip(validTrip, chauffeurToken);
        expect(res.status).toBe(403);
    });

    test("refuse un corps vide (400)", async () => {
        const res = await postTrip({});
        expect(res.status).toBe(400);
    });

    test("refuse une date de fin avant la date de début (400)", async () => {
        const res = await postTrip({ ...validTrip, plannedEndDate: "2026-10-19T08:00:00.000Z" });
        expect(res.status).toBe(400);
    });

    test("répond 404 si le camion n'existe pas", async () => {
        Truck.findById.mockResolvedValue(null);
        const res = await postTrip(validTrip);
        expect(res.status).toBe(404);
    });

    test("répond 409 si le camion est en maintenance", async () => {
        Truck.findById.mockResolvedValue({ _id: "truck1", status: "maintenance" });
        const res = await postTrip(validTrip);
        expect(res.status).toBe(409);
    });

    test("répond 409 si le camion a une alerte non traitée", async () => {
        hasUnhandledAlert.mockImplementation(async (model) => model === "Truck");
        const res = await postTrip(validTrip);
        expect(res.status).toBe(409);
    });

    test("répond 404 si la remorque n'existe pas", async () => {
        Trailer.findById.mockResolvedValue(null);
        const res = await postTrip(validTrip);
        expect(res.status).toBe(404);
    });

    test("répond 409 si la remorque est en maintenance", async () => {
        Trailer.findById.mockResolvedValue({ _id: "trailer1", status: "maintenance" });
        const res = await postTrip(validTrip);
        expect(res.status).toBe(409);
    });

    test("répond 404 si le chauffeur n'existe pas ou n'est pas chauffeur", async () => {
        User.findById.mockResolvedValue({ _id: "driver1", role: "admin" });
        const res = await postTrip(validTrip);
        expect(res.status).toBe(404);
    });

    test("répond 403 si le chauffeur est suspendu", async () => {
        User.findById.mockResolvedValue({ _id: "driver1", role: "chauffeur", suspended: true });
        const res = await postTrip(validTrip);
        expect(res.status).toBe(403);
    });

    test("répond 409 en cas de conflit de planning", async () => {
        findConflict.mockResolvedValue("Le camion est déjà assigné sur cette période");
        const res = await postTrip(validTrip);
        expect(res.status).toBe(409);
        expect(res.body.message).toContain("camion");
        expect(Trip.create).not.toHaveBeenCalled();
    });

    test("crée le trajet avec sa référence (201)", async () => {
        const res = await postTrip(validTrip);

        expect(res.status).toBe(201);
        expect(res.body.trip.reference).toBe("TRP-2026-0001");
        expect(Trip.create).toHaveBeenCalledWith(
            expect.objectContaining({
                reference: "TRP-2026-0001",
                truck: validTrip.truckId,
                trailer: validTrip.trailerId,
                driver: validTrip.driverId,
            })
        );
    });
});



describe("GET /api/v1/trips", () => {
    test("un chauffeur ne voit que ses trajets (200)", async () => {
        const populate3 = jest.fn().mockResolvedValue([{ _id: "trip1" }]);
        const populate2 = jest.fn().mockReturnValue({ populate: populate3 });
        const populate1 = jest.fn().mockReturnValue({ populate: populate2 });
        Trip.find.mockReturnValue({ populate: populate1 });

        const res = await request(app)
            .get("/api/v1/trips")
            .set("Authorization", `Bearer ${chauffeurToken}`);

        expect(res.status).toBe(200);
        expect(Trip.find).toHaveBeenCalledWith({ driver: "u2" });
    });

    test("un admin voit tous les trajets (200)", async () => {
        const populate3 = jest.fn().mockResolvedValue([]);
        const populate2 = jest.fn().mockReturnValue({ populate: populate3 });
        const populate1 = jest.fn().mockReturnValue({ populate: populate2 });
        Trip.find.mockReturnValue({ populate: populate1 });

        const res = await request(app)
            .get("/api/v1/trips")
            .set("Authorization", `Bearer ${adminToken}`);

        expect(res.status).toBe(200);
        expect(Trip.find).toHaveBeenCalledWith({});
    });
});

describe("PATCH /api/v1/trips/:id/status", () => {
    const patchStatus = (body, token = chauffeurToken) =>
        request(app)
            .patch("/api/v1/trips/trip1/status")
            .set("Authorization", `Bearer ${token}`)
            .send(body);

    test("refuse un statut invalide (400)", async () => {
        const res = await patchStatus({ status: "todo" });
        expect(res.status).toBe(400);
    });

    test("répond 404 si le trajet n'existe pas", async () => {
        Trip.findById.mockResolvedValue(null);
        const res = await patchStatus({ status: "in_progress" });
        expect(res.status).toBe(404);
    });

    test("refuse un autre chauffeur (403)", async () => {
        Trip.findById.mockResolvedValue({ _id: "trip1", driver: "autre", status: "todo" });
        const res = await patchStatus({ status: "in_progress" });
        expect(res.status).toBe(403);
    });

    test("refuse de sauter une étape (400)", async () => {
        Trip.findById.mockResolvedValue({ _id: "trip1", driver: "u2", status: "todo" });
        const res = await patchStatus({ status: "done" });
        expect(res.status).toBe(400);
    });

    test("passe de todo à in_progress (200)", async () => {
        const trip = { _id: "trip1", driver: "u2", status: "todo", save: jest.fn().mockResolvedValue() };
        Trip.findById.mockResolvedValue(trip);

        const res = await patchStatus({ status: "in_progress" });

        expect(res.status).toBe(200);
        expect(trip.status).toBe("in_progress");
        expect(trip.save).toHaveBeenCalledTimes(1);
    });
});

describe("PATCH /api/v1/trips/:id/data", () => {
    const patchData = (body) =>
        request(app)
            .patch("/api/v1/trips/trip1/data")
            .set("Authorization", `Bearer ${chauffeurToken}`)
            .send(body);

    test("refuse un corps vide (400)", async () => {
        const res = await patchData({});
        expect(res.status).toBe(400);
    });

    test("répond 404 si le trajet n'existe pas", async () => {
        Trip.findById.mockResolvedValue(null);
        const res = await patchData({ departureKm: 1000 });
        expect(res.status).toBe(404);
    });

    test("refuse un autre chauffeur (403)", async () => {
        Trip.findById.mockResolvedValue({ _id: "trip1", driver: "autre" });
        const res = await patchData({ departureKm: 1000 });
        expect(res.status).toBe(403);
    });

    test("refuse un km d'arrivée <= km de départ (400)", async () => {
        Trip.findById.mockResolvedValue({
            _id: "trip1", driver: "u2", departureKm: null, arrivalKm: null, save: jest.fn(),
        });
        const res = await patchData({ departureKm: 1000, arrivalKm: 1000 });
        expect(res.status).toBe(400);
    });

    test("enregistre le kilométrage valide (200)", async () => {
        const trip = {
            _id: "trip1", driver: "u2", truck: "truck1", trailer: "trailer1",
            departureKm: null, arrivalKm: null, fuelVolume: null, remarks: "",
            save: jest.fn().mockResolvedValue(),
        };
        Trip.findById.mockResolvedValue(trip);

        const res = await patchData({ departureKm: 1000, arrivalKm: 1400, fuelVolume: 120 });

        expect(res.status).toBe(200);
        expect(trip.arrivalKm).toBe(1400);
        expect(trip.save).toHaveBeenCalledTimes(1);
    });
});
