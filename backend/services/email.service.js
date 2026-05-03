import nodemailer from "nodemailer";

let transporter = null;

export const getTransporter = () => {
  if (!transporter) {
    const host = process.env.SMTP_HOST;
    const port = parseInt(process.env.SMTP_PORT || "465");
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    console.log(`[SMTP Debug] User: ${user}, Host: ${host}, Port: ${port}`);
    if (pass) {
      console.log(
        `[SMTP Debug] Pass Length: ${pass.length}, Starts with: ${pass.substring(0, 2)}..., Ends with: ...${pass.substring(pass.length - 2)}`
      );
    }

    if (!user || !pass) {
      console.warn(
        "SMTP credentials missing. Email OTP will be simulated in logs."
      );
      return null;
    }

    const isGmail =
      host?.includes("gmail") || user?.endsWith("@gmail.com");

    if (isGmail) {
      transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 465,
        secure: true, // SSL for Port 465
        auth: {
          user: user.trim(),
          pass: pass.trim().replace(/\s/g, ""),
        },
        tls: { rejectUnauthorized: false },
      });
    } else {
      transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user: user.trim(), pass: pass.trim() },
        tls: { rejectUnauthorized: false },
      });
    }

    // Verify connection on startup
    transporter.verify((error) => {
      if (error) {
        console.error("SMTP Connection Error:", error.message);
      } else {
        console.log("SMTP Server is ready to take messages");
      }
    });
  }
  return transporter;
};
