import express from "express";
import { auth } from "../middleware/auth.js";
import {
  subscribePremium,
  boostIssuePriority,
  getUserPayments,
  getInvoice,
} from "../controllers/paymentController.js";


const router = express.Router();

// Subscribe to Premium
router.post("/subscribe", auth, subscribePremium);

// Boost Issue Priority
router.post("/boost/:issueId", auth, boostIssuePriority);

// Get User Payments
router.get("/my-payments", auth, getUserPayments);

// Get Invoice
router.get("/invoice/:paymentId", auth, getInvoice);

export default router;

