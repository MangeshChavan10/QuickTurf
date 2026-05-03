import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema({
  turfId: { type: String, required: true },
  orderId: { type: String, required: true },
  paymentId: { type: String, default: null },
  amount: { type: Number, required: true },
  status: { type: String, default: 'Confirmed' },
  date: { type: String, required: true },
  time: { type: String, required: true },
  userEmail: { type: String, required: true },
  reminderSent: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  refundStatus: { type: String, default: null },
  refundedAmount: { type: Number, default: null },
  cancelledAt: { type: Date, default: null },
  cancelIdempotencyKey: { type: String, unique: true, sparse: true },
  isReviewed: { type: Boolean, default: false }
});

export const Booking = mongoose.model('Booking', bookingSchema);

const otpSchema = new mongoose.Schema({
  identifier: { type: String, required: true },
  otp: { type: String, required: true },
  expiresAt: { type: Date, required: true }
});

export const Otp = mongoose.model('Otp', otpSchema);

const reviewSchema = new mongoose.Schema({
  turfId: { type: String, required: true },
  author: { type: String, required: true },
  date: { type: String, required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

export const Review = mongoose.model('Review', reviewSchema);
