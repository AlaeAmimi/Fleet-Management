const mongoose = require('mongoose');

const truckSchema = new mongoose.Schema(
  {
    plateNumber: { type: String, required: true, unique: true, trim: true, uppercase: true },
    brand: { type: String, required: true, trim: true },
    model: { type: String, required: true, trim: true },
    year: { type: Number, min: 1990 },
    status: {
      type: String,
      enum: ['available', 'maintenance'],
      default: 'available',
    },
    totalKm: { type: Number, default: 0, min: 0 },
    lastOilChangeKm: { type: Number, default: 0, min: 0 },
    lastInspectionKm: { type: Number, default: 0, min: 0 },
    archived: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Truck', truckSchema);