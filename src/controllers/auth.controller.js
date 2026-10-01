const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

async function login(req, res) {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({
            success: false,
            message: "Email et mot de passe requis"
        });
    }

    const user = await User.findOne({ email });

    if (!user) {
        return res.status(401).json({
            success: false,
            message: "Email ou mot de passe incorrect"
        });
    }

    const passwordMatches = await bcrypt.compare(password, user.password);

    if (!passwordMatches) {
        return res.status(401).json({
            success: false,
            message: "Email ou mot de passe incorrect"
        });
    }

    if (user.suspended) {
        return res.status(403).json({
            success: false,
            message: "Ce compte est suspendu"
        });
    }

    const token = jwt.sign(
        { id: user._id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || "1h" }
    );

    res.status(200).json({
        success: true,
        token,
        user: {
            id: user._id,
            email: user.email,
            role: user.role
        }
    });
}

module.exports = { login };