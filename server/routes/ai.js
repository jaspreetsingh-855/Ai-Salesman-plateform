import { Router } from "express";
import Task from "../models/Task.js";
import RoutePlan from "../models/RoutePlan.js";
import User from "../models/User.js";
import Lead from "../models/Lead.js";
import LeadChat from "../models/LeadChat.js";
import { getSettings } from "../models/Settings.js";
import { requireAuth } from "../middleware/auth.js";
import { notify, todayIso, monthRange } from "../utils/notify.js";

const router = Router();

function apiErrorText(status, body) {
  try {
    const parsed = JSON.parse(body);
    return parsed?.error?.message || parsed?.error?.code || body.slice(0, 200);
  } catch {
    return body.slice(0, 200) || `HTTP ${status}`;
  }
}

async function askOpenAi(prompt, tone) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return { text: null, error: null };

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`
      },
      signal: AbortSignal.timeout(8000),
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

    const raw = await response.text();
    if (!response.ok) {
      const error = apiErrorText(response.status, raw);
      console.error("OpenAI error:", response.status, error);
      return { text: null, error };
    }

    const data = JSON.parse(raw);
    return { text: data.choices?.[0]?.message?.content || null, error: null };
  } catch (err) {
    const error = err.name === "TimeoutError" ? "OpenAI timed out" : (err.message || "OpenAI request failed");
    console.error("OpenAI error:", error);
    return { text: null, error };
  }
}

async function askGemini(prompt, tone) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return { text: null, error: null };

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${key}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: AbortSignal.timeout(8000),
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
    const raw = await response.text();
    if (!response.ok) {
      const error = apiErrorText(response.status, raw);
      console.error("Gemini error:", response.status, error);
      return { text: null, error };
    }
    const data = JSON.parse(raw);
    return { text: data.candidates?.[0]?.content?.parts?.[0]?.text || null, error: null };
  } catch (err) {
    const error = err.name === "TimeoutError" ? "Gemini timed out" : (err.message || "Gemini request failed");
    console.error("Gemini error:", error);
    return { text: null, error };
  }
}

async function askModel(prompt) {
  const settings = await getSettings();
  const tone = settings.aiTone || "professional and brief";
  if (process.env.GEMINI_API_KEY) {
    const gemini = await askGemini(prompt, tone);
    if (gemini.text) return { text: gemini.text, source: "gemini", error: null };
    return { text: null, source: "local", error: gemini.error };
  }
  const openAi = await askOpenAi(prompt, tone);
  if (openAi.text) return { text: openAi.text, source: "openai", error: null };
  return { text: null, source: "local", error: openAi.error || null };
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

function parseJsonObject(text) {
  if (!text) return null;
  const match = String(text).match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    return JSON.parse(match[0]);
  } catch {
    return null;
  }
}

function localFollowUp(lead, salesmanName, company) {
  const shop = lead.shop || lead.stopName || "your shop";
  const area = lead.area ? ` in ${lead.area}` : "";
  return `Hi ${lead.name}, this is ${salesmanName} from ${company}. Just checking in about ${shop}${area}. When is a good time for a short visit this week?`;
}

function localQualify(lead) {
  let score = 4;
  if (lead.status === "won") score = 9;
  else if (lead.status === "contacted") score = 6;
  else if (lead.status === "lost") score = 2;
  if (lead.phone) score += 1;
  if (lead.notes) score += 1;
  if (lead.shop || lead.stopName) score += 1;
  score = Math.max(1, Math.min(10, score));

  const nextAction = {
    new: "Send a WhatsApp intro and book a first visit.",
    contacted: "Follow up on WhatsApp and confirm a visit slot.",
    won: "Schedule a repeat visit and collect payment/order.",
    lost: "Pause outreach; review why it was lost."
  }[lead.status] || "Send a short WhatsApp follow-up.";

  return {
    score,
    reason: `Based on status (${lead.status})${lead.phone ? ", phone on file" : ", no phone"}${lead.notes ? ", and notes" : ""}.`,
    nextAction
  };
}

async function loadLeadForUser(req, leadId) {
  if (!leadId) return { error: "Choose a lead.", status: 400 };
  const lead = await Lead.findById(leadId).populate("salesman", "name phone");
  if (!lead) return { error: "Lead not found." };
  if (req.user.role === "salesman" && String(lead.salesman?._id || lead.salesman) !== String(req.user._id)) {
    return { error: "You cannot use AI on this lead.", status: 403 };
  }
  return { lead };
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
    error: model.error || null,
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
    error: model.error || null,
    summary: model.text || local,
    stats: {
      todayAssigned: tasks.length,
      todayDone: tasks.filter((task) => task.status === "done").length,
      monthAssigned: monthTasks.length,
      monthDone
    }
  });
});

router.post("/follow-up", requireAuth, async (req, res) => {
  const loaded = await loadLeadForUser(req, req.body.leadId);
  if (loaded.error) {
    return res.status(loaded.status || 404).json({ message: loaded.error });
  }
  const { lead } = loaded;

  const settings = await getSettings();
  const salesmanName = lead.salesman?.name || req.user.name;
  const company = settings.companyName || "SalesNav AI";
  const local = localFollowUp(lead, salesmanName, company);

  const model = await askModel(
    `Write one WhatsApp follow-up (max 280 characters, no quotes, no emoji spam) from salesman ${salesmanName} at ${company} to lead ${lead.name}. Shop: ${lead.shop || lead.stopName || "n/a"}. Area: ${lead.area || "n/a"}. Status: ${lead.status}. Notes: ${lead.notes || "none"}. Do not invent discounts or visits that did not happen.`
  );

  res.json({
    source: model.source,
    error: model.error || null,
    message: (model.text || local).trim().replace(/^["']|["']$/g, "")
  });
});

router.post("/qualify-lead", requireAuth, async (req, res) => {
  const loaded = await loadLeadForUser(req, req.body.leadId);
  if (loaded.error) {
    return res.status(loaded.status || 404).json({ message: loaded.error });
  }
  const { lead } = loaded;
  const local = localQualify(lead);

  const model = await askModel(
    `Score this field-sales lead from 1 to 10. Return JSON only with keys score (number), reason (short), nextAction (short). Lead: ${JSON.stringify({
      name: lead.name,
      shop: lead.shop,
      area: lead.area,
      status: lead.status,
      notes: lead.notes,
      hasPhone: Boolean(lead.phone)
    })}. Do not invent extra facts.`
  );

  const parsed = parseJsonObject(model.text);
  const score = Math.max(1, Math.min(10, Number(parsed?.score) || local.score));
  const reason = parsed?.reason || local.reason;
  const nextAction = parsed?.nextAction || local.nextAction;

  lead.score = score;
  lead.nextAction = nextAction;
  await lead.save();

  res.json({
    source: parsed ? model.source : "local",
    error: parsed ? null : model.error || null,
    score,
    reason,
    nextAction,
    lead: await lead.populate("salesman", "name")
  });
});

function timeOk(time, start, end) {
  if (!time) return false;
  return time >= start && time <= end;
}

function suggestSlots(start, end) {
  const hours = ["10:00", "12:00", "15:00", "17:00"].filter((t) => timeOk(t, start, end));
  const picks = hours.length ? hours.slice(0, 2) : [start];
  const days = [1, 2].map((offset) => {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    return d.toISOString().slice(0, 10);
  });
  return days.flatMap((date) => picks.map((time) => ({ date, time })));
}

router.get("/chat/:leadId", requireAuth, async (req, res) => {
  const loaded = await loadLeadForUser(req, req.params.leadId);
  if (loaded.error) return res.status(loaded.status || 404).json({ message: loaded.error });
  const messages = await LeadChat.find({ lead: loaded.lead._id }).sort({ createdAt: 1 }).limit(100);
  res.json({ lead: loaded.lead, messages });
});

export async function generateSalesReply(lead, customerText, { channel = "in-app" } = {}) {
  await LeadChat.create({ lead: lead._id, role: "customer", text: customerText, channel });
  const history = await LeadChat.find({ lead: lead._id }).sort({ createdAt: 1 }).limit(20);
  const settings = await getSettings();
  const salesmanName = lead.salesman?.name || "your salesman";
  const company = settings.companyName || "SalesNav AI";
  const local = `Thanks ${lead.name}. ${salesmanName} from ${company} can visit ${lead.shop || "your shop"}${lead.area ? ` in ${lead.area}` : ""}. What day and time works?`;

  const model = await askModel(
    `You are ${salesmanName}, a field salesman at ${company}. Reply in one or two short WhatsApp-style sentences to this customer. Do not invent prices or completed visits. Lead: ${JSON.stringify({
      name: lead.name,
      shop: lead.shop,
      area: lead.area,
      status: lead.status
    })}. Chat:\n${history.map((m) => `${m.role}: ${m.text}`).join("\n")}`
  );

  const reply = (model.text || local).trim().replace(/^["']|["']$/g, "");
  const saved = await LeadChat.create({ lead: lead._id, role: "ai", text: reply, channel });
  if (lead.status === "new") {
    lead.status = "contacted";
    await lead.save();
  }

  return { reply, saved, source: model.source, error: model.error || null, status: lead.status };
}

router.post("/chat", requireAuth, async (req, res) => {
  const loaded = await loadLeadForUser(req, req.body.leadId);
  if (loaded.error) return res.status(loaded.status || 404).json({ message: loaded.error });
  const { lead } = loaded;
  const customerText = (req.body.message || "").trim();
  if (!customerText) return res.status(400).json({ message: "Message is required." });

  const channel = req.body.channel === "whatsapp" ? "whatsapp" : "in-app";
  const result = await generateSalesReply(lead, customerText, { channel });

  res.json({
    source: result.source,
    error: result.error,
    reply: result.reply,
    message: result.saved,
    status: result.status
  });
});

router.post("/auto-chat", requireAuth, async (req, res) => {
  const loaded = await loadLeadForUser(req, req.body.leadId);
  if (loaded.error) return res.status(loaded.status || 404).json({ message: loaded.error });
  const { lead } = loaded;
  const existing = await LeadChat.countDocuments({ lead: lead._id });
  if (existing) {
    const messages = await LeadChat.find({ lead: lead._id }).sort({ createdAt: 1 });
    return res.json({ alreadyStarted: true, messages });
  }

  const settings = await getSettings();
  const salesmanName = lead.salesman?.name || req.user.name;
  const company = settings.companyName || "SalesNav AI";
  const slots = suggestSlots(settings.workingHoursStart || "09:00", settings.workingHoursEnd || "18:00")
    .slice(0, 2)
    .map((s) => `${s.date} ${s.time}`)
    .join(" or ");
  const local = `Hi ${lead.name}, this is ${salesmanName} from ${company}. We can visit ${lead.shop || "your shop"} — would ${slots} work?`;

  const model = await askModel(
    `Write the first outbound WhatsApp from salesman ${salesmanName} at ${company} to ${lead.name} about ${lead.shop || "their shop"}. Offer these visit slots: ${slots}. Max 240 characters. No fake discounts.`
  );
  const text = (model.text || local).trim().replace(/^["']|["']$/g, "");
  const saved = await LeadChat.create({ lead: lead._id, role: "ai", text, channel: "in-app" });
  res.json({ alreadyStarted: false, source: model.source, error: model.error || null, message: saved, suggestedSlots: suggestSlots(settings.workingHoursStart || "09:00", settings.workingHoursEnd || "18:00") });
});

router.post("/book-meeting", requireAuth, async (req, res) => {
  const loaded = await loadLeadForUser(req, req.body.leadId);
  if (loaded.error) return res.status(loaded.status || 404).json({ message: loaded.error });
  const { lead } = loaded;
  const date = req.body.date;
  const time = req.body.time;
  if (!date || !time) {
    return res.status(400).json({ message: "Date and time are required." });
  }

  const settings = await getSettings();
  const start = settings.workingHoursStart || "09:00";
  const end = settings.workingHoursEnd || "18:00";
  if (!timeOk(time, start, end)) {
    return res.status(400).json({ message: `Choose a time between ${start} and ${end}.` });
  }

  const title = `Visit: ${lead.name}${lead.shop ? ` (${lead.shop})` : ""}`;
  const task = await Task.create({
    title,
    description: `Booked meeting at ${time}. ${req.body.notes || ""}`.trim(),
    area: lead.area || "",
    date,
    time,
    salesman: lead.salesman?._id || lead.salesman,
    assignedBy: req.user._id,
    lead: lead._id
  });

  lead.meetingDate = date;
  lead.meetingTime = time;
  lead.meetingTask = task._id;
  if (lead.status === "new") lead.status = "contacted";
  await lead.save();

  await notify(
    lead.salesman?._id || lead.salesman,
    "Meeting booked",
    `${title} on ${date} at ${time}.`
  );

  await LeadChat.create({
    lead: lead._id,
    role: "ai",
    text: `Visit booked for ${date} at ${time}. ${lead.salesman?.name || "Our salesman"} will come to ${lead.shop || lead.name}.`
  });

  res.status(201).json({
    ok: true,
    task,
    lead: await lead.populate("salesman", "name")
  });
});

export default router;
