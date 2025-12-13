import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (err) {
    console.error("Get current user error:", err);
    res.status(500).json({ message: err.message });
  }
};

export const generateToken = async (req, res) => {
  try {
    const { email,name,photo } = req.body;
    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({
        name: name,
        email,
        photo: photo || "",
        role: "citizen",
        isPremium: false,
        isBlocked: false,
      });
    }
    const token = jwt.sign(
      {
        _id: user._id,
        email: user.email,
        role: user.role,
        isPremium: user.isPremium,
        isBlocked: user.isBlocked,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );
    res.json({ token });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const saveUser = async (req, res) => {
  try {
    const { name, email, photo, role } = req.body;
    const exists = await User.findOne({ email });
    if (!exists) {
      await User.create({
        name,
        email,
        photo,
        role: role || "citizen",
        isPremium: false,
        isBlocked: false,
      });
    }
    res.json({ message: "User saved" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getUserByEmail = async (req, res) => {
  try {
    const email = req.params.email;
    const user = await User.findOne({ email });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// export const loginUser = async (req, res) => {
//   try {
//     const { email, password } = req.body;

//     // Validation
//     if (!email || !password) {
//       return res.status(400).json({ 
//         message: "Email and password are required" 
//       });
//     }

//     // Find user
//     const user = await User.findOne({ email });
//     if (!user) {
//       return res.status(401).json({ message: "Invalid email or password" });
//     }

//     // Check if user is blocked
//     if (user.isBlocked) {
//       return res.status(403).json({ 
//         message: "Your account has been blocked. Please contact support." 
//       });
//     }

//     // Check password (plain text comparison)
//     if (user.password !== password) {
//       return res.status(401).json({ message: "Invalid email or password" });
//     }

//     // Generate JWT token
//     const token = jwt.sign(
//       {
//         _id: user._id,
//         email: user.email,
//         role: user.role,
//         isPremium: user.isPremium,
//         isBlocked: user.isBlocked,
//       },
//       process.env.JWT_SECRET,
//       { expiresIn: "7d" }
//     );

//     res.json({
//       message: "Login successful",
//       token,
//       user: {
//         _id: user._id,
//         name: user.name,
//         email: user.email,
//         photo: user.photo,
//         role: user.role,
//         isPremium: user.isPremium,
//         isBlocked: user.isBlocked,
//       },
//     });
//   } catch (err) {
//     console.error("loginUser error:", err);
//     res.status(500).json({ message: err.message });
//   }
// };