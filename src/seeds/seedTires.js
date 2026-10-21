require("dotenv").config();
const mongoose = require("mongoose");
const Tire = require("../models/Tire");

// [serial, position, wearKm, threshold, treadDepthMm, state, archived]
const TIRES = [
    // front-left
    ["SEED-FL-1", "front-left", 76000, 80000, 8, "good", false],   // critical by km (4000 left)
    ["SEED-FL-2", "front-left", 20000, 80000, 10, "good", false],  // healthy
    ["SEED-FL-3", "front-left", 30000, 80000, 3, "good", false],   // critical by depth only (3 mm, boundary)
    ["SEED-FL-4", "front-left", 79000, 80000, 2, "good", true],    // archived: excluded
    // front-right
    ["SEED-FR-1", "front-right", 79000, null, 9, "good", false],   // null threshold -> 80000 -> 1000 left, critical
    ["SEED-FR-2", "front-right", 85000, 80000, 7, "worn", false],  // over threshold -> 0 left, critical
    ["SEED-FR-3", "front-right", 5000, 0, 12, "good", false],      // threshold 0 -> 0 left, critical
    ["SEED-FR-4", "front-right", 79000, 80000, 2, "to_replace", false], // excluded by state
    // rear-left
    ["SEED-RL-1", "rear-left", 10000, 80000, 14, "new", false],    // healthy
    ["SEED-RL-2", "rear-left", 15000, 80000, 5, "good", false],    // healthy
    ["SEED-RL-3", "rear-left", 75000, 80000, 6, "good", false],    // exactly 5000 left: NOT critical
    // rear-right: only excluded tires, so this position must not appear
    ["SEED-RR-1", "rear-right", 1000, 80000, 10, "good", true],
    ["SEED-RR-2", "rear-right", 1000, 80000, 10, "to_replace", false],
];

async function run() {
    await mongoose.connect(process.env.MONGO_URI);
    await Tire.deleteMany({ serialNumber: /^SEED-/ });

    for (const [serialNumber, position, wearKm, wearThresholdKm, treadDepthMm, state, archived] of TIRES) {
        await Tire.create({ serialNumber, position, wearKm, wearThresholdKm, treadDepthMm, state, archived });
    }

    console.log("Tire seed done");
    await mongoose.disconnect();
}

run().catch((err) => {
    console.error(err);
    process.exit(1);
});