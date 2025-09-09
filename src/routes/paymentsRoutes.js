// routes/payment.js
const express = require("express");
const crypto = require("crypto");
const { customAlphabet } = require("nanoid");

const { initTransaction, verifyTransaction } = require("../services/paystack");
const Order = require("../models/Order");
const eventConfig = require("../config/eventConfig");
const { processPaidOrder } = require("../services/orderProcessor");

const router = express.Router();
const nano = customAlphabet("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789", 10);

// Helper: calculate total from items
function calcTotal(items) {
  if (!items || items.length === 0) return 0;

  const it = items[0]; // assume one ticket type per checkout
  const t = eventConfig.ticketTypes.find((x) => x.code === it.type);
  if (!t) throw new Error("Unknown ticket type " + it.type);

  return t.price * it.qty;
}

// --- Initiate transaction ---
router.post("/initiate-transaction", async (req, res, next) => {
  try {
    const { email, fullName, items, successUrl, cancelUrl, phone, country, company } = req.body;

    if (!email || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "email and items required" });
    }

    const total = calcTotal(items); // USD amount
    const orderRef = nano();

    const order = await Order.create({
      orderRef,
      email,
      fullName,
      phone,
      country,
      company,
      amount: total,
      currency: "USD",
      status: "PENDING",
      lineItems: items,
    });

    // Paystack expects amount in kobo/cents (integer)
    const amountCents = Math.round(total * 100);

    const payInit = await initTransaction({
      email,
      amount: amountCents,
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

// --- Verify payment ---
router.post("/verify-payment", async (req, res, next) => {
  try {
    const { reference } = req.body;
    if (!reference) return res.status(400).json({ error: "reference required" });

    const verification = await verifyTransaction(reference);
    const status = verification.status;
    const payRef = verification.reference;

    const order = await Order.findOne({ orderRef: reference });
    if (!order) return res.status(404).json({ error: "Order not found" });

    if (status === "success" && order.status !== "PAID") {
      order.status = "PAID";
      order.paystackRef = payRef;
      await order.save();

      await processPaidOrder(order);
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
