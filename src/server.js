require("dotenv").config();
const express = require("express");
const cors = require("cors");
require("./config/db"); // MongoDB connection

const authRoutes = require("./routes/auth");
const paymentRoutes = require("./routes/paymentsRoutes");
const ticketRoutes = require("./routes/ticketsRoutes");
const errorHandler = require("./middlewares/errorHandler");
const contactRoutes = require("./routes/contactRoutes");

const app = express();


// ✅ CORS configuration
const allowedOrigins = [
  "https://gulfafricanexus.com" 
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error("Not allowed by CORS"));
  },
  methods: ["GET","POST","PUT","DELETE"],
  credentials: true
}));

// ✅ Raw body parser for webhooks (Paystack needs raw body)
app.use("/api/payments/webhook", express.raw({ type: "*/*" }));

// ✅ JSON parser for other endpoints
app.use(express.json());

// --- Contact form route
app.use("/api/contact", contactRoutes);

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
