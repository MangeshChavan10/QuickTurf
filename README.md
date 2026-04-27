# QuickTurf 🟢

> **Solapur's #1 Turf Booking Platform** — Book, Play, Review.

A full-stack MERN application for seamless sports turf booking, built with React, Express, MongoDB, and Razorpay payments.

---

## ✨ Features

- 🔐 OTP-based authentication (Email & Phone) + JWT
- 🏟️ Browse and explore turfs with real-time slot availability
- 💳 Razorpay payment integration with refund support
- 📅 12-hour cancellation policy with automated refunds
- ⭐ Real review system — ratings calculated from live database
- 💬 Post-game feedback prompts after your booking ends
- 📧 Automated email notifications (booking, cancellation, OTP)
- 🏢 Partner Portal for turf owners
- 🛡️ Super Admin Portal for platform management
- 📱 Fully responsive design

---

## 🚀 Getting Started

### Prerequisites
- Node.js ≥ 18
- MongoDB Atlas account
- Razorpay account (optional — runs in simulation mode without it)
- Gmail account with App Password (for emails)

### Installation

```bash
# 1. Clone the repo
git clone https://github.com/MangeshChavan10/quickturf.git
cd quickturf

# 2. Install root dependencies
npm install

# 3. Install backend dependencies
cd backend && npm install && cd ..

# 4. Install frontend dependencies
cd frontend && npm install && cd ..

# 5. Set up environment variables
cp .env.example .env
# Fill in your credentials in .env
```

### Running Locally

```bash
# Terminal 1 — Backend (port 3000)
cd backend && npm run dev

# Terminal 2 — Frontend (port 5173)
cd frontend && npm run dev -- --host 0.0.0.0
```

---

## 🔑 Environment Variables

Copy `.env.example` to `.env` and fill in your values:

| Variable | Description |
|---|---|
| `MONGODB_URI` | MongoDB Atlas connection string |
| `JWT_SECRET` | Random string for signing JWTs |
| `RAZORPAY_KEY_ID` | Razorpay public key |
| `RAZORPAY_KEY_SECRET` | Razorpay secret key |
| `RAZORPAY_WEBHOOK_SECRET` | Razorpay webhook signing secret |
| `SMTP_HOST` | Email server host |
| `SMTP_PORT` | Email server port (465 for Gmail SSL) |
| `SMTP_USER` | Your Gmail address |
| `SMTP_PASS` | Gmail App Password |

> ⚠️ **Never commit your `.env` file.** It is already excluded via `.gitignore`.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite, Framer Motion |
| Backend | Node.js, Express.js, TypeScript |
| Database | MongoDB Atlas (Mongoose) |
| Payments | Razorpay |
| Email | Nodemailer (Gmail SMTP) |
| Auth | JWT + OTP |

---

## 👥 Team

| Name | Role |
|---|---|
| Mangesh Chavan | Full-Stack Developer |
| Parshva | Developer |
| Sameehan | Developer |
| Shreyas | Developer |

---
