const router = require("express").Router();
const { authenticateToken, requireRole } = require("../middlewares/auth");
const { driversEcoPerformance } = require("../controllers/analytics.controller");
const { tiresHealthMatrix } = require("../controllers/analytics.controller");
const { tripsFinancialEsg } = require("../controllers/analytics.controller");

router.get("/drivers/eco-performance", authenticateToken, requireRole("admin"), driversEcoPerformance);
router.get("/tires/health-matrix", authenticateToken, requireRole("admin"), tiresHealthMatrix);
router.get("/trips/financial-esg", authenticateToken, requireRole("admin"), tripsFinancialEsg);
module.exports = router;