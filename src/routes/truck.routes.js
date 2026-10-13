const router = require("express").Router();
const { authenticateToken, requireRole } = require("../middlewares/auth");
const {createTruck, getAllTrucks, getTruckById, updateTruck, archiveTruck} = require("../controllers/truck.controller");
const validate = require("../middlewares/validate");
const schemas = require("../validators/schemas");

router.post("/", authenticateToken, requireRole("admin"), validate(schemas.createTruck), createTruck);
router.put("/:id", authenticateToken, requireRole("admin"), validate(schemas.updateTruck), updateTruck);

router.post("/", authenticateToken, requireRole("admin"), createTruck);
router.get("/", authenticateToken, getAllTrucks);
router.get("/:id", authenticateToken, getTruckById);
router.put("/:id", authenticateToken, requireRole("admin"), updateTruck);
router.patch("/:id/archive", authenticateToken, requireRole("admin"), archiveTruck);

module.exports = router;