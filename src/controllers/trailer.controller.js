const Trailer = require("../models/Trailer");

async function createTrailer(req, res) {
    const { plateNumber, type } = req.body;

    if (!plateNumber || !type) {
        return res.status(400).json({
            success: false,
            message: "plateNumber et type sont requis"
        });
    }

    const existing = await Trailer.findOne({ plateNumber: plateNumber.toUpperCase() });
    if (existing) {
        return res.status(409).json({
            success: false,
            message: "Une remorque avec cette plaque existe déjà"
        });
    }

    const trailer = await Trailer.create({
        plateNumber: plateNumber.toUpperCase(),
        type
    });

    res.status(201).json({ success: true, trailer });
}

async function getAllTrailers(req, res) {
    const { status, archived } = req.query;

    const filter = {};
    if (status) filter.status = status;
    filter.archived = archived === "true";

    const trailers = await Trailer.find(filter);
    res.status(200).json({ success: true, count: trailers.length, trailers });
}

async function getTrailerById(req, res) {
    const trailer = await Trailer.findById(req.params.id);

    if (!trailer) {
        return res.status(404).json({ success: false, message: "Remorque introuvable" });
    }

    res.status(200).json({ success: true, trailer });
}

async function updateTrailer(req, res) {
    const trailer = await Trailer.findById(req.params.id);

    if (!trailer) {
        return res.status(404).json({ success: false, message: "Remorque introuvable" });
    }

    const { type, status } = req.body;

    if (type) trailer.type = type;
    if (status) trailer.status = status;

    await trailer.save();

    res.status(200).json({ success: true, trailer });
}

async function archiveTrailer(req, res) {
    const trailer = await Trailer.findById(req.params.id);

    if (!trailer) {
        return res.status(404).json({ success: false, message: "Remorque introuvable" });
    }

    trailer.archived = true;
    await trailer.save();

    res.status(200).json({ success: true, message: "Remorque archivée", trailer });
}

module.exports = {
    createTrailer,
    getAllTrailers,
    getTrailerById,
    updateTrailer,
    archiveTrailer
};