import { Router } from "express";
import User from "../models/User.js";
import Lead from "../models/Lead.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { notify } from "../utils/notify.js";
import { audit } from "../utils/audit.js";
import { sendSms, sendWhatsApp, twilioConfigured } from "../utils/twilio.js";

const router = Router();

function sendNote(channel, result) {
  if (result.sent) {
    return channel === "whatsapp" ? "WhatsApp sent via Twilio." : "SMS sent via Twilio.";
  }
  if (channel === "whatsapp") {
    return "In-app reminder saved. Add TWILIO_SID, TWILIO_TOKEN and TWILIO_WHATSAPP_FROM to send WhatsApp.";
  }
  return "In-app reminder saved. Add TWILIO_SID, TWILIO_TOKEN and TWILIO_FROM to send SMS.";
}

router.get("/status", requireAuth, (_req, res) => {
  res.json({
    sms: twilioConfigured("sms"),
    whatsapp: twilioConfigured("whatsapp")
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

  const result = await sendWhatsApp(phone, text);
  await audit(req.user, "whatsapp", "message", auditTarget, text);

  res.json({
    ok: true,
    inApp: Boolean(notifyUserId),
    channel: "whatsapp",
    result,
    note: sendNote("whatsapp", result)
  });
});

export default router;
