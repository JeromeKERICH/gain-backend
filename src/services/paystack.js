const axios = require('axios');
const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;

if (!PAYSTACK_SECRET) {
  console.warn('⚠️ PAYSTACK_SECRET_KEY not set. Payment functions will fail until you set it.');
}

const initTransaction = async ({ email, amountKobo, reference, callback_url, currency = 'KES' }) => {
  const url = 'https://api.paystack.co/transaction/initialize';
  const body = { email, amount: amountKobo, reference, callback_url, currency };
  const res = await axios.post(url, body, { headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` } });
  return res.data.data; // contains authorization_url, access_code, reference
};

const verifyTransaction = async (reference) => {
  const url = `https://api.paystack.co/transaction/verify/${reference}`;
  const res = await axios.get(url, { headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` } });
  return res.data.data; // includes status
};

module.exports = { initTransaction, verifyTransaction };
