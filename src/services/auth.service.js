const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const AppError = require("../utils/appError");

function signToken(user) {
    return jwt.sign(
        { id: user._id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || "1h" }
    );
}

async function login(email, password) {
    if (!email || !password) {
        throw new AppError("Email et mot de passe requis", 400);
    }

    const user = await User.findOne({ email });
    if (!user) {
        throw new AppError("Email ou mot de passe incorrect", 401);
    }

    const passwordMatches = await bcrypt.compare(password, user.password);
    if (!passwordMatches) {
        throw new AppError("Email ou mot de passe incorrect", 401);
    }

    if (user.suspended) {
        throw new AppError("Ce compte est suspendu", 403);
    }

    return {
        token: signToken(user),
        user: { id: user._id, email: user.email, role: user.role },
    };
}

module.exports = { signToken, login };