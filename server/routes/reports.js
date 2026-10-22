import { Router } from "express";
import Task from "../models/Task.js";
import RoutePlan from "../models/RoutePlan.js";
import User from "../models/User.js";
import { requireAuth } from "../middleware/auth.js";
import { monthRange, todayIso } from "../utils/notify.js";
import { salesmanFilter } from "../utils/scope.js";

const router = Router();

async function buildReport(req) {
  const { from, to } = req.query.from && req.query.to
    ? { from: req.query.from, to: req.query.to }
    : monthRange();

  const base = await salesmanFilter(req.user, req.query.salesman);
  const query = { ...base, date: { $gte: from, $lte: to } };
  const tasks = await Task.find(query).populate("salesman", "name email");
  const bySalesman = {};
  const byDay = {};

  for (const task of tasks) {
    const salesmanId = String(task.salesman?._id || task.salesman);
    const salesmanName = task.salesman?.name || "Unknown";

    if (!bySalesman[salesmanId]) {
      bySalesman[salesmanId] = {
        salesmanId,
        name: salesmanName,
        assigned: 0,
        done: 0,
        pending: 0,
        inProgress: 0,
        income: 0
      };
    }

    bySalesman[salesmanId].assigned += 1;
    bySalesman[salesmanId][task.status === "in_progress" ? "inProgress" : task.status] += 1;
    bySalesman[salesmanId].income += task.income || 0;

    if (!byDay[task.date]) {
      byDay[task.date] = { date: task.date, assigned: 0, done: 0, income: 0 };
    }
    byDay[task.date].assigned += 1;
    if (task.status === "done") byDay[task.date].done += 1;
    byDay[task.date].income += task.income || 0;
  }

  const assigned = tasks.length;
  const done = tasks.filter((task) => task.status === "done").length;

  return {
    from,
    to,
    assigned,
    done,
    pending: tasks.filter((task) => task.status === "pending").length,
    inProgress: tasks.filter((task) => task.status === "in_progress").length,
    income: tasks.reduce((sum, task) => sum + (task.income || 0), 0),
    completion: assigned ? Math.round((done / assigned) * 100) : 0,
    bySalesman: Object.values(bySalesman),
    byDay: Object.values(byDay).sort((a, b) => a.date.localeCompare(b.date))
  };
}

router.get("/dashboard", requireAuth, async (req, res) => {
  const { from, to } = monthRange();
  const today = todayIso();
  const filter = await salesmanFilter(req.user, req.query.salesman);

  const monthTasks = await Task.find({
    ...filter,
    date: { $gte: from, $lte: to }
  }).populate("salesman", "name");

  const todayTasks = monthTasks.filter((task) => task.date === today);
  const todayRoutes = await RoutePlan.find({ ...filter, date: today }).populate("salesman", "name");

  const assigned = monthTasks.length;
  const done = monthTasks.filter((task) => task.status === "done").length;
  const income = monthTasks.reduce((sum, task) => sum + (task.income || 0), 0);

  res.json({
    today,
    from,
    to,
    assigned,
    done,
    pending: monthTasks.filter((task) => task.status === "pending").length,
    inProgress: monthTasks.filter((task) => task.status === "in_progress").length,
    income,
    target: req.user.role === "salesman" ? req.user.monthlyTarget : 0,
    achievement:
      req.user.role === "salesman" && req.user.monthlyTarget
        ? Math.round((done / req.user.monthlyTarget) * 100)
        : assigned
          ? Math.round((done / assigned) * 100)
          : 0,
    todayTasks,
    todayRoutes
  });
});

router.get("/agenda", requireAuth, async (req, res) => {
  const date = req.query.date || todayIso();
  const query = { ...(await salesmanFilter(req.user, req.query.salesman)), date };

  const [tasks, routes, salesmen] = await Promise.all([
    Task.find(query).populate("salesman", "name email").sort({ createdAt: 1 }),
    RoutePlan.find(query).populate("salesman", "name email").sort({ createdAt: 1 }),
    req.user.role === "salesman"
      ? []
      : User.find({ role: "salesman" }).select("name email")
  ]);

  res.json({ date, tasks, routes, salesmen });
});

router.get("/", requireAuth, async (req, res) => {
  res.json(await buildReport(req));
});

router.get("/export.csv", requireAuth, async (req, res) => {
  const report = await buildReport(req);
  const lines = ["Date,Assigned,Done,Income"];
  for (const row of report.byDay) {
    lines.push(`${row.date},${row.assigned},${row.done},${row.income}`);
  }
  lines.push("");
  lines.push("Salesman,Assigned,Done,Income");
  for (const row of report.bySalesman) {
    lines.push(`"${row.name}",${row.assigned},${row.done},${row.income}`);
  }
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", `attachment; filename=sales-report-${report.from}-to-${report.to}.csv`);
  res.send(lines.join("\n"));
});

router.get("/export.pdf", requireAuth, async (req, res) => {
  const report = await buildReport(req);
  const lines = [
    "SalesNav Performance Report",
    `${report.from} to ${report.to}`,
    `Assigned: ${report.assigned}  Done: ${report.done}  Income: ${report.income}`,
    "",
    "By day:"
  ];
  report.byDay.forEach((row) => lines.push(`${row.date}  assigned ${row.assigned}  done ${row.done}  income ${row.income}`));
  lines.push("", "By salesman:");
  report.bySalesman.forEach((row) => lines.push(`${row.name}  assigned ${row.assigned}  done ${row.done}  income ${row.income}`));

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename=sales-report-${report.from}.pdf`);

  const { default: PDFDocument } = await import("pdfkit");
  const doc = new PDFDocument({ margin: 40 });
  doc.pipe(res);
  doc.fontSize(18).text("SalesNav Performance Report", { underline: true });
  doc.moveDown();
  doc.fontSize(11);
  lines.slice(1).forEach((line) => doc.text(line));
  doc.end();
});

export default router;
