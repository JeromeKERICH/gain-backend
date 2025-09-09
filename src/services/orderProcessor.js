// services/orderProcessor.js
const { createTicketData } = require("./ticket");
const { generateTicketPDF } = require("./pdfTicket");
const { sendEmail } = require("./email");
const Ticket = require("../models/Ticket");

/**
 * Process a paid order by creating tickets, generating PDFs, and sending emails
 * @param {Object} order - The order object to process
 * @returns {Promise<void>}
 */
async function processPaidOrder(order) {
  try {
    console.log(`🔄 Processing paid order: ${order.orderRef}`);

    // Check if tickets already exist for this order
    const alreadyMinted = await Ticket.find({ orderRef: order.orderRef });
    if (alreadyMinted.length > 0) {
      console.log("⚠️ Tickets already minted for this order. Skipping...");
      return;
    }

    // Create tickets and PDF attachments
    const { mintedTickets, pdfAttachments } = await createTicketsAndAttachments(order);
    
    // Send email to customer with tickets
    await sendCustomerEmail(order, mintedTickets, pdfAttachments);
    
    // Brief delay to respect email rate limits
    await delay(600);
    
    // Send notification to admin
    await sendAdminNotification(order, mintedTickets);
    
    console.log(`✅ Order processed and emails sent for ${order.orderRef}`);
  } catch (error) {
    console.error(`❌ Error processing order ${order.orderRef}:`, error);
    throw error;
  }
}

/**
 * Create tickets and PDF attachments for an order
 * @param {Object} order - The order object
 * @returns {Promise<Object>} Object containing minted tickets and PDF attachments
 */
async function createTicketsAndAttachments(order) {
  const mintedTickets = [];
  const pdfAttachments = [];

  for (const lineItem of order.lineItems) {
    for (let i = 0; i < lineItem.qty; i++) {
      // Create ticket data
      const ticketData = await createTicketData({
        orderRef: order.orderRef,
        type: lineItem.type,
        attendeeName: order.fullName || order.email,
        email: order.email,
      });

      // Save ticket to database
      const ticket = await Ticket.create({
        orderRef: ticketData.orderRef,
        ticketCode: ticketData.ticketCode,
        type: ticketData.type,
        attendeeName: ticketData.attendeeName,
        email: ticketData.email,
        qrDataUrl: ticketData.qrDataUrl,
      });

      mintedTickets.push(ticket);

      // Generate PDF and add to attachments
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
 * Send email to customer with their tickets
 * @param {Object} order - The order object
 * @param {Array} mintedTickets - Array of minted tickets
 * @param {Array} attachments - Array of PDF attachments
 * @returns {Promise<void>}
 */
async function sendCustomerEmail(order, mintedTickets, attachments) {
  const customerHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #f8f9fa; padding: 20px; text-align: center;">
        <h1 style="color: #333; margin: 0;">GAIN Tickets</h1>
      </div>
      
      <div style="padding: 20px;">
        <h2 style="color: #333;">Hi ${order.fullName || "Guest"},</h2>
        <p>Thank you for securing your spot at GAIN 2025! We’ve received your payment, and your ticket is now confirmed.</p>
        <p>Here are your GAIN Summit 2025 tickets:</p>
        <p><strong>Event Date:</strong> Nov 24-25, 2025</p>
        <p>We can’t wait to welcome you to a transformative experience filled with opportunities, connections, and inspiration.</p>

    
        
        <p>See you there! <br/>
        <p>The GAIN 2025 Team</p>
        
        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p style="margin: 5px 0;"><strong>Order Reference:</strong> ${order.orderRef}</p>
          <p style="margin: 5px 0;"><strong>Number of Tickets:</strong> ${mintedTickets.length}</p>
        </div>
        
    
        
        <p>Your tickets are attached as PDFs. Please bring them to the event.</p>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
          <p style="color: #777; font-size: 14px;">If you have any questions, please contact our support team.</p>
        </div>
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
 * Send admin notification about new order
 * @param {Object} order - The order object
 * @param {Array} mintedTickets - Array of minted tickets
 * @returns {Promise<void>}
 */
async function sendAdminNotification(order, mintedTickets) {
  const adminHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #f8f9fa; padding: 20px; text-align: center;">
        <h1 style="color: #333; margin: 0;">New Order Received</h1>
      </div>
      
      <div style="padding: 20px;">
        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p style="margin: 5px 0;"><strong>Order Reference:</strong> ${order.orderRef}</p>
          <p style="margin: 5px 0;"><strong>Customer Name:</strong> ${order.fullName}</p>
          <p style="margin: 5px 0;"><strong>Email:</strong> ${order.email}</p>
          <p style="margin: 5px 0;"><strong>Phone:</strong> ${order.phone || "-"}</p>
          <p style="margin: 5px 0;"><strong>Country:</strong> ${order.country || "-"}</p>
          <p style="margin: 5px 0;"><strong>Company:</strong> ${order.company || "-"}</p>
          <p style="margin: 5px 0;"><strong>Number of Tickets:</strong> ${mintedTickets.length}</p>
        </div>
        
        <h3 style="color: #333;">Ticket Details:</h3>
        ${mintedTickets.map(ticket => `
          <div style="border: 1px solid #ddd; border-radius: 5px; padding: 10px; margin: 10px 0;">
            <p style="margin: 5px 0;"><strong>Type:</strong> ${ticket.type}</p>
            <p style="margin: 5px 0;"><strong>Code:</strong> ${ticket.ticketCode}</p>
          </div>
        `).join('')}
      </div>
    </div>
  `;

  await sendEmail({
    to: process.env.ADMIN_EMAIL,
    subject: `New GAIN Order — Ref: ${order.orderRef}`,
    html: adminHtml,
  });
}

/**
 * Utility function to delay execution
 * @param {number} ms - Milliseconds to delay
 * @returns {Promise}
 */
function delay(ms) {
  return new Promise(res => setTimeout(res, ms));
}

module.exports = { processPaidOrder };