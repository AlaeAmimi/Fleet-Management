const Truck = require("../models/Truck");

async function createTruck(req, res) {
    const { plateNumber, brand, model, year } = req.body;

    if (!plateNumber || !brand || !model) {
        return res.status(400).json({
            success: false,
            message: "plateNumber, brand et model sont requis"
        });
    }

    const existing = await Truck.findOne({ plateNumber: plateNumber.toUpperCase() });
    if (existing) {
        return res.status(409).json({
            success: false,
            message: "Un camion avec cette plaque existe déjà"
        });
    }

    const truck = await Truck.create({
        plateNumber: plateNumber.toUpperCase(),
        brand,
        model,
        year
    });

    res.status(201).json({ success: true, truck });
}

async function getAllTrucks(req, res) {
    const { status, archived } = req.query;

    const filter = {};
    if (status) filter.status = status;
    filter.archived = archived === "true";

    const trucks = await Truck.find(filter);
    res.status(200).json({ success: true, count: trucks.length, trucks });
}

async function getTruckById(req, res) {
    const truck = await Truck.findById(req.params.id);

    if (!truck) {
        return res.status(404).json({ success: false, message: "Camion introuvable" });
    }

    res.status(200).json({ success: true, truck });
}

async function updateTruck(req, res) {
    const truck = await Truck.findById(req.params.id);

    if (!truck) {
        return res.status(404).json({ success: false, message: "Camion introuvable" });
    }

    const { brand, model, year, status } = req.body;

    if (brand) truck.brand = brand;
    if (model) truck.model = model;
    if (year) truck.year = year;
    if (status) truck.status = status;

    await truck.save();

    res.status(200).json({ success: true, truck });
}

async function archiveTruck(req, res) {
    const truck = await Truck.findById(req.params.id);

    if (!truck) {
        return res.status(404).json({ success: false, message: "Camion introuvable" });
    }

    truck.archived = true;
    await truck.save();

    res.status(200).json({ success: true, message: "Camion archivé", truck });
}

module.exports = {
    createTruck,
    getAllTrucks,
    getTruckById,
    updateTruck,
    archiveTruck
};