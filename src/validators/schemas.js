const Joi = require("joi");

const objectId = Joi.string().hex().length(24);

const login = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
});

const createChauffeur = Joi.object({
    firstName: Joi.string().trim().min(2).required(),
    lastName: Joi.string().trim().min(2).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required(),
});

const createTruck = Joi.object({
    plateNumber: Joi.string().trim().required(),
    brand: Joi.string().trim().required(),
    model: Joi.string().trim().required(),
    year: Joi.number().integer().min(1990).max(new Date().getFullYear() + 1),
});

const updateTruck = Joi.object({
    brand: Joi.string().trim(),
    model: Joi.string().trim(),
    year: Joi.number().integer().min(1990).max(new Date().getFullYear() + 1),
    status: Joi.string().valid("available", "maintenance"),
}).min(1);

const createTrailer = Joi.object({
    plateNumber: Joi.string().trim().required(),
    type: Joi.string().trim().required(),
});

const updateTrailer = Joi.object({
    type: Joi.string().trim(),
    status: Joi.string().valid("available", "maintenance"),
}).min(1);

const createTire = Joi.object({
    serialNumber: Joi.string().trim().required(),
    brand: Joi.string().trim(),
    position: Joi.string().trim(),
});

const updateTire = Joi.object({
    brand: Joi.string().trim(),
    position: Joi.string().trim(),
    state: Joi.string().valid("new", "good", "worn", "to_replace"),
    wearKm: Joi.number().min(0),
    wearThresholdKm: Joi.number().min(1),
}).min(1);

const assignTire = Joi.object({
    truckId: objectId.required(),
});

const createTrip = Joi.object({
    departureSite: Joi.string().trim().required(),
    arrivalSite: Joi.string().trim().required(),
    cargo: Joi.string().trim().required(),
    plannedStartDate: Joi.date().iso().required(),
    plannedEndDate: Joi.date().iso().greater(Joi.ref("plannedStartDate")).required(),
    truckId: objectId.required(),
    trailerId: objectId.required(),
    driverId: objectId.required(),
});

const tripStatus = Joi.object({
    status: Joi.string().valid("in_progress", "done").required(),
});

const tripData = Joi.object({
    departureKm: Joi.number().min(0),
    arrivalKm: Joi.number().min(0),
    fuelVolume: Joi.number().min(0),
    remarks: Joi.string().allow(""),
}).min(1);

const maintenanceRule = Joi.object({
    type: Joi.string().valid("oil_change", "inspection", "tire_wear").required(),
    thresholdKm: Joi.number().integer().min(1).required(),
});

module.exports = {
    login, createChauffeur,
    createTruck, updateTruck,
    createTrailer, updateTrailer,
    createTire, updateTire, assignTire,
    createTrip, tripStatus, tripData,
    maintenanceRule,
};