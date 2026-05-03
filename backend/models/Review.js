import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema({
  turfId: { type: String, required: true },
  author: { type: String, required: true },
  date: { type: String, required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

export const Review = mongoose.model("Review", reviewSchema);
