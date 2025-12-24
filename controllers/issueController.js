import Issue from "../models/Issue.js";
import Timeline from "../models/Timeline.js";
import User from "../models/User.js";

// helper to create timeline entry
const addTimeline = async ({ issueId, status, message, updatedBy, role }) => {
  await Timeline.create({
    issue: issueId,
    status,
    message,
    updatedBy,
    role,
  });
};

// Get All Issues with Filters, Search, Pagination
export const getAllIssues = async (req, res) => {
  try {
    const {
      category,
      status,
      priority,
      search,
      page = 1,
      limit = 12,
    } = req.query;

    const query = {};

    // Filters
    if (category) query.category = category;
    if (status) query.status = status;
    if (priority) query.priority = priority;

    // Search (title, category, location)
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { category: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
      
      // Also search in location if it's a string
      if (typeof query.$or[0] !== 'undefined') {
        query.$or.push({ location: { $regex: search, $options: "i" } });
      }
    }

    const skip = (Number(page) - 1) * Number(limit);

    // Sort: High priority first (boosted), then by createdAt desc
    const issues = await Issue.find(query)
      .populate("reporter", "name email photo")
      .populate("assignedStaff", "name email photo")
      .sort({ priority: -1, createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Issue.countDocuments(query);

    res.json({
      issues,
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit)),
    });
  } catch (err) {
    console.error("getAllIssues error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Upvote Issue
export const upvoteIssue = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const userEmail = req.user.email;

    const issue = await Issue.findById(id);
    if (!issue) return res.status(404).json({ message: "Issue not found" });

    // Check if user is the reporter
    if (issue.reporter.toString() === userId.toString()) {
      return res.status(403).json({ message: "You cannot upvote your own issue" });
    }

    // Check if already upvoted (check both _id and email)
    const hasUpvoted = issue.upvotedBy.some(
      (upvoter) => upvoter === userId.toString() || upvoter === userEmail
    );

    if (hasUpvoted) {
      return res.status(400).json({ message: "You have already upvoted this issue" });
    }

    // Add upvote
    issue.upvotes = (issue.upvotes || 0) + 1;
    issue.upvotedBy.push(userId.toString());
    await issue.save();

    // Add timeline entry
    await addTimeline({
      issueId: issue._id,
      status: issue.status,
      message: `Issue upvoted by ${req.user.name || req.user.email}`,
      updatedBy: userId,
      role: req.user.role,
    });

    res.json({ message: "Upvoted successfully", upvotes: issue.upvotes });
  } catch (err) {
    console.error("upvoteIssue error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Get Issue by ID (for details page)
export const getIssueById = async (req, res) => {
  try {
    const { id } = req.params;
    const issue = await Issue.findById(id)
      .populate("reporter", "name email photo isPremium")
      .populate("assignedStaff", "name email photo");

    if (!issue) {
      return res.status(404).json({ message: "Issue not found" });
    }

    // Get timeline for this issue
    const timeline = await Timeline.find({ issue: id })
      .populate("updatedBy", "name email")
      .sort({ createdAt: -1 });

    res.json({ issue, timeline });
  } catch (err) {
    console.error("getIssueById error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// create new issue
export const createIssue = async (req, res) => {
  try {
    const user = req.user;
    // Check if user is blocked
    if (user.isBlocked) {
      return res.status(403).json({ message: "Blocked users cannot report issues" });
    }

    // Check issue limit for free users
    const issueCount = await Issue.countDocuments({ reporter: user._id });
    if (!user.isPremium && issueCount >= 3) {
      return res.status(400).json({ 
        message: "Free users can only report 3 issues. Upgrade to premium for unlimited reports." 
      });
    }

    const { title, description, category, image, address} = req.body;

    // Create issue
    const issue = await Issue.create({
      title,
      description,
      category,
      images: image ? [image] : [],
      location: location || address || "Location not provided",
      reporter: req.user._id,
      priority: "normal",
      upvotes: 0,
      upvotedBy: [],
    });

    // Add timeline entry
    await addTimeline({
      issueId: issue._id,
      status: "pending",
      message: "Issue reported by citizen",
      updatedBy: req.user._id,
      role: req.user.role,
    });

    res.status(201).json(issue);
  } catch (err) {
    console.error("CreateIssue error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// get citizen stats
export const getCitizenStats = async (req, res) => {
  try {
    const { email } = req.params;
    
    // Find user
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const reporterId = user._id;

    const totalIssues = await Issue.countDocuments({ reporter: reporterId });
    const pending = await Issue.countDocuments({ reporter: reporterId, status: "pending" });
    const inProgress = await Issue.countDocuments({ reporter: reporterId, status: "in-progress" });
    const resolved = await Issue.countDocuments({ reporter: reporterId, status: "resolved" });

    res.json({ totalIssues, pending, inProgress, resolved });
  } catch (err) {
    console.error("getCitizenStats error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// get user's issues with filters/pagination/search
export const getUserIssues = async (req, res) => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 10, status, category, search } = req.query;
    const query = { reporter: userId };

    if (status) query.status = status;
    if (category) query.category = category;
    if (search) query.title = { $regex: search, $options: "i" };

    const skip = (Number(page) - 1) * Number(limit);

    const issues = await Issue.find(query)
      .sort({ priority: -1, createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Issue.countDocuments(query);

    res.json({ issues, total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    console.error("getUserIssues error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// update issue (only reporter & only when pending)
export const updateIssue = async (req, res) => {
  try {
    const id = req.params.id;
    const issue = await Issue.findById(id);
    if (!issue) return res.status(404).json({ message: "Not found" });

    if (issue.reporter.toString() !== req.user._id.toString())
      return res.status(403).json({ message: "Forbidden" });

    if (issue.status !== "pending") 
      return res.status(400).json({ message: "Only pending issues can be edited" });

    const { title, description, category, image, location } = req.body;
    issue.title = title ?? issue.title;
    issue.description = description ?? issue.description;
    issue.category = category ?? issue.category;
    if (image) issue.images = [image];
    if (location) issue.location = location;

    await issue.save();

    await addTimeline({
      issueId: issue._id,
      status: issue.status,
      message: "Issue edited by reporter",
      updatedBy: req.user._id,
      role: req.user.role,
    });

    res.json(issue);
  } catch (err) {
    console.error("updateIssue error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// delete issue (only reporter & pending)
export const deleteIssue = async (req, res) => {
  try {
    const id = req.params.id;
    const issue = await Issue.findById(id);
    if (!issue) return res.status(404).json({ message: "Not found" });

    if (issue.reporter.toString() !== req.user._id.toString())
      return res.status(403).json({ message: "Forbidden" });

    if (issue.status !== "pending") 
      return res.status(400).json({ message: "Only pending issues can be deleted" });

    await Issue.findByIdAndDelete(id);

    await addTimeline({
      issueId: id,
      status: "deleted",
      message: "Issue deleted by reporter",
      updatedBy: req.user._id,
      role: req.user.role,
    });

    res.json({ message: "Deleted" });
  } catch (err) {
    console.error("deleteIssue error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Boost Issue Priority (Payment required)
export const boostIssue = async (req, res) => {
  try {
    const { id } = req.params;
    const issue = await Issue.findById(id);

    if (!issue) {
      return res.status(404).json({ message: "Issue not found" });
    }

    // Check if user is the reporter
    if (issue.reporter.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Only the reporter can boost this issue" });
    }

    // Check if already boosted
    if (issue.priority === "high" || issue.isBoosted) {
      return res.status(400).json({ message: "Issue is already boosted" });
    }

    // Update priority
    issue.priority = "high";
    issue.isBoosted = true;
    await issue.save();

    // Add timeline entry
    await addTimeline({
      issueId: issue._id,
      status: issue.status,
      message: "Issue priority boosted to high",
      updatedBy: req.user._id,
      role: req.user.role,
    });

    res.json({ message: "Issue boosted successfully", issue });
  } catch (err) {
    console.error("boostIssue error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
// Get Latest Resolved Issues
export const getLatestResolvedIssues = async (req, res) => {
  try {
    const issues = await Issue.find({ status: "resolved" })
      .populate("reporter", "name email photo")
      .sort({ updatedAt: -1 })
      .limit(6);

    res.json(issues);
  } catch (err) {
    console.error("getLatestResolvedIssues error:", err);
    res.status(500).json({ message: "Server error" });
  }
};