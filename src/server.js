require("dotenv").config();
const express = require("express");
const cors = require("cors");
require("./config/db"); // MongoDB connection

const authRoutes = require("./routes/auth");
const paymentRoutes = require("./routes/paymentsRoutes");
const ticketRoutes = require("./routes/ticketsRoutes");
const errorHandler = require("./middlewares/errorHandler");

const app = express();

// ✅ CORS setup for frontend only
app.use(cors({
  origin: process.env.FRONTEND_URL, // e.g., https://yourfrontend.com
  methods: ["GET", "POST"],
  credentials: true
}));

// ✅ Raw body parser for webhooks (Paystack needs raw body)
app.use("/api/payments/webhook", express.raw({ type: "*/*" }));

// ✅ JSON parser for other endpoints
app.use(express.json());

// --- Health check
app.get("/", (req, res) => res.send("GAIN API running 🚀"));

// --- Routes
app.use("/api/auth", authRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/tickets", ticketRoutes);

// --- Error handler
app.use(errorHandler);

// --- Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`Server running on port ${PORT}`)
);
