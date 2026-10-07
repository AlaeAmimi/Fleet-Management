const router = require("express").Router();
const { authenticateToken, requireRole } = require("../middlewares/auth");
const { createTrip, getAllTrips, getTripById, updateTripStatus, recordTripData } = require("../controllers/trip.controller");

router.post("/", authenticateToken, requireRole("admin"), createTrip);
router.get("/", authenticateToken, getAllTrips);
router.get("/:id", authenticateToken, getTripById);
router.patch("/:id/status", authenticateToken, updateTripStatus);
router.patch("/:id/data", authenticateToken, recordTripData);

module.exports = router;