import { Router } from "express";
import { getSettings } from "../models/Settings.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { audit } from "../utils/audit.js";

const router = Router();

router.get("/", requireAuth, async (_req, res) => {
  const settings = await getSettings();
  res.json(settings);
});

router.put("/", requireAuth, requireRole("admin"), async (req, res) => {
  const settings = await getSettings();
  const { companyName, workingHoursStart, workingHoursEnd, areas, aiTone } = req.body;
  if (companyName) settings.companyName = companyName;
  if (workingHoursStart) settings.workingHoursStart = workingHoursStart;
  if (workingHoursEnd) settings.workingHoursEnd = workingHoursEnd;
  if (Array.isArray(areas)) settings.areas = areas.filter(Boolean);
  if (typeof areas === "string") {
    settings.areas = areas.split(",").map((item) => item.trim()).filter(Boolean);
  }
  if (aiTone) settings.aiTone = aiTone;
  await settings.save();
  await audit(req.user, "update", "settings", settings._id, "Company settings updated");
  res.json(settings);
});

export default router;
