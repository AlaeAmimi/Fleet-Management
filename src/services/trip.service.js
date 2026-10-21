const AppError = require("../utils/appError");

const NEXT_STATUS = { todo: "in_progress", in_progress: "done" };

function calculateDistance(departureKm, arrivalKm) {
    if (arrivalKm <= departureKm) {
        throw new AppError(
            "Le kilométrage d'arrivée doit être strictement supérieur au kilométrage de départ",
            400
        );
    }
    return arrivalKm - departureKm;
}

// Liters per 100 km, rounded to 2 decimals
function calculateConsumption(fuelVolume, distanceKm) {
    return Math.round((fuelVolume / distanceKm) * 100 * 100) / 100;
}

function assertValidTransition(currentStatus, newStatus) {
    const expected = NEXT_STATUS[currentStatus];
    if (!expected || expected !== newStatus) {
        throw new AppError(`Transition invalide : "${currentStatus}" vers "${newStatus}"`, 400);
    }
}

module.exports = { calculateDistance, calculateConsumption, assertValidTransition };