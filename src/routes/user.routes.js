const router = require("express").Router();
const { authenticateToken, requireRole } = require("../middlewares/auth");
const { createChauffeur } = require("../controllers/user.controller");

router.post("/chauffeurs", authenticateToken, requireRole("admin"), createChauffeur);

module.exports = router;