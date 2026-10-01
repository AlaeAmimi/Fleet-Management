const bcrypt = require("bcryptjs");
const User = require("../models/User");

async function createChauffeur(req, res) {
    const { firstName, lastName, email, password } = req.body;

    if (!firstName || !lastName || !email || !password) {
        return res.status(400).json({
            success: false,
            message: "Tous les champs sont requis"
        });
    }

    const existing = await User.findOne({ email });
    if (existing) {
        return res.status(409).json({
            success: false,
            message: "Un compte avec cet email existe déjà"
        });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const chauffeur = await User.create({
        firstName,
        lastName,
        email,
        password: hashedPassword,
        role: "chauffeur"
    });

    res.status(201).json({
        success: true,
        user: {
            id: chauffeur._id,
            email: chauffeur.email,
            role: chauffeur.role
        }
    });
}

module.exports = { createChauffeur };