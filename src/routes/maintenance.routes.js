const router = require("express").Router();
const { authenticateToken, requireRole } = require("../middlewares/auth");
const validate = require("../middlewares/validate");
const schemas = require("../validators/schemas");
const { setRule, getRules, getAlerts, resolveAlert } = require("../controllers/maintenance.controller");

router.post("/rules", authenticateToken, requireRole("admin"), validate(schemas.maintenanceRule), setRule);
router.get("/rules", authenticateToken, getRules);
router.get("/alerts", authenticateToken, requireRole("admin"), getAlerts);
router.patch("/alerts/:id/resolve", authenticateToken, requireRole("admin"), resolveAlert);

module.exports = router;