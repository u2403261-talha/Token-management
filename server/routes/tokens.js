// Routes for retrieving and updating tokens in MongoDB with owner authorization.
const express = require("express");
const Token = require("../models/Token");
const Event = require("../models/Event");

const router = express.Router();

// GET /api/tokens?eventId=... - Retrieve tokens for an event sorted by number
router.get("/", async (req, res) => {
  try {
    const { eventId } = req.query;
    if (!eventId) {
      return res.status(400).json({ message: "eventId parameter is required" });
    }

    // Authorization check: ensure event belongs to the logged-in organizer
    const event = await Event.findOne({ _id: eventId, owner: req.userId });
    if (!event) {
      return res.status(404).json({ message: "Event not found or access unauthorized" });
    }

    // Find all tokens for this event from MongoDB, sorted by tokenNumber ascending
    const tokens = await Token.find({ event: eventId }).sort({ tokenNumber: 1 });
    return res.status(200).json(tokens);
  } catch (err) {
    return res.status(500).json({ message: "Server error fetching tokens" });
  }
});

// PUT /api/tokens/:id - Update token status in MongoDB (waiting, serving, completed, done, skipped)
router.put("/:id", async (req, res) => {
  try {
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ message: "Status is required" });
    }

    const tokenDoc = await Token.findById(req.params.id);
    if (!tokenDoc) {
      return res.status(404).json({ message: "Token not found" });
    }

    // Authorization check: ensure event belonging to this token is owned by logged-in organizer
    const event = await Event.findOne({ _id: tokenDoc.event, owner: req.userId });
    if (!event) {
      return res.status(403).json({ message: "Unauthorized token update" });
    }

    tokenDoc.status = status;
    await tokenDoc.save();

    return res.status(200).json(tokenDoc);
  } catch (err) {
    return res.status(500).json({ message: "Server error updating token" });
  }
});

module.exports = router;
