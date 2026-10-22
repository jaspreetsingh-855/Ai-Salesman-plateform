import { Router } from "express";
import User from "../models/User.js";
import RoutePlan from "../models/RoutePlan.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { teamSalesmanIds } from "../utils/scope.js";
import { todayIso } from "../utils/notify.js";

const router = Router();

router.post("/", requireAuth, async (req, res) => {
  const lat = Number(req.body.lat);
  const lng = Number(req.body.lng);
  if (Number.isNaN(lat) || Number.isNaN(lng)) {
    return res.status(400).json({ message: "lat and lng are required." });
  }

  req.user.lastLocation = { lat, lng, at: new Date() };
  await req.user.save();
  res.json(req.user.lastLocation);
});

router.get("/live", requireAuth, requireRole("admin"), async (req, res) => {
  const ids = await teamSalesmanIds(req.user);
  const query = { role: "salesman", "lastLocation.lat": { $ne: null } };
  if (ids) query._id = { $in: ids };
  const people = await User.find(query).select("name email lastLocation");
  const routes = await RoutePlan.find({ date: todayIso() }).populate("salesman", "name");
  res.json({ people, routes });
});

export default router;
