import { Router } from "express";
import AuditLog from "../models/AuditLog.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();

router.get("/", requireAuth, requireRole("admin"), async (_req, res) => {
  const rows = await AuditLog.find()
    .populate("actor", "name email role")
    .sort({ createdAt: -1 })
    .limit(200);
  res.json(rows);
});

export default router;
