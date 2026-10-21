const { getDriverEcoPerformance, getTireHealthMatrix, getFinancialEsg } = require("../services/analytics.service");

async function driversEcoPerformance(req, res) {
    const data = await getDriverEcoPerformance();
    res.status(200).json({ success: true, count: data.length, data });
}
async function tiresHealthMatrix(req, res) {
    const data = await getTireHealthMatrix();
    res.status(200).json({ success: true, count: data.length, data });
}
async function tripsFinancialEsg(req, res) {
    const startDate = req.query.startDate ? new Date(req.query.startDate) : null;
    const endDate = req.query.endDate ? new Date(req.query.endDate) : null;

    if ((startDate && isNaN(startDate)) || (endDate && isNaN(endDate))) {
        return res.status(400).json({ success: false, message: "startDate ou endDate invalide (format ISO attendu)" });
    }
    if (startDate && endDate && startDate > endDate) {
        return res.status(400).json({ success: false, message: "startDate doit être antérieure à endDate" });
    }

    const data = await getFinancialEsg({ startDate, endDate });
    res.status(200).json({ success: true, count: data.length, data });
}

module.exports = { driversEcoPerformance, tiresHealthMatrix, tripsFinancialEsg };

