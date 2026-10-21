jest.mock("../../src/models/Trip");

const Trip = require("../../src/models/Trip");
const { findConflict } = require("../../src/services/availability.service");

const params = {
    truckId: "truck1",
    trailerId: "trailer1",
    driverId: "driver1",
    startDate: new Date("2026-10-10T08:00:00Z"),
    endDate: new Date("2026-10-10T18:00:00Z"),
};

beforeEach(() => {
    jest.resetAllMocks();
});

describe("findConflict", () => {
    test("retourne null quand rien n'est réservé", async () => {
        Trip.findOne.mockResolvedValue(null);

        const result = await findConflict(params);

        expect(result).toBeNull();
        expect(Trip.findOne).toHaveBeenCalledTimes(3);
    });

    test("détecte un conflit camion et s'arrête", async () => {
        Trip.findOne.mockResolvedValueOnce({ _id: "t1" });

        const result = await findConflict(params);

        expect(result).toBe("Le camion est déjà assigné sur cette période");
        expect(Trip.findOne).toHaveBeenCalledTimes(1);
    });
        test("détecte un conflit remorque", async () => {
        Trip.findOne
            .mockResolvedValueOnce(null)
            .mockResolvedValueOnce({ _id: "t1" });

        const result = await findConflict(params);

        expect(result).toBe("La remorque est déjà assignée sur cette période");
    });

    test("détecte un conflit chauffeur", async () => {
        Trip.findOne
            .mockResolvedValueOnce(null)
            .mockResolvedValueOnce(null)
            .mockResolvedValueOnce({ _id: "t1" });

        const result = await findConflict(params);

        expect(result).toBe("Le chauffeur a déjà un trajet sur cette période");
    });

    test("ne considère que les trajets todo et in_progress", async () => {
        Trip.findOne.mockResolvedValue(null);

        await findConflict(params);

        const filter = Trip.findOne.mock.calls[0][0];
        expect(filter.status).toEqual({ $in: ["todo", "in_progress"] });
        expect(filter.truck).toBe("truck1");
    });

    test("exclut le trajet donné quand excludeTripId est fourni", async () => {
        Trip.findOne.mockResolvedValue(null);

        await findConflict({ ...params, excludeTripId: "tripX" });

        const filter = Trip.findOne.mock.calls[0][0];
        expect(filter._id).toEqual({ $ne: "tripX" });
    });
});