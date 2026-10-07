const Trip = require("../models/Trip");
const Truck = require("../models/Truck");
const Trailer = require("../models/Trailer");
const User = require("../models/User");
const { findConflict } = require("../services/availability.service");

async function createTrip(req, res) {
    const {
        departureSite, arrivalSite, cargo,
        plannedStartDate, plannedEndDate,
        truckId, trailerId, driverId
    } = req.body;

    if (!departureSite || !arrivalSite || !cargo || !plannedStartDate || !plannedEndDate || !truckId || !trailerId || !driverId) {
        return res.status(400).json({ success: false, message: "Tous les champs sont requis" });
    }

    const startDate = new Date(plannedStartDate);
    const endDate = new Date(plannedEndDate);

    const truck = await Truck.findById(truckId);
    if (!truck) return res.status(404).json({ success: false, message: "Camion introuvable" });
    if (truck.status === "maintenance") {
        return res.status(409).json({ success: false, message: "Le camion est en maintenance" });
    }

    const trailer = await Trailer.findById(trailerId);
    if (!trailer) return res.status(404).json({ success: false, message: "Remorque introuvable" });
    if (trailer.status === "maintenance") {
        return res.status(409).json({ success: false, message: "La remorque est en maintenance" });
    }

    const driver = await User.findById(driverId);
    if (!driver || driver.role !== "chauffeur") {
        return res.status(404).json({ success: false, message: "Chauffeur introuvable" });
    }
    if (driver.suspended) {
        return res.status(403).json({ success: false, message: "Ce chauffeur est suspendu" });
    }

    const conflict = await findConflict({
        truckId, trailerId, driverId, startDate, endDate
    });
    if (conflict) {
        return res.status(409).json({ success: false, message: conflict });
    }

    const trip = await Trip.create({
        departureSite, arrivalSite, cargo,
        plannedStartDate: startDate,
        plannedEndDate: endDate,
        truck: truckId,
        trailer: trailerId,
        driver: driverId
    });

    res.status(201).json({ success: true, trip });
}

async function getAllTrips(req, res) {
    const filter = {};

    // chauffeur kayshof ghir trips dyawlo
    if (req.user.role === "chauffeur") {
        filter.driver = req.user.id;
    }

    const trips = await Trip.find(filter)
        .populate("truck", "plateNumber brand model")
        .populate("trailer", "plateNumber type")
        .populate("driver", "firstName lastName email");

    res.status(200).json({ success: true, count: trips.length, trips });
}

async function getTripById(req, res) {
    const trip = await Trip.findById(req.params.id)
        .populate("truck", "plateNumber brand model")
        .populate("trailer", "plateNumber type")
        .populate("driver", "firstName lastName email");

    if (!trip) {
        return res.status(404).json({ success: false, message: "Trajet introuvable" });
    }

    // cheuffeur may9drsh yshof trips dyal shi 7ed akhor
    if (req.user.role === "chauffeur" && trip.driver._id.toString() !== req.user.id) {
        return res.status(403).json({ success: false, message: "Accès refusé" });
    }

    res.status(200).json({ success: true, trip });
}

const VALID_TRANSITIONS = {
    todo: "in_progress",
    in_progress: "done",
};

async function updateTripStatus(req, res) {
    const { status } = req.body;

    if (!status) {
        return res.status(400).json({ success: false, message: "status est requis" });
    }

    const trip = await Trip.findById(req.params.id);
    if (!trip) {
        return res.status(404).json({ success: false, message: "Trajet introuvable" });
    }

    // cauffeur y9der ybedel trips dyawlo only
    if (trip.driver.toString() !== req.user.id) {
        return res.status(403).json({ success: false, message: "Accès refusé : ce n'est pas votre trajet" });
    }

    const expectedNext = VALID_TRANSITIONS[trip.status];
    if (status !== expectedNext) {
        return res.status(400).json({
            success: false,
            message: `Transition invalide : le statut doit passer de "${trip.status}" à "${expectedNext}"`
        });
    }

    trip.status = status;
    await trip.save();

    res.status(200).json({ success: true, trip });
}

async function recordTripData(req, res) {
    const { departureKm, arrivalKm, fuelVolume, remarks } = req.body;

    const trip = await Trip.findById(req.params.id);
    if (!trip) {
        return res.status(404).json({ success: false, message: "Trajet introuvable" });
    }

    if (trip.driver.toString() !== req.user.id) {
        return res.status(403).json({ success: false, message: "Accès refusé : ce n'est pas votre trajet" });
    }

    if (departureKm !== undefined) trip.departureKm = departureKm;
    if (arrivalKm !== undefined) trip.arrivalKm = arrivalKm;
    if (fuelVolume !== undefined) trip.fuelVolume = fuelVolume;
    if (remarks !== undefined) trip.remarks = remarks;

    //uodate only if both values are filled
    if (trip.departureKm !== null && trip.arrivalKm !== null) {
        if (trip.arrivalKm <= trip.departureKm) {
            return res.status(400).json({
                success: false,
                message: "Le kilométrage d'arrivée doit être strictement supérieur au kilométrage de départ"
            });
        }
    }

    await trip.save();

    res.status(200).json({ success: true, trip });
}

module.exports = {
    createTrip, getAllTrips, getTripById,
    updateTripStatus, recordTripData
};