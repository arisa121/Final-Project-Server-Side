import User from "../models/User.js";

export const admin = async () => {
  try {
    // Check if admin already exists
    const adminExists = await User.findOne({ role: "admin" });
    
    if (!adminExists) {
      await User.create({
        name: "Admin",
        email: "sumon@gmail.com", // আপনার email দিন
        photo: "https://i.postimg.cc/k4Dtf70D/486678859-520384654459779-5621146170279631596-n.jpg", // optional
        role: "admin",
        isPremium: false,
        isBlocked: false,
      });
      console.log("✅ Admin account created successfully!");
      console.log("Email: admin@example.com");
    } else {
      console.log("ℹ️ Admin already exists");
    }
  } catch (error) {
    console.error("❌ Error seeding admin:", error);
  }
};