const router = require("express").Router();
const { authenticateToken, requireRole } = require("../middlewares/auth");
const validate = require("../middlewares/validate");
const schemas = require("../validators/schemas");
const {
    createTrailer,
    getAllTrailers,
    getTrailerById,
    updateTrailer,
    archiveTrailer
} = require("../controllers/trailer.controller");

router.post("/", authenticateToken, requireRole("admin"), validate(schemas.createTrailer), createTrailer);
router.get("/", authenticateToken, getAllTrailers);
router.get("/:id", authenticateToken, getTrailerById);
router.put("/:id", authenticateToken, requireRole("admin"), validate(schemas.updateTrailer), updateTrailer);
router.patch("/:id/archive", authenticateToken, requireRole("admin"), archiveTrailer);

module.exports = router;