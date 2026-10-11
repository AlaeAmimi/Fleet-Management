const mongoose = require("mongoose");

const maintenanceRuleSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["oil_change", "inspection", "tire_wear"],
      required: true,
      unique: true,
    },
    thresholdKm: { type: Number, required: true, min: 1 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("MaintenanceRule", maintenanceRuleSchema);