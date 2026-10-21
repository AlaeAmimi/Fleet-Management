jest.mock("../../src/models/Counter");

const Counter = require("../../src/models/Counter");
const { generateTripReference } = require("../../src/services/reference.service");

const year = new Date().getFullYear();

beforeEach(() => {
    jest.resetAllMocks();
});

describe("generateTripReference", () => {
    test("formate la référence avec 4 chiffres", async () => {
        Counter.findOneAndUpdate.mockResolvedValue({ seq: 1 });

        const reference = await generateTripReference();

        expect(reference).toBe(`TRP-${year}-0001`);
    });

    test("complète avec des zéros à gauche", async () => {
        Counter.findOneAndUpdate.mockResolvedValue({ seq: 42 });

        expect(await generateTripReference()).toBe(`TRP-${year}-0042`);
    });

    test("ne tronque pas au-delà de 4 chiffres", async () => {
        Counter.findOneAndUpdate.mockResolvedValue({ seq: 12345 });

        expect(await generateTripReference()).toBe(`TRP-${year}-12345`);
    });

    test("incrémente le compteur de l'année en cours", async () => {
        Counter.findOneAndUpdate.mockResolvedValue({ seq: 1 });

        await generateTripReference();

        expect(Counter.findOneAndUpdate).toHaveBeenCalledWith(
            { _id: `trip-${year}` },
            { $inc: { seq: 1 } },
            { new: true, upsert: true }
        );
    });
});