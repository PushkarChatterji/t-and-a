import nodemailer from 'nodemailer';

function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST ?? 'smtp.ethereal.email',
    port: parseInt(process.env.SMTP_PORT ?? '587', 10),
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

export async function sendVerificationEmail(to: string, token: string): Promise<void> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  const link = `${appUrl}/verify-email?token=${token}`;
  const transporter = createTransporter();
  await transporter.sendMail({
    from: process.env.EMAIL_FROM ?? 'noreply@eduportal.com',
    to,
    subject: 'Verify your EduPortal account',
    html: `
      <h2>Welcome to EduPortal!</h2>
      <p>Please verify your email address by clicking the link below:</p>
      <a href="${link}" style="display:inline-block;padding:12px 24px;background:#4F46E5;color:#fff;text-decoration:none;border-radius:6px;">Verify Email</a>
      <p>This link expires in 24 hours.</p>
      <p>If you did not create an account, ignore this email.</p>
    `,
  });
}

export async function sendPasswordResetEmail(to: string, token: string): Promise<void> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  const link = `${appUrl}/reset-password?token=${token}`;
  const transporter = createTransporter();
  await transporter.sendMail({
    from: process.env.EMAIL_FROM ?? 'noreply@eduportal.com',
    to,
    subject: 'Reset your EduPortal password',
    html: `
      <h2>Password Reset</h2>
      <p>Click the link below to reset your password. This link expires in 1 hour.</p>
      <a href="${link}" style="display:inline-block;padding:12px 24px;background:#4F46E5;color:#fff;text-decoration:none;border-radius:6px;">Reset Password</a>
      <p>If you did not request a password reset, ignore this email.</p>
    `,
  });
}
