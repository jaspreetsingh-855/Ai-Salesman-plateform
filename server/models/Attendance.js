import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    date: { type: String, required: true },
    checkInAt: { type: Date, default: null },
    checkOutAt: { type: Date, default: null },
    checkInLocation: {
      lat: Number,
      lng: Number
    },
    checkOutLocation: {
      lat: Number,
      lng: Number
    }
  },
  { timestamps: true }
);

attendanceSchema.index({ user: 1, date: 1 }, { unique: true });

export default mongoose.model("Attendance", attendanceSchema);
