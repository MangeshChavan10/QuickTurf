import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function diagnoseSMTP() {
  console.log('--- SMTP Diagnostic ---');
  console.log(`SMTP_HOST: smtp.gmail.com`);
  console.log(`SMTP_PORT: 587`);
  console.log(`SMTP_USER: ${process.env.SMTP_USER}`);
  console.log(`SMTP_PASS: ${process.env.SMTP_PASS ? '[HIDDEN]' : 'MISSING'}`);

  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // Use STARTTLS on 587
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    },
    logger: true,
    debug: true
  });

  try {
    console.log('\nTesting connection...');
    await transporter.verify();
    console.log('✅ Connection verified successfully. Credentials are valid.');
    
    console.log('\nSending test email...');
    const info = await transporter.sendMail({
      from: `"QuickTurf Diagnostic" <${process.env.SMTP_USER}>`,
      to: process.env.SMTP_USER,
      subject: "QuickTurf SMTP Diagnostic Test",
      text: "If you are reading this, the QuickTurf SMTP server is working perfectly."
    });
    console.log(`✅ Test email sent successfully! Message ID: ${info.messageId}`);
    
  } catch (error: any) {
    console.error('\n❌ SMTP Error Occurred:');
    console.error('Message:', error.message);
    console.error('Code:', error.code);
    console.error('Command:', error.command);
    if (error.response) console.error('Response:', error.response);
  }
}

diagnoseSMTP();
