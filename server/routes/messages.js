import { Router } from "express";
import User from "../models/User.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { notify } from "../utils/notify.js";
import { audit } from "../utils/audit.js";

const router = Router();

async function sendTwilio(phone, body) {
  const sid = process.env.TWILIO_SID;
  const token = process.env.TWILIO_TOKEN;
  const from = process.env.TWILIO_FROM;
  if (!sid || !token || !from || !phone) return { sent: false, reason: "Twilio not configured" };

  const auth = Buffer.from(`${sid}:${token}`).toString("base64");
  const params = new URLSearchParams({ To: phone, From: from, Body: body });
  const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: params
  });
  return { sent: response.ok, reason: response.ok ? "sent" : await response.text() };
}

router.post("/remind", requireAuth, requireRole("admin"), async (req, res) => {
  const user = await User.findById(req.body.userId);
  if (!user) return res.status(404).json({ message: "User not found." });

  const text = req.body.message || "Please check your SalesNav tasks and route for today.";
  await notify(user._id, "SMS / WhatsApp reminder", text);
  const result = await sendTwilio(user.phone, text);
  await audit(req.user, "remind", "message", user._id, text);

  res.json({
    ok: true,
    inApp: true,
    sms: result,
    note: result.sent
      ? "SMS sent via Twilio."
      : "In-app reminder saved. Add TWILIO_SID, TWILIO_TOKEN and TWILIO_FROM to send real SMS/WhatsApp."
  });
});

export default router;
