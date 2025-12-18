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
  getLatestResolvedIssues,
} from "../controllers/issueController.js";

const router = express.Router();

// Public routes
router.get("/latest-resolved", getLatestResolvedIssues);
router.get("/", getAllIssues);
// Protected routes
router.get("/citizen-stats/:email", auth, getCitizenStats);
router.get("/user", auth, getUserIssues);
router.get("/:id", auth, getIssueById);
router.post("/", auth, createIssue);
router.post("/:id/upvote", auth, upvoteIssue);
router.post("/:id/boost", auth, boostIssue);
router.put("/:id", auth, updateIssue);
router.delete("/:id", auth, deleteIssue);

export default router;