// services/orderProcessor.js
const { createTicketData } = require("./ticket");
const { generateTicketPDF } = require("./pdfTicket");
const { sendEmail } = require("./email");
const Ticket = require("../models/Ticket");

/**
 * Process a paid order by creating tickets, generating PDFs, and sending emails
 * Works with Pesapal verified orders
 */
async function processPaidOrder(order) {
  try {
    console.log(`🔄 Processing paid order: ${order.orderRef}`);

    // Avoid duplicate ticket generation
    const alreadyMinted = await Ticket.find({ orderRef: order.orderRef });
    if (alreadyMinted.length > 0) {
      console.log("⚠️ Tickets already minted for this order. Skipping...");
      return;
    }

    // Mint tickets & build attachments
    const { mintedTickets, pdfAttachments } = await createTicketsAndAttachments(order);

    // Customer email
    await sendCustomerEmail(order, mintedTickets, pdfAttachments);

    // Tiny delay
    await delay(600);

    // Admin notification
    await sendAdminNotification(order, mintedTickets);

    console.log(`✅ Order processed and emails sent for ${order.orderRef}`);
  } catch (error) {
    console.error(`❌ Error processing order ${order.orderRef}:`, error);
    throw error;
  }
}

/**
 * Mint tickets and generate PDFs
 */
async function createTicketsAndAttachments(order) {
  const mintedTickets = [];
  const pdfAttachments = [];

  for (const lineItem of order.lineItems) {
    for (let i = 0; i < lineItem.qty; i++) {
      const ticketData = await createTicketData({
        orderRef: order.orderRef,
        type: lineItem.type,
        attendeeName: order.fullName || order.email,
        email: order.email,
      });

      const ticket = await Ticket.create({
        orderRef: ticketData.orderRef,
        ticketCode: ticketData.ticketCode,
        type: ticketData.type,
        attendeeName: ticketData.attendeeName,
        email: ticketData.email,
        qrDataUrl: ticketData.qrDataUrl,
      });

      mintedTickets.push(ticket);

      const pdfBuffer = await generateTicketPDF(ticket, order);
      pdfAttachments.push({
        filename: `GAIN_Ticket_${ticket.ticketCode}.pdf`,
        content: pdfBuffer,
      });
    }
  }

  return { mintedTickets, pdfAttachments };
}

/**
 * Send tickets to the customer
 */
async function sendCustomerEmail(order, mintedTickets, attachments) {
  const customerHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #f8f9fa; padding: 20px; text-align: center;">
        <h1 style="color: #333; margin: 0;">GAIN Tickets</h1>
      </div>

      <div style="padding: 20px;">
        <h2 style="color: #333;">Hi ${order.fullName || "Guest"},</h2>
        <p>Thank you for securing your spot at GAIN 2025! We’ve received your payment via Pesapal, and your ticket is now confirmed.</p>
        <p><strong>Event Date:</strong> Nov 24-25, 2025</p>

        <p>Your tickets are attached as PDFs. Please bring them to the event.</p>

        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Order Ref:</strong> ${order.orderRef}</p>
          <p><strong>Tickets:</strong> ${mintedTickets.length}</p>
        </div>

        <p>See you there,<br/>The GAIN 2025 Team</p>
      </div>
    </div>
  `;

  await sendEmail({
    to: order.email,
    subject: `Your GAIN Ticket(s) — Ref: ${order.orderRef}`,
    html: customerHtml,
    attachments,
  });
}

/**
 * Notify admin about new purchase
 */
async function sendAdminNotification(order, mintedTickets) {
  const adminHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>New Paid Order (Pesapal)</h2>
      <p><strong>Ref:</strong> ${order.orderRef}</p>
      <p><strong>Customer:</strong> ${order.fullName} (${order.email})</p>
      <p><strong>Tickets:</strong> ${mintedTickets.length}</p>
    </div>
  `;

  await sendEmail({
    to: process.env.ADMIN_EMAIL,
    subject: `New GAIN Order — Ref: ${order.orderRef}`,
    html: adminHtml,
  });
}

/**
 * Utility delay
 */
function delay(ms) {
  return new Promise(res => setTimeout(res, ms));
}

module.exports = { processPaidOrder };
