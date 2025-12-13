import Issue from "../models/Issue.js";
import Timeline from "../models/Timeline.js";

// ============================================
// STAFF DASHBOARD STATS
// ============================================
export const getStaffStats = async (req, res) => {
  try {
    const staffId = req.user._id;

    // Total assigned issues
    const assignedIssuesCount = await Issue.countDocuments({ 
      assignedStaff: staffId 
    });

    // Resolved issues by this staff
    const resolvedIssuesCount = await Issue.countDocuments({ 
      assignedStaff: staffId, 
      status: "resolved" 
    });

    // In-progress issues
    const inProgressCount = await Issue.countDocuments({ 
      assignedStaff: staffId, 
      status: "in-progress" 
    });

    // Pending issues
    const pendingCount = await Issue.countDocuments({ 
      assignedStaff: staffId, 
      status: "pending" 
    });

    // Today's tasks (created today)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todaysTasks = await Issue.countDocuments({ 
      assignedStaff: staffId,
      createdAt: { $gte: today }
    });

    res.json({
      assignedIssuesCount,
      resolvedIssuesCount,
      inProgressCount,
      pendingCount,
      todaysTasks,
    });
  } catch (err) {
    console.error("getStaffStats error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ============================================
// GET ASSIGNED ISSUES
// ============================================
export const getAssignedIssues = async (req, res) => {
  try {
    const staffId = req.user._id;
    const {
      page = 1,
      limit = 10,
      status,
      priority,
      search
    } = req.query;

    const query = { assignedStaff: staffId };

    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } }
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    // Sort: High priority first, then by createdAt
    const issues = await Issue.find(query)
      .populate("reporter", "name email photo")
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
    console.error("getAssignedIssues error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ============================================
// CHANGE ISSUE STATUS
// ============================================
export const changeIssueStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const staffId = req.user._id;

    // Validate status transitions
    const validTransitions = {
      "pending": ["in-progress"],
      "in-progress": ["working"],
      "working": ["resolved"],
      "resolved": ["closed"]
    };

    const issue = await Issue.findById(id);

    if (!issue) {
      return res.status(404).json({ message: "Issue not found" });
    }

    // Check if this staff is assigned to this issue
    if (issue.assignedStaff?.toString() !== staffId.toString()) {
      return res.status(403).json({ 
        message: "You can only update issues assigned to you" 
      });
    }

    // Validate status transition
    if (!validTransitions[issue.status]?.includes(status)) {
      return res.status(400).json({ 
        message: `Cannot change status from ${issue.status} to ${status}` 
      });
    }

    // Update status
    issue.status = status;
    await issue.save();

    // Add timeline entry
    await Timeline.create({
      issue: issue._id,
      status: status,
      message: `Status changed to ${status} by staff`,
      updatedBy: staffId,
      role: "staff"
    });

    const updatedIssue = await Issue.findById(id)
      .populate("reporter", "name email photo")
      .populate("assignedStaff", "name email photo");

    res.json({ 
      message: "Status updated successfully", 
      issue: updatedIssue 
    });
  } catch (err) {
    console.error("changeIssueStatus error:", err);
    res.status(500).json({ message: "Server error" });
  }
};