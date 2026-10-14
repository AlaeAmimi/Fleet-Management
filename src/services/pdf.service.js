const PDFDocument = require("pdfkit");

function formatDate(date) {
    return new Date(date).toLocaleString("fr-FR", { timeZone: "Africa/Casablanca" });
}

// Builds the mission order PDF and returns it as a Buffer (nothing is written to disk)
function generateMissionOrderPdf(trip) {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ margin: 50 });
        const chunks = [];

        doc.on("data", (chunk) => chunks.push(chunk));
        doc.on("end", () => resolve(Buffer.concat(chunks)));
        doc.on("error", reject);

        doc.fontSize(20).text("ORDRE DE MISSION", { align: "center" });
        doc.moveDown(0.5);
        doc.fontSize(12).text(`Référence : ${trip.reference}`, { align: "center" });
        doc.moveDown(2);

        doc.fontSize(14).text("Trajet", { underline: true });
        doc.fontSize(12);
        doc.text(`Départ : ${trip.departureSite}`);
        doc.text(`Arrivée : ${trip.arrivalSite}`);
        doc.text(`Marchandise : ${trip.cargo}`);
        doc.text(`Début prévu : ${formatDate(trip.plannedStartDate)}`);
        doc.text(`Fin prévue : ${formatDate(trip.plannedEndDate)}`);
        doc.moveDown();

        doc.fontSize(14).text("Chauffeur", { underline: true });
        doc.fontSize(12);
        doc.text(`${trip.driver.firstName} ${trip.driver.lastName}`);
        doc.text(`Email : ${trip.driver.email}`);
        doc.moveDown();

        doc.fontSize(14).text("Véhicules", { underline: true });
        doc.fontSize(12);
        doc.text(`Camion : ${trip.truck.plateNumber} (${trip.truck.brand} ${trip.truck.model})`);
        doc.text(`Remorque : ${trip.trailer.plateNumber} (${trip.trailer.type})`);
        doc.moveDown(3);

        doc.text("Signature du chauffeur : ______________________");
        doc.moveDown();
        doc.text("Cachet de l'entreprise : ______________________");

        doc.end();
    });
}

module.exports = { generateMissionOrderPdf };