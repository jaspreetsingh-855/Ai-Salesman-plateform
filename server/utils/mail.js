import nodemailer from "nodemailer";

export function mailConfigured() {
  return Boolean(process.env.EMAIL_USER && process.env.EMAIL_PASS);
}

function transporter() {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || "smtp.gmail.com",
    port: Number(process.env.EMAIL_PORT || 587),
    secure: process.env.EMAIL_PORT === "465",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
}

export async function sendResetEmail({ to, name, role, resetUrl }) {
  if (!mailConfigured()) {
    return { sent: false, reason: "Email is not configured" };
  }

  const from = process.env.EMAIL_FROM || process.env.EMAIL_USER;
  const who = role === "admin" ? "admin" : "salesman";

  try {
    await transporter().sendMail({
      from,
      to,
      subject: "SalesNav password reset",
      text: `Hi ${name || "there"},\n\nReset your ${who} password using this link (valid 1 hour):\n${resetUrl}\n\nIf you did not ask for this, ignore the email.`,
      html: `<p>Hi ${name || "there"},</p><p>Reset your <strong>${who}</strong> password using this link (valid 1 hour):</p><p><a href="${resetUrl}">${resetUrl}</a></p><p>If you did not ask for this, ignore the email.</p>`
    });
    return { sent: true, reason: "sent" };
  } catch (err) {
    console.error("Reset email failed:", err.message);
    return { sent: false, reason: err.message };
  }
}
