const router = require("express").Router();
const { authenticateToken, requireRole } = require("../middlewares/auth");
const validate = require("../middlewares/validate");
const schemas = require("../validators/schemas");
const {
    createTrip,
    getAllTrips,
    getTripById,
    updateTripStatus,
    recordTripData,
    getMissionOrder
} = require("../controllers/trip.controller");

router.post("/", authenticateToken, requireRole("admin"), validate(schemas.createTrip), createTrip);
router.get("/", authenticateToken, getAllTrips);
router.get("/:id", authenticateToken, getTripById);
router.get("/:id/mission-order", authenticateToken, getMissionOrder);
router.patch("/:id/status", authenticateToken, validate(schemas.tripStatus), updateTripStatus);
router.patch("/:id/data", authenticateToken, validate(schemas.tripData), recordTripData);

module.exports = router;