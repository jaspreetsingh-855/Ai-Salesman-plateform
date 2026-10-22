import mongoose from "mongoose";

const stopSchema = new mongoose.Schema(
  {
    order: { type: Number, required: true },
    name: { type: String, required: true, trim: true },
    address: { type: String, default: "" },
    lat: { type: Number, default: null },
    lng: { type: Number, default: null },
    status: {
      type: String,
      enum: ["pending", "in_progress", "done"],
      default: "pending"
    },
    notes: { type: String, default: "" },
    photoUrl: { type: String, default: "" }
  },
  { _id: true }
);

const routePlanSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    date: { type: String, required: true },
    salesman: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    stops: { type: [stopSchema], default: [] }
  },
  { timestamps: true }
);

export default mongoose.model("RoutePlan", routePlanSchema);
