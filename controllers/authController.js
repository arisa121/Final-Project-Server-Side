import User from "../models/User.js";
import jwt from "jsonwebtoken";

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });

export const register = async (req, res) => {
  try {
    const user = await User.create(req.body);
    const token = generateToken(user._id);
    res.json({ user, token });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const login = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });

    if (!user) return res.status(404).json({ message: "User not found" });

    const token = generateToken(user._id);
    res.json({ user, token });

  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};
