const router = require("express").Router();
const { authenticateToken, requireRole } = require("../middlewares/auth");
const { driversEcoPerformance } = require("../controllers/analytics.controller");

router.get(
    "/drivers/eco-performance",
    authenticateToken,
    requireRole("admin"),
    driversEcoPerformance
);

module.exports = router;