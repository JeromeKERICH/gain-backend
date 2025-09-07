// routes/payment.js
const express = require("express");
const crypto = require("crypto");
const { customAlphabet } = require("nanoid");

const { initTransaction, verifyTransaction } = require("../services/paystack");
const Order = require("../models/Order");
const eventConfig = require("../config/eventConfig");
const { processPaidOrder } = require("../services/orderProcessor");

const router = express.Router();
const nano = customAlphabet(
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",
  10
);

// --- Helper: calculate total ---
function calcTotal(items) {
  let total = 0;
  items.forEach((it) => {
    const t = eventConfig.ticketTypes.find((x) => x.code === it.type);
    if (!t) throw new Error("Unknown ticket type " + it.type);
    total += t.price * it.qty;
  });
  return total;
}

// --- Initiate transaction ---
router.post("/initiate-transaction", async (req, res, next) => {
  try {
    const {
      email,
      fullName,
      items,
      successUrl,
      cancelUrl,
      phone,
      country,
      company,
    } = req.body;

    if (!email || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "email and items required" });
    }

    const total = calcTotal(items);
    const orderRef = nano();

    // persist pending order
    const order = await Order.create({
      orderRef,
      email,
      fullName,
      phone,
      country,
      company,
      amount: total,
      currency: eventConfig.currency,
      status: "PENDING",
      lineItems: items,
    });

    // Paystack expects amount in kobo (or lowest denomination)
    const amountKobo = total * 100;

    const payInit = await initTransaction({
      email,
      amountKobo,
      currency: "USD",
      reference: orderRef,
      callback_url: successUrl || process.env.FRONTEND_URL + "/payment-callback",
    });

    res.json({
      authorization_url: payInit.authorization_url,
      reference: orderRef,
    });
  } catch (err) {
    next(err);
  }
});

// --- Verify payment (frontend callback) ---
router.post("/verify-payment", async (req, res, next) => {
  try {
    const { reference } = req.body;
    if (!reference)
      return res.status(400).json({ error: "reference required" });

    const verification = await verifyTransaction(reference);
    const status = verification.status; // "success" expected
    const payRef = verification.reference;

    const order = await Order.findOne({ orderRef: reference });
    if (!order) return res.status(404).json({ error: "Order not found" });

    if (status === "success" && order.status !== "PAID") {
      order.status = "PAID";
      order.paystackRef = payRef;
      await order.save();

      await processPaidOrder(order); // mint tickets + send emails
    }

    res.json({
      ok: true,
      status: order.status,
      orderRef: order.orderRef,
    });
  } catch (err) {
    next(err);
  }
});

// --- Paystack Webhook ---
router.post("/webhook", async (req, res) => {
  try {
    const signature = req.headers["x-paystack-signature"] || "";
    const secret = process.env.PAYSTACK_SECRET_KEY || "";

    // rawBody was set in express.json() middleware in server.js
    const computed = crypto
      .createHmac("sha512", secret)
      .update(req.rawBody)
      .digest("hex");

    if (computed !== signature) return res.status(401).send("invalid signature");

    const payload = req.body;
    if (payload.event === "charge.success") {
      const reference = payload.data.reference;
      const order = await Order.findOne({ orderRef: reference });

      if (order && order.status !== "PAID") {
        const verification = await verifyTransaction(reference);
        if (verification.status === "success") {
          order.status = "PAID";
          order.paystackRef = verification.reference;
          await order.save();

          await processPaidOrder(order);
        }
      }
    }

    res.status(200).send("ok");
  } catch (err) {
    console.error("Webhook error", err);
    res.status(500).send("error");
  }
});

module.exports = router;
