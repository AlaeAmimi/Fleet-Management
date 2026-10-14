const router = require("express").Router();
const { authenticateToken, requireRole } = require("../middlewares/auth");
const {createTire, getAllTires, getTireById, updateTire, assignTireToTruck} = require("../controllers/tire.controller");

router.post("/", authenticateToken, requireRole("admin"), createTire);
router.get("/", authenticateToken, getAllTires);
router.get("/:id", authenticateToken, getTireById);
router.put("/:id", authenticateToken, requireRole("admin"), updateTire);
router.patch("/:id/assign", authenticateToken, requireRole("admin"), assignTireToTruck);
module.exports = router;