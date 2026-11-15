import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { User, IUser } from '../models/User.js';
import { Otp } from '../models/Otp.js';
import { ENV } from '../config/env.js';
import { AuthRequest } from '../middleware/auth.js';
import { sendPasswordResetEmail, sendOtpEmail } from '../services/emailService.js';

const generateToken = (user: IUser) => {
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      role: user.role,
    },
    ENV.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

const sendAuthResponse = (res: Response, user: IUser, statusCode = 200, message = 'Success') => {
  const token = generateToken(user);

  res.cookie('token', token, {
    httpOnly: true,
    secure: ENV.NODE_ENV === 'production',
    sameSite: ENV.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  res.status(statusCode).json({
    success: true,
    message,
    token,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      role: user.role,
      addresses: user.addresses || [],
    },
  });
};

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, phone } = req.body;

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      res.status(400).json({ success: false, message: 'An account with this email already exists.' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      passwordHash,
      phone: phone?.trim() || '',
      role: 'customer',
      addresses: [],
    });

    sendAuthResponse(res, user, 201, 'Account created successfully!');
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Registration failed' });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user || !user.passwordHash) {
      res.status(400).json({ success: false, message: 'Invalid email or password.' });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      res.status(400).json({ success: false, message: 'Invalid email or password.' });
      return;
    }

    sendAuthResponse(res, user, 200, 'Welcome back!');
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Login failed' });
  }
};

