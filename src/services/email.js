// services/email.js
const axios = require("axios");

const RESEND_KEY = process.env.RESEND_API_KEY;
if (!RESEND_KEY) console.warn("RESEND_API_KEY not set. Emails will fail.");

/**
 * Send an email via Resend API
 * @param {Object} opts
 * @param {string|string[]} opts.to - Recipient(s)
 * @param {string} opts.subject - Email subject
 * @param {string} opts.html - HTML body
 * @param {Object[]} [opts.attachments] - Attachments (base64)
 * @param {string} [opts.from] - From address
 */
async function sendEmail({
  to,
  subject,
  html,
  attachments = [],
  from = "GAIN Tickets <no-reply@tickets.gulfafricanexus.com>",
}) {
  try {
    const url = "https://api.resend.com/emails";

    const payload = {
      from,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      // Resend wants base64 attachments: { filename, content }
      attachments: attachments.map((att) => ({
        filename: att.filename,
        content: att.content, // should already be base64 string
      })),
    };

    const res = await axios.post(url, payload, {
      headers: {
        Authorization: `Bearer ${RESEND_KEY}`,
        "Content-Type": "application/json",
      },
    });

    console.log(`Email sent to ${to} (id: ${res.data.id || "unknown"})`);
    return res.data;
  } catch (err) {
    console.error(
      "Email send failed:",
      err.response?.data || err.message || err
    );
    throw err;
  }
}

module.exports = { sendEmail };
