// Routes for managing organizer events (CRUD operations with owner authorization).
const express = require("express");
const Event = require("../models/Event");
const Token = require("../models/Token");

const router = express.Router();

// Create a new event for the logged-in organizer
router.post("/", async (req, res) => {
  try {
    const { title, description, date, time, location, status } = req.body;
    if (!title || !title.trim()) {
      return res.status(400).json({ message: "Title is required" });
    }

    const event = new Event({
      title: title.trim(),
      description: description ? description.trim() : "",
      date: date ? date.trim() : "",
      time: time ? time.trim() : "",
      location: location ? location.trim() : "",
      status: status || "active",
      owner: req.userId,
    });
    await event.save();

    return res.status(201).json(event);
  } catch (err) {
    return res.status(500).json({ message: "Server error creating event" });
  }
});

// Get all events owned by the logged-in organizer
router.get("/", async (req, res) => {
  try {
    const events = await Event.find({ owner: req.userId }).sort({ createdAt: -1 });

    // Attach dynamic participant count to each event from MongoDB Token collection
    const eventsWithStats = await Promise.all(
      events.map(async (event) => {
        const participantCount = await Token.countDocuments({ event: event._id });
        const obj = event.toObject();
        obj.participantCount = participantCount;
        return obj;
      })
    );

    return res.status(200).json(eventsWithStats);
  } catch (err) {
    return res.status(500).json({ message: "Server error fetching events" });
  }
});

// Get a single event by ID (only if owned by organizer)
router.get("/:id", async (req, res) => {
  try {
    const event = await Event.findOne({ _id: req.params.id, owner: req.userId });
    if (!event) {
      return res.status(404).json({ message: "Event not found or access unauthorized" });
    }

    const participantCount = await Token.countDocuments({ event: event._id });
    const obj = event.toObject();
    obj.participantCount = participantCount;

    return res.status(200).json(obj);
  } catch (err) {
    return res.status(500).json({ message: "Server error fetching event" });
  }
});

// Update an event (only if owned by organizer)
router.put("/:id", async (req, res) => {
  try {
    const { title, description, date, time, location, status } = req.body;
    if (title !== undefined && (!title || !title.trim())) {
      return res.status(400).json({ message: "Title cannot be empty" });
    }

    const updateFields = {};
    if (title !== undefined) updateFields.title = title.trim();
    if (description !== undefined) updateFields.description = description.trim();
    if (date !== undefined) updateFields.date = date.trim();
    if (time !== undefined) updateFields.time = time.trim();
    if (location !== undefined) updateFields.location = location.trim();
    if (status !== undefined) updateFields.status = status;

    const event = await Event.findOneAndUpdate(
      { _id: req.params.id, owner: req.userId },
      updateFields,
      { new: true }
    );

    if (!event) {
      return res.status(404).json({ message: "Event not found or access unauthorized" });
    }

    return res.status(200).json(event);
  } catch (err) {
    return res.status(500).json({ message: "Server error updating event" });
  }
});

// Delete an event and all its associated tokens
router.delete("/:id", async (req, res) => {
  try {
    const event = await Event.findOneAndDelete({ _id: req.params.id, owner: req.userId });
    if (!event) {
      return res.status(404).json({ message: "Event not found or access unauthorized" });
    }

    // Delete all tokens belonging to this event
    await Token.deleteMany({ event: req.params.id });

    return res.status(200).json({ message: "Event deleted successfully" });
  } catch (err) {
    return res.status(500).json({ message: "Server error deleting event" });
  }
});

module.exports = router;
