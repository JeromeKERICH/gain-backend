// services/paystack.js
const axios = require("axios");

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;

async function initTransaction({ email, amount, currency, reference, callback_url }) {
  const res = await axios.post(
    "https://api.paystack.co/transaction/initialize",
    {
      email,
      amount,         // ✅ must be named "amount"
      currency,       // "USD" works if enabled on your account
      reference,
      callback_url,
    },
    {
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET}`,
        "Content-Type": "application/json",
      },
    }
  );

  return res.data.data; // contains authorization_url, access_code, reference
}

async function verifyTransaction(reference) {
  const res = await axios.get(
    `https://api.paystack.co/transaction/verify/${reference}`,
    {
      headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` },
    }
  );
  return res.data.data; // contains status, reference, amount, currency, etc.
}

module.exports = { initTransaction, verifyTransaction };
