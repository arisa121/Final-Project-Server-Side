import express from "express";
import { auth, requireRole } from "../middleware/auth.js";
import {
  getAdminStats,
  getAllIssuesAdmin,
  assignStaff,
  rejectIssue,
  getAllStaff,
  createStaff,
  updateStaff,
  deleteStaff,
  getAllUsers,
  blockUser,
  getAllPayments,
  getPaymentStats,
} from "../controllers/adminController.js";

const router = express.Router();

//All routes require authentication + admin role
router.use(auth, requireRole("admin"));

// Dashboard
router.get("/stats", getAdminStats);

// Issues Management
router.get("/issues", getAllIssuesAdmin);
router.patch("/issues/:id/assign", assignStaff);
router.patch("/issues/:id/reject", rejectIssue);

// Staff Management
router.get("/staff", getAllStaff);
router.post("/staff", createStaff);
router.put("/staff/:id", updateStaff);
router.delete("/staff/:id", deleteStaff);

// Users Management
router.get("/users", getAllUsers);
router.patch("/users/:id/block", blockUser);

// Payments
router.get("/payments", getAllPayments);
router.get("/payments/stats", getPaymentStats);

export default router;