import express from "express";
import { auth } from "../middleware/auth.js";
import { allowRoles } from "../middleware/role.js";
import {
  getStaffStats,
  getAssignedIssues,
  changeIssueStatus,
} from "../controllers/staffController.js";

const router = express.Router();

// Dashboard Stats
router.get("/stats", auth, allowRoles("staff"), getStaffStats);

// Assigned Issues
router.get("/assigned-issues", auth, allowRoles("staff"), getAssignedIssues);

// Change Issue Status
router.patch("/issues/:id/status", auth, allowRoles("staff"), changeIssueStatus);

export default router;