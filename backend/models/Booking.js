import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema({
  turfId: { type: String, required: true },
  orderId: { type: String, required: true },
  amount: { type: Number, required: true },
  status: { type: String, default: "Confirmed" }, // Confirmed | Pending | Cancelled
  date: { type: String, required: true },
  time: { type: String, required: true },
  userEmail: { type: String, required: true },
  reminderSent: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  // ── Refund tracking (pro-grade) ──
  refundStatus: { type: String, default: null }, // null | 'initiated' | 'succeeded' | 'failed' | 'no_refund'
  refundedAmount: { type: Number, default: null }, // Actual amount returned to user
  cancelledAt: { type: Date, default: null }, // Timestamp of cancellation
  cancelIdempotencyKey: { type: String, unique: true, sparse: true }, // prevents double-cancel
  isReviewed: { type: Boolean, default: false }, // Tracks if user has left feedback
});

export const Booking = mongoose.model("Booking", bookingSchema);
