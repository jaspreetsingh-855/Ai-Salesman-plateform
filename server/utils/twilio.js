export function toE164(phone, defaultCountry = "91") {
  if (!phone) return "";
  let raw = String(phone).trim();
  if (raw.startsWith("whatsapp:")) raw = raw.slice("whatsapp:".length);
  raw = raw.replace(/[^\d+]/g, "");
  if (raw.startsWith("00")) raw = `+${raw.slice(2)}`;
  if (raw.startsWith("+")) return raw;
  const digits = raw.replace(/\D/g, "");
  const local = digits.startsWith("0") ? digits.slice(1) : digits;
  if (!local) return "";
  if (local.length === 10) return `+${defaultCountry}${local}`;
  return `+${local}`;
}

export function twilioConfigured(channel = "sms") {
  const sid = process.env.TWILIO_SID;
  const token = process.env.TWILIO_TOKEN;
  const from = channel === "whatsapp" ? process.env.TWILIO_WHATSAPP_FROM : process.env.TWILIO_FROM;
  return Boolean(sid && token && from);
}

function whatsappAddr(value) {
  const e164 = toE164(value);
  if (!e164) return "";
  return e164.startsWith("whatsapp:") ? e164 : `whatsapp:${e164}`;
}

async function sendTwilio({ to, from, body }) {
  const sid = process.env.TWILIO_SID;
  const token = process.env.TWILIO_TOKEN;
  if (!sid || !token || !from || !to) {
    return { sent: false, reason: "Twilio not configured" };
  }

  const auth = Buffer.from(`${sid}:${token}`).toString("base64");
  const params = new URLSearchParams({ To: to, From: from, Body: body });
  const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: params
  });

  if (response.ok) return { sent: true, reason: "sent" };
  const detail = await response.text();
  return { sent: false, reason: detail.slice(0, 400) };
}

export async function sendSms(phone, body) {
  const to = toE164(phone);
  const from = process.env.TWILIO_FROM;
  if (!to) return { sent: false, reason: "Missing phone number" };
  return sendTwilio({ to, from, body });
}

export async function sendWhatsApp(phone, body) {
  const to = whatsappAddr(phone);
  let from = process.env.TWILIO_WHATSAPP_FROM || "";
  if (from && !from.startsWith("whatsapp:")) from = `whatsapp:${toE164(from) || from}`;
  if (!to) return { sent: false, reason: "Missing phone number" };
  return sendTwilio({ to, from, body });
}
