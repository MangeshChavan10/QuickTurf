import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: { type: String, required: false },
  email: { type: String, required: false, unique: true, sparse: true },
  phoneNumber: { type: String, required: false, unique: true, sparse: true },
  password: { type: String, required: false },
  role: { type: String, enum: ["user", "admin", "superadmin"], default: "user" },
  isApproved: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  // ── Moderation ──
  warnings: [
    {
      message: { type: String },
      warnedBy: { type: String }, // email of admin/superadmin who issued it
      warnedAt: { type: Date, default: Date.now },
    },
  ],
  isBanned: { type: Boolean, default: false },
  banReason: { type: String, default: null },
});

export const User = mongoose.model("User", userSchema);
