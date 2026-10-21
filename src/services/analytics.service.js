// $match filters, like find().
// $group collapses many documents into one per _id, and computes totals with $sum, $avg, $max and so on.
// $addFields adds a computed field to each document.
// $lookup joins another collection, like a SQL JOIN.
// $project picks and renames the fields in the output.
// $sort orders the results.

const Trip = require("../models/Trip");
const Tire = require("../models/Tire");

// TODO: build the eco-performance pipeline here
async function getDriverEcoPerformance() {
  return Trip.aggregate([
  // 1. keep only completed trips with fuel and both km filled in
  { $match: { status: "done", fuelVolume: { $ne: null }, departureKm: { $ne: null }, arrivalKm: { $ne: null } } },

  // 2. add each trip's distance
  { $addFields: { distanceKm: { $subtract: ["$arrivalKm", "$departureKm"] } } },

  // 3. one document per driver: total liters, total km
  { $group: { _id: "$driver", totalLiters: { $sum: "$fuelVolume" }, totalKm: { $sum: "$distanceKm" } } },

  // 4. consumption in L/100km, computed from the totals
  { $addFields: { avgConsumption: { $multiply: [{ $divide: ["$totalLiters", "$totalKm"] }, 100] } } },

  // 5. score = max(0, min(100, 100 - (consumption - 30) * 2.5))
  { $addFields: { ecoScore: { $max: [ 0, { $min: [100, { $subtract: [100, { $multiply: [{ $subtract: ["$avgConsumption", 30] }, 2.5] }] }] }, ], }, }, },

  // 6. bring in the driver's name from the users collection
  { $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "driver" } },
  { $unwind: "$driver" },

  // 7. clean output with rounded values
  {
    $project: {
      _id: 0,
      driverId: "$driver._id",
      firstName: "$driver.firstName",
      lastName: "$driver.lastName",
      totalLiters: 1,
      totalKm: 1,
      avgConsumption: { $round: ["$avgConsumption", 2] },
      ecoScore: { $round: ["$ecoScore", 1] },
    },
  },

  // 8. best score first
  { $sort: { ecoScore: -1 } },
])
}


async function getTireHealthMatrix() {
  return Tire.aggregate([
    // 1. active tires: not archived, state is not to_replace
    { $match: { archived: { $ne: true }, state: { $ne: "to_replace" } } },

    // 2. remainingKm = max(0, threshold - current km); threshold defaults to 80000 only when null/missing
    {
      $addFields: {
        remainingKm: {
          $max: [0, { $subtract: [{ $ifNull: ["$wearThresholdKm", 80000] }, "$wearKm"] }],
        },
      },
    },

    // 3. critical if remainingKm < 5000 OR treadDepthMm <= 3
    {
      $addFields: {
        isCritical: {
          $or: [{ $lt: ["$remainingKm", 5000] }, { $lte: ["$treadDepthMm", 3] }],
        },
      },
    },

    // 4. one result per position
    {
      $group: {
        _id: "$position",
        tiresCount: { $sum: 1 },
        avgKm: { $avg: "$wearKm" },
        criticalCount: { $sum: { $cond: ["$isCritical", 1, 0] } },
        estimatedBudget: { $sum: { $cond: ["$isCritical", 3800, 0] } },
      },
    },
  ]);
}

async function getFinancialEsg({ startDate, endDate }) {
  const match = {
    status: "done",
    fuelVolume: { $ne: null },
    departureKm: { $ne: null },
    arrivalKm: { $ne: null },
  };

  // Optional time window on the planned start date
  if (startDate || endDate) {
    match.plannedStartDate = {};
    if (startDate) match.plannedStartDate.$gte = startDate;
    if (endDate) match.plannedStartDate.$lte = endDate;
  }

  return Trip.aggregate([
    // 1. completed trips with all data, inside the optional window
    { $match: match },

    // 2. distance of each trip
    { $addFields: { distanceKm: { $subtract: ["$arrivalKm", "$departureKm"] } } },

    // 3. one document per route
    {
      $group: {
        _id: { departureSite: "$departureSite", arrivalSite: "$arrivalSite" },
        tripsCount: { $sum: 1 },
        totalKm: { $sum: "$distanceKm" },
        totalLiters: { $sum: "$fuelVolume" },
      },
    },

    // 4. CO2 in tonnes from the totals: liters * 2.68 / 1000
    { $addFields: { co2Tonnes: { $divide: [{ $multiply: ["$totalLiters", 2.68] }, 1000] } } },

    // 5. clean output
    {
      $project: {
        _id: 0,
        departureSite: "$_id.departureSite",
        arrivalSite: "$_id.arrivalSite",
        tripsCount: 1,
        totalKm: 1,
        totalLiters: 1,
        co2Tonnes: { $round: ["$co2Tonnes", 3] },
      },
    },

    // 6. most polluting route first
    { $sort: { co2Tonnes: -1 } },
  ]);
}

module.exports = { getDriverEcoPerformance, getTireHealthMatrix, getFinancialEsg };