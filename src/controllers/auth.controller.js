const authService = require("../services/auth.service");

async function login(req, res) {
    const { email, password } = req.body;
    const result = await authService.login(email, password);
    res.status(200).json({ success: true, ...result });
}

module.exports = { login };