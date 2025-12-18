import Payment from "../models/Payment.js";
import User from "../models/User.js";
import Issue from "../models/Issue.js";
import Timeline from "../models/Timeline.js";

// SUBSCRIBE TO PREMIUM
export const subscribePremium = async (req, res) => {
  try {
    const userId = req.user._id;
    const { amount = 1000 } = req.body;

    // Check if already premium
    const user = await User.findById(userId);
    if (user.isPremium) {
      return res.status(400).json({ message: "You are already a premium member" });
    }

    // Mock Payment Gateway Integration
    const txnId = `TXN${Date.now()}${Math.random().toString(36).substr(2, 9)}`;

    // Create payment record
    const payment = await Payment.create({
      user: userId,
      amount,
      type: "premium",
      txnId,
    });

    // Update user to premium
    user.isPremium = true;
    await user.save();

    res.status(201).json({
      message: "Premium subscription successful!",
      payment,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        isPremium: user.isPremium,
      },
    });
  } catch (err) {
    console.error("subscribePremium error:", err);
    res.status(500).json({ message: "Server error" });
  }
};


// BOOST ISSUE PRIORITY
export const boostIssuePriority = async (req, res) => {
  try {
    const { issueId } = req.params;
    const userId = req.user._id;
    const { amount = 100 } = req.body;

    const issue = await Issue.findById(issueId);

    if (!issue) {
      return res.status(404).json({ message: "Issue not found" });
    }

    // Check if user is the reporter
    if (issue.reporter.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Only the reporter can boost this issue" });
    }

    // Check if already boosted
    if (issue.priority === "high" || issue.isBoosted) {
      return res.status(400).json({ message: "Issue is already boosted" });
    }

    // Mock Payment Gateway Integration
    const txnId = `TXN${Date.now()}${Math.random().toString(36).substr(2, 9)}`;

    // Create payment record
    const payment = await Payment.create({
      user: userId,
      issue: issueId,
      amount,
      type: "boost",
      txnId,
    });

    // Update issue priority
    issue.priority = "high";
    issue.isBoosted = true;
    await issue.save();

    // Add timeline entry
    await Timeline.create({
      issue: issueId,
      status: issue.status,
      message: "Issue priority boosted to high",
      updatedBy: userId,
      role: req.user.role,
    });

    const updatedIssue = await Issue.findById(issueId)
      .populate("reporter", "name email photo isPremium")
      .populate("assignedStaff", "name email photo");

    res.status(201).json({
      message: "Issue boosted successfully!",
      payment,
      issue: updatedIssue,
    });
  } catch (err) {
    console.error("boostIssuePriority error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// GET USER PAYMENTS
export const getUserPayments = async (req, res) => {
  try {
    const userId = req.user._id;

    const payments = await Payment.find({ user: userId })
      .populate("issue", "title")
      .sort({ createdAt: -1 });

    // Calculate totals
    const totalSpent = payments.reduce((sum, p) => sum + p.amount, 0);
    const premiumPayments = payments.filter((p) => p.type === "premium").length;
    const boostPayments = payments.filter((p) => p.type === "boost").length;

    res.json({
      payments,
      summary: {
        totalSpent,
        premiumPayments,
        boostPayments,
        totalTransactions: payments.length,
      },
    });
  } catch (err) {
    console.error("getUserPayments error:", err);
    res.status(500).json({ message: "Server error" });
  }
};


// GENERATE INVOICE DATA (For PDF)
export const getInvoice = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const userId = req.user._id;

    const payment = await Payment.findById(paymentId)
      .populate("user", "name email")
      .populate("issue", "title category");

    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    // Check if user owns this payment
    if (payment.user._id.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    // Invoice data
    const invoice = {
      invoiceNumber: `INV-${payment._id.toString().slice(-8).toUpperCase()}`,
      date: payment.createdAt,
      customer: {
        name: payment.user.name,
        email: payment.user.email,
      },
      items: [
        {
          description:
            payment.type === "premium"
              ? "Premium Subscription (Lifetime)"
              : `Issue Priority Boost: ${payment.issue?.title || "N/A"}`,
          amount: payment.amount,
        },
      ],
      total: payment.amount,
      txnId: payment.txnId,
      paymentType: payment.type,
    };

    res.json(invoice);
  } catch (err) {
    console.error("getInvoice error:", err);
    res.status(500).json({ message: "Server error" });
  }
};