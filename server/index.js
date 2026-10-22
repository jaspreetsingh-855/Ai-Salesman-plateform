import "dotenv/config";
import path from "path";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { connectDb } from "./config/db.js";
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/users.js";
import taskRoutes from "./routes/tasks.js";
import routeRoutes from "./routes/routes.js";
import notificationRoutes from "./routes/notifications.js";
import reportRoutes from "./routes/reports.js";
import aiRoutes from "./routes/ai.js";
import settingsRoutes from "./routes/settings.js";
import attendanceRoutes from "./routes/attendance.js";
import locationRoutes from "./routes/location.js";
import leadRoutes from "./routes/leads.js";
import auditRoutes from "./routes/audit.js";
import messageRoutes from "./routes/messages.js";

const app = express();
const port = Number(process.env.PORT) || 5000;

app.use(cors({ origin: ["http://localhost:5173", "http://127.0.0.1:5173"], credentials: true }));
app.use(cookieParser());
app.use(express.json());
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, db: "salesman_nav" });
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/routes", routeRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/location", locationRoutes);
app.use("/api/leads", leadRoutes);
app.use("/api/audit", auditRoutes);
app.use("/api/messages", messageRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ message: err.message || "Server error" });
});

connectDb()
  .then(() => {
    app.listen(port, () => {
      console.log(`API running on http://localhost:${port}`);
    });
  })
  .catch((error) => {
    console.error("MongoDB connection failed. Open MongoDB Compass and confirm mongodb://127.0.0.1:27017 is running.");
    console.error(error.message);
    process.exit(1);
  });
