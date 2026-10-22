import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, default: "" },
    password: { type: String, required: true },
    role: { type: String, enum: ["admin", "salesman"], required: true },
    monthlyTarget: { type: Number, default: 10 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    tokenVersion: { type: Number, default: 0 },
    resetToken: { type: String, default: "" },
    resetExpires: { type: Date, default: null },
    lastLocation: {
      lat: Number,
      lng: Number,
      at: Date
    }
  },
  { timestamps: true }
);

userSchema.methods.toSafe = function toSafe() {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    phone: this.phone,
    role: this.role,
    monthlyTarget: this.monthlyTarget,
    lastLocation: this.lastLocation || null,
    createdAt: this.createdAt
  };
};

export default mongoose.model("User", userSchema);
