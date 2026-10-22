import Notification from "../models/Notification.js";

export async function notify(userId, title, message) {
  if (!userId) return;
  await Notification.create({ user: userId, title, message });
}

export function signUser(user, jwtLib) {
  return jwtLib.sign(
    { id: user._id, role: user.role, name: user.name, tv: user.tokenVersion || 0 },
    process.env.JWT_SECRET || "salesman-nav-dev-secret",
    { expiresIn: "7d" }
  );
}

export function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export function monthRange(date = new Date()) {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  return {
    from: start.toISOString().slice(0, 10),
    to: end.toISOString().slice(0, 10)
  };
}
