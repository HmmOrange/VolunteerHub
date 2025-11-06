import Event from "../models/Event.js";
import User from "../models/User.js";

export const createEvent = async (req, res) => {
  try {
    const { name, date, location, description, username } = req.body;

    const user = await User.findOne({ username });
    if (!user) return res.status(400).json({ message: "User not found" });

    const newEvent = new Event({
      name,
      date,
      location,
      description,
      createdBy: user._id,
    });

    await newEvent.save();
    res.status(201).json({ message: "Event created successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getAllEvents = async (req, res) => {
  try {
    const events = await Event.find().populate("createdBy", "username");
    res.json(events);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
