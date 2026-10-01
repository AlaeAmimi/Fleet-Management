const jwt = require("jsonwebtoken");

function authenticateToken(req, res, next) {
    const authHeader = req.headers["authorization"];

    if (!authHeader) {
        return res.status(401).json({
            success: false,
            message: "Token manquant"
        });
    }

    const parts = authHeader.split(" ");

    if (parts.length !== 2 || parts[0] !== "Bearer" || !parts[1]) {
        return res.status(401).json({
            success: false,
            message: "Format Authorization invalide"
        });
    }

    const token = parts[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        if (err.name === "TokenExpiredError") {
            return res.status(403).json({
                success: false,
                message: "Le jeton a expiré, veuillez vous reconnecter"
            });
        }
        if (err.name === "JsonWebTokenError") {
            return res.status(403).json({
                success: false,
                message: "Signature de jeton invalide"
            });
        }
        return res.status(403).json({
            success: false,
            message: "Token invalide"
        });
    }
}

function requireRole(role) {
    return (req, res, next) => {
        if (req.user.role !== role) {
            return res.status(403).json({
                success: false,
                message: "Accès refusé : privilèges insuffisants"
            });
        }
        next();
    };
}

module.exports = {
    authenticateToken,
    requireRole
};