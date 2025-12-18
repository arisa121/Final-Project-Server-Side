import User from "../models/User.js";
import { firebaseAuth } from "./firebaseAdmin.js";

export const admin = async () => {
  try {
    // Check if admin already exists in MongoDB
    const adminExists = await User.findOne({ role: "admin" });
    
    if (!adminExists) {
      const adminEmail = "sumon@gmail.com";
      const adminPassword = "Sumonmia121@";

      //1. Create admin in Firebase Authentication
      let firebaseUser;
      try {
        firebaseUser = await firebaseAuth.createUser({
          email: adminEmail,
          password: adminPassword,
          displayName: "Md Sumon Mia",
          photoURL: "https://i.postimg.cc/k4Dtf70D/486678859-520384654459779-5621146170279631596-n.jpg",
        });
        console.log("Firebase admin created:", firebaseUser.uid);
      } catch (firebaseError) {
        if (firebaseError.code === "auth/email-already-exists") {
          // Get existing Firebase user
          firebaseUser = await firebaseAuth.getUserByEmail(adminEmail);
          console.log("ℹAdmin already exists in Firebase");
        } else {
          throw firebaseError;
        }
      }
      // 2. Create admin in MongoDB
      await User.create({
        name: "Md Sumon Mia",
        email: adminEmail,
        password: adminPassword, 
        photo: "https://i.postimg.cc/k4Dtf70D/486678859-520384654459779-5621146170279631596-n.jpg",
        phone: "01700000000",
        role: "admin",
        firebaseUid: firebaseUser.uid,
        isPremium: false,
        isBlocked: false,
      });

      console.log("Admin account created successfully!");
      console.log("Email:", adminEmail);
      console.log("Password:", adminPassword);
    } else {
      console.log("Admin already exists");
      
      //Update Firebase UID if missing
      if (!adminExists.firebaseUid) {
        try {
          const firebaseUser = await firebaseAuth.getUserByEmail(adminExists.email);
          adminExists.firebaseUid = firebaseUser.uid;
          await adminExists.save();
          console.log("Admin Firebase UID updated");
        } catch (error) {
          console.log("Could not update Firebase UID:", error.message);
        }
      }
    }
  } catch (error) {
    console.error("Error seeding admin:", error);
  }
};
