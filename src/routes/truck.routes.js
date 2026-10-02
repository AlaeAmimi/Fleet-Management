const router = require("express").Router();
const { authenticateToken, requireRole } = require("../middlewares/auth");
const {createTruck, getAllTrucks, getTruckById, updateTruck, archiveTruck} = require("../controllers/truck.controller");

router.post("/", authenticateToken, requireRole("admin"), createTruck);
router.get("/", authenticateToken, getAllTrucks);
router.get("/:id", authenticateToken, getTruckById);
router.put("/:id", authenticateToken, requireRole("admin"), updateTruck);
router.patch("/:id/archive", authenticateToken, requireRole("admin"), archiveTruck);

module.exports = router;