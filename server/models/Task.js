import mongoose from "mongoose";

const taskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    area: { type: String, default: "" },
    date: { type: String, required: true },
    salesman: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    status: {
      type: String,
      enum: ["pending", "in_progress", "done"],
      default: "pending"
    },
    notes: { type: String, default: "" },
    income: { type: Number, default: 0 },
    photoUrl: { type: String, default: "" },
    time: { type: String, default: "" },
    lead: { type: mongoose.Schema.Types.ObjectId, ref: "Lead", default: null }
  },
  { timestamps: true }
);

export default mongoose.model("Task", taskSchema);
