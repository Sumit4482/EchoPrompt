import nodemailer from 'nodemailer';
import type Transporter from 'nodemailer/lib/mailer';

function isSmtpConfigured(): boolean {
  return Boolean(
    process.env.SMTP_HOST?.trim() &&
      process.env.SMTP_USER?.trim() &&
      process.env.SMTP_PASS?.trim(),
  );
}

let transporter: Transporter | null = null;

function getTransporter(): Transporter | null {
  if (!isSmtpConfigured()) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  return transporter;
}

export async function sendPasswordResetEmail(to: string, resetToken: string): Promise<boolean> {
  const mailer = getTransporter();
  const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');
  const resetUrl = `${frontendUrl}/reset-password?token=${encodeURIComponent(resetToken)}`;
  const from = process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@echoprompt.app';

  const html = `
    <p>You requested a password reset for EchoPrompt.</p>
    <p><a href="${resetUrl}">Reset your password</a></p>
    <p>This link expires in 1 hour. If you did not request this, ignore this email.</p>
    <p style="color:#666;font-size:12px">Or paste this token on the reset page: ${resetToken}</p>
  `;

  if (!mailer) {
    console.warn('SMTP not configured — password reset email not sent.');
    return false;
  }

  try {
    await mailer.sendMail({
      from,
      to,
      subject: 'EchoPrompt password reset',
      html,
      text: `Reset your password: ${resetUrl}`,
    });
    console.log(`Password reset email sent to ${to}`);
    return true;
  } catch (error) {
    console.error('SMTP send failed:', error);
    return false;
  }
}

export function isEmailConfigured(): boolean {
  return isSmtpConfigured();
}
