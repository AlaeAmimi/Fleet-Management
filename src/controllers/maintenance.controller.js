const MaintenanceRule = require("../models/MaintenanceRule");
const Alert = require("../models/Alert");
const Truck = require("../models/Truck");

async function setRule(req, res) {
    const { type, thresholdKm } = req.body;

    // Creates the rule if it doesn't exist yet, updates it otherwise
    const rule = await MaintenanceRule.findOneAndUpdate(
        { type },
        { thresholdKm },
        { new: true, upsert: true }
    );

    res.status(200).json({ success: true, rule });
}

async function getRules(req, res) {
    const rules = await MaintenanceRule.find();
    res.status(200).json({ success: true, rules });
}

async function getAlerts(req, res) {
    const { handled } = req.query;

    const filter = {};
    if (handled !== undefined) filter.handled = handled === "true";

    const alerts = await Alert.find(filter).populate("vehicle");
    res.status(200).json({ success: true, count: alerts.length, alerts });
}

async function resolveAlert(req, res) {
    const alert = await Alert.findById(req.params.id);

    if (!alert) {
        return res.status(404).json({ success: false, message: "Alerte introuvable" });
    }
    if (alert.handled) {
        return res.status(400).json({ success: false, message: "Alerte déjà traitée" });
    }

    // The maintenance was done: restart the km counter for that type of work
    if (alert.vehicleModel === "Truck") {
        const truck = await Truck.findById(alert.vehicle);
        if (truck) {
            if (alert.type === "oil_change") truck.lastOilChangeKm = truck.totalKm;
            if (alert.type === "inspection") truck.lastInspectionKm = truck.totalKm;
            await truck.save();
        }
    }

    alert.handled = true;
    await alert.save();

    res.status(200).json({ success: true, alert });
}

module.exports = { setRule, getRules, getAlerts, resolveAlert };