import jwt from "jsonwebtoken";
import User from "../models/User.js";

function readToken(req) {
  const header = req.headers.authorization || "";
  if (header.startsWith("Bearer ")) return header.slice(7);
  return req.cookies?.sn_token || null;
}

export async function requireAuth(req, res, next) {
  const token = readToken(req);

  if (!token) {
    return res.status(401).json({ message: "Please log in." });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || "salesman-nav-dev-secret");
    const user = await User.findById(payload.id);

    if (!user) {
      return res.status(401).json({ message: "User not found." });
    }

    if ((payload.tv || 0) !== (user.tokenVersion || 0)) {
      return res.status(401).json({ message: "Session expired. Please log in again." });
    }

    req.user = user;
    next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired session." });
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: "You do not have access to this page." });
    }
    next();
  };
}

function cookieOptions() {
  const frontend = (process.env.FRONTEND_URL || "").replace(/\/$/, "");
  const crossSite = frontend.startsWith("https://") && !frontend.includes("localhost");
  return {
    httpOnly: true,
    sameSite: crossSite ? "none" : "lax",
    secure: crossSite || process.env.NODE_ENV === "production",
    maxAge: 7 * 24 * 60 * 60 * 1000
  };
}

export function setAuthCookie(res, token) {
  res.cookie("sn_token", token, cookieOptions());
}

export function clearAuthCookie(res) {
  res.clearCookie("sn_token", cookieOptions());
}
