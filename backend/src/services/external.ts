import nodemailer from "nodemailer";
import Razorpay from "razorpay";
import dotenv from "dotenv";

dotenv.config();

let transporter: any = null;
export const getTransporter = () => {
  if (!transporter) {
    const host = process.env.SMTP_HOST;
    const port = parseInt(process.env.SMTP_PORT || "465");
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (!user || !pass) return null;

    transporter = nodemailer.createTransport({
      host: host || "smtp.gmail.com",
      port,
      secure: port === 465,
      auth: { user: user.trim(), pass: pass.trim() },
      tls: { rejectUnauthorized: false }
    });
  }
  return transporter;
};

let razorpay: any = null;
export const getRazorpay = () => {
  if (!razorpay) {
    const key_id = process.env.RAZORPAY_KEY_ID;
    const key_secret = process.env.RAZORPAY_KEY_SECRET;
    if (!key_id || !key_secret) return null;
    razorpay = new Razorpay({ key_id, key_secret });
  }
  return razorpay;
};
