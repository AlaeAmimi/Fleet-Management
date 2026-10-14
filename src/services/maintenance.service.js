const MaintenanceRule = require("../models/MaintenanceRule");
const Alert = require("../models/Alert");

// Creates an alert, unless an unhandled one already exists for the same vehicle and reason
async function createAlertIfNotExists(vehicleModel, vehicleId, type, reason) {
    const existing = await Alert.findOne({
        vehicle: vehicleId,
        vehicleModel,
        reason,
        handled: false,
    });

    if (!existing) {
        await Alert.create({ vehicleModel, vehicle: vehicleId, type, reason });
    }
}

// Called after a truck's totalKm changes
async function checkTruckMaintenance(truck) {
    const oilRule = await MaintenanceRule.findOne({ type: "oil_change" });
    if (oilRule && truck.totalKm - truck.lastOilChangeKm >= oilRule.thresholdKm) {
        await createAlertIfNotExists("Truck", truck._id, "oil_change", "Vidange requise");
    }

    const inspectionRule = await MaintenanceRule.findOne({ type: "inspection" });
    if (inspectionRule && truck.totalKm - truck.lastInspectionKm >= inspectionRule.thresholdKm) {
        await createAlertIfNotExists("Truck", truck._id, "inspection", "Révision requise");
    }
}

// Called after a tire's wearKm changes
async function checkTireMaintenance(tire) {
    if (tire.truck && tire.wearKm >= tire.wearThresholdKm) {
        await createAlertIfNotExists(
            "Truck",
            tire.truck,
            "tire_wear",
            `Pneu à remplacer (série ${tire.serialNumber})`
        );
    }
}

// True if the vehicle has at least one unhandled alert
async function hasUnhandledAlert(vehicleModel, vehicleId) {
    const alert = await Alert.findOne({ vehicle: vehicleId, vehicleModel, handled: false });
    return !!alert;
}

module.exports = { checkTruckMaintenance, checkTireMaintenance, hasUnhandledAlert };