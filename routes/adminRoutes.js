import express from "express";
import { auth } from "../middleware/auth.js";
import { allowRoles } from "../middleware/role.js";
import { assignStaff, blockUser } from "../controllers/adminController.js";

const router = express.Router();

router.patch("/assign/:id", auth, allowRoles("admin"), assignStaff);
router.patch("/block/:id", auth, allowRoles("admin"), blockUser);

export default router;

