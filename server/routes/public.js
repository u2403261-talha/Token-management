// Public routes for attendees to view event details and request tokens
const express = require("express");
const Event = require("../models/Event");
const Token = require("../models/Token");

const router = express.Router();

// GET /api/public/events/:id - Get public event title by ID
router.get("/events/:id", async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }
    return res.status(200).json({ title: event.title, _id: event._id });
  } catch (err) {
    return res.status(500).json({ message: "Server error fetching event" });
  }
});

// POST /api/public/events/:id/join - Request a token and store in MongoDB
router.post("/events/:id/join", async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Name is required" });
    }

    // Safely increase the token number by 1 in MongoDB using $inc
    const event = await Event.findByIdAndUpdate(
      req.params.id,
      { $inc: { lastTokenNumber: 1 } },
      { new: true }
    );

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // Create and save new Token document in MongoDB
    const token = await Token.create({
      event: event._id,
      tokenNumber: event.lastTokenNumber,
      name: name.trim(),
      status: "waiting",
    });

    // Return created token to requester
    return res.status(201).json(token);
  } catch (err) {
    return res.status(500).json({ message: "Server error creating token" });
  }
});

module.exports = router;
