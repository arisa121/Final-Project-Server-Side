import Issue from "../models/Issue.js";
import Timeline from "../models/Timeline.js";

export const createIssue = async (req, res) => {
  try {
    const issue = await Issue.create({
      ...req.body,
      reporter: req.user._id,
    });

    await Timeline.create({
      issue: issue._id,
      status: "pending",
      message: "Issue created",
      updatedBy: req.user._id,
      role: req.user.role,
    });

    res.json(issue);

  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const getAllIssues = async (req, res) => {
  const issues = await Issue.find().sort({ createdAt: -1 });
  res.json(issues);
};

export const getIssueById = async (req, res) => {
  const issue = await Issue.findById(req.params.id).populate("reporter assignedTo");
  const timeline = await Timeline.find({ issue: req.params.id }).sort({ createdAt: -1 });
  res.json({ issue, timeline });
};

export const upvote = async (req, res) => {
  const issue = await Issue.findById(req.params.id);

  if (issue.upvotes.includes(req.user._id))
    return res.status(400).json({ message: "Already voted" });

  issue.upvotes.push(req.user._id);
  await issue.save();

  res.json({ upvotes: issue.upvotes.length });
};
