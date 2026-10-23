const router = require("express").Router();
const { authenticateToken, requireRole } = require("../middlewares/auth");
const validate = require("../middlewares/validate");
const schemas = require("../validators/schemas");
const { createChauffeur } = require("../controllers/user.controller");

router.post(
    "/chauffeurs",
    authenticateToken,
    requireRole("admin"),
    validate(schemas.createChauffeur),
    createChauffeur
);

module.exports = router;