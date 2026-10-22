import crypto from "crypto";
import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { clearAuthCookie, requireAuth, setAuthCookie } from "../middleware/auth.js";
import { signUser } from "../utils/notify.js";
import { audit } from "../utils/audit.js";

const router = Router();

function sendSession(res, user) {
  const token = signUser(user, jwt);
  setAuthCookie(res, token);
  return { token, user: user.toSafe() };
}

router.post("/signup", async (req, res) => {
  try {
    const { name, email, phone, password, role } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: "Name, email, password and role are required." });
    }

    if (!["admin", "salesman"].includes(role)) {
      return res.status(400).json({ message: "Role must be admin or salesman." });
    }

    const exists = await User.findOne({ email: email.trim().toLowerCase() });
    if (exists) {
      return res.status(400).json({ message: "An account with this email already exists." });
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone || "",
      password: hashed,
      role
    });

    await audit(user, "signup", "user", user._id, `${role} account created`);
    res.status(201).json(sendSession(res, user));
  } catch (error) {
    res.status(500).json({ message: error.message || "Signup failed." });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: (email || "").trim().toLowerCase() });

    if (!user) {
      return res.status(400).json({ message: "Invalid email or password." });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(400).json({ message: "Invalid email or password." });
    }

    await audit(user, "login", "user", user._id, "Logged in");
    res.json(sendSession(res, user));
  } catch (error) {
    res.status(500).json({ message: error.message || "Login failed." });
  }
});

router.get("/me", requireAuth, (req, res) => {
  res.json({ user: req.user.toSafe() });
});

router.post("/logout", requireAuth, (req, res) => {
  clearAuthCookie(res);
  res.json({ ok: true });
});

router.post("/logout-all", requireAuth, async (req, res) => {
  req.user.tokenVersion = (req.user.tokenVersion || 0) + 1;
  await req.user.save();
  clearAuthCookie(res);
  await audit(req.user, "logout-all", "user", req.user._id, "All sessions revoked");
  res.json({ ok: true });
});

router.post("/forgot", async (req, res) => {
  const email = (req.body.email || "").trim().toLowerCase();
  const user = await User.findOne({ email });
  if (!user) {
    return res.json({ message: "If that email exists, a reset link was created." });
  }

  const token = crypto.randomBytes(20).toString("hex");
  user.resetToken = token;
  user.resetExpires = new Date(Date.now() + 60 * 60 * 1000);
  await user.save();

  const resetUrl = `${req.headers.origin || "http://localhost:5173"}/reset-password?token=${token}`;
  res.json({
    message: "Reset link created. Email is not configured, so the demo link is returned here.",
    resetUrl
  });
});

router.post("/reset", async (req, res) => {
  const { token, password } = req.body;
  if (!token || !password) {
    return res.status(400).json({ message: "Token and new password are required." });
  }

  const user = await User.findOne({
    resetToken: token,
    resetExpires: { $gt: new Date() }
  });

  if (!user) {
    return res.status(400).json({ message: "Reset link is invalid or expired." });
  }

  user.password = await bcrypt.hash(password, 10);
  user.resetToken = "";
  user.resetExpires = null;
  user.tokenVersion = (user.tokenVersion || 0) + 1;
  await user.save();
  clearAuthCookie(res);
  res.json({ message: "Password updated. Please log in." });
});

export default router;
