import { Router } from "express";
import User from "../models/User.js";
import Lead from "../models/Lead.js";
import LeadChat from "../models/LeadChat.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { notify } from "../utils/notify.js";
import { audit } from "../utils/audit.js";
import { sendSms, sendWhatsApp, twilioConfigured, waMeLink, phoneDigits } from "../utils/twilio.js";
import { generateSalesReply } from "./ai.js";

const router = Router();

function sendNote(channel, result) {
  if (result.sent) {
    return channel === "whatsapp" ? "WhatsApp sent via Twilio." : "SMS sent via Twilio.";
  }
  if (channel === "whatsapp") {
    return "Opened in WhatsApp. Add TWILIO_SID, TWILIO_TOKEN and TWILIO_WHATSAPP_FROM to auto-send from the server.";
  }
  return "In-app reminder saved. Add TWILIO_SID, TWILIO_TOKEN and TWILIO_FROM to send SMS.";
}

function webhookBase() {
  return (process.env.PUBLIC_BASE_URL || "http://localhost:5000").replace(/\/$/, "");
}

async function findLeadByPhone(from) {
  const tail = phoneDigits(from).slice(-10);
  if (tail.length < 8) return null;
  const leads = await Lead.find({ phone: { $exists: true, $ne: "" } }).populate("salesman", "name");
  return leads.find((lead) => phoneDigits(lead.phone).slice(-10) === tail) || null;
}

router.get("/status", requireAuth, (_req, res) => {
  res.json({
    sms: twilioConfigured("sms"),
    whatsapp: twilioConfigured("whatsapp"),
    clickToChat: true,
    webhookUrl: `${webhookBase()}/api/messages/whatsapp/inbound`
  });
});

router.post("/remind", requireAuth, requireRole("admin"), async (req, res) => {
  const user = await User.findById(req.body.userId);
  if (!user) return res.status(404).json({ message: "User not found." });

  const text = req.body.message || "Please check your SalesNav tasks and route for today.";
  const channel = req.body.channel === "whatsapp" ? "whatsapp" : "sms";
  await notify(user._id, channel === "whatsapp" ? "WhatsApp reminder" : "SMS reminder", text);
  const result = channel === "whatsapp" ? await sendWhatsApp(user.phone, text) : await sendSms(user.phone, text);
  await audit(req.user, "remind", "message", user._id, `${channel}: ${text}`);

  res.json({
    ok: true,
    inApp: true,
    channel,
    result,
    waLink: channel === "whatsapp" ? waMeLink(user.phone, text) : "",
    note: sendNote(channel, result)
  });
});

router.post("/whatsapp", requireAuth, async (req, res) => {
  const text = (req.body.message || "").trim();
  if (!text) return res.status(400).json({ message: "Message is required." });

  let phone = "";
  let label = "";
  let notifyUserId = null;
  let auditTarget = null;
  let leadDoc = null;

  if (req.body.leadId) {
    const lead = await Lead.findById(req.body.leadId).populate("salesman", "name");
    if (!lead) return res.status(404).json({ message: "Lead not found." });
    if (req.user.role === "salesman" && String(lead.salesman?._id || lead.salesman) !== String(req.user._id)) {
      return res.status(403).json({ message: "You cannot message this lead." });
    }
    phone = lead.phone;
    label = lead.name;
    notifyUserId = lead.salesman?._id || lead.salesman;
    auditTarget = lead._id;
    leadDoc = lead;
  } else if (req.body.userId) {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Only admin can WhatsApp a salesman." });
    }
    const user = await User.findById(req.body.userId);
    if (!user) return res.status(404).json({ message: "User not found." });
    phone = user.phone;
    label = user.name;
    notifyUserId = user._id;
    auditTarget = user._id;
  } else if (req.body.phone) {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Only admin can send to a raw number." });
    }
    phone = req.body.phone;
    label = req.body.phone;
  } else {
    return res.status(400).json({ message: "Provide leadId or userId." });
  }

  if (!phone) {
    return res.status(400).json({ message: "No phone number on file for this contact." });
  }

  if (notifyUserId) {
    await notify(notifyUserId, `WhatsApp to ${label}`, text);
  }

  if (leadDoc) {
    await LeadChat.create({
      lead: leadDoc._id,
      role: "salesman",
      channel: "whatsapp",
      text
    });
    if (leadDoc.status === "new") {
      leadDoc.status = "contacted";
      await leadDoc.save();
    }
  }

  const result = await sendWhatsApp(phone, text);
  await audit(req.user, "whatsapp", "message", auditTarget, text);
  const link = waMeLink(phone, text);

  res.json({
    ok: true,
    inApp: Boolean(notifyUserId),
    channel: "whatsapp",
    result,
    waLink: link,
    note: result.sent ? sendNote("whatsapp", result) : sendNote("whatsapp", result)
  });
});

router.post("/whatsapp/inbound", async (req, res) => {
  const from = req.body.From || req.body.WaId || "";
  const body = String(req.body.Body || "").trim();
  res.type("text/xml").send("<Response></Response>");
  if (!from || !body) return;

  try {
    const lead = await findLeadByPhone(from);
    if (!lead) return;
    const { reply } = await generateSalesReply(lead, body, { channel: "whatsapp" });
    if (lead.salesman) {
      await notify(lead.salesman._id || lead.salesman, "WhatsApp reply", `${lead.name}: ${body}`);
    }
    if (twilioConfigured("whatsapp")) {
      await sendWhatsApp(lead.phone, reply);
    }
  } catch (err) {
    console.error("WhatsApp inbound error:", err.message);
  }
});

export default router;
