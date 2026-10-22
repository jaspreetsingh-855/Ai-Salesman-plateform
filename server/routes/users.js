import { Router } from "express";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import Task from "../models/Task.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { notify, monthRange } from "../utils/notify.js";
import { audit } from "../utils/audit.js";

const router = Router();

router.get("/salesmen", requireAuth, requireRole("admin"), async (req, res) => {
  const salesmen = await User.find({ role: "salesman" }).sort({ createdAt: -1 });
  const { from, to } = monthRange();
  const tasks = await Task.find({ date: { $gte: from, $lte: to } });

  const result = salesmen.map((person) => {
    const mine = tasks.filter((task) => String(task.salesman) === String(person._id));
    const assigned = mine.length;
    const done = mine.filter((task) => task.status === "done").length;
    const income = mine.reduce((sum, task) => sum + (task.income || 0), 0);

    return {
      ...person.toSafe(),
      assigned,
      done,
      pending: mine.filter((task) => task.status === "pending").length,
      inProgress: mine.filter((task) => task.status === "in_progress").length,
      income,
      achievement: person.monthlyTarget
        ? Math.round((done / person.monthlyTarget) * 100)
        : 0
    };
  });

  res.json(result);
});

router.post("/salesmen", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const { name, email, phone, password, monthlyTarget } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email and password are required." });
    }

    const exists = await User.findOne({ email: email.trim().toLowerCase() });
    if (exists) {
      return res.status(400).json({ message: "An account with this email already exists." });
    }

    const hashed = await bcrypt.hash(password, 10);
    const salesman = await User.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone || "",
      password: hashed,
      role: "salesman",
      monthlyTarget: Number(monthlyTarget) || 10,
      createdBy: req.user._id
    });

    await notify(
      salesman._id,
      "Welcome to the team",
      `${req.user.name} added you as a salesman. Check your dashboard for today's tasks.`
    );
    await audit(req.user, "create", "salesman", salesman._id, salesman.email);

    res.status(201).json(salesman.toSafe());
  } catch (error) {
    res.status(500).json({ message: error.message || "Could not add salesman." });
  }
});

router.patch("/salesmen/:id", requireAuth, requireRole("admin"), async (req, res) => {
  const salesman = await User.findOne({ _id: req.params.id, role: "salesman" });
  if (!salesman) {
    return res.status(404).json({ message: "Salesman not found." });
  }

  const { name, phone, monthlyTarget } = req.body;
  if (name) salesman.name = name;
  if (phone !== undefined) salesman.phone = phone;
  if (monthlyTarget !== undefined) salesman.monthlyTarget = Number(monthlyTarget) || 0;
  await salesman.save();
  await audit(req.user, "update", "salesman", salesman._id, "Updated salesman");

  res.json(salesman.toSafe());
});

router.delete("/salesmen/:id", requireAuth, requireRole("admin"), async (req, res) => {
  const salesman = await User.findOneAndDelete({ _id: req.params.id, role: "salesman" });
  if (!salesman) {
    return res.status(404).json({ message: "Salesman not found." });
  }
  await audit(req.user, "delete", "salesman", salesman._id, salesman.email);
  res.json({ ok: true });
});

export default router;
