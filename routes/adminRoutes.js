import express from "express";
import { auth } from "../middleware/auth.js";
import { allowRoles } from "../middleware/role.js";
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

// Dashboard Stats
router.get("/stats", auth, allowRoles("admin"), getAdminStats);

// Issues Management
router.get("/issues", auth, allowRoles("admin"), getAllIssuesAdmin);
router.patch("/issues/:id/assign", auth, allowRoles("admin"), assignStaff);
router.patch("/issues/:id/reject", auth, allowRoles("admin"), rejectIssue);

// Staff Management
router.get("/staff", auth, allowRoles("admin"), getAllStaff);
router.post("/staff", auth, allowRoles("admin"), createStaff);
router.put("/staff/:id", auth, allowRoles("admin"), updateStaff);
router.delete("/staff/:id", auth, allowRoles("admin"), deleteStaff);

// User Management
router.get("/users", auth, allowRoles("admin"), getAllUsers);
router.patch("/users/:id/block", auth, allowRoles("admin"), blockUser);

// Payments
router.get("/payments", auth, allowRoles("admin"), getAllPayments);
router.get("/payments/stats", auth, allowRoles("admin"), getPaymentStats);

export default router;

