const router = require("express").Router();
const { authenticateToken, requireRole } = require("../middlewares/auth");
const {
    createTrailer,
    getAllTrailers,
    getTrailerById,
    updateTrailer,
    archiveTrailer
} = require("../controllers/trailer.controller");

router.post("/", authenticateToken, requireRole("admin"), createTrailer);
router.get("/", authenticateToken, getAllTrailers);
router.get("/:id", authenticateToken, getTrailerById);
router.put("/:id", authenticateToken, requireRole("admin"), updateTrailer);
router.patch("/:id/archive", authenticateToken, requireRole("admin"), archiveTrailer);

module.exports = router;