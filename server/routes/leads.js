import { Router } from "express";
import Lead from "../models/Lead.js";
import { requireAuth } from "../middleware/auth.js";
import { salesmanFilter } from "../utils/scope.js";
import { audit } from "../utils/audit.js";

const router = Router();

router.get("/", requireAuth, async (req, res) => {
  const filter = await salesmanFilter(req.user, req.query.salesman);
  const query = {};
  if (filter.salesman) query.salesman = filter.salesman;
  if (req.query.search) {
    query.$or = [
      { name: { $regex: req.query.search, $options: "i" } },
      { shop: { $regex: req.query.search, $options: "i" } },
      { phone: { $regex: req.query.search, $options: "i" } }
    ];
  }
  const leads = await Lead.find(query).populate("salesman", "name").sort({ createdAt: -1 });
  res.json(leads);
});

router.post("/", requireAuth, async (req, res) => {
  const salesman = req.user.role === "salesman" ? req.user._id : req.body.salesman;
  if (!req.body.name || !salesman) {
    return res.status(400).json({ message: "Name and salesman are required." });
  }

  const lead = await Lead.create({
    name: req.body.name,
    phone: req.body.phone || "",
    shop: req.body.shop || "",
    area: req.body.area || "",
    notes: req.body.notes || "",
    stopName: req.body.stopName || "",
    status: req.body.status || "new",
    salesman
  });
  await audit(req.user, "create", "lead", lead._id, lead.name);
  res.status(201).json(await lead.populate("salesman", "name"));
});

router.patch("/:id", requireAuth, async (req, res) => {
  const lead = await Lead.findById(req.params.id);
  if (!lead) return res.status(404).json({ message: "Lead not found." });
  if (req.user.role === "salesman" && String(lead.salesman) !== String(req.user._id)) {
    return res.status(403).json({ message: "You cannot edit this lead." });
  }

  ["name", "phone", "shop", "area", "notes", "stopName", "status"].forEach((key) => {
    if (req.body[key] !== undefined) lead[key] = req.body[key];
  });
  await lead.save();
  res.json(await lead.populate("salesman", "name"));
});

router.delete("/:id", requireAuth, async (req, res) => {
  const lead = await Lead.findById(req.params.id);
  if (!lead) return res.status(404).json({ message: "Lead not found." });
  if (req.user.role === "salesman" && String(lead.salesman) !== String(req.user._id)) {
    return res.status(403).json({ message: "You cannot delete this lead." });
  }
  await lead.deleteOne();
  await audit(req.user, "delete", "lead", req.params.id, lead.name);
  res.json({ ok: true });
});

export default router;
