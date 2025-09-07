// services/orderProcessor.js
const { createTicketData } = require("./ticket");
const { generateTicketPDF } = require("./pdfTicket");

const { sendEmail } = require("./email");
const Ticket = require("../models/Ticket");

async function processPaidOrder(order) {
  console.log(`Processing paid order: ${order.orderRef}`);

  const alreadyMinted = await Ticket.find({ orderRef: order.orderRef });
if (alreadyMinted.length > 0) {
  console.log("⚠️ Tickets already minted for this order. Skipping...");
  return;
}


  const minted = [];
  const attachments = [];

  for (const li of order.lineItems) {
    for (let i = 0; i < li.qty; i++) {
      const td = await createTicketData({
        orderRef: order.orderRef,
        type: li.type,
        attendeeName: order.fullName || order.email,
        email: order.email,
      });

      const ticket = await Ticket.create({
        orderRef: td.orderRef,
        ticketCode: td.ticketCode,
        type: td.type,
        attendeeName: td.attendeeName,
        email: td.email,
        qrDataUrl: td.qrDataUrl,
      });

      minted.push(ticket);

      // ✅ No base64 conversion — just keep as Buffer
      const pdfBuffer = await generateTicketPDF(ticket, order);
      attachments.push({
        filename: `GAIN_Ticket_${ticket.ticketCode}.pdf`,
        content: pdfBuffer,
      });
    }
  }

  // --- Email to Customer ---
  const customerHtml = `
    <h2>Your GAIN Ticket(s)</h2>
    <p>Hi ${order.fullName || "Guest"},</p>
    <p>Your payment was successful! 🎉</p>
    <p><b>Order Ref:</b> ${order.orderRef}</p>
    <p><b>Tickets:</b> ${minted.length}</p>
    <hr/>
    ${minted
      .map(
        (t) => `
      <div>
        <strong>${t.type}</strong> — Code: ${t.ticketCode}<br/>
        <img src="${t.qrDataUrl}" style="max-width:150px"/>
      </div>
    `
      )
      .join("")}
    <p>Your tickets are attached as PDFs. Please bring them to the event.</p>
  `;

  await sendEmail({
    to: order.email,
    subject: `🎟️ Your GAIN Ticket(s) — Ref: ${order.orderRef}`,
    html: customerHtml,
    attachments,
  });

  function delay(ms) {
    return new Promise(res => setTimeout(res, ms));
  }
  
  // after sending customer email
  await delay(600); // wait ~0.6s to stay under 2 req/sec
  
  
  
  // --- Admin Notification ---
  const adminHtml = `
    <h2>New Order Received</h2>
    <p><b>Order Ref:</b> ${order.orderRef}</p>
    <p><b>Name:</b> ${order.fullName}</p>
    <p><b>Email:</b> ${order.email}</p>
    <p><b>Phone:</b> ${order.phone || "-"}</p>
    <p><b>Country:</b> ${order.country || "-"}</p>
    <p><b>Company:</b> ${order.company || "-"}</p>
    <p><b>Tickets:</b> ${minted.length}</p>
  `;

  await sendEmail({
    to: process.env.ADMIN_EMAIL,
    subject: `📢 New GAIN Order — Ref: ${order.orderRef}`,
    html: adminHtml,
  });

  console.log(`✅ Order processed and emails sent for ${order.orderRef}`);
}

module.exports = { processPaidOrder };
