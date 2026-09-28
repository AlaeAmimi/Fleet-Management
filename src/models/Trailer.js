const mongoose = require('mongoose');

const trailerSchema = new mongoose.Schema(
  {
    plateNumber: { type: String, required: true, unique: true, trim: true, uppercase: true },
    type: { type: String, required: true, trim: true }, // e.g. flatbed, refrigerated, tanker
    status: {
      type: String,
      enum: ['available', 'maintenance'],
      default: 'available',
    },
    totalKm: { type: Number, default: 0, min: 0 },
    lastInspectionKm: { type: Number, default: 0, min: 0 },
    archived: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Trailer', trailerSchema);