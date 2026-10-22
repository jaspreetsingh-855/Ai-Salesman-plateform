import AuditLog from "../models/AuditLog.js";

export async function audit(actor, action, entity, entityId, detail = "") {
  try {
    await AuditLog.create({
      actor: actor?._id || actor,
      action,
      entity,
      entityId: entityId ? String(entityId) : "",
      detail
    });
  } catch (error) {
    console.error("Audit log failed:", error.message);
  }
}
