import { Router } from "express";
import Task from "../models/Task.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { notify } from "../utils/notify.js";
import { salesmanFilter } from "../utils/scope.js";
import { audit } from "../utils/audit.js";
import { publicPath, upload } from "../utils/upload.js";

const router = Router();

function canAccessTask(user, task) {
  if (user.role === "admin") return true;
  return String(task.salesman) === String(user._id);
}

router.get("/", requireAuth, async (req, res) => {
  const query = await salesmanFilter(req.user, req.query.salesman);

  if (req.query.status) query.status = req.query.status;
  if (req.query.date) query.date = req.query.date;
  if (req.query.from && req.query.to) {
    query.date = { $gte: req.query.from, $lte: req.query.to };
  }
  if (req.query.search) {
    query.$or = [
      { title: { $regex: req.query.search, $options: "i" } },
      { area: { $regex: req.query.search, $options: "i" } },
      { description: { $regex: req.query.search, $options: "i" } }
    ];
  }

  const tasks = await Task.find(query)
    .populate("salesman", "name email")
    .populate("assignedBy", "name")
    .sort({ date: -1, createdAt: -1 });

  res.json(tasks);
});

router.post("/", requireAuth, requireRole("admin"), async (req, res) => {
  const { title, description, area, date, salesman, income } = req.body;

  if (!title || !date || !salesman) {
    return res.status(400).json({ message: "Title, date and salesman are required." });
  }

  const task = await Task.create({
    title,
    description: description || "",
    area: area || "",
    date,
    salesman,
    assignedBy: req.user._id,
    income: Number(income) || 0
  });

  await notify(
    salesman,
    "New task assigned",
    `${req.user.name} assigned you "${title}" for ${date}.`
  );
  await audit(req.user, "create", "task", task._id, title);

  const populated = await task.populate([
    { path: "salesman", select: "name email" },
    { path: "assignedBy", select: "name" }
  ]);

  res.status(201).json(populated);
});

router.patch("/:id", requireAuth, async (req, res) => {
  const task = await Task.findById(req.params.id);
  if (!task) {
    return res.status(404).json({ message: "Task not found." });
  }

  if (!canAccessTask(req.user, task)) {
    return res.status(403).json({ message: "You cannot update this task." });
  }

  const { status, notes, income, title, description, area, date } = req.body;

  if (status) task.status = status;
  if (notes !== undefined) task.notes = notes;
  if (income !== undefined) task.income = Number(income) || 0;

  if (req.user.role !== "salesman") {
    if (title) task.title = title;
    if (description !== undefined) task.description = description;
    if (area !== undefined) task.area = area;
    if (date) task.date = date;
  }

  await task.save();

  if (status === "done") {
    await notify(
      task.assignedBy,
      "Task completed",
      `${req.user.name} completed "${task.title}".`
    );
  }

  const populated = await task.populate([
    { path: "salesman", select: "name email" },
    { path: "assignedBy", select: "name" }
  ]);

  res.json(populated);
});

router.post("/:id/photo", requireAuth, upload.single("photo"), async (req, res) => {
  const task = await Task.findById(req.params.id);
  if (!task || !canAccessTask(req.user, task)) {
    return res.status(404).json({ message: "Task not found." });
  }
  if (!req.file) {
    return res.status(400).json({ message: "Please upload a visit photo." });
  }
  task.photoUrl = publicPath(req.file.filename);
  if (req.body.status) task.status = req.body.status;
  if (req.body.notes !== undefined) task.notes = req.body.notes;
  await task.save();
  res.json(task);
});

router.delete("/:id", requireAuth, requireRole("admin"), async (req, res) => {
  const task = await Task.findByIdAndDelete(req.params.id);
  if (!task) {
    return res.status(404).json({ message: "Task not found." });
  }
  await audit(req.user, "delete", "task", req.params.id, task.title);
  res.json({ ok: true });
});

router.post("/:id/remind", requireAuth, requireRole("admin"), async (req, res) => {
  const task = await Task.findById(req.params.id).populate("salesman", "name phone");
  if (!task) {
    return res.status(404).json({ message: "Task not found." });
  }

  await notify(
    task.salesman._id,
    "Task reminder",
    `Reminder: "${task.title}" on ${task.date} is still ${task.status.replace("_", " ")}.`
  );

  res.json({ ok: true, phone: task.salesman.phone });
});

export default router;
