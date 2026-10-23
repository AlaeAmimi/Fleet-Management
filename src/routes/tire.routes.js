const router = require("express").Router();
const { authenticateToken, requireRole } = require("../middlewares/auth");
const validate = require("../middlewares/validate");
const schemas = require("../validators/schemas");
const {
    createTire,
    getAllTires,
    getTireById,
    updateTire,
    assignTireToTruck
} = require("../controllers/tire.controller");

router.post("/", authenticateToken, requireRole("admin"), validate(schemas.createTire), createTire);
router.get("/", authenticateToken, getAllTires);
router.get("/:id", authenticateToken, getTireById);
router.put("/:id", authenticateToken, requireRole("admin"), validate(schemas.updateTire), updateTire);
router.patch("/:id/assign", authenticateToken, requireRole("admin"), validate(schemas.assignTire), assignTireToTruck);

module.exports = router;