const mongoose = require("mongoose");

const alertSchema = new mongoose.Schema(
  {
    vehicleType: { type: String, enum: ["truck", "trailer"], required: true },
    vehicle: { type: mongoose.Schema.Types.ObjectId, required: true, refPath: "vehicleType_model" },
    vehicleType_model: { type: String, enum: ["Truck", "Trailer"], required: true },
    reason: { type: String, required: true },
    handled: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Alert", alertSchema);