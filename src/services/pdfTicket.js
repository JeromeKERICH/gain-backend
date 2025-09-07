// services/pdfTicket.js
const PDFDocument = require("pdfkit");
const fs = require("fs");

/**
 * Generate a luxurious ticket PDF as a Buffer
 */
async function generateTicketPDF(ticket, order) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: [600, 800], // Custom size for ticket
        margins: { top: 40, bottom: 40, left: 40, right: 40 }
      });
      const chunks = [];

      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));

      // Set background color
      doc.rect(0, 0, doc.page.width, doc.page.height).fill("#0A1F44"); // Dark blue background

      // Add decorative gold elements
      const drawGoldDecoration = () => {
        doc.save();
        // Gold border
        doc.lineWidth(3);
        doc.strokeColor("#D4AF37");
        doc.roundedRect(20, 20, doc.page.width - 40, doc.page.height - 40, 10).stroke();
        
        // Gold corner decorations
        const cornerSize = 30;
        doc.lineWidth(2);
        
        // Top-left corner
        doc.moveTo(20, 50).lineTo(50, 20).stroke();
        doc.moveTo(20, 70).lineTo(70, 20).stroke();
        
        // Top-right corner
        doc.moveTo(doc.page.width - 20, 50).lineTo(doc.page.width - 50, 20).stroke();
        doc.moveTo(doc.page.width - 20, 70).lineTo(doc.page.width - 70, 20).stroke();
        
        // Bottom-left corner
        doc.moveTo(20, doc.page.height - 50).lineTo(50, doc.page.height - 20).stroke();
        doc.moveTo(20, doc.page.height - 70).lineTo(70, doc.page.height - 20).stroke();
        
        // Bottom-right corner
        doc.moveTo(doc.page.width - 20, doc.page.height - 50).lineTo(doc.page.width - 50, doc.page.height - 20).stroke();
        doc.moveTo(doc.page.width - 20, doc.page.height - 70).lineTo(doc.page.width - 70, doc.page.height - 20).stroke();
        
        doc.restore();
      };

      drawGoldDecoration();

      // Add luxury pattern in the background (subtle)
      const drawLuxuryPattern = () => {
        doc.save();
        doc.opacity(0.05);
        doc.fillColor("#D4AF37");
        
        for (let i = 0; i < 20; i++) {
          for (let j = 0; j < 20; j++) {
            if ((i + j) % 2 === 0) {
              doc.circle(30 + i * 30, 30 + j * 30, 2).fill();
            }
          }
        }
        doc.restore();
      };

      drawLuxuryPattern();

      // Main content area with white background
      doc.roundedRect(40, 40, doc.page.width - 80, doc.page.height - 80, 8)
        .fill("#FFFFFF");

      // --- Header ---
      doc.fontSize(28).fillColor("#0A1F44").font("Helvetica-Bold");
    
      doc.text("GAIN SUMMIT 2025", { align: "center", top: 30, y: 60 });
      
      doc.fontSize(16).fillColor("#D4AF37").font("Helvetica-Oblique");
      doc.text("Bridging Capital, Catalyzing Growth", { align: "center", y: 90 });
      
      // Decorative line
      doc.moveTo(100, 110).lineTo(doc.page.width - 100, 110)
        .lineWidth(2).strokeColor("#D4AF37").stroke();

      // --- Ticket Type Badge ---
      const ticketType = ticket.type || "BUSINESS";
      doc.roundedRect(doc.page.width / 2 - 80, 125, 160, 40, 5)
        .fill(ticketType === "VIP" ? "#D4AF37" : "#143E37");
      
      doc.fontSize(16).fillColor(ticketType === "VIP" ? "#0A1F44" : "#FFFFFF")
        .font("Helvetica-Bold");
      doc.text(`${ticketType} ACCESS`, { align: "center", y: 135 });

      // --- Ticket Details ---
      doc.fontSize(12).fillColor("#333333").font("Helvetica");
      
      const detailsY = 190;
      doc.text("TICKET HOLDER", 60, detailsY);
      doc.font("Helvetica-Bold").text(ticket.attendeeName || "Guest", 220, detailsY);
      
      doc.font("Helvetica").text("TICKET CODE", 60, detailsY + 30);
      doc.font("Helvetica-Bold").text(ticket.ticketCode, 220, detailsY + 30);
      
      doc.font("Helvetica").text("ORDER REFERENCE", 60, detailsY + 60);
      doc.font("Helvetica-Bold").text(order.orderRef, 220, detailsY + 60);
      
      doc.font("Helvetica").text("EVENT DATE", 60, detailsY + 90);
      doc.font("Helvetica-Bold").text("November 24-25, 2025", 220, detailsY + 90);
      
      doc.font("Helvetica").text("LOCATION", 60, detailsY + 120);
      doc.font("Helvetica-Bold").text("Al Habtoor Palace, Dubai", 220, detailsY + 120);
      

      // --- QR Code Area ---
      if (ticket.qrDataUrl) {
        try {
          doc.image(ticket.qrDataUrl, doc.page.width / 2 - 75, detailsY + 170, {
            fit: [150, 150],
            align: "center"
          });
        } catch (err) {
          console.warn("QR image not added:", err.message);
          // Draw placeholder if QR code fails
          doc.rect(doc.page.width / 2 - 75, detailsY + 170, 150, 150)
            .fill("#EEEEEE");
          doc.fontSize(10).fillColor("#999999").text("QR CODE", 
            doc.page.width / 2 - 75, detailsY + 240, { width: 150, align: "center" });
        }
      }

      
      
    

      // --- Footer ---
      doc.fontSize(10).fillColor("#666666").font("Helvetica");
      doc.text("This ticket is non-transferable without prior authorization.", 
        { align: "center", y: doc.page.height - 60 });
      doc.text("Present this ticket at registration for entry.", 
        { align: "center", y: doc.page.height - 45 });

      // Add luxury seal
      doc.circle(doc.page.width - 70, doc.page.height - 70, 20)
        .fill("#D4AF37");
      doc.fontSize(8).fillColor("#0A1F44").font("Helvetica-Bold");
      doc.text("GAIN", doc.page.width - 70, doc.page.height - 72, { align: "center" });
      doc.text("2025", doc.page.width - 70, doc.page.height - 62, { align: "center" });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = { generateTicketPDF };