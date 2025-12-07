import express from "express";
import { auth } from "../middleware/auth.js";
import { createIssue, getAllIssues, getIssueById, upvote } from "../controllers/issueController.js";

const router = express.Router();

router.get("/", getAllIssues);
router.get("/:id", auth, getIssueById);
router.post("/", auth, createIssue);
router.post("/upvote/:id", auth, upvote);

export default router;

