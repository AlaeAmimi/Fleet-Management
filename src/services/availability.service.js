const Trip = require("../models/Trip");

async function findConflict({ truckId, trailerId, driverId, startDate, endDate, excludeTripId }) {
    const overlapFilter = {
        status: { $in: ["todo", "in_progress"] },
        plannedStartDate: { $lt: endDate },
        plannedEndDate: { $gt: startDate },
    };

    if (excludeTripId) {
        overlapFilter._id = { $ne: excludeTripId };
    }

    const truckConflict = await Trip.findOne({ ...overlapFilter, truck: truckId });
    if (truckConflict) return "Le camion est déjà assigné sur cette période";

    const trailerConflict = await Trip.findOne({ ...overlapFilter, trailer: trailerId });
    if (trailerConflict) return "La remorque est déjà assignée sur cette période";

    const driverConflict = await Trip.findOne({ ...overlapFilter, driver: driverId });
    if (driverConflict) return "Le chauffeur a déjà un trajet sur cette période";

    return null;
}

module.exports = { findConflict };