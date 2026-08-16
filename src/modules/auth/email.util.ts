// import * as nodemailer from 'nodemailer';

// const transporter = nodemailer.createTransport({
//   service: 'gmail',
//   auth: {
//     user: process.env.EMAIL_USER,
//     pass: process.env.EMAIL_PASS,
//   },
// });

// export const sendEmail = async (to: string, subject: string, html: string) => {
//   if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
//     console.warn('Email not sent — EMAIL_USER/EMAIL_PASS not configured');
//     return;
//   }
//   try {
//     await transporter.sendMail({
//       from: `"White Label Backoffice" <${process.env.EMAIL_USER}>`,
//       to,
//       subject,
//       html,
//     });
//   } catch (error) {
//     console.warn(`Failed to send email to ${to}:`, (error as Error).message);
//   }
// };

// export const generateOtp = (): string => {
//   // 6-digit numeric OTP, e.g. "482913"
//   return Math.floor(100000 + Math.random() * 900000).toString();
// };

// export const emailVerificationOtpEmail = (otp: string) => `
//   <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto;">
//     <h2>Verify Your Email</h2>
//     <p>Use the code below to verify your email address. It expires in 10 minutes.</p>
//     <p style="font-size: 28px; font-weight: bold; letter-spacing: 6px;">${otp}</p>
//     <p>If you didn't create this account, you can ignore this email.</p>
//   </div>
// `;

// export const passwordResetOtpEmail = (otp: string) => `
//   <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto;">
//     <h2>Reset Your Password</h2>
//     <p>Use the code below to reset your password. It expires in 10 minutes.</p>
//     <p style="font-size: 28px; font-weight: bold; letter-spacing: 6px;">${otp}</p>
//     <p>If you didn't request this, you can safely ignore this email.</p>
//   </div>
// `;
import * as nodemailer from 'nodemailer';

// Brevo (formerly Sendinblue) — a transactional email service, used here via
// SMTP through Nodemailer.
//
// IMPORTANT: the transporter is created lazily inside getTransporter(),
// NOT at module top-level. Module imports are resolved by Node before
// NestFactory.create() runs, which is when ConfigModule actually loads the
// .env file — so a top-level `nodemailer.createTransport(...)` call would
// capture `undefined` credentials permanently and every send would fail
// silently (no error thrown, nothing shown in Brevo's activity logs).
let transporter: nodemailer.Transporter | null = null;

const getTransporter = () => {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: 'smtp-relay.brevo.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.BREVO_SMTP_USER, // from Brevo dashboard → SMTP & API
        pass: process.env.BREVO_SMTP_KEY, // Brevo SMTP key, NOT your account password
      },
    });
  }
  return transporter;
};

export const sendEmail = async (to: string, subject: string, html: string) => {
  if (!process.env.BREVO_SMTP_USER || !process.env.BREVO_SMTP_KEY) {
    console.warn('Email not sent — BREVO_SMTP_USER/BREVO_SMTP_KEY not configured');
    return;
  }
  try {
    await getTransporter().sendMail({
      // Must be an email address verified in Brevo (Brevo → Senders & IP → Senders)
      from: process.env.EMAIL_FROM || 'White Label Backoffice <noreply@devisgon.com>',
      to,
      subject,
      html,
    });
  } catch (error) {
    console.warn(`Failed to send email to ${to}:`, (error as Error).message);
  }
};

export const generateOtp = (): string => {
  // 6-digit numeric OTP, e.g. "482913"
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const emailVerificationOtpEmail = (otp: string) => `
  <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto;">
    <h2>Verify Your Email</h2>
    <p>Use the code below to verify your email address. It expires in 10 minutes.</p>
    <p style="font-size: 28px; font-weight: bold; letter-spacing: 6px;">${otp}</p>
    <p>If you didn't create this account, you can ignore this email.</p>
  </div>
`;

export const passwordResetOtpEmail = (otp: string) => `
  <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto;">
    <h2>Reset Your Password</h2>
    <p>Use the code below to reset your password. It expires in 10 minutes.</p>
    <p style="font-size: 28px; font-weight: bold; letter-spacing: 6px;">${otp}</p>
    <p>If you didn't request this, you can safely ignore this email.</p>
  </div>
`;