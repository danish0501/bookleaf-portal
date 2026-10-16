import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { generateToken, setAuthCookie, clearAuthCookie } from '../utils/token.js';

export async function login(req: Request, res: Response): Promise<void> {
  const { email, password } = req.body;

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    res.status(401).json({
      success: false,
      error: 'Invalid email or password. Please verify your credentials.',
    });
    return;
  }

  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
  if (!isPasswordValid) {
    res.status(401).json({
      success: false,
      error: 'Invalid email or password. Please verify your credentials.',
    });
    return;
  }

  const token = generateToken({
    userId: user._id.toString(),
    email: user.email,
    role: user.role,
    name: user.name,
    authorId: user.author_id,
  });

  setAuthCookie(res, token);

  res.status(200).json({
    success: true,
    message: 'Login successful',
    token, // Also return token in JSON for non-cookie API clients / mobile / curl
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      author_id: user.author_id,
      admin_id: user.admin_id,
      phone: user.phone,
      city: user.city,
      joined_date: user.joined_date,
    },
  });
}

export async function logout(req: Request, res: Response): Promise<void> {
  clearAuthCookie(res);
  res.status(200).json({
    success: true,
    message: 'Successfully logged out',
  });
}

export async function getCurrentUser(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: 'Not authenticated',
    });
    return;
  }

  res.status(200).json({
    success: true,
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      author_id: req.user.author_id,
      admin_id: req.user.admin_id,
      phone: req.user.phone,
      city: req.user.city,
      joined_date: req.user.joined_date,
    },
  });
}
