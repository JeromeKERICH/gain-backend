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
        margins: { top: 0, bottom: 0, left: 0, right: 0 }
      });
      const chunks = [];

      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));

      // --- Constants for layout ---
      const pageWidth = doc.page.width;
      const pageHeight = doc.page.height;
      const margin = 40;
      const contentWidth = pageWidth - (margin * 2);
      
      // Colors
      const darkBlue = "#0A1F44";
      const gold = "#D4AF37";
      const lightGold = "#F5E8C8";
      const white = "#FFFFFF";
      const darkText = "#143E37";
      const lightText = "#6C757D";

      // --- BACKGROUND WITH LUXURY PATTERN ---
      // Dark blue background
      doc.rect(0, 0, pageWidth, pageHeight).fill(darkBlue);
      
      // Subtle geometric pattern
      doc.save();
      doc.opacity(0.03);
      doc.fillColor(gold);
      const patternSize = 20;
      const patternSpacing = 30;
      
      for (let x = 0; x < pageWidth; x += patternSpacing) {
        for (let y = 0; y < pageHeight; y += patternSpacing) {
          if ((x + y) % (patternSpacing * 2) === 0) {
            doc.polygon(
              [x, y],
              [x + patternSize, y],
              [x + patternSize/2, y + patternSize]
            ).fill();
          } else {
            doc.circle(x, y, patternSize/2).fill();
          }
        }
      }
      doc.restore();

      // --- HEADER SECTION ---
      // Header background with gold accent
      const headerHeight = 120;
      doc.rect(0, 0, pageWidth, headerHeight).fill(darkBlue);
      doc.rect(0, headerHeight - 10, pageWidth, 15).fill(gold);
      
      // Logo placeholder (in a real implementation, you would use an actual logo image)
      const logoSize = 60;
      const logoX = margin;
      const logoY = (headerHeight - logoSize) / 2;
      
      // Draw a simplified logo representation
      doc.save();
      doc.fillColor(gold);
      doc.circle(logoX + logoSize/2, logoY + logoSize/2, logoSize/2).fill();
      doc.fillColor(darkBlue);
      doc.fontSize(16).font("Helvetica-Bold");
      doc.text("G", logoX + logoSize/2 - 5, logoY + logoSize/2 - 10);
      doc.restore();
      
      // Event title
      doc.fontSize(28).fillColor(white).font("Helvetica-Bold");
      doc.text("GAIN SUMMIT 2025", margin + logoSize + 20, 35);
      
      doc.fontSize(14).fillColor(lightGold).font("Helvetica-Oblique");
      doc.text("Bridging Capital, Catalyzing Growth", margin + logoSize + 20, 65);
      
      // Decorative line under header
      doc.moveTo(margin, headerHeight - 15).lineTo(pageWidth - margin, headerHeight - 15)
        .lineWidth(1).strokeColor(gold).stroke();

      // --- BODY SECTION ---
      const bodyY = headerHeight + 20;
      const bodyHeight = pageHeight - headerHeight - 120;
      
      // Main content area with white background
      doc.roundedRect(margin, bodyY, contentWidth, bodyHeight, 10)
        .fill(white);
      
      // Ticket type badge
      const ticketType = ticket.type || "BUSINESS";
      const badgeWidth = 140;
      const badgeX = pageWidth - margin - badgeWidth - 10;
      
      doc.roundedRect(badgeX, bodyY + 20, badgeWidth, 35, 5)
        .fill(ticketType === "VIP" ? gold : darkBlue);
      
      doc.fontSize(14).fillColor(ticketType === "VIP" ? darkBlue : white)
        .font("Helvetica-Bold");
      doc.text(`${ticketType} ACCESS`, badgeX + 10, bodyY + 30);
      
      // Ticket details section
      const detailsY = bodyY + 70;
      
      // Section title
      doc.fontSize(16).fillColor(darkBlue).font("Helvetica-Bold");
      doc.text("TICKET DETAILS", margin + 20, detailsY);
      
      // Decorative line under section title
      doc.moveTo(margin + 20, detailsY + 20).lineTo(margin + 180, detailsY + 20)
        .lineWidth(2).strokeColor(gold).stroke();
      
      // Ticket information
      doc.fontSize(12).fillColor(darkText).font("Helvetica");
      const lineHeight = 25;
      let currentY = detailsY + 40;
      
      doc.text("TICKET HOLDER:", margin + 20, currentY);
      doc.font("Helvetica-Bold").text(ticket.attendeeName || "Guest", margin + 120, currentY);
      
      currentY += lineHeight;
      doc.font("Helvetica").text("TICKET CODE:", margin + 20, currentY);
      doc.font("Helvetica-Bold").text(ticket.ticketCode, margin + 120, currentY);
      
      currentY += lineHeight;
      doc.font("Helvetica").text("ORDER REF:", margin + 20, currentY);
      doc.font("Helvetica-Bold").text(order.orderRef, margin + 120, currentY);
      
      currentY += lineHeight;
      doc.font("Helvetica").text("EVENT DATE:", margin + 20, currentY);
      doc.font("Helvetica-Bold").text("November 24-25, 2025", margin + 120, currentY);
      
      currentY += lineHeight;
      doc.font("Helvetica").text("LOCATION:", margin + 20, currentY);
      doc.font("Helvetica-Bold").text("Al Habtoor Palace, Dubai", margin + 120, currentY);
      
      // QR Code area
      const qrSize = 150;
      const qrX = pageWidth - margin - qrSize - 20;
      const qrY = detailsY + 40;
      
      // QR code container with decorative border
      doc.save();
      doc.lineWidth(2);
      doc.strokeColor(gold);
      doc.roundedRect(qrX, qrY, qrSize, qrSize, 5).stroke();
      
      // Add corner decorations to QR container
      const cornerLength = 15;
      doc.lineWidth(1.5);
      
      // Top-left corner
      doc.moveTo(qrX, qrY + cornerLength).lineTo(qrX, qrY).lineTo(qrX + cornerLength, qrY);
      // Top-right corner
      doc.moveTo(qrX + qrSize - cornerLength, qrY).lineTo(qrX + qrSize, qrY).lineTo(qrX + qrSize, qrY + cornerLength);
      // Bottom-left corner
      doc.moveTo(qrX, qrY + qrSize - cornerLength).lineTo(qrX, qrY + qrSize).lineTo(qrX + cornerLength, qrY + qrSize);
      // Bottom-right corner
      doc.moveTo(qrX + qrSize - cornerLength, qrY + qrSize).lineTo(qrX + qrSize, qrY + qrSize).lineTo(qrX + qrSize, qrY + qrSize - cornerLength);
      
      doc.stroke();
      doc.restore();
      
      // Add QR code or placeholder
      if (ticket.qrDataUrl) {
        try {
          doc.image(ticket.qrDataUrl, qrX + 5, qrY + 5, {
            width: qrSize - 10,
            height: qrSize - 10
          });
        } catch (err) {
          console.warn("QR image not added:", err.message);
          // Draw placeholder if QR code fails
          doc.rect(qrX + 5, qrY + 5, qrSize - 10, qrSize - 10)
            .fill("#EEEEEE");
          doc.fontSize(10).fillColor(lightText).text("QR CODE", 
            qrX + qrSize/2, qrY + qrSize/2 - 5, { width: qrSize - 10, align: "center" });
        }
      }
      
      // "Scan Me" label
      doc.fontSize(10).fillColor(darkBlue).font("Helvetica-Bold");
      doc.text("SCAN FOR ENTRY", qrX, qrY + qrSize + 10, { width: qrSize, align: "center" });

      // --- FOOTER SECTION ---
      const footerY = pageHeight - 80;
      
      // Footer background
      doc.rect(0, footerY, pageWidth, 80).fill(darkBlue);
      
      // Top border of footer
      doc.moveTo(margin, footerY).lineTo(pageWidth - margin, footerY)
        .lineWidth(2).strokeColor(gold).stroke();
      
      // Footer content
      doc.fontSize(10).fillColor(white).font("Helvetica");
      
      // Terms text
      doc.text("This ticket is non-transferable without prior authorization. Please present this ticket at registration for entry.", 
        margin, footerY + 15, { width: contentWidth, align: "center" });
      
      // Contact information
      doc.text("Questions? Contact: contact@gulfafricanexus.com | +971 58 100 9603 / +971 52 240 7930", 
        margin, footerY + 40, { width: contentWidth, align: "center" });
      
      // Copyright
      doc.text("© 2025 GAIN Summit. All Rights Reserved.", 
        margin, footerY + 55, { width: contentWidth, align: "center" });
      
      // Luxury seal in bottom right
      const sealSize = 50;
      const sealX = pageWidth - margin - sealSize;
      const sealY = footerY - sealSize/2;
      
      doc.circle(sealX, sealY, sealSize/2)
        .fill(gold);
      
      doc.fontSize(8).fillColor(darkBlue).font("Helvetica-Bold");
      doc.text("OFFICIAL", sealX, sealY - 8, { align: "center" });
      doc.text("TICKET", sealX, sealY + 2, { align: "center" });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = { generateTicketPDF };