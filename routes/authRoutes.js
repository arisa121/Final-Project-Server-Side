import express from "express";
import { auth } from "../middleware/auth.js";
import {
  getCurrentUser,
  generateToken,
  saveUser,
  getUserByEmail,
} from "../controllers/authController.js";

const router = express.Router();

router.get("/me", auth, getCurrentUser);
router.post("/jwt", generateToken);
router.post("/save-user", saveUser);
router.get("/user/:email", auth, getUserByEmail);
// router.post("/login", loginUser);

export default router;
