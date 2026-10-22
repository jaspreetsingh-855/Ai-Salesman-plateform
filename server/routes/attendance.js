import { Router } from "express";
import Attendance from "../models/Attendance.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { todayIso } from "../utils/notify.js";
import { teamSalesmanIds } from "../utils/scope.js";
import { audit } from "../utils/audit.js";

const router = Router();

router.get("/", requireAuth, async (req, res) => {
  const date = req.query.date || todayIso();
  const query = { date };

  if (req.user.role === "salesman") {
    query.user = req.user._id;
  } else {
    const ids = await teamSalesmanIds(req.user);
    if (ids) query.user = { $in: ids };
  }

  const rows = await Attendance.find(query).populate("user", "name email role lastLocation");
  res.json(rows);
});

router.get("/me", requireAuth, async (req, res) => {
  const date = req.query.date || todayIso();
  const row = await Attendance.findOne({ user: req.user._id, date });
  res.json(row || { date, checkInAt: null, checkOutAt: null });
});

router.post("/check-in", requireAuth, async (req, res) => {
  const date = todayIso();
  const lat = req.body.lat ? Number(req.body.lat) : null;
  const lng = req.body.lng ? Number(req.body.lng) : null;

  const row = await Attendance.findOneAndUpdate(
    { user: req.user._id, date },
    {
      $setOnInsert: { user: req.user._id, date },
      $set: {
        checkInAt: new Date(),
        checkInLocation: lat && lng ? { lat, lng } : undefined
      }
    },
    { new: true, upsert: true }
  );

  await audit(req.user, "check-in", "attendance", row._id, date);
  res.json(row);
});

router.post("/check-out", requireAuth, async (req, res) => {
  const date = todayIso();
  const row = await Attendance.findOne({ user: req.user._id, date });
  if (!row || !row.checkInAt) {
    return res.status(400).json({ message: "Check in first." });
  }

  row.checkOutAt = new Date();
  if (req.body.lat && req.body.lng) {
    row.checkOutLocation = { lat: Number(req.body.lat), lng: Number(req.body.lng) };
  }
  await row.save();
  await audit(req.user, "check-out", "attendance", row._id, date);
  res.json(row);
});

router.get("/field", requireAuth, requireRole("admin"), async (req, res) => {
  const date = req.query.date || todayIso();
  const rows = await Attendance.find({ date, checkInAt: { $ne: null }, checkOutAt: null })
    .populate("user", "name email lastLocation");
  res.json(rows);
});

export default router;
