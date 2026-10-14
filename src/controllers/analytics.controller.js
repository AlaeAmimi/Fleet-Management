const { getDriverEcoPerformance } = require("../services/analytics.service");

async function driversEcoPerformance(req, res) {
    const data = await getDriverEcoPerformance();
    res.status(200).json({ success: true, count: data.length, data });
}

module.exports = { driversEcoPerformance };