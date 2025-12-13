import Issue from "../models/Issue.js";
import User from "../models/User.js";
import Timeline from "../models/Timeline.js";
import Payment from "../models/Payment.js";


// ============================================
// DASHBOARD STATS
// ============================================
export const getAdminStats = async (req, res) => {
  try {
    const totalIssues = await Issue.countDocuments();
    const resolvedIssues = await Issue.countDocuments({ status: "resolved" });
    const pendingIssues = await Issue.countDocuments({ status: "pending" });
    const rejectedIssues = await Issue.countDocuments({ status: "rejected" });
    const inProgressIssues = await Issue.countDocuments({ status: "in-progress" });

    const totalPayments = await Payment.aggregate([
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);

    const totalRevenue = totalPayments.length > 0 ? totalPayments[0].total : 0;

    // Latest Issues (last 5)
    const latestIssues = await Issue.find()
      .populate("reporter", "name email")
      .sort({ createdAt: -1 })
      .limit(5);

    // Latest Payments (last 5)
    const latestPayments = await Payment.find()
      .populate("user", "name email")
      .populate("issue", "title")
      .sort({ createdAt: -1 })
      .limit(5);

    // Latest Users (last 5)
    const latestUsers = await User.find({ role: "citizen" })
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      stats: {
        totalIssues,
        resolvedIssues,
        pendingIssues,
        rejectedIssues,
        inProgressIssues,
        totalRevenue,
      },
      latestIssues,
      latestPayments,
      latestUsers,
    });
  } catch (err) {
    console.error("getAdminStats error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ============================================
// ALL ISSUES (with filters, pagination, sorting)
// ============================================
export const getAllIssuesAdmin = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      category,
      priority,
      search
    } = req.query;

    const query = {};
    if (status) query.status = status;
    if (category) query.category = category;
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
      .populate("reporter", "name email")
      .populate("assignedStaff", "name email")
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
    console.error("getAllIssuesAdmin error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ============================================
// ASSIGN STAFF
// ============================================
export const assignStaff = async (req, res) => {
  try {
    const { staffId } = req.body;
    const issue = await Issue.findById(req.params.id);

    if (!issue) {
      return res.status(404).json({ message: "Issue not found" });
    }

    // Check if already assigned
    if (issue.assignedStaff) {
      return res.status(400).json({ message: "Staff already assigned to this issue" });
    }

    // Verify staff exists and has staff role
    const staff = await User.findById(staffId);
    if (!staff || staff.role !== "staff") {
      return res.status(400).json({ message: "Invalid staff member" });
    }

    issue.assignedStaff = staffId;
    await issue.save();

    // Add timeline entry
    await Timeline.create({
      issue: issue._id,
      status: issue.status,
      message: `Staff ${staff.name} assigned to this issue`,
      updatedBy: req.user._id,
      role: "admin"
    });

    const updatedIssue = await Issue.findById(issue._id)
      .populate("reporter", "name email")
      .populate("assignedStaff", "name email");

    res.json(updatedIssue);
  } catch (err) {
    console.error("assignStaff error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ============================================
// REJECT ISSUE
// ============================================
export const rejectIssue = async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id);

    if (!issue) {
      return res.status(404).json({ message: "Issue not found" });
    }

    // Only pending issues can be rejected
    if (issue.status !== "pending") {
      return res.status(400).json({ message: "Only pending issues can be rejected" });
    }

    issue.status = "rejected";
    await issue.save();

    // Add timeline entry
    await Timeline.create({
      issue: issue._id,
      status: "rejected",
      message: "Issue rejected by admin",
      updatedBy: req.user._id,
      role: "admin"
    });

    res.json({ message: "Issue rejected successfully", issue });
  } catch (err) {
    console.error("rejectIssue error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ============================================
// GET ALL STAFF
// ============================================
export const getAllStaff = async (req, res) => {
  try {
    const staff = await User.find({ role: "staff" }).sort({ createdAt: -1 });
    res.json(staff);
  } catch (err) {
    console.error("getAllStaff error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ============================================
// CREATE STAFF ( Database)
// ============================================
export const createStaff = async (req, res) => {
  try {
    const { name, email, phone, photo, password } = req.body;
     // Validation
    if (!name || !email) {
      return res.status(400).json({ message: "Name and email are required" });
    }
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already exists" });
    }

   
    // Create in Database only
    // Staff will register via frontend with same email
  
    // Create in Database
    const staff = await User.create({
      name,
      email,
      photo,
      phone,
      role: "staff",
      isPremium: false,
      isBlocked: false,
    });

    res.status(201).json({ 
      message: "Staff created successfully", 
      staff 
    });
  } catch (err) {
    console.error("createStaff error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ============================================
// UPDATE STAFF
// ============================================
export const updateStaff = async (req, res) => {
  try {
    const { name, email, phone, photo } = req.body;
    
    const staff = await User.findById(req.params.id);
    if (!staff || staff.role !== "staff") {
      return res.status(404).json({ message: "Staff not found" });
    }

    staff.name = name || staff.name;
    staff.email = email || staff.email;
    staff.phone = phone || staff.phone;
    staff.photo = photo || staff.photo;

    await staff.save();

    res.json({ message: "Staff updated successfully", staff });
  } catch (err) {
    console.error("updateStaff error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ============================================
// DELETE STAFF
// ============================================
export const deleteStaff = async (req, res) => {
  try {
    const staff = await User.findById(req.params.id);
    if (!staff || staff.role !== "staff") {
      return res.status(404).json({ message: "Staff not found" });
    }

    // Check if staff has assigned issues
    const assignedIssues = await Issue.countDocuments({ assignedStaff: staff._id });
    if (assignedIssues > 0) {
      return res.status(400).json({ 
        message: "Cannot delete staff with assigned issues. Please reassign issues first." 
      });
    }

    await User.findByIdAndDelete(req.params.id);

    // Also delete from Firebase if needed
    // await firebaseAuth.deleteUser(staff.firebaseUid);

    res.json({ message: "Staff deleted successfully" });
  } catch (err) {
    console.error("deleteStaff error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ============================================
// GET ALL USERS (Citizens)
// ============================================
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({ role: "citizen" }).sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    console.error("getAllUsers error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ============================================
// BLOCK/UNBLOCK USER
// ============================================
export const blockUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user || user.role !== "citizen") {
      return res.status(404).json({ message: "User not found" });
    }

    user.isBlocked = !user.isBlocked;
    await user.save();

    res.json({ 
      message: `User ${user.isBlocked ? "blocked" : "unblocked"} successfully`, 
      user 
    });
  } catch (err) {
    console.error("blockUser error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ============================================
// GET ALL PAYMENTS
// ============================================
export const getAllPayments = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      type,
      startDate,
      endDate
    } = req.query;

    const query = {};
    if (type) query.type = type;
    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    const skip = (Number(page) - 1) * Number(limit);
    const payments = await Payment.find(query)
      .populate("user", "name email")
      .populate("issue", "title")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));
   const total = await Payment.countDocuments(query);
   res.json({
      payments,
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit)),
    });
  } catch (err) {
    console.error("getAllPayments error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ============================================
// GET PAYMENT STATS (For Charts)
// ============================================
export const getPaymentStats = async (req, res) => {
  try {
    const monthlyStats = await Payment.aggregate([
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" }
          },
          total: { $sum: "$amount" },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id.year": -1, "_id.month": -1 } },
      { $limit: 12 }
    ]);

    res.json(monthlyStats);
  } catch (err) {
    console.error("getPaymentStats error:", err);
    res.status(500).json({ message: "Server error" });
  }
};