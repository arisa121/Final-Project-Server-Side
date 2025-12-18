import { firebaseAuth } from "../config/firebaseAdmin.js";
import User from "../models/User.js";

export const auth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Unauthorized - No token provided" });
    }

    const token = authHeader.split(" ")[1];

    //Verify Firebase ID token
    const decodedToken = await firebaseAuth.verifyIdToken(token);
    
    //Get user from MongoDB using Firebase UID
    const user = await User.findOne({ firebaseUid: decodedToken.uid }).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found in database" });
    }

    //Check if user is blocked
    if (user.isBlocked) {
      return res.status(403).json({ 
        message: "Your account has been blocked. Please contact support." 
      });
    }
    req.user = user;
    req.firebaseUser = decodedToken;

    next();
  } catch (error) {
    console.error("Auth middleware error:", error);

    if (error.code === "auth/id-token-expired") {
      return res.status(401).json({ message: "Token expired" });
    }
    if (error.code === "auth/argument-error") {
      return res.status(401).json({ message: "Invalid token format" });
    }

    return res.status(403).json({ message: "Forbidden - Invalid token" });
  }
};

//Role-based middleware
export const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: `Access denied. Required roles: ${allowedRoles.join(", ")}` 
      });
    }

    next();
  };
};