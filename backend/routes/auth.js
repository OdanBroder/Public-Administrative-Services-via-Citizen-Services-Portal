import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import auth from '../middleware/auth.js';
import { validateEmail, validatePassword } from '../utils/validators.js';
import { google } from 'googleapis';
import nodemailer from 'nodemailer';
import { sendPasswordResetEmail, sendWelcomeEmail } from '../services/emailService.js';

const router = express.Router();

// Register
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, firstName, lastName } = req.body;

    // Validate input
    if (!username || !email || !password || !firstName || !lastName) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    if (!validatePassword(password)) {
      return res.status(400).json({ 
        error: 'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character' 
      });
    }

    // Check if user already exists
    const existingUser = await User.findByEmail(email) || await User.findByUsername(username);
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Create new user
    const user = await User.create({
      username,
      email,
      password,
      firstName,
      lastName
    });

    // Send welcome email
    try {
      await sendWelcomeEmail(email, firstName);
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
      // Continue with registration even if welcome email fails
    }

    // Generate tokens
    const accessToken = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
      expiresIn: '15m'
    });

    const refreshToken = jwt.sign({ userId: user.id }, process.env.JWT_REFRESH_SECRET, {
      expiresIn: '7d'
    });

    // Store refresh token in user record
    await user.update({ refreshToken });

    res.status(201).json({
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      }
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate tokens
    const accessToken = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
      expiresIn: '15m'
    });

    const refreshToken = jwt.sign({ userId: user.id }, process.env.JWT_REFRESH_SECRET, {
      expiresIn: '7d'
    });

    // Store refresh token in user record
    await user.update({ refreshToken });

    res.json({
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      }
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Logout
router.post('/logout', auth, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.userId);
    if (user) {
      await user.update({ refreshToken: null });
    }
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Refresh Token
router.post('/refresh-token', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token is required' });
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    
    // Find user
    const user = await User.findByPk(decoded.userId);
    if (!user || user.refreshToken !== refreshToken) {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    // Generate new tokens
    const accessToken = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
      expiresIn: '15m'
    });

    const newRefreshToken = jwt.sign({ userId: user.id }, process.env.JWT_REFRESH_SECRET, {
      expiresIn: '7d'
    });

    // Update refresh token
    await user.update({ refreshToken: newRefreshToken });

    res.json({
      accessToken,
      refreshToken: newRefreshToken
    });
  } catch (error) {
    res.status(401).json({ error: 'Invalid refresh token' });
  }
});

// Get profile
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const { password, refreshToken, ...userWithoutSensitiveData } = user.toJSON();
    res.json(userWithoutSensitiveData);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update profile
router.patch('/profile', auth, async (req, res) => {
  const updates = Object.keys(req.body);
  const allowedUpdates = ['firstName', 'lastName', 'email', 'password'];
  const isValidOperation = updates.every(update => allowedUpdates.includes(update));

  if (!isValidOperation) {
    return res.status(400).json({ error: 'Invalid updates' });
  }

  try {
    const user = await User.findByPk(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // If email is being updated, check if it's already in use
    if (updates.includes('email')) {
      const existingUser = await User.findByEmail(req.body.email);
      if (existingUser && existingUser.id !== user.id) {
        return res.status(400).json({ error: 'Email already in use' });
      }
    }

    // Update user
    updates.forEach(update => user[update] = req.body[update]);
    await user.save();

    const { password, refreshToken, ...userWithoutSensitiveData } = user.toJSON();
    res.json(userWithoutSensitiveData);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Change password
router.post('/change-password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }

    const user = await User.findByPk(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Validate new password
    if (!validatePassword(newPassword)) {
      return res.status(400).json({ 
        error: 'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character' 
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Request password reset
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const user = await User.findByEmail(email);
    if (!user) {
      // Return success even if user doesn't exist for security
      return res.json({ message: 'If an account exists, a password reset email has been sent' });
    }

    // Generate password reset token
    const resetToken = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
      expiresIn: '1h'
    });

    // Store reset token in user record
    await user.update({ resetToken });

    // Send password reset email
    try {
      await sendPasswordResetEmail(email, resetToken);
    } catch (emailError) {
      console.error('Failed to send password reset email:', emailError);
      return res.status(500).json({ error: 'Failed to send password reset email' });
    }

    res.json({ message: 'If an account exists, a password reset email has been sent' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Reset password
router.post('/reset-password', async (req, res) => {
  try {
    const { resetToken, newPassword } = req.body;

    if (!resetToken || !newPassword) {
      return res.status(400).json({ error: 'Reset token and new password are required' });
    }

    // Verify reset token
    const decoded = jwt.verify(resetToken, process.env.JWT_SECRET);
    
    // Find user
    const user = await User.findByPk(decoded.userId);
    if (!user || user.resetToken !== resetToken) {
      return res.status(401).json({ error: 'Invalid or expired reset token' });
    }

    // Validate new password
    if (!validatePassword(newPassword)) {
      return res.status(400).json({ 
        error: 'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character' 
      });
    }

    // Update password and clear reset token
    user.password = newPassword;
    user.resetToken = null;
    await user.save();

    res.json({ message: 'Password has been reset successfully' });
  } catch (error) {
    res.status(401).json({ error: 'Invalid or expired reset token' });
  }
});

export default router; 