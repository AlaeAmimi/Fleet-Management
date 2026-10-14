const Counter = require("../models/Counter");

async function generateTripReference() {
    const year = new Date().getFullYear();

    const counter = await Counter.findOneAndUpdate(
        { _id: `trip-${year}` },
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
    );

    return `TRP-${year}-${String(counter.seq).padStart(4, "0")}`;
}

module.exports = { generateTripReference };