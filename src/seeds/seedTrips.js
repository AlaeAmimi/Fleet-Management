require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Truck = require("../models/Truck");
const Trailer = require("../models/Trailer");
const Trip = require("../models/Trip");

// [driver key, day of month, distance km, liters or null, status]
const TRIPS = [
    // Driver A: 1000 km, 250 L
    ["A", 1, 400, 100, "done"],
    ["A", 3, 600, 150, "done"],
    ["A", 20, null, null, "todo"],          // not done: must be ignored
    // Driver B: 1000 km, 350 L
    ["B", 1, 500, 175, "done"],
    ["B", 3, 500, 175, "done"],
    ["B", 20, 100, 40, "in_progress"],      // not done: must be ignored
    // Driver C: 1000 km, 450 L
    ["C", 1, 400, 180, "done"],
    ["C", 3, 600, 270, "done"],
    ["C", 5, 300, null, "done"],            // done but no fuel entered: must be ignored
    // Driver D: tests how you combine trips
    ["D", 1, 10, 5, "done"],
    ["D", 3, 1000, 300, "done"],
];

const DRIVERS = {
    A: { firstName: "Ahmed", lastName: "Bennani", email: "seed.a@fleet.com" },
    B: { firstName: "Karim", lastName: "Alami", email: "seed.b@fleet.com" },
    C: { firstName: "Youssef", lastName: "Idrissi", email: "seed.c@fleet.com" },
    D: { firstName: "Omar", lastName: "Tazi", email: "seed.d@fleet.com" },
};

async function run() {
    await mongoose.connect(process.env.MONGO_URI);

    // Remove previous seed data so the script can be rerun
    const oldTruck = await Truck.findOne({ plateNumber: "SEED-001" });
    if (oldTruck) await Trip.deleteMany({ truck: oldTruck._id });
    await Truck.deleteMany({ plateNumber: "SEED-001" });
    await Trailer.deleteMany({ plateNumber: "SEED-REM-001" });
    await User.deleteMany({ email: /^seed\..*@fleet\.com$/ });

    const truck = await Truck.create({ plateNumber: "SEED-001", brand: "Volvo", model: "FH16", year: 2022 });
    const trailer = await Trailer.create({ plateNumber: "SEED-REM-001", type: "flatbed" });

    const password = await bcrypt.hash("Chauffeur123", 10);
    const drivers = {};
    for (const key of Object.keys(DRIVERS)) {
        drivers[key] = await User.create({ ...DRIVERS[key], password, role: "chauffeur" });
    }

    for (const [key, day, distance, liters, status] of TRIPS) {
        const start = new Date(Date.UTC(2026, 8, day, 8, 0, 0));
        const end = new Date(Date.UTC(2026, 8, day, 18, 0, 0));
        const finished = status !== "todo" && distance !== null;

        await Trip.create({
            departureSite: "Youssoufia",
            arrivalSite: "Casablanca",
            cargo: "Ciment",
            plannedStartDate: start,
            plannedEndDate: end,
            status,
            truck: truck._id,
            trailer: trailer._id,
            driver: drivers[key]._id,
            departureKm: finished ? 10000 : null,
            arrivalKm: finished ? 10000 + distance : null,
            fuelVolume: liters,
        });
    }

    console.log("Seed done");
    await mongoose.disconnect();
}

run().catch((err) => {
    console.error(err);
    process.exit(1);
});