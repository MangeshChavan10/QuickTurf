import mongoose from "mongoose";

const turfSchema = new mongoose.Schema({
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  name: { type: String, required: true },
  image: { type: String, required: true },
  gallery: [String],
  price: { type: Number, required: true },
  rating: { type: Number, required: true },
  reviewCount: { type: Number, required: true },
  location: { type: String, required: true },
  subLocation: { type: String, required: true },
  description: { type: String },
  type: { type: String, required: true },
  facilities: [String],
  amenities: [String],
  host: {
    name: String,
    avatar: String,
    years: Number,
  },
  coordinates: {
    lat: Number,
    lng: Number,
  },
  isDisabled: { type: Boolean, default: false }, // superadmin can disable individual turfs
  disabledReason: { type: String, default: null },
});

export const Turf = mongoose.model("Turf", turfSchema);
