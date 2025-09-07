const express = require("express");
const Ticket = require("../models/Ticket");

const router = express.Router();

// POST /api/tickets/verify
router.post("/verify", async (req, res) => {
  try {
    const { qrData } = req.body; // e.g. "ticketId|email"
    const [ticketId, email] = qrData.split("|");

    const ticket = await Ticket.findOne({ ticketId }).populate("user");

    if (!ticket) {
      return res.status(404).json({ success: false, message: "Ticket not found" });
    }

    if (ticket.user.email !== email) {
      return res.status(400).json({ success: false, message: "Ticket email mismatch" });
    }

    if (ticket.status === "used") {
      return res.status(400).json({ success: false, message: "Ticket already used" });
    }

    // ✅ Mark ticket as used
    ticket.status = "used";
    await ticket.save();

    res.json({
      success: true,
      message: "Ticket valid",
      ticket: {
        ticketId: ticket.ticketId,
        name: ticket.user.name,
        email: ticket.user.email,
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;
