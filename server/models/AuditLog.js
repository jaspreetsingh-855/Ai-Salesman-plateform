import mongoose from "mongoose";

const auditSchema = new mongoose.Schema(
  {
    actor: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    action: { type: String, required: true },
    entity: { type: String, default: "" },
    entityId: { type: String, default: "" },
    detail: { type: String, default: "" }
  },
  { timestamps: true }
);

export default mongoose.model("AuditLog", auditSchema);
