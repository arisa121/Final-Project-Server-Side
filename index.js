// final - project
// IzLjcgBmIproKig9
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";

import authRoutes from "./routes/authRoutes.js";
import issueRoutes from "./routes/issueRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";

dotenv.config();
const app = express();

// database connect
connectDB();

app.get("/", (req, res) => {
  res.send("PIIRS Server Running...");
});

app.use("/api/auth", authRoutes);
app.use("/api/issues", issueRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/payments", paymentRoutes);

const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`Server running on ${port}`));