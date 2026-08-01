import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { getOne, insertAndGetId } from './db.js';
import { User } from '../types.js';

const JWT_SECRET = process.env.JWT_SECRET || 'generative-quiz-app-secret-jwt-key-2026';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    username: string;
    email: string;
  };
}

export function generateToken(user: { id: number; username: string; email: string }): string {
  return jwt.sign(
    { id: user.id, username: user.username, email: user.email },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    return res.status(401).json({ error: 'Access token required. Please login.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: number; username: string; email: string };
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired token. Please log in again.' });
  }
}

export async function registerUser(username: string, email: string, password: string): Promise<{ token: string; user: User }> {
  // Validate input
  if (!username || !email || !password) {
    throw new Error('Username, email, and password are required');
  }

  if (password.length < 6) {
    throw new Error('Password must be at least 6 characters long');
  }

  // Check if user already exists
  const existingUser = await getOne<{ id: number }>('SELECT id FROM users WHERE username = ? OR email = ?', [username, email]);
  if (existingUser) {
    throw new Error('User with this username or email already exists');
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);
  const createdAt = new Date().toISOString();

  const id = await insertAndGetId(
    'INSERT INTO users (username, email, password_hash, created_at) VALUES (?, ?, ?, ?)',
    [username.trim(), email.trim().toLowerCase(), passwordHash, createdAt]
  );

  const user: User = {
    id,
    username: username.trim(),
    email: email.trim().toLowerCase(),
    created_at: createdAt
  };

  const token = generateToken(user);

  return { token, user };
}

export async function loginUser(emailOrUsername: string, password: string): Promise<{ token: string; user: User }> {
  if (!emailOrUsername || !password) {
    throw new Error('Email/Username and password are required');
  }

  const searchTerm = emailOrUsername.trim().toLowerCase();
  const dbUser = await getOne<{ id: number; username: string; email: string; password_hash: string; created_at: string }>(
    'SELECT * FROM users WHERE LOWER(email) = ? OR LOWER(username) = ?',
    [searchTerm, searchTerm]
  );

  if (!dbUser) {
    throw new Error('Invalid email/username or password');
  }

  const isPasswordValid = await bcrypt.compare(password, dbUser.password_hash);
  if (!isPasswordValid) {
    throw new Error('Invalid email/username or password');
  }

  const user: User = {
    id: dbUser.id,
    username: dbUser.username,
    email: dbUser.email,
    created_at: dbUser.created_at
  };

  const token = generateToken(user);

  return { token, user };
}
