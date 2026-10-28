import mongoose from "mongoose";

const leadChatSchema = new mongoose.Schema(
  {
    lead: { type: mongoose.Schema.Types.ObjectId, ref: "Lead", required: true, index: true },
    role: { type: String, enum: ["customer", "ai", "salesman"], required: true },
    channel: { type: String, enum: ["in-app", "whatsapp"], default: "in-app" },
    text: { type: String, required: true, trim: true }
  },
  { timestamps: true }
);

export default mongoose.model("LeadChat", leadChatSchema);
