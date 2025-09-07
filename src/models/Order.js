const mongoose = require("mongoose");

const OrderSchema = new mongoose.Schema({
  orderRef: { type: String, required: true, unique: true },
  email: { type: String, required: true },
  fullName: { type: String },
  phone: { type: String },
  country: { type: String },
  company: { type: String },
  amount: { type: Number, required: true },
  currency: { type: String, default: "USD" },
  status: { type: String, enum: ["PENDING", "PAID"], default: "PENDING" },
  paystackRef: { type: String },
  lineItems: [
    {
      type: { type: String },
      qty: { type: Number },
    },
  ],
}, { timestamps: true });

module.exports = mongoose.model("Order", OrderSchema);
