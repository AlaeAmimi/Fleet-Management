const Tire = require("../models/Tire");
const Truck = require("../models/Truck");
const { checkTireMaintenance } = require("../services/maintenance.service");

async function createTire(req, res) {
    const { serialNumber, brand, position } = req.body;

    if (!serialNumber) {
        return res.status(400).json({
            success: false,
            message: "serialNumber est requis"
        });
    }

    const existing = await Tire.findOne({ serialNumber });
    if (existing) {
        return res.status(409).json({
            success: false,
            message: "Un pneu avec ce numéro de série existe déjà"
        });
    }

    const tire = await Tire.create({ serialNumber, brand, position });

    res.status(201).json({ success: true, tire });
}

async function getAllTires(req, res) {
    const { state, truck } = req.query;

    const filter = {};
    if (state) filter.state = state;
    if (truck) filter.truck = truck;

    const tires = await Tire.find(filter).populate("truck", "plateNumber brand model");
    res.status(200).json({ success: true, count: tires.length, tires });
}

async function getTireById(req, res) {
    const tire = await Tire.findById(req.params.id).populate("truck", "plateNumber brand model");

    if (!tire) {
        return res.status(404).json({ success: false, message: "Pneu introuvable" });
    }

    res.status(200).json({ success: true, tire });
}

async function updateTire(req, res) {
    const tire = await Tire.findById(req.params.id);

    if (!tire) {
        return res.status(404).json({ success: false, message: "Pneu introuvable" });
    }

    const { brand, position, state, wearKm, wearThresholdKm } = req.body;

    if (brand) tire.brand = brand;
    if (position) tire.position = position;
    if (state) tire.state = state;
    if (wearKm !== undefined) tire.wearKm = wearKm;
    if (wearThresholdKm !== undefined) tire.wearThresholdKm = wearThresholdKm;

    await tire.save();
    await checkTireMaintenance(tire);

    res.status(200).json({ success: true, tire });
}

async function assignTireToTruck(req, res) {
    const { truckId } = req.body;

    if (!truckId) {
        return res.status(400).json({ success: false, message: "truckId est requis" });
    }

    const tire = await Tire.findById(req.params.id);
    if (!tire) {
        return res.status(404).json({ success: false, message: "Pneu introuvable" });
    }

    const truck = await Truck.findById(truckId);
    if (!truck) {
        return res.status(404).json({ success: false, message: "Camion introuvable" });
    }

    tire.truck = truck._id;
    await tire.save();

    res.status(200).json({ success: true, message: "Pneu associé au camion", tire });
}

module.exports = {createTire, getAllTires, getTireById, updateTire, assignTireToTruck};