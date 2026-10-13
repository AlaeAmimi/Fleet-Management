const router = require("express").Router();
const { login } = require("../controllers/auth.controller");
const validate = require("../middlewares/validate");
const schemas = require("../validators/schemas");

router.post("/login", validate(schemas.login), login);

router.post("/login", login);

module.exports = router;