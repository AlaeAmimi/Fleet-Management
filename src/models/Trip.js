const mongoose = require("mongoose");

const tripSchema = new mongoose.Schema(
  {
    departureSite: { type: String, required: true, trim: true },
    arrivalSite: { type: String, required: true, trim: true },
    cargo: { type: String, required: true, trim: true },
    plannedStartDate: { type: Date, required: true },
    plannedEndDate: { type: Date, required: true },
    status: {
      type: String,
      enum: ["todo", "in_progress", "done"],
      default: "todo",
    },
    truck: { type: mongoose.Schema.Types.ObjectId, ref: "Truck", required: true },
    trailer: { type: mongoose.Schema.Types.ObjectId, ref: "Trailer", required: true },
    driver: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    departureKm: { type: Number, default: null },
    arrivalKm: { type: Number, default: null },
    fuelVolume: { type: Number, default: null },
    remarks: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Trip", tripSchema);