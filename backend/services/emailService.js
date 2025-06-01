import nodemailer from 'nodemailer';
import config from '../config/config.js';

const transporter = nodemailer.createTransport({
  host: config.email.smtp.host,
  port: config.email.smtp.port,
  secure: config.email.smtp.secure,
  auth: {
    user: config.email.smtp.auth.user,
    pass: config.email.smtp.auth.pass
  }
});

export const sendPasswordResetEmail = async (email, resetToken) => {
  const resetUrl = `${config.frontendUrl}/reset-password?token=${resetToken}`;
  
  const mailOptions = {
    from: config.email.from,
    to: email,
    subject: 'Password Reset Request',
    html: `
      <h1>Password Reset Request</h1>
      <p>You requested a password reset. Click the link below to reset your password:</p>
      <a href="${resetUrl}">Reset Password</a>
      <p>This link will expire in 1 hour.</p>
      <p>If you didn't request this, please ignore this email.</p>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error('Failed to send password reset email');
  }
};

export const sendWelcomeEmail = async (email, firstName) => {
  const mailOptions = {
    from: config.email.from,
    to: email,
    subject: 'Welcome to Our Platform',
    html: `
      <h1>Welcome ${firstName}!</h1>
      <p>Thank you for registering with our platform.</p>
      <p>We're excited to have you on board!</p>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Error sending welcome email:', error);
    // Don't throw error for welcome email as it's not critical
  }
}; 