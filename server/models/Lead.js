import mongoose from "mongoose";

const leadSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, default: "" },
    shop: { type: String, default: "" },
    area: { type: String, default: "" },
    notes: { type: String, default: "" },
    status: { type: String, enum: ["new", "contacted", "won", "lost"], default: "new" },
    salesman: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    stopName: { type: String, default: "" },
    score: { type: Number, default: null },
    nextAction: { type: String, default: "" },
    meetingDate: { type: String, default: "" },
    meetingTime: { type: String, default: "" },
    meetingTask: { type: mongoose.Schema.Types.ObjectId, ref: "Task", default: null }
  },
  { timestamps: true }
);

export default mongoose.model("Lead", leadSchema);
