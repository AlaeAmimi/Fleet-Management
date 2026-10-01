const mongoose = require('mongoose');

const tireSchema = new mongoose.Schema(
  {
    serialNumber: { type: String, required: true, unique: true, trim: true },
    brand: { type: String, trim: true },
    position: { type: String, trim: true }, // e.g. front-left
    truck: { type: mongoose.Schema.Types.ObjectId, ref: 'Truck', default: null },
    state: {
      type: String,
      enum: ['new', 'good', 'worn', 'to_replace'],
      default: 'new',
    },
    wearKm: { type: Number, default: 0, min: 0 },
    wearThresholdKm: { type: Number, default: 60000, min: 1 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Tire', tireSchema);