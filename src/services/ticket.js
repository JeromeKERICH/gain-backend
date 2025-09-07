const QRCode = require('qrcode');
const { customAlphabet } = require('nanoid');
const nano = customAlphabet('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 8);

async function createTicketData({ orderRef, type, attendeeName, email }) {
  const ticketCode = `${orderRef}-${nano()}`;
  const qrDataUrl = await QRCode.toDataURL(ticketCode);
  return { ticketCode, qrDataUrl, type, attendeeName, email, orderRef };
}

module.exports = { createTicketData };
