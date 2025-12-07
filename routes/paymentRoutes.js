import express from "express";
import { auth } from "../middleware/auth.js";
import { boostPayment } from "../controllers/paymentController.js";

const router = express.Router();

router.post("/boost", auth, boostPayment);

export default router;

