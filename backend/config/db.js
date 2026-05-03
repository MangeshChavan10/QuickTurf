import mongoose from "mongoose";

export async function connectDB() {
  const mongoURI = process.env.MONGODB_URI;
  if (!mongoURI) {
    console.warn(
      "MONGODB_URI not found in environment. Database features will be disabled."
    );
    return;
  }
  await mongoose
    .connect(mongoURI)
    .then(() => console.log("Connected to MongoDB established"))
    .catch((err) => console.error("MongoDB connection error:", err));
}
