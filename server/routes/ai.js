import { Router } from "express";
import Task from "../models/Task.js";
import RoutePlan from "../models/RoutePlan.js";
import User from "../models/User.js";
import { getSettings } from "../models/Settings.js";
import { requireAuth } from "../middleware/auth.js";
import { todayIso, monthRange } from "../utils/notify.js";

const router = Router();

async function askOpenAi(prompt, tone) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      temperature: 0.4,
      messages: [
        {
          role: "system",
          content: `You are an AI assistant for a field sales navigation platform. Tone: ${tone}. Be concise and practical. Do not invent shops or numbers.`
        },
        { role: "user", content: prompt }
      ]
    })
  });

  if (!response.ok) return null;
  const data = await response.json();
  return data.choices?.[0]?.message?.content || null;
}

async function askGemini(prompt, tone) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `You are a field-sales AI. Tone: ${tone}. Do not invent data.\n\n${prompt}`
              }
            ]
          }
        ]
      })
    }
  );

  if (!response.ok) return null;
  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || null;
}

async function askModel(prompt) {
  const settings = await getSettings();
  const tone = settings.aiTone || "professional and brief";
  const openAi = await askOpenAi(prompt, tone);
  if (openAi) return { text: openAi, source: "openai" };
  const gemini = await askGemini(prompt, tone);
  if (gemini) return { text: gemini, source: "gemini" };
  return { text: null, source: "local" };
}

function localRouteSuggestion(stops) {
  const pending = stops.filter((stop) => stop.status !== "done");
  const done = stops.filter((stop) => stop.status === "done");
  const ordered = [...pending, ...done];
  const lines = ordered.map((stop, index) => `${index + 1}. ${stop.name}${stop.address ? ` — ${stop.address}` : ""} (${stop.status.replace("_", " ")})`);

  return {
    orderedStops: ordered.map((stop, index) => ({ ...stop, suggestedOrder: index + 1 })),
    summary: pending.length
      ? `Start with pending stops first. Suggested order:\n${lines.join("\n")}`
      : "All stops are done. No new route needed today."
  };
}

function localDailySummary({ tasks, routes, role, name }) {
  const assigned = tasks.length;
  const done = tasks.filter((task) => task.status === "done").length;
  const pending = tasks.filter((task) => task.status === "pending").length;
  const income = tasks.reduce((sum, task) => sum + (task.income || 0), 0);
  const routeStops = routes.flatMap((route) => route.stops || []);
  const stopsDone = routeStops.filter((stop) => stop.status === "done").length;

  if (role === "salesman") {
    return `Hi ${name}, today you have ${assigned} tasks (${done} done, ${pending} pending) and ${routeStops.length} route stops (${stopsDone} done). Recorded income: ₹${income}. ${pending ? "Finish pending visits before end of day." : "All tasks complete. Nice work."}`;
  }

  return `Daily summary: ${assigned} tasks assigned, ${done} completed, ${pending} still pending. Route stops done: ${stopsDone}/${routeStops.length || 0}. Income recorded: ₹${income}. ${pending ? "Send reminders to salesmen with pending work." : "Great day — no pending tasks."}`;
}

router.post("/route-suggestion", requireAuth, async (req, res) => {
  const salesmanId = req.user.role === "salesman" ? req.user._id : req.body.salesmanId;
  const date = req.body.date || todayIso();

  if (!salesmanId) {
    return res.status(400).json({ message: "Choose a salesman." });
  }

  const route = await RoutePlan.findOne({ salesman: salesmanId, date }).sort({ createdAt: -1 });
  if (!route || !route.stops.length) {
    return res.json({
      source: "local",
      orderedStops: [],
      summary: "No route found for this date. Create a route with stops first."
    });
  }

  const local = localRouteSuggestion(route.stops.map((stop) => stop.toObject()));
  const model = await askModel(
    `Suggest the best visit order for this salesman route on ${date}. Use only these stops: ${JSON.stringify(local.orderedStops.map((s) => ({ name: s.name, address: s.address, status: s.status })))}. Keep it short.`
  );

  res.json({
    ...local,
    source: model.source,
    summary: model.text || local.summary
  });
});

router.get("/daily-summary", requireAuth, async (req, res) => {
  const date = req.query.date || todayIso();
  const { from, to } = monthRange();
  const salesmanId = req.user.role === "salesman" ? req.user._id : req.query.salesmanId;

  const taskQuery = { date };
  const monthQuery = { date: { $gte: from, $lte: to } };
  if (salesmanId) {
    taskQuery.salesman = salesmanId;
    monthQuery.salesman = salesmanId;
  }

  const [tasks, routes, monthTasks, salesman] = await Promise.all([
    Task.find(taskQuery).populate("salesman", "name"),
    RoutePlan.find(salesmanId ? { salesman: salesmanId, date } : { date }),
    Task.find(monthQuery),
    salesmanId ? User.findById(salesmanId) : null
  ]);

  const local = localDailySummary({
    tasks,
    routes,
    role: req.user.role,
    name: salesman?.name || req.user.name
  });

  const monthDone = monthTasks.filter((task) => task.status === "done").length;
  const model = await askModel(
    `Write a short daily performance summary for ${req.user.role} ${req.user.name}. Use only these facts. Today (${date}): ${tasks.length} tasks, ${tasks.filter((t) => t.status === "done").length} done. Month so far: ${monthTasks.length} assigned, ${monthDone} done. Keep under 80 words.`
  );

  res.json({
    date,
    source: model.source,
    summary: model.text || local,
    stats: {
      todayAssigned: tasks.length,
      todayDone: tasks.filter((task) => task.status === "done").length,
      monthAssigned: monthTasks.length,
      monthDone
    }
  });
});

export default router;
