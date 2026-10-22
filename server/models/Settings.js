import mongoose from "mongoose";

const settingsSchema = new mongoose.Schema(
  {
    companyName: { type: String, default: "SalesNav AI" },
    workingHoursStart: { type: String, default: "09:00" },
    workingHoursEnd: { type: String, default: "18:00" },
    areas: { type: [String], default: ["Model Town", "City Center"] },
    aiTone: { type: String, default: "professional and brief" }
  },
  { timestamps: true }
);

const Settings = mongoose.model("Settings", settingsSchema);

export async function getSettings() {
  let doc = await Settings.findOne();
  if (!doc) {
    doc = await Settings.create({});
  }
  return doc;
}

export default Settings;
