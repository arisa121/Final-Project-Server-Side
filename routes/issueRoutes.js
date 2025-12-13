import express from "express";
import { auth } from "../middleware/auth.js";
import {
  createIssue,
  deleteIssue,
  getAllIssues,
  getIssueById,
  getCitizenStats,
  getUserIssues,
  updateIssue,
  upvoteIssue,
  boostIssue,
} from "../controllers/issueController.js";

const router = express.Router();

// Public routes
router.get("/", getAllIssues); // With filters & pagination

// Protected routes
router.get("/citizen-stats/:email", auth, getCitizenStats);
router.get("/user", auth, getUserIssues);
router.get("/:id", auth, getIssueById); // Get single issue with timeline
router.post("/", auth, createIssue);
router.post("/:id/upvote", auth, upvoteIssue);
router.post("/:id/boost", auth, boostIssue); // Boost issue (after payment)
router.put("/:id", auth, updateIssue);
router.delete("/:id", auth, deleteIssue);
export default router;