export const googleAuth = async (req: Request, res: Response): Promise<void> => {
  try {
    let { email, name, googleId, credential } = req.body;

    // If client passes a Google ID token from Google Identity Services
    if (credential && (!email || !googleId)) {
      try {
        const tokenRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`);
        if (tokenRes.ok) {
          const payload: any = await tokenRes.json();
          email = payload.email;
          name = payload.name;
          googleId = payload.sub;
        }
      } catch (tokenErr) {
        // Fallback to decode JWT payload safely
        try {
          const parts = credential.split('.');
          if (parts.length === 3) {
            const decoded = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf-8'));
            if (decoded.email) {
              email = decoded.email;
              name = decoded.name;
              googleId = decoded.sub;
            }
          }
        } catch {}
      }
    }

    if (!email) {
      res.status(400).json({ success: false, message: 'Google authentication data missing' });
      return;
    }

    let user = await User.findOne({ email: email.toLowerCase().trim() });

    if (!user) {
      const isStoreAdmin = ['traditionbytia@gmail.com', 'traitionbytia@gmail.com'].includes(email.toLowerCase().trim());
      user = await User.create({
        name: name || email.split('@')[0],
        email: email.toLowerCase().trim(),
        googleId,
        role: isStoreAdmin ? 'admin' : 'customer',
        addresses: [],
      });
    } else {
      if (!user.googleId && googleId) {
        user.googleId = googleId;
      }
      if (['traditionbytia@gmail.com', 'traitionbytia@gmail.com'].includes(email.toLowerCase().trim())) {
        user.role = 'admin';
      }
      await user.save();
    }

    sendAuthResponse(res, user, 200, 'Signed in with Google successfully');
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Google authentication failed' });
  }
};

export const logout = (req: Request, res: Response): void => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: ENV.NODE_ENV === 'production',
    sameSite: ENV.NODE_ENV === 'production' ? 'none' : 'lax',
  });
  res.status(200).json({ success: true, message: 'Logged out successfully' });
};

export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Not authenticated' });
    return;
  }
  res.status(200).json({
    success: true,
    user: {
      _id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      phone: req.user.phone || '',
      role: req.user.role,
      addresses: req.user.addresses || [],
    },
  });
};

export const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }
    const { name, phone } = req.body;
    if (name) req.user.name = name.trim();
    if (phone !== undefined) req.user.phone = phone.trim();

    await req.user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        _id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        phone: req.user.phone,
        role: req.user.role,
        addresses: req.user.addresses,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to update profile' });
  }
};

export const addAddress = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }
    const { name, phone, street, city, state, pincode, isDefault } = req.body;

    if (isDefault) {
      req.user.addresses.forEach((a) => (a.isDefault = false));
    }

    req.user.addresses.push({
      name,
      phone,
      street,
      city,
      state,
      pincode,
      isDefault: isDefault ?? (req.user.addresses.length === 0),
    });

    await req.user.save();

    res.status(200).json({
      success: true,
      message: 'Address saved successfully',
      addresses: req.user.addresses,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to add address' });
  }
};

export const deleteAddress = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }
    const { addressId } = req.params;
    req.user.addresses = req.user.addresses.filter(
      (a: any) => a._id?.toString() !== addressId
    );

    await req.user.save();
    res.status(200).json({
      success: true,
      message: 'Address removed successfully',
      addresses: req.user.addresses,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to delete address' });
  }
};

export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email.toLowerCase().trim() });

    if (!user) {
      // Don't leak user existence
      res.status(200).json({ success: true, message: 'If an account exists, a reset link has been sent.' });
      return;
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await user.save();

    await sendPasswordResetEmail(user.email, resetToken);

    res.status(200).json({ success: true, message: 'Password reset link sent to your email.' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Password reset request failed' });
  }
};

export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token, password } = req.body;
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: new Date() },
    });

    if (!user) {
      res.status(400).json({ success: false, message: 'Password reset token is invalid or has expired.' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(password, salt);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.status(200).json({ success: true, message: 'Password reset successful. You may now log in.' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Password reset failed' });
  }
};

// ==============================================================================
// 4-DIGIT OTP SYSTEM (ACCOUNT CREATION & LOGIN - 5 MINUTE EXPIRATION)
// ==============================================================================

export const sendSignupOtp = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({ success: false, message: 'Name, email, and password are required.' });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ success: false, message: 'Password must be at least 6 characters long.' });
      return;
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      res.status(400).json({ success: false, message: 'An account with this email already exists. Please sign in.' });
      return;
    }

    // Generate random 4-digit numeric code (1000 - 9999)
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes validity

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const registrationData = JSON.stringify({
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      phone: phone ? phone.trim() : '',
    });

    // Clean up any pending OTPs for this email
    await Otp.deleteMany({ email: normalizedEmail, purpose: 'signup' });

    // Store new OTP with 5 minute expiration
    await Otp.create({
      email: normalizedEmail,
      otp,
      purpose: 'signup',
      data: registrationData,
      expiresAt,
    });

    // Send royal branded email via Gmail SMTP
    await sendOtpEmail(normalizedEmail, otp, 'signup');

    res.status(200).json({
      success: true,
      message: `A 4-digit verification code has been sent to ${normalizedEmail}. It is valid for 5 minutes.`,
      email: normalizedEmail,
      expiresInSeconds: 300,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to send verification code.' });
  }
};

export const verifySignupOtp = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      res.status(400).json({ success: false, message: 'Email and 4-digit verification code are required.' });
      return;
    }

    const normalizedEmail = email.toLowerCase().trim();
    const record = await Otp.findOne({
      email: normalizedEmail,
      purpose: 'signup',
    });

    if (!record) {
      res.status(400).json({
        success: false,
        message: 'Verification code has expired or not found. Please request a new code.',
      });
      return;
    }

    if (new Date() > record.expiresAt) {
      await Otp.deleteOne({ _id: record._id });
      res.status(400).json({
        success: false,
        message: 'Verification code expired (valid for 5 minutes only). Please request a new code.',
      });
      return;
    }

    if (record.otp !== otp.toString().trim()) {
      res.status(400).json({ success: false, message: 'Invalid 4-digit verification code. Please check your email.' });
      return;
    }

    // Parse verified registration data
    const userData = JSON.parse(record.data || '{}');

    // Create user in MongoDB
    const user = await User.create({
      name: userData.name,
      email: normalizedEmail,
      passwordHash: userData.passwordHash,
      phone: userData.phone || '',
      role: 'customer',
    });

    // Remove used OTP
    await Otp.deleteOne({ _id: record._id });

    sendAuthResponse(res, user, 201, 'Account created and verified successfully!');
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to verify account.' });
  }
};

export const sendLoginOtp = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;
    if (!email) {
      res.status(400).json({ success: false, message: 'Email is required.' });
      return;
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      res.status(404).json({ success: false, message: 'No registered account found with this email.' });
      return;
    }

    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    await Otp.deleteMany({ email: normalizedEmail, purpose: 'login' });
    await Otp.create({
      email: normalizedEmail,
      otp,
      purpose: 'login',
      expiresAt,
    });

    await sendOtpEmail(normalizedEmail, otp, 'login');

    res.status(200).json({
      success: true,
      message: `A 4-digit login code has been sent to ${normalizedEmail} (valid for 5 minutes).`,
      email: normalizedEmail,
      expiresInSeconds: 300,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to send login code.' });
  }
};

export const verifyLoginOtp = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      res.status(400).json({ success: false, message: 'Email and 4-digit code are required.' });
      return;
    }

    const normalizedEmail = email.toLowerCase().trim();
    const record = await Otp.findOne({
      email: normalizedEmail,
      purpose: 'login',
    });

    if (!record) {
      res.status(400).json({ success: false, message: 'Login code expired or not found. Please request a new code.' });
      return;
    }

    if (new Date() > record.expiresAt) {
      await Otp.deleteOne({ _id: record._id });
      res.status(400).json({ success: false, message: 'Login code has expired (valid for 5 minutes). Please request a new code.' });
      return;
    }

    if (record.otp !== otp.toString().trim()) {
      res.status(400).json({ success: false, message: 'Invalid 4-digit code.' });
      return;
    }

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      res.status(404).json({ success: false, message: 'User account not found.' });
      return;
    }

    await Otp.deleteOne({ _id: record._id });
    sendAuthResponse(res, user, 200, 'Welcome back! Signed in with OTP.');
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Login verification failed.' });
  }
};

