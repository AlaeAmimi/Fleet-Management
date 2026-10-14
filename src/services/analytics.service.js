// $match filters, like find().
// $group collapses many documents into one per _id, and computes totals with $sum, $avg, $max and so on.
// $addFields adds a computed field to each document.
// $lookup joins another collection, like a SQL JOIN.
// $project picks and renames the fields in the output.
// $sort orders the results.

const Trip = require("../models/Trip");

// TODO: build the eco-performance pipeline here
async function getDriverEcoPerformance() {
  return Trip.aggregate([]);
}

module.exports = { getDriverEcoPerformance };