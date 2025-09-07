const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
  orderRef: String,
  ticketCode: { type: String, unique: true },
  type: String,
  attendeeName: String,
  email: String,
  qrDataUrl: String, // data URL (for now) — replace with S3/Cloudinary in prod
  status: { type: String, enum: ['ACTIVE','USED','VOID'], default: 'ACTIVE' }
}, { timestamps: true });

module.exports = mongoose.model('Ticket', ticketSchema);
