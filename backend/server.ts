import express from "express";
import path from "path";
import { fileURLToPath } from "url";

import dotenv from "dotenv";
import Razorpay from "razorpay";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import multer from "multer";
import fs from "fs";
import cron from "node-cron";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import mongoSanitize from "express-mongo-sanitize";

dotenv.config({ override: true });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret";

// Database Connection
const mongoURI = process.env.MONGODB_URI;
if (mongoURI) {
  mongoose.connect(mongoURI)
    .then(() => console.log("Connected to MongoDB established"))
    .catch(err => console.error("MongoDB connection error:", err));
} else {
  console.warn("MONGODB_URI not found in environment. Database features will be disabled.");
}

// Schemas
const userSchema = new mongoose.Schema({
  name: { type: String, required: false },
  email: { type: String, required: false, unique: true, sparse: true },
  phoneNumber: { type: String, required: false, unique: true, sparse: true },
  password: { type: String, required: false },
  role: { type: String, enum: ['user', 'admin', 'superadmin'], default: 'user' },
  isApproved: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  // ── Moderation ──
  warnings: [{
    message: { type: String },
    warnedBy: { type: String },  // email of admin/superadmin who issued it
    warnedAt: { type: Date, default: Date.now }
  }],
  isBanned: { type: Boolean, default: false },
  banReason: { type: String, default: null },
  googleId: { type: String, required: false, sparse: true }
});

const otpSchema = new mongoose.Schema({
  identifier: { type: String, required: true },
  otp: { type: String, required: true },
  expiresAt: { type: Date, required: true }
});

const turfSchema = new mongoose.Schema({
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
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
    years: Number
  },
  coordinates: {
    lat: Number,
    lng: Number
  },
  isDisabled: { type: Boolean, default: false },  // superadmin can disable individual turfs
  disabledReason: { type: String, default: null }
});

const bookingSchema = new mongoose.Schema({
  turfId: { type: String, required: true },
  orderId: { type: String, required: true },
  paymentId: { type: String, default: null },
  amount: { type: Number, required: true },
  status: { type: String, default: 'Confirmed' }, // Confirmed | Pending | Cancelled
  date: { type: String, required: true },
  time: { type: String, required: true },
  userEmail: { type: String, required: true },
  reminderSent: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  // ── Refund tracking (pro-grade) ──
  refundStatus: { type: String, default: null },      // null | 'initiated' | 'succeeded' | 'failed' | 'no_refund'
  refundedAmount: { type: Number, default: null },     // Actual amount returned to user
  cancelledAt: { type: Date, default: null },          // Timestamp of cancellation
  cancelIdempotencyKey: { type: String, unique: true, sparse: true }, // prevents double-cancel
  isReviewed: { type: Boolean, default: false }        // Tracks if user has left feedback
});

const reviewSchema = new mongoose.Schema({
  turfId: { type: String, required: true },
  author: { type: String, required: true },
  date: { type: String, required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);
const Turf = mongoose.model('Turf', turfSchema);
const Booking = mongoose.model('Booking', bookingSchema);
const Otp = mongoose.model('Otp', otpSchema);
const Review = mongoose.model('Review', reviewSchema);

// Lazy initialization for Nodemailer
let transporter: any = null;
const getTransporter = () => {
  if (!transporter) {
    const host = (process.env.SMTP_HOST || "").trim();
    const port = parseInt(process.env.SMTP_PORT || "465");
    const user = (process.env.SMTP_USER || "").trim();
    const pass = (process.env.SMTP_PASS || "").trim().replace(/\s/g, "");

    if (!user || !pass) {
      console.warn("SMTP credentials missing. Email OTP will be simulated in logs.");
      return null;
    }

    const isGmail = host.includes("gmail") || user.endsWith("@gmail.com");

    if (isGmail) {
      transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user, pass }
      });
    } else {
      transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
        tls: {
          rejectUnauthorized: false // Often needed for custom SMTP
        }
      });
    }

    // Verify connection on startup
    transporter.verify((error: any) => {
      if (error) {
        console.error("SMTP Connection Error:", error.message);
      } else {
        console.log("SMTP Server is ready to take messages");
      }
    });
  }
  return transporter;
};

// Lazy initialization for Razorpay
let razorpay: any = null;
const getRazorpay = () => {
  if (!razorpay) {
    const key_id = process.env.RAZORPAY_KEY_ID;
    const key_secret = process.env.RAZORPAY_KEY_SECRET;
    
    if (!key_id || !key_secret) {
      console.warn("Razorpay keys are missing. Payment API will operate in simulation mode.");
      return null;
    }
    
    razorpay = new Razorpay({
      key_id,
      key_secret,
    });
  }
  return razorpay;
};

