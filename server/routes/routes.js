import { Router } from "express";
import RoutePlan from "../models/RoutePlan.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { notify } from "../utils/notify.js";
import { salesmanFilter } from "../utils/scope.js";
import { audit } from "../utils/audit.js";
import { publicPath, upload } from "../utils/upload.js";

const router = Router();

router.get("/", requireAuth, async (req, res) => {
  const query = await salesmanFilter(req.user, req.query.salesman);
  if (req.query.date) query.date = req.query.date;

  const routes = await RoutePlan.find(query)
    .populate("salesman", "name email lastLocation")
    .populate("assignedBy", "name")
    .sort({ date: -1, createdAt: -1 });

  res.json(routes);
});

router.post("/", requireAuth, requireRole("admin"), async (req, res) => {
  const { name, date, salesman, stops } = req.body;

  if (!name || !date || !salesman) {
    return res.status(400).json({ message: "Name, date and salesman are required." });
  }

  const cleanStops = (stops || [])
    .filter((stop) => stop.name && stop.name.trim())
    .map((stop, index) => ({
      order: index + 1,
      name: stop.name.trim(),
      address: stop.address || "",
      lat: stop.lat ? Number(stop.lat) : null,
      lng: stop.lng ? Number(stop.lng) : null,
      status: "pending",
      notes: ""
    }));

  if (!cleanStops.length) {
    return res.status(400).json({ message: "Add at least one route stop." });
  }

  const route = await RoutePlan.create({
    name,
    date,
    salesman,
    assignedBy: req.user._id,
    stops: cleanStops
  });

  await notify(
    salesman,
    "New route assigned",
    `${req.user.name} assigned route "${name}" with ${cleanStops.length} stops for ${date}.`
  );
  await audit(req.user, "create", "route", route._id, name);

  const populated = await route.populate([
    { path: "salesman", select: "name email" },
    { path: "assignedBy", select: "name" }
  ]);

  res.status(201).json(populated);
});

router.patch("/:id/stops/:stopId", requireAuth, async (req, res) => {
  const route = await RoutePlan.findById(req.params.id);
  if (!route) {
    return res.status(404).json({ message: "Route not found." });
  }

  if (req.user.role === "salesman" && String(route.salesman) !== String(req.user._id)) {
    return res.status(403).json({ message: "You cannot update this route." });
  }

  const stop = route.stops.id(req.params.stopId);
  if (!stop) {
    return res.status(404).json({ message: "Stop not found." });
  }

  if (req.body.status) stop.status = req.body.status;
  if (req.body.notes !== undefined) stop.notes = req.body.notes;
  if (req.body.lat !== undefined) stop.lat = Number(req.body.lat);
  if (req.body.lng !== undefined) stop.lng = Number(req.body.lng);
  await route.save();

  const populated = await route.populate([
    { path: "salesman", select: "name email" },
    { path: "assignedBy", select: "name" }
  ]);

  res.json(populated);
});

router.post("/:id/stops/:stopId/photo", requireAuth, upload.single("photo"), async (req, res) => {
  const route = await RoutePlan.findById(req.params.id);
  if (!route) {
    return res.status(404).json({ message: "Route not found." });
  }
  if (req.user.role === "salesman" && String(route.salesman) !== String(req.user._id)) {
    return res.status(403).json({ message: "You cannot update this route." });
  }
  const stop = route.stops.id(req.params.stopId);
  if (!stop || !req.file) {
    return res.status(400).json({ message: "Photo and stop are required." });
  }
  stop.photoUrl = publicPath(req.file.filename);
  stop.status = "done";
  if (req.body.notes) stop.notes = req.body.notes;
  await route.save();
  res.json(route);
});

router.delete("/:id", requireAuth, requireRole("admin"), async (req, res) => {
  const route = await RoutePlan.findByIdAndDelete(req.params.id);
  if (!route) {
    return res.status(404).json({ message: "Route not found." });
  }
  await audit(req.user, "delete", "route", req.params.id, route.name);
  res.json({ ok: true });
});

export default router;
