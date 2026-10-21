const mongoose = require('mongoose');

const tireSchema = new mongoose.Schema(
  {
    serialNumber: { type: String, required: true, unique: true, trim: true },
    brand: { type: String, trim: true },
    position: { type: String, trim: true, required: true }, // e.g. front-left
    truck: { type: mongoose.Schema.Types.ObjectId, ref: 'Truck', default: null },
    state: {
      type: String,
      enum: ['new', 'good', 'worn', 'to_replace'],
      default: 'new',
    },
    archived: { type: Boolean, default: false },
    wearKm: { type: Number, required: true, default: 0, min: 0 },
    wearThresholdKm: { type: Number, default: 80000, min: 0 },
    treadDepthMm: { type: Number, required: true, min: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Tire', tireSchema);