async function startServer() {
  const app = express();
  const PORT = parseInt(process.env.PORT || '3000');

  // Setup Multer Storage
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      const dir = path.join(__dirname, 'public/uploads');
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      cb(null, dir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, uniqueSuffix + '-' + file.originalname);
    }
  });
  const upload = multer({ storage });

  // ── Security: HTTP Headers ──
  app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' } // allow serving images to frontend
  }));

  // ── Security: Rate Limiting ──
  const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests. Please try again later.' },
  });
  const paymentLimiter = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 20,
    message: { error: 'Too many payment attempts. Please wait 10 minutes.' },
  });
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 15,
    message: { error: 'Too many login attempts. Please try again later.' },
  });
  app.use('/api/', generalLimiter);
  app.use('/api/payment-intent', paymentLimiter);
  app.use('/api/auth', authLimiter);

  app.use(express.json({ limit: '10kb' }));
  app.use(express.urlencoded({ extended: true, limit: '10kb' }));

  // ── Security: NoSQL Injection Sanitization ──
  app.use(mongoSanitize());

  // ── CORS — allow Vercel frontend + local dev ──
  const ALLOWED_ORIGINS = [
    'http://localhost:5173',
    'http://localhost:4173',
    'https://quick-turf-ten.vercel.app',
    ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : []),
  ];

  app.use((req: any, res: any, next: any) => {
    const origin = req.headers.origin;
    if (!origin || ALLOWED_ORIGINS.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin || '*');
    } else {
      // Still set header to avoid crashes, but block in response
      res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGINS[2]); // Vercel as fallback
    }
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Requested-With');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Max-Age', '86400'); // Cache preflight for 24h
    if (req.method === 'OPTIONS') {
      return res.sendStatus(204);
    }
    next();
  });

  app.use("/uploads", express.static(path.join(__dirname, "public/uploads")));

  // ================= ADMIN MIDDLEWARE =================
  const authenticateAdmin = async (req: any, res: any, next: any) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Unauthorized" });

    try {
      const decoded: any = jwt.verify(token, JWT_SECRET);
      const user = await User.findById(decoded.userId);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ error: "Forbidden: Admins only" });
      }
      if (!user.isApproved) {
        return res.status(403).json({ error: "Pending Verification" });
      }
      req.user = user;
      next();
    } catch (error) {
      res.status(401).json({ error: "Invalid token" });
    }
  };

  const authenticateSuperAdmin = async (req: any, res: any, next: any) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Unauthorized" });

    try {
      const decoded: any = jwt.verify(token, JWT_SECRET);
      const user = await User.findById(decoded.userId);
      if (!user || user.role !== 'superadmin') {
        return res.status(403).json({ error: "Forbidden: Super Admins only" });
      }
      req.user = user;
      next();
    } catch (error) {
      res.status(401).json({ error: "Invalid token" });
    }
  };

  // ================= ADMIN ROUTES =================
  app.post("/api/admin/register", async (req, res) => {
    try {
      const { name, email, password, otp } = req.body;
      if (!name || !email || !password || !otp) {
        return res.status(400).json({ error: "All fields including OTP are required." });
      }

      // Verify OTP first
      const otpRecord = await Otp.findOne({ identifier: email, otp });
      if (!otpRecord || otpRecord.expiresAt < new Date()) {
        return res.status(400).json({ error: "Invalid or expired OTP. Please request a new one." });
      }
      await Otp.deleteOne({ _id: otpRecord._id });

      const existing = await User.findOne({ email });
      if (existing) return res.status(400).json({ error: "Email already exists" });

      const hashedPassword = await bcrypt.hash(password, 10);
      const user = new User({ name, email, password: hashedPassword, role: 'admin' });
      await user.save();
      
      const token = jwt.sign({ userId: user._id, role: 'admin' }, JWT_SECRET);
      res.json({ token, user: { name: user.name, email: user.email, role: 'admin', isApproved: user.isApproved } });
    } catch (error) {
      res.status(500).json({ error: "Registration failed" });
    }
  });

  app.post("/api/admin/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      const user = await User.findOne({ email, role: 'admin' });
      if (!user) return res.status(404).json({ error: "Admin not found" });

      const isValid = await bcrypt.compare(password, user.password || "");
      if (!isValid) return res.status(401).json({ error: "Invalid credentials" });

      const token = jwt.sign({ userId: user._id, role: 'admin' }, JWT_SECRET);
      res.json({ token, user: { name: user.name, email: user.email, role: 'admin', isApproved: user.isApproved } });
    } catch (error) {
      res.status(500).json({ error: "Login failed" });
    }
  });

  app.post("/api/admin/turfs", authenticateAdmin, upload.single('image'), async (req: any, res: any) => {
    try {
      const { name, price, location, subLocation, type } = req.body;
      const imagePath = req.file ? `/uploads/${req.file.filename}` : "";

      const turf = new Turf({
        ownerId: req.user._id,
        name, price, location, subLocation, type,
        image: imagePath,
        rating: 5.0,
        reviewCount: 0
      });
      await turf.save();
      res.json({ success: true, turf });
    } catch (error) {
      res.status(500).json({ error: "Failed to create turf" });
    }
  });

  app.get("/api/admin/turfs", authenticateAdmin, async (req: any, res: any) => {
    try {
      const turfs = await Turf.find({ ownerId: req.user._id });
      res.json(turfs);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch turfs" });
    }
  });

  app.put("/api/admin/turfs/:id", authenticateAdmin, async (req: any, res: any) => {
    try {
      const turf = await Turf.findOne({ _id: req.params.id, ownerId: req.user._id });
      if (!turf) return res.status(404).json({ error: "Turf not found or access denied" });

      const { name, price, location, subLocation, type, description } = req.body;
      if (name) turf.name = name;
      if (price) turf.price = Number(price);
      if (location) turf.location = location;
      if (subLocation !== undefined) turf.subLocation = subLocation;
      if (type) turf.type = type;
      if (description !== undefined) turf.description = description;

      await turf.save();
      res.json({ success: true, turf });
    } catch (error) {
      res.status(500).json({ error: "Failed to update turf" });
    }
  });

  app.get("/api/admin/bookings", authenticateAdmin, async (req: any, res: any) => {
    try {
      const turfs = await Turf.find({ ownerId: req.user._id });
      const turfIds = turfs.map(t => t._id.toString());
      const bookings = await Booking.find({ turfId: { $in: turfIds } }).sort({ createdAt: -1 });
      res.json(bookings);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch bookings" });
    }
  });

  app.get("/api/admin/analytics", authenticateAdmin, async (req: any, res: any) => {
    try {
      const turfs = await Turf.find({ ownerId: req.user._id });
      const turfIds = turfs.map(t => t._id.toString());
      const allBookings = await Booking.find({ turfId: { $in: turfIds } }).populate('turfId');

      const confirmed = allBookings.filter(b => b.status === 'Confirmed');
      const cancelled = allBookings.filter(b => b.status === 'Cancelled');

      const revenue = confirmed.reduce((sum, b) => sum + (b.amount || 0), 0);
      const totalBookings = confirmed.length;
      const cancellations = cancelled.length;
      const avgBookingValue = totalBookings > 0 ? Math.round(revenue / totalBookings) : 0;

      // Monthly revenue trend — last 6 months
      const monthlyData: Record<string, number> = {};
      const now = new Date();
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = d.toLocaleString('default', { month: 'short', year: '2-digit' });
        monthlyData[key] = 0;
      }
      confirmed.forEach(b => {
        const d = new Date(b.createdAt);
        const key = d.toLocaleString('default', { month: 'short', year: '2-digit' });
        if (key in monthlyData) monthlyData[key] += (b.amount || 0);
      });
      const monthlyTrend = Object.entries(monthlyData).map(([month, revenue]) => ({ month, revenue }));

      // Per-turf breakdown
      const turfBreakdown = turfs.map(turf => {
        const turfBookings = confirmed.filter(b => String((b.turfId as any)?._id || b.turfId) === String(turf._id));
        return {
          name: turf.name,
          bookings: turfBookings.length,
          revenue: turfBookings.reduce((s, b) => s + (b.amount || 0), 0)
        };
      });

      res.json({ revenue, totalBookings, activeTurfs: turfs.length, cancellations, avgBookingValue, monthlyTrend, turfBreakdown });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch analytics" });
    }
  });

  app.get("/api/admin/customers", authenticateAdmin, async (req: any, res: any) => {
    try {
      const turfs = await Turf.find({ ownerId: req.user._id });
      const turfIds = turfs.map(t => t._id.toString());
      const bookings = await Booking.find({ turfId: { $in: turfIds }, status: 'Confirmed' });

      // Group bookings by userEmail
      const customersMap = new Map();
      bookings.forEach(b => {
        if (!b.userEmail) return;
        const email = b.userEmail;
        if (!customersMap.has(email)) {
          customersMap.set(email, { email, totalBookings: 0, totalSpent: 0, lastBookingDate: b.date });
        }
        const customer = customersMap.get(email);
        customer.totalBookings += 1;
        customer.totalSpent += (b.amount || 0);
      });

      res.json(Array.from(customersMap.values()));
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch customers" });
    }
  });


  // ================= ADMIN: USER MODERATION =================
  app.post("/api/admin/customers/:email/warn", authenticateAdmin, async (req: any, res: any) => {
    try {
      const { message } = req.body;
      if (!message) return res.status(400).json({ error: "Warning message required" });
      const user = await User.findOne({ email: req.params.email, role: 'user' });
      if (!user) return res.status(404).json({ error: "User not found" });
      user.warnings.push({ message, warnedBy: req.user.email, warnedAt: new Date() });
      await user.save();
      res.json({ success: true, warnings: user.warnings });
    } catch (error) {
      res.status(500).json({ error: "Failed to warn user" });
    }
  });

  app.post("/api/admin/customers/:email/ban", authenticateAdmin, async (req: any, res: any) => {
    try {
      const { reason } = req.body;
      const user = await User.findOne({ email: req.params.email, role: 'user' });
      if (!user) return res.status(404).json({ error: "User not found" });
      user.isBanned = true;
      user.banReason = reason || "Repeated policy violations";
      await user.save();
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to ban user" });
    }
  });

  app.post("/api/admin/customers/:email/unban", authenticateAdmin, async (req: any, res: any) => {
    try {
      const user = await User.findOne({ email: req.params.email, role: 'user' });
      if (!user) return res.status(404).json({ error: "User not found" });
      user.isBanned = false;
      user.banReason = null;
      await user.save();
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to unban user" });
    }
  });

  // Also expose full user detail for admin (warnings, ban status)
  app.get("/api/admin/customers/:email/detail", authenticateAdmin, async (req: any, res: any) => {
    try {
      const user = await User.findOne({ email: req.params.email, role: 'user' }).select('-password');
      if (!user) return res.status(404).json({ error: "User not found" });
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch user detail" });
    }
  });

  // ================= SUPER ADMIN ROUTES =================
  // Hidden endpoint to seed first super admin
  app.post("/api/superadmin/setup", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      const hashedPassword = await bcrypt.hash(password, 10);
      
      // Check if user already exists
      let user = await User.findOne({ email });
      if (user) {
        user.role = 'superadmin';
        user.isApproved = true;
        user.password = hashedPassword;
        await user.save();
        return res.json({ success: true, message: "Super admin updated" });
      }

      user = new User({ name: 'Super Admin', email, password: hashedPassword, role: 'superadmin', isApproved: true });
      await user.save();
      res.json({ success: true, message: "Super admin created" });
    } catch (error) {
      console.error("Superadmin creation error:", error);
      res.status(500).json({ error: "Failed to create superadmin" });
    }
  });

  app.post("/api/superadmin/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      const user = await User.findOne({ email, role: 'superadmin' });
      if (!user) return res.status(404).json({ error: "Super Admin not found" });

      const isValid = await bcrypt.compare(password, user.password || "");
      if (!isValid) return res.status(401).json({ error: "Invalid credentials" });

      const token = jwt.sign({ userId: user._id, role: 'superadmin' }, JWT_SECRET);
      res.json({ token, user: { name: user.name, email: user.email, role: 'superadmin' } });
    } catch (error) {
      res.status(500).json({ error: "Login failed" });
    }
  });

  app.get("/api/superadmin/partners", authenticateSuperAdmin, async (req, res) => {
    try {
      const partners = await User.find({ role: 'admin' }).select('-password').sort({ createdAt: -1 });
      res.json(partners);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch partners" });
    }
  });

  app.post("/api/superadmin/partners/:id/approve", authenticateSuperAdmin, async (req, res) => {
    try {
      const partner = await User.findById(req.params.id);
      if (!partner) return res.status(404).json({ error: "Partner not found" });

      partner.isApproved = true;
      await partner.save();
      res.json({ success: true, partner });
    } catch (error) {
      res.status(500).json({ error: "Failed to approve partner" });
    }
  });


  app.post("/api/superadmin/partners/:id/warn", authenticateSuperAdmin, async (req, res) => {
    try {
      const { message } = req.body as { message: string };
      if (!message) return res.status(400).json({ error: "Warning message required" });
      const partner = await User.findOne({ _id: req.params.id, role: 'admin' });
      if (!partner) return res.status(404).json({ error: "Partner not found" });
      partner.warnings.push({ message, warnedBy: 'superadmin', warnedAt: new Date() });
      await partner.save();
      res.json({ success: true, warnings: partner.warnings });
    } catch (error) {
      res.status(500).json({ error: "Failed to warn partner" });
    }
  });

  app.post("/api/superadmin/partners/:id/ban", authenticateSuperAdmin, async (req, res) => {
    try {
      const { reason } = req.body as { reason: string };
      const partner = await User.findOne({ _id: req.params.id, role: 'admin' });
      if (!partner) return res.status(404).json({ error: "Partner not found" });
      partner.isBanned = true;
      partner.isApproved = false;  // also revoke approval
      partner.banReason = reason || "Repeated policy violations";
      await partner.save();
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to ban partner" });
    }
  });

  app.post("/api/superadmin/partners/:id/unban", authenticateSuperAdmin, async (req, res) => {
    try {
      const partner = await User.findOne({ _id: req.params.id, role: 'admin' });
      if (!partner) return res.status(404).json({ error: "Partner not found" });
      partner.isBanned = false;
      partner.banReason = null;
      partner.isApproved = true;  // restore approval
      await partner.save();
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to unban partner" });
    }
  });


  // ================= SUPERADMIN: PLATFORM ANALYTICS =================
  app.get("/api/superadmin/analytics", authenticateSuperAdmin, async (req, res) => {
    try {
      const [totalOwners, totalTurfs, activeTurfs, bannedOwners, allBookings] = await Promise.all([
        User.countDocuments({ role: 'admin' }),
        Turf.countDocuments({}),
        Turf.countDocuments({ isDisabled: { $ne: true } }),
        User.countDocuments({ role: 'admin', isBanned: true }),
        Booking.find({ status: 'Confirmed' })
      ]);

      const today = new Date().toISOString().split('T')[0];
      const bookingsToday = await Booking.countDocuments({ status: 'Confirmed', createdAt: { $gte: new Date(today) } });
      const totalRevenue = allBookings.reduce((s, b) => s + (b.amount || 0), 0);
      const totalBookings = allBookings.length;
      const totalUsers = await User.countDocuments({ role: 'user' });
      const bannedUsers = await User.countDocuments({ role: 'user', isBanned: true });

      res.json({ totalOwners, totalTurfs, activeTurfs, bannedOwners, bookingsToday, totalRevenue, totalBookings, totalUsers, bannedUsers });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch analytics" });
    }
  });

  // ================= SUPERADMIN: TURF MANAGEMENT =================
  app.get("/api/superadmin/turfs", authenticateSuperAdmin, async (req, res) => {
    try {
      const turfs = await Turf.find({}).populate('ownerId', 'name email isApproved isBanned').sort({ createdAt: -1 });
      res.json(turfs);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch turfs" });
    }
  });

  app.post("/api/superadmin/turfs/:id/disable", authenticateSuperAdmin, async (req, res) => {
    try {
      const { reason } = req.body as { reason: string };
      const turf = await Turf.findByIdAndUpdate(req.params.id, { isDisabled: true, disabledReason: reason || "Disabled by platform" }, { new: true });
      if (!turf) return res.status(404).json({ error: "Turf not found" });
      res.json({ success: true, turf });
    } catch (error) {
      res.status(500).json({ error: "Failed to disable turf" });
    }
  });

  app.post("/api/superadmin/turfs/:id/enable", authenticateSuperAdmin, async (req, res) => {
    try {
      const turf = await Turf.findByIdAndUpdate(req.params.id, { isDisabled: false, disabledReason: null }, { new: true });
      if (!turf) return res.status(404).json({ error: "Turf not found" });
      res.json({ success: true, turf });
    } catch (error) {
      res.status(500).json({ error: "Failed to enable turf" });
    }
  });

  // ================= API Routes =================
  app.post("/api/auth/send-otp", async (req, res) => {
    try {
      const { phone, email } = req.body;
      const identifier = email || phone;
      if (!identifier) return res.status(400).json({ error: "Email or Phone required" });

      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 5 * 60000); // 5 minutes

      await Otp.findOneAndUpdate(
        { identifier },
        { otp, expiresAt },
        { upsert: true, new: true }
      );

      let isSimulated = false;
      let simulationReason = "";
      const mailTransporter = getTransporter();
      if (email && mailTransporter) {
        try {
          await mailTransporter.sendMail({
            from: `"QuickTurf" <${process.env.SMTP_USER}>`,
            to: email,
            subject: "Your QuickTurf OTP",
            text: `Your OTP for QuickTurf login is: ${otp}. Valid for 5 minutes.`,
            html: `
              <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px; max-width: 500px;">
                <h2 style="color: #7D8B73;">QuickTurf Login</h2>
                <p>Use the code below to sign in to your QuickTurf account:</p>
                <div style="background: #f4f5f3; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 10px; color: #2A3428; border-radius: 8px; margin: 20px 0;">
                  ${otp}
                </div>
                <p style="color: #666; font-size: 12px;">This code expires in 5 minutes. If you didn't request this, please ignore this email.</p>
              </div>
            `
          });
          console.log(`[EMAIL OTP] Sent to ${email}`);
        } catch (mailError: any) {
          console.error("Mail send error:", mailError.message);
          isSimulated = true;
          simulationReason = `Mail service error: ${mailError.message}`;
        }
      } else {
        isSimulated = true;
        simulationReason = !mailTransporter ? "SMTP credentials missing" : "Phone identifier provided";
      }

      // Always log OTP to backend console for dev testing
      if (isSimulated) {
        console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
        console.log(`  📧 OTP FOR ${identifier}: ${otp}`);
        console.log(`  ⚠️  Simulation reason: ${simulationReason}`);
        console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
      }
      
      res.json({ 
        success: true, 
        message: "OTP sent successfully"
      });
    } catch (error) {
      console.error("OTP Error:", error);
      res.status(500).json({ error: "Failed to send OTP" });
    }
  });

  app.post("/api/auth/verify-otp", async (req, res) => {
    try {
      const { phone, email, otp } = req.body;
      const identifier = email || phone;
      const otpRecord = await Otp.findOne({ identifier, otp });

      if (!otpRecord || otpRecord.expiresAt < new Date()) {
        return res.status(400).json({ error: "Invalid or expired OTP" });
      }

      // Clear OTP after success
      await Otp.deleteOne({ _id: otpRecord._id });

      let user;
      if (email) {
        user = await User.findOne({ email });
      } else {
        user = await User.findOne({ phoneNumber: phone });
      }

      if (!user) {
        // Return success but don't give a token if user doesn't exist
        // This allows the Signup flow to proceed after verification
        return res.json({ 
          success: true, 
          userExists: false, 
          message: "OTP verified. Please complete your profile." 
        });
      }

      // User exists, typical login
      const token = jwt.sign({ id: user._id, email: user.email || user.phoneNumber }, JWT_SECRET, { expiresIn: '30d' });
      res.json({ 
        token, 
        userExists: true,
        user: { 
          name: user.name, 
          email: user.email || "", 
          phoneNumber: user.phoneNumber || "",
          role: user.role || 'user',
          isApproved: true
        } 
      });
    } catch (error) {
      res.status(500).json({ error: "Verification failed" });
    }
  });

  app.post("/api/auth/signup", async (req, res) => {
    try {
      const { name, email, password, otp } = req.body;
      if (!name || !email || !password) {
        return res.status(400).json({ error: "Name, email, and password are required." });
      }
      if (!otp) {
        return res.status(400).json({ error: "OTP is required to verify your email." });
      }

      // Verify OTP first
      const otpRecord = await Otp.findOne({ identifier: email, otp });
      if (!otpRecord || otpRecord.expiresAt < new Date()) {
        return res.status(400).json({ error: "Invalid or expired OTP. Please request a new one." });
      }
      await Otp.deleteOne({ _id: otpRecord._id });

      // Check for existing user
      const existingUser = await User.findOne({ email });
      if (existingUser) return res.status(400).json({ error: "An account with this email already exists. Please log in." });

      const hashedPassword = await bcrypt.hash(password, 10);
      const user = new User({ name, email, password: hashedPassword });
      await user.save();

      const token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, { expiresIn: '30d' });
      res.json({ success: true, token, user: { name: user.name, email: user.email, role: 'user', isApproved: true } });
    } catch (error) {
      console.error('[Signup Error]', error);
      res.status(500).json({ error: "Signup failed. Please try again." });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      const user = await User.findOne({ email });
      if (!user) return res.status(400).json({ error: "Invalid credentials" });

      if (!user.password) return res.status(400).json({ error: "This account uses OTP login. Please sign in with your phone/email OTP." });
      const isMatch = await bcrypt.compare(password, user.password as string);
      if (!isMatch) return res.status(400).json({ error: "Invalid credentials" });

      const token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, { expiresIn: '30d' });
      res.json({ token, user: { name: user.name, email: user.email, role: user.role || 'user', isApproved: true } });
    } catch (error) {
      res.status(500).json({ error: "Login failed" });
    }
  });

  // ── Google OAuth Login ──
  app.post("/api/auth/google", async (req, res) => {
    try {
      const { credential } = req.body;
      if (!credential) return res.status(400).json({ error: "No credential provided" });

      const { OAuth2Client } = await import('google-auth-library');
      const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
      
      const ticket = await client.verifyIdToken({
        idToken: credential,
        audience: process.env.GOOGLE_CLIENT_ID
      });
      const payload = ticket.getPayload();
      if (!payload || !payload.email) {
        return res.status(400).json({ error: "Invalid Google token" });
      }

      const { email, name, sub: googleId } = payload;
      
      let user = await User.findOne({ email });
      if (!user) {
        // Auto-create account for new Google users
        user = new User({ 
          name: name || email.split('@')[0], 
          email, 
          googleId,
          password: null // No password for Google users
        });
        await user.save();
      } else {
        // Update googleId if not set
        if (!user.googleId) {
          user.googleId = googleId;
          await user.save();
        }
      }

      if (user.isBanned) {
        return res.status(403).json({ error: `Account suspended: ${user.banReason || 'Policy violation'}` });
      }

      const token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, { expiresIn: '30d' });
      res.json({ 
        token, 
        user: { 
          name: user.name, 
          email: user.email, 
          role: user.role || 'user', 
          isApproved: true 
        } 
      });
    } catch (error: any) {
      console.error('[Google Auth Error]', error.message);
      res.status(500).json({ error: "Google authentication failed" });
    }
  });

  app.get("/api/turfs/:id/availability", async (req, res) => {
    try {
      const { date } = req.query;
      if (!date) return res.status(400).json({ error: "Date is required" });
      
      const tenMinsAgo = new Date(Date.now() - 10 * 60 * 1000);
      const bookings = await Booking.find({ 
        turfId: req.params.id, 
        date: date as string,
        $or: [
          { status: 'Confirmed' },
          { status: 'Pending', createdAt: { $gte: tenMinsAgo } }
        ]
      });
      
      const bookedSlots = bookings.flatMap(b => (b.time || '').split(',').map(s => s.trim()));
      res.json({ bookedSlots });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch availability" });
    }
  });

  app.get("/api/turfs", async (req, res) => {
    try {
      let turfs = await Turf.find();
      if (turfs.length === 0) {
          // If DB is empty, return the hardcoded Match Point Turf
          let realRating = 4.98;
          let realReviewCount = 342;
          
          try {
            const reviews = await Review.find({ turfId: "1" });
            if (reviews.length > 0) {
              realReviewCount = reviews.length;
              realRating = Number((reviews.reduce((acc, r) => acc + r.rating, 0) / realReviewCount).toFixed(2));
            } else {
              // Real 0 rating if no reviews
              realRating = 0;
              realReviewCount = 0;
            }
          } catch(e) {}

          return res.json([{
            id: "1",
            _id: "650000000000000000000001", // Mock ID
            name: "Match Point Turf",
            image: "/images/turf-night.jpg",
            gallery: [
              "/images/turf-night.jpg", 
              "/images/turf-trophy.jpg",
              "/images/turf-day.jpg",
              "https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&q=80&w=1200",
              "https://images.unsplash.com/photo-1589487391730-58f20eb2c308?auto=format&fit=crop&q=80&w=1200"
            ],
            price: 10,
            rating: realRating,
            reviewCount: realReviewCount,
            location: "Solapur",
            subLocation: "Civil Hospital Road",
            description: "Experience the ultimate matchday at Match Point Turf. Featuring high-grade artificial grass, professional floodlights for night sessions, and a dedicated trophy facility for your tournaments of Solapur.",
            amenities: ["Night LED Floodlights", "Tournament Trophy Support", "Changing Rooms", "Free Parking", "Drinking Water", "First Aid"],
            distance: "1.2 km away",
            host: { name: "Match Point Team", avatar: "", years: 5 },
            coordinates: { lat: 17.6599, lng: 75.9064 }
          }]);
      }

      // If we have turfs in DB, we should dynamically calculate the rating to ensure it's not stuck on fake ratings
      const turfsWithRealRatings = await Promise.all(turfs.map(async (turf) => {
        const turfObj = turf.toObject ? turf.toObject() : turf;
        const reviews = await Review.find({ turfId: turfObj._id.toString() });
        if (reviews.length > 0) {
          turfObj.reviewCount = reviews.length;
          turfObj.rating = Number((reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(2));
        } else {
          // Check if it's the mock ID and has reviews matching the string "1"
          const mockReviews = await Review.find({ turfId: turfObj._id.toString() });
          if (mockReviews.length > 0) {
            turfObj.reviewCount = mockReviews.length;
            turfObj.rating = Number((mockReviews.reduce((acc, r) => acc + r.rating, 0) / mockReviews.length).toFixed(2));
          } else {
            turfObj.rating = 0;
            turfObj.reviewCount = 0;
          }
        }
        return turfObj;
      }));

      res.json(turfsWithRealRatings);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch turfs" });
    }
  });

  app.get("/api/turfs/:id", async (req, res) => {
    try {
      if (req.params.id === "1" || req.params.id === "650000000000000000000001") {
          let realRating = 4.98;
          let realReviewCount = 342;
          
          try {
            const reviews = await Review.find({ turfId: req.params.id });
            if (reviews.length > 0) {
              realReviewCount = reviews.length;
              realRating = Number((reviews.reduce((acc, r) => acc + r.rating, 0) / realReviewCount).toFixed(2));
            } else {
              realRating = 0;
              realReviewCount = 0;
            }
          } catch(e) {}

          return res.json({
            id: "1",
            _id: "650000000000000000000001",
            name: "Match Point Turf",
            image: "/images/turf-night.jpg",
            gallery: [
              "/images/turf-night.jpg", 
              "/images/turf-trophy.jpg",
              "/images/turf-day.jpg",
              "https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&q=80&w=1200",
              "https://images.unsplash.com/photo-1589487391730-58f20eb2c308?auto=format&fit=crop&q=80&w=1200"
            ],
            price: 10,
            rating: realRating,
            reviewCount: realReviewCount,
            location: "Solapur",
            subLocation: "Civil Hospital Road",
            description: "Experience the ultimate matchday at Match Point Turf. Featuring high-grade artificial grass, professional floodlights for night sessions, and a dedicated trophy facility for your tournaments. The preferred destination for serious athletes in Solapur.",
            amenities: ["Night LED Floodlights", "Tournament Trophy Support", "Changing Rooms", "Free Parking", "Drinking Water", "First Aid"],
            distance: "1.2 km away",
            host: { name: "Match Point Team", avatar: "", years: 5 },
            coordinates: { lat: 17.6599, lng: 75.9064 }
          });
      }
      const turf = await Turf.findById(req.params.id);
      if (turf) {
        const turfObj = turf.toObject();
        const reviews = await Review.find({ turfId: turfObj._id.toString() });
        if (reviews.length > 0) {
          turfObj.reviewCount = reviews.length;
          turfObj.rating = Number((reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(2));
        } else {
          const mockReviews = await Review.find({ turfId: turfObj._id.toString() });
          if (mockReviews.length > 0) {
            turfObj.reviewCount = mockReviews.length;
            turfObj.rating = Number((mockReviews.reduce((acc, r) => acc + r.rating, 0) / mockReviews.length).toFixed(2));
          } else {
            turfObj.rating = 0;
            turfObj.reviewCount = 0;
          }
        }
        return res.json(turfObj);
      }
      res.status(404).json({ error: "Turf not found" });
    } catch (error) {
      res.status(404).json({ error: "Turf not found" });
    }
  });

  // ================= REVIEWS =================
  app.get("/api/turfs/:id/reviews", async (req, res) => {
    try {
      const reviews = await Review.find({ turfId: req.params.id }).sort({ createdAt: -1 });
      
      res.json(reviews.map(r => ({
        id: r._id,
        author: r.author,
        date: r.date,
        rating: r.rating,
        comment: r.comment
      })));
    } catch (error) {
      console.error("Fetch reviews error:", error);
      res.status(500).json({ error: "Failed to fetch reviews" });
    }
  });

  app.post("/api/turfs/:id/reviews", async (req, res) => {
    try {
      const { author, rating, comment } = req.body;
      const turfId = req.params.id;

      if (!author || !rating || !comment) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const date = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      
      const newReview = new Review({
        turfId,
        author,
        date,
        rating,
        comment
      });

      await newReview.save();

      // Update Turf rating and reviewCount
      const allReviews = await Review.find({ turfId });
      const avgRating = allReviews.reduce((acc, r) => acc + r.rating, 0) / allReviews.length;
      
      if (mongoose.Types.ObjectId.isValid(turfId)) {
        await Turf.findByIdAndUpdate(turfId, {
          rating: parseFloat(avgRating.toFixed(2)),
          reviewCount: allReviews.length
        });
      }

      res.json({
        id: newReview._id,
        author: newReview.author,
        date: newReview.date,
        rating: newReview.rating,
        comment: newReview.comment
      });
    } catch (error) {
      console.error("Create review error:", error);
      res.status(500).json({ error: "Failed to create review" });
    }
  });


  // ================= USER PROFILE =================
  app.get("/api/user/profile", async (req, res) => {
    const { email } = req.query;
    if (!email || typeof email !== 'string') return res.status(400).json({ error: "Email required" });
    try {
      const user = await User.findOne({ email }).select('-password');
      if (!user) return res.status(404).json({ error: "User not found" });
      res.json({ name: user.name, email: user.email, phoneNumber: user.phoneNumber, role: user.role });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch profile" });
    }
  });

  app.put("/api/user/profile", async (req, res) => {
    const { email, name, phoneNumber, newPassword } = req.body;
    if (!email) return res.status(400).json({ error: "Email required" });
    try {
      const user = await User.findOne({ email });
      if (!user) return res.status(404).json({ error: "User not found" });

      if (name !== undefined) user.name = name;
      if (phoneNumber !== undefined) user.phoneNumber = phoneNumber;
      if (newPassword && newPassword.length >= 6) {
        user.password = await bcrypt.hash(newPassword, 10);
      }

      await user.save();
      res.json({ success: true, name: user.name, email: user.email, phoneNumber: user.phoneNumber });
    } catch (error) {
      res.status(500).json({ error: "Failed to update profile" });
    }
  });

  app.get("/api/bookings", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader) return res.status(401).json({ error: "Unauthorized" });
      const token = authHeader.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || "default_secret") as any;
      const user = await User.findById(decoded.id);
      if (!user) return res.status(404).json({ error: "User not found" });

      const identifiers = [];
      if (user.email) identifiers.push(user.email);
      if (user.phoneNumber) identifiers.push(user.phoneNumber);
      
      if (identifiers.length === 0) identifiers.push('undefined');

      const bookings = await Booking.find({ userEmail: { $in: identifiers } }).sort({ createdAt: -1 });
      // Manually enrich each booking with turf data
      const enriched = await Promise.all(bookings.map(async (b) => {
        let turfData = null;
        if (b.turfId) {
          if (mongoose.Types.ObjectId.isValid(b.turfId)) {
            turfData = await Turf.findById(b.turfId).lean();
          } else {
            turfData = await Turf.findOne({ id: b.turfId }).lean();
          }
        }
        return { ...b.toObject(), turfId: turfData || { name: 'Unknown Turf', image: '', subLocation: '' } };
      }));
      res.json(enriched);
    } catch (error) {
      console.error('Bookings fetch error:', error);
      res.status(500).json({ error: "Failed to fetch bookings" });
    }
  });

  // ================= CANCEL BOOKING =================
  const PLATFORM_FEE = 50;

  app.post("/api/bookings/:id/cancel", async (req, res) => {
    try {
      const booking = await Booking.findById(req.params.id);
      if (!booking) return res.status(404).json({ error: "Booking not found" });
      if (booking.status === 'Cancelled') return res.status(400).json({ error: "Booking already cancelled" });

      // ── Idempotency Guard: prevent double-cancellation ──
      const idempotencyKey = `cancel_${req.params.id}`;
      if (booking.cancelIdempotencyKey === idempotencyKey) {
        return res.status(409).json({ error: "This cancellation is already being processed. Please wait." });
      }

      // ── HARD BLOCK: No cancellations within 6 hours of start ──
      // (Inline quick parse to avoid code duplication before full parseSlotTime is defined below)
      const _quickParseDate = (dateStr: string, timeStr: string): Date => {
        const startTime = (timeStr || '').split(' - ')[0].trim();
        const friendlyDate = dateStr.match(/(\d{1,2})\s+([A-Z]{3})/i);
        const months: Record<string, string> = {
          JAN:'01',FEB:'02',MAR:'03',APR:'04',MAY:'05',JUN:'06',
          JUL:'07',AUG:'08',SEP:'09',OCT:'10',NOV:'11',DEC:'12'
        };
        let resolvedDate: string;
        if (dateStr === 'Today' || !dateStr) {
          resolvedDate = new Date().toISOString().split('T')[0];
        } else if (friendlyDate) {
          const year = new Date().getFullYear();
          resolvedDate = `${year}-${months[friendlyDate[2].toUpperCase()] || '01'}-${friendlyDate[1].padStart(2,'0')}`;
        } else {
          resolvedDate = dateStr;
        }
        const h12 = startTime.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
        const h24 = startTime.match(/^(\d{1,2}):(\d{2})$/);
        if (h12) {
          let hr = parseInt(h12[1]);
          if (h12[3].toUpperCase() === 'PM' && hr !== 12) hr += 12;
          if (h12[3].toUpperCase() === 'AM' && hr === 12) hr = 0;
          return new Date(`${resolvedDate}T${String(hr).padStart(2,'0')}:${h12[2]}:00+05:30`);
        } else if (h24) {
          return new Date(`${resolvedDate}T${h24[1].padStart(2,'0')}:${h24[2]}:00+05:30`);
        }
        return new Date(NaN);
      };
      // We allow cancellation at any time to free up the slot, 
      // but refunds are governed by the 12-hour rule below.

      // ── 12-hour refund window check ──
      // Parses date like "FRI 25 APR" and time like "10:00 PM" or "10:00 PM - 11:00 PM"
      const parseSlotTime = (dateStr: string, timeStr: string): Date => {
        // Extract just the start time (handles single slots and ranges)
        const startTime = timeStr.split(' - ')[0].trim();

        // Parse date: handle "FRI 25 APR", "25 APR", "2026-04-25", or "Today"
        let resolvedDate: string;
        const friendlyDate = dateStr.match(/(\d{1,2})\s+([A-Z]{3})/i);
        if (dateStr === 'Today' || !dateStr) {
          resolvedDate = new Date().toISOString().split('T')[0];
        } else if (friendlyDate) {
          const day = friendlyDate[1].padStart(2, '0');
          const monthStr = friendlyDate[2].toUpperCase();
          const months: Record<string, string> = {
            JAN: '01', FEB: '02', MAR: '03', APR: '04', MAY: '05', JUN: '06',
            JUL: '07', AUG: '08', SEP: '09', OCT: '10', NOV: '11', DEC: '12'
          };
          const year = new Date().getFullYear();
          resolvedDate = `${year}-${months[monthStr] || '01'}-${day}`;
        } else {
          resolvedDate = dateStr; // assume ISO already
        }

        // Parse time: "10:00 PM" or "22:00"
        const h12 = startTime.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
        const h24 = startTime.match(/^(\d{1,2}):(\d{2})$/);
        if (h12) {
          let hr = parseInt(h12[1]);
          const mn = h12[2];
          if (h12[3].toUpperCase() === 'PM' && hr !== 12) hr += 12;
          if (h12[3].toUpperCase() === 'AM' && hr === 12) hr = 0;
          return new Date(`${resolvedDate}T${String(hr).padStart(2, '0')}:${mn}:00+05:30`);
        } else if (h24) {
          return new Date(`${resolvedDate}T${h24[1].padStart(2, '0')}:${h24[2]}:00+05:30`);
        }
        return new Date(NaN);
      };

      const startTimeStr = booking.time?.trim() || '';
      const turfStartDate = parseSlotTime(booking.date, startTimeStr);
      const hoursUntilStart = isNaN(turfStartDate.getTime())
        ? 999  // Can't parse the time — allow cancellation
        : (turfStartDate.getTime() - Date.now()) / (1000 * 60 * 60);
      
      const isWithinNoRefundWindow = hoursUntilStart < 12;
      let refundAmount = 0;
      let refundStatus = 'no_refund';

      if (booking.status === 'Confirmed') {
        refundAmount = isWithinNoRefundWindow ? 0 : Math.max(0, (booking.amount || 0) - PLATFORM_FEE);
        refundStatus = isWithinNoRefundWindow ? 'no_refund' : 'initiated';
      }

      // ── Mark idempotency key + initiate cancellation atomically ──
      booking.status = 'Cancelled';
      booking.reminderSent = true;
      booking.cancelledAt = new Date();
      booking.cancelIdempotencyKey = idempotencyKey;
      booking.refundedAmount = refundAmount;
      booking.refundStatus = refundStatus;
      await booking.save();

      // ── Attempt Razorpay refund (async — webhook will confirm later) ──
      const rzp = getRazorpay();
      let refundId: string | null = null;
      if (refundAmount > 0 && rzp && booking.orderId && !booking.orderId.startsWith('SIM_')) {
        try {
          const payments = await (rzp.orders as any).fetchPayments(booking.orderId);
          const payment = payments.items?.[0];
          if (payment) {
            const refund = await (rzp.payments as any).refund(payment.id, {
              amount: refundAmount * 100,
              notes: { reason: 'Customer cancellation', platform_fee: String(PLATFORM_FEE), booking_id: String(booking._id) }
            });
            refundId = refund.id;
            console.log(`[Cancel] Refund initiated: ${refundId} for booking ${booking._id}`);
          }
        } catch (rzpErr) {
          booking.refundStatus = 'failed';
          await booking.save();
          console.warn('[Cancel] Razorpay refund initiation failed:', rzpErr);
        }
      }

      // ── Lookup turf name for email ──
      let turfName = 'your turf';
      if (booking.turfId) {
        const turfDoc = mongoose.Types.ObjectId.isValid(booking.turfId)
          ? await Turf.findById(booking.turfId).lean()
          : await Turf.findOne({ id: booking.turfId }).lean();
        if (turfDoc) turfName = (turfDoc as any).name;
      }
      const mailer = getTransporter();
      if (mailer) {
        await mailer.sendMail({
          from: `"QuickTurf" <${process.env.SMTP_USER}>`,
          to: booking.userEmail,
          subject: isWithinNoRefundWindow
            ? `Booking Cancelled — No Refund Applicable`
            : `Booking Cancelled — Refund of ₹${refundAmount} Initiated`,
          html: `
            <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e4e4e7;">
              <div style="background:#2C332A;padding:32px;text-align:center;">
                <h1 style="color:white;margin:0;font-size:24px;">Booking Cancelled</h1>
              </div>
              <div style="padding:32px;">
                <p style="color:#3f3f46;">Your booking has been cancelled. Here's a summary:</p>
                <div style="background:#f4f4f5;border-radius:12px;padding:20px;margin:24px 0;">
                  <p style="margin:6px 0;"><strong>🏟️ Venue:</strong> ${turfName}</p>
                  <p style="margin:6px 0;"><strong>📅 Date:</strong> ${booking.date}</p>
                  <p style="margin:6px 0;"><strong>⏰ Time:</strong> ${booking.time}</p>
                  <hr style="border:none;border-top:1px solid #e4e4e7;margin:12px 0;"/>
                  <p style="margin:6px 0;"><strong>Amount Paid:</strong> ₹${booking.amount}</p>
                  ${isWithinNoRefundWindow
                    ? `<p style="margin:6px 0;color:#ef4444;"><strong>Refund:</strong> Not applicable (cancelled within 12 hours of start time)</p>`
                    : `<p style="margin:6px 0;color:#ef4444;"><strong>Platform Fee (non-refundable):</strong> − ₹${PLATFORM_FEE}</p>
                       <p style="margin:6px 0;color:#00A36C;font-size:18px;"><strong>Refund Amount:</strong> ₹${refundAmount}</p>`
                  }
                </div>
                ${!isWithinNoRefundWindow
                  ? `<p style="color:#71717a;font-size:14px;">Your refund of <strong>₹${refundAmount}</strong> has been <strong>initiated</strong> and will appear in your original payment method within <strong>5–7 business days</strong>. You will receive another email once the bank confirms the transfer.</p>`
                  : `<p style="color:#71717a;font-size:14px;">Per our cancellation policy, no refund is issued for bookings cancelled within 12 hours of the start time.</p>`
                }
                <div style="background:#fef3c7;border-radius:8px;padding:12px 16px;margin-top:20px;border-left:4px solid #f59e0b;">
                  <p style="margin:0;font-size:12px;color:#92400e;"><strong>⚠️ Disclaimer:</strong> Refund timelines depend on your bank and payment method. QuickTurf initiates the refund immediately, but settlement is handled by Razorpay and your bank. For disputes, contact support@quickturf.in.</p>
                </div>
                <p style="color:#a1a1aa;font-size:12px;margin-top:32px;">— The QuickTurf Team, Solapur</p>
              </div>
            </div>
          `
        });
      }

      res.json({
        success: true,
        refundAmount,
        platformFee: isWithinNoRefundWindow ? 0 : PLATFORM_FEE,
        noRefund: isWithinNoRefundWindow,
        refundStatus: booking.refundStatus,
        refundId,
        message: isWithinNoRefundWindow
          ? 'Booking cancelled. No refund applies — cancellation was made within 12 hours of start time.'
          : `Booking cancelled. Refund of ₹${refundAmount} has been initiated. You'll receive a confirmation email once your bank processes it (5–7 business days).`
      });

    } catch (error) {
      console.error('[Cancel] Error:', error);
      res.status(500).json({ error: "Failed to cancel booking" });
    }
  });

  app.put("/api/bookings/:id/reviewed", async (req, res) => {
    try {
      const booking = await Booking.findByIdAndUpdate(req.params.id, { isReviewed: true }, { new: true });
      if (!booking) return res.status(404).json({ error: "Booking not found" });
      res.json({ message: "Booking marked as reviewed" });
    } catch (error) {
      console.error('Update booking reviewed status error:', error);
      res.status(500).json({ error: "Failed to update booking" });
    }
  });

  // ================= RAZORPAY WEBHOOK (Async Refund Confirmation) =================
  app.post("/api/webhooks/razorpay", express.raw({ type: 'application/json' }), async (req, res) => {
    const signature = req.headers['x-razorpay-signature'] as string;
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    // ── Verify webhook signature ──
    if (webhookSecret && signature) {
      const crypto = await import('crypto');
      const expectedSig = crypto.default
        .createHmac('sha256', webhookSecret)
        .update(req.body)
        .digest('hex');
      if (expectedSig !== signature) {
        console.warn('[Webhook] Invalid Razorpay signature — rejected');
        return res.status(400).json({ error: "Invalid signature" });
      }
    }

    try {
      const event = JSON.parse(req.body.toString());
      console.log(`[Webhook] Received event: ${event.event}`);

      if (event.event === 'refund.processed' || event.event === 'refund.succeeded') {
        const refundPayload = event.payload?.refund?.entity;
        const bookingId = refundPayload?.notes?.booking_id;

        if (bookingId) {
          const booking = await Booking.findById(bookingId);
          if (booking && booking.refundStatus === 'initiated') {
            booking.refundStatus = 'succeeded';
            await booking.save();
            console.log(`[Webhook] ✅ Refund confirmed for booking ${bookingId}`);

            // Send "Refund confirmed" email
            const mailer = getTransporter();
            if (mailer) {
              await mailer.sendMail({
                from: `"QuickTurf" <${process.env.SMTP_USER}>`,
                to: booking.userEmail,
                subject: `✅ Your Refund of ₹${booking.refundedAmount} Has Been Processed`,
                html: `
                  <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e4e4e7;">
                    <div style="background:#00A36C;padding:32px;text-align:center;">
                      <h1 style="color:white;margin:0;font-size:24px;">✅ Refund Processed!</h1>
                    </div>
                    <div style="padding:32px;">
                      <p style="color:#3f3f46;">Great news! Your bank has confirmed the refund of <strong>₹${booking.refundedAmount}</strong>. It should now be visible in your account.</p>
                      <p style="color:#71717a;font-size:14px;">If you don't see it yet, it may take up to 2 additional business days depending on your bank.</p>
                      <p style="color:#a1a1aa;font-size:12px;margin-top:32px;">— The QuickTurf Team, Solapur</p>
                    </div>
                  </div>
                `
              });
            }
          }
        }
      }

      if (event.event === 'refund.failed') {
        const refundPayload = event.payload?.refund?.entity;
        const bookingId = refundPayload?.notes?.booking_id;
        if (bookingId) {
          await Booking.findByIdAndUpdate(bookingId, { refundStatus: 'failed' });
          console.error(`[Webhook] ❌ Refund FAILED for booking ${bookingId} — manual review needed`);
        }
      }

      res.json({ received: true });
    } catch (err) {
      console.error('[Webhook] Processing error:', err);
      res.status(500).json({ error: "Webhook processing failed" });
    }
  });

  app.post("/api/create-payment-intent", async (req, res) => {
    const { amount, turfId, date, time, userEmail } = req.body;
    
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader) return res.status(401).json({ error: "Unauthorized" });
      const token = authHeader.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || "default_secret") as any;
      const user = await User.findById(decoded.id);
      if (!user) return res.status(404).json({ error: "User not found" });

      const identifier = user.email || user.phoneNumber || 'undefined';

      // 0. Check if user is banned
      if (user.isBanned) {
        return res.status(403).json({
          success: false,
          error: `Your account has been suspended. Reason: ${user.banReason || 'Platform policy violation'}. Contact support@quickturf.in.`
        });
      }

      // 1a. Check if turf is disabled by superadmin
      if (mongoose.Types.ObjectId.isValid(turfId)) {
        const turfDoc = await Turf.findById(turfId);
        if (turfDoc?.isDisabled) {
          return res.status(403).json({
            success: false,
            error: `This turf is currently unavailable. ${turfDoc.disabledReason || 'It has been temporarily disabled by the platform.'}`
          });
        }
      }

      // 1. Check for existing locks
      const tenMinsAgo = new Date(Date.now() - 10 * 60 * 1000);
      const existingBooking = await Booking.findOne({
        turfId,
        date,
        time,
        $or: [
          { status: 'Confirmed' },
          { status: 'Pending', createdAt: { $gte: tenMinsAgo } }
        ]
      });

      if (existingBooking) {
        return res.status(409).json({ 
          success: false, 
          error: "This slot is currently being booked by someone else. Please try another slot or check back in 10 minutes." 
        });
      }

      // 2. Create Razorpay Order
      const rzp = getRazorpay();
      let orderId = `SIM_${Math.random().toString(36).substr(2, 9)}`;
      let isSimulation = true;
      let amountInPaise = amount * 100;
      let keyId = undefined;

      if (rzp) {
        const order = await rzp.orders.create({
          amount: amount * 100,
          currency: "INR",
          receipt: `receipt_${Date.now()}`,
        });
        orderId = order.id;
        amountInPaise = order.amount as number;
        keyId = process.env.RAZORPAY_KEY_ID;
        isSimulation = false;
      }

      // 3. Establish Lock
      const newBooking = new Booking({
        turfId,
        orderId,
        amount: amount,
        date,
        time,
        status: 'Pending',
        userEmail: identifier
      });
      await newBooking.save();
      
      res.json({ 
        success: true, 
        isSimulation,
        orderId,
        amount: amountInPaise,
        keyId
      });
    } catch (error: any) {
      console.error("Payment Intent Error:", error);
      res.status(500).json({ success: false, error: "Failed to initialize payment", details: error.message });
    }
  });

  app.post("/api/verify-payment", async (req, res) => {
    const { orderId, amount, turfId, date, time, userEmail, rzpPayload } = req.body;
    
    try {
      const key_secret = process.env.RAZORPAY_KEY_SECRET;

      // STRICT SECURITY: If Razorpay is configured on the backend, we MUST verify the cryptographic signature.
      if (key_secret) {
        if (!rzpPayload || !rzpPayload.razorpay_signature || !rzpPayload.razorpay_payment_id) {
          console.error("Missing Razorpay payload in production mode.");
          return res.status(400).json({ success: false, error: "Payment verification failed: Missing Razorpay payload" });
        }

        const crypto = await import('crypto');
        const generatedSignature = crypto.default
          .createHmac('sha256', key_secret)
          .update(orderId + "|" + rzpPayload.razorpay_payment_id)
          .digest('hex');

        if (generatedSignature !== rzpPayload.razorpay_signature) {
          console.error("Invalid Razorpay signature mismatch.");
          return res.status(400).json({ success: false, error: "Payment verification failed: Invalid signature" });
        }
      }

      const updatedBooking = await Booking.findOneAndUpdate(
        { orderId },
        { status: 'Confirmed', paymentId: rzpPayload?.razorpay_payment_id || 'SIMULATED' },
        { new: true }
      );
      
      if (!updatedBooking) {
        return res.status(404).json({ success: false, error: "Booking lock not found" });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Booking verification error:", error);
      res.status(500).json({ success: false });
    }
  });

  // Seed Data Route (Temporary)
  app.post("/api/seed", async (req, res) => {
    const { force } = req.body;
    const count = await Turf.countDocuments();
    
    if (count > 0 && !force) return res.json({ message: "Already seeded. Use {force: true} to reset." });
    
    if (force) {
      await Turf.deleteMany({});
    }
    
    const initialTurfs = [
      { 
        name: "Match Point Turf", 
        image: "/images/turf-night.jpg", 
        gallery: [
          "/images/turf-night.jpg",
          "/images/turf-trophy.jpg",
          "/images/turf-day.jpg",
          "https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&q=80&w=1200",
          "https://images.unsplash.com/photo-1589487391730-58f20eb2c308?auto=format&fit=crop&q=80&w=1200"
        ],
        price: 10, 
        rating: 4.98, 
        reviewCount: 342, 
        location: "Civil Hospital Road, Solapur", 
        subLocation: "Solapur", 
        description: "Experience the ultimate matchday at Match Point Turf. Featuring high-grade artificial grass, professional floodlights for night sessions, and a dedicated trophy facility for your tournaments. The preferred destination for serious athletes in Solapur.",
        type: "Football / Cricket / Box Cricket", 
        facilities: ["FIFA Grade Turf", "LED Floodlights", "Tournament Trophy Support", "Changing Rooms"], 
        amenities: ["Night LED Floodlights", "Tournament Trophy Support", "Changing Rooms", "Free Parking", "Drinking Water", "First Aid"],
        host: {
          name: "Match Point Team",
          avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuD9OLYFJoFVIRdzeuJxH5vnWGU49nraZMiWq5TkrxpBEg-s7br2RFJrGdKS8fhVTmGmNLgigfKEPMuvxXTUmQRsAodE7TIrNpGxZq5vmjkcXQk2rKOjL3LrshAOcqQyA7mVJi62eT864uDA7qo7kdBORgq4NDc3UGQHod7wbbH9YBDBEu7ni1tPzvSkPQbjsv_12OSo14JlqYtv3c3xB1Nt8eUp8NiJAXTKK-0xHtIA0YWlVZtPo4V6FFf7FQxOTx45uVk7-P-kCpA",
          years: 5
        },
        coordinates: { lat: 17.6599, lng: 75.9064 } 
      }
    ];
    
    await Turf.insertMany(initialTurfs);
    res.json({ message: "Seeded successfully with Match Point Turf" });
  });

  // API only in this split setup
  const distPath = path.join(process.cwd(), "../frontend/dist");
  app.use(express.static(distPath));
  // Catch all route to serve index.html for SPA
  app.get("*", (req, res) => {
    // Only serve index.html for non-API routes
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(distPath, "index.html"));
    } else {
      res.status(404).json({ error: "Not found" });
    }
  });

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });

  // ================= BOOKING REMINDER CRON JOB =================
  cron.schedule('* * * * *', async () => {
    // ── Task 1: Expire stale Pending bookings older than 10 minutes ──
    try {
      const tenMinsAgo = new Date(Date.now() - 10 * 60 * 1000);
      const expired = await Booking.deleteMany({
        status: 'Pending',
        createdAt: { $lt: tenMinsAgo }
      });
      if (expired.deletedCount > 0) {
        console.log(`[Cron] Released ${expired.deletedCount} expired pending booking lock(s)`);
      }
    } catch (err) {
      console.error('[Cron] Error cleaning up pending bookings:', err);
    }

    // ── Task 2: Send 1-hour turf booking reminders ──
    try {
      const now = new Date();
      const bookings = await Booking.find({ status: 'Confirmed', reminderSent: { $ne: true } }).populate('turfId');

      for (const booking of bookings) {
        if (!booking.date || !booking.time) continue;

        // Parse start time from "HH:00 - HH:00" format
        const startTimeStr = booking.time.split(' - ')[0].trim();
        // Build IST datetime string
        const turfStartDate = new Date(`${booking.date}T${startTimeStr}:00+05:30`);

        const diffMs = turfStartDate.getTime() - now.getTime();
        const diffHours = diffMs / (1000 * 60 * 60);

        // Fire when 0 to 1 hour remains before the booking
        if (diffHours <= 1 && diffHours > 0) {
          console.log(`[Cron] Sending 1-hour reminder to ${booking.userEmail}`);
          const turfName = (booking.turfId as any)?.name || 'your turf';

          const mailOptions = {
            from: `"QuickTurf" <${process.env.SMTP_USER}>`,
            to: booking.userEmail,
            subject: `⏱️ Reminder: Your booking at ${turfName} is in 1 Hour!`,
            html: `
              <div style="font-family: 'Arial', sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e4e4e7;">
                <div style="background: #00A36C; padding: 32px; text-align: center;">
                  <h1 style="color: white; margin: 0; font-size: 28px;">⚽ Get Ready to Play!</h1>
                </div>
                <div style="padding: 32px;">
                  <p style="color: #3f3f46; font-size: 16px;">Hello! This is your 1-hour reminder for an upcoming booking.</p>
                  <div style="background: #f4f4f5; border-radius: 12px; padding: 20px; margin: 24px 0;">
                    <p style="margin: 6px 0; color: #18181b;"><strong>🏟️ Venue:</strong> ${turfName}</p>
                    <p style="margin: 6px 0; color: #18181b;"><strong>📅 Date:</strong> ${booking.date}</p>
                    <p style="margin: 6px 0; color: #18181b;"><strong>⏰ Time:</strong> ${booking.time}</p>
                  </div>
                  <p style="color: #71717a;">Please arrive <strong>10 minutes early</strong> to ensure your full playtime. Have a great match!</p>
                  <p style="color: #a1a1aa; font-size: 12px; margin-top: 32px;">— The QuickTurf Team, Solapur</p>
                </div>
              </div>
            `
          };

          const transporterInstance = getTransporter();
          if (transporterInstance) {
            await transporterInstance.sendMail(mailOptions);
            console.log(`[Cron] Reminder email sent to ${booking.userEmail}`);
          } else {
            console.log(`[Cron][Simulated] Reminder email would be sent to ${booking.userEmail}`);
          }

          booking.reminderSent = true;
          await booking.save();
        }
      }
    } catch (err) {
      console.error('[Cron] Reminder job error:', err);
    }
  });
}

startServer().catch(console.error);
