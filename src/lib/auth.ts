import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { UserRole } from './types';

const COOKIE_NAME = 'coolcredit_session';

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET?.trim();

  if (!secret || secret.length < 32) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('JWT_SECRET must be configured with at least 32 characters in production.');
    }

    return 'coolcredit_dev_jwt_secret_lokoja_pilot';
  }

  return secret;
}

export function assertAuthConfiguration(): void {
  getJwtSecret();
}

export interface SessionPayload {
  userId: string;
  email: string;
  name: string;
  role: UserRole;
  eligible: boolean;
  bankName?: string;
  accountNumber?: string;
}

// Simple in-memory sliding window rate limiter
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(key: string, maxRequests = 10, windowMs = 60000): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(key);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (entry.count >= maxRequests) {
    return false;
  }

  entry.count += 1;
  return true;
}

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function createToken(payload: SessionPayload): string {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: '7d' });
}

export function verifyToken(token: string): SessionPayload | null {
  try {
    return jwt.verify(token, getJwtSecret()) as SessionPayload;
  } catch {
    return null;
  }
}

export function getSessionFromCookies(): SessionPayload | null {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;
    return verifyToken(token);
  } catch {
    return null;
  }
}

export function getSessionFromRequest(req: NextRequest): SessionPayload | null {
  const cookie = req.cookies.get(COOKIE_NAME)?.value;
  if (!cookie) {
    // Check Authorization header as fallback
    const authHeader = req.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return verifyToken(authHeader.substring(7));
    }
    return null;
  }
  return verifyToken(cookie);
}

export function setSessionCookie(res: NextResponse, token: string): void {
  res.cookies.set({
    name: COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60, // 7 days
  });
}

export function clearSessionCookie(res: NextResponse): void {
  res.cookies.set({
    name: COOKIE_NAME,
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
}

/**
 * Server-side role enforcement helper.
 * If user does not match allowed roles, returns a 401 or 403 response.
 */
export function requireRole(
  req: NextRequest,
  allowedRoles: UserRole[]
): { session: SessionPayload | null; errorResponse?: NextResponse } {
  const session = getSessionFromRequest(req);
  if (!session) {
    return {
      session: null,
      errorResponse: NextResponse.json(
        { error: 'Authentication required. Please log in.' },
        { status: 401 }
      ),
    };
  }

  if (!allowedRoles.includes(session.role)) {
    return {
      session,
      errorResponse: NextResponse.json(
        {
          error: `Access denied. Role '${session.role}' is not authorized for this action. Allowed: ${allowedRoles.join(', ')}`,
        },
        { status: 403 }
      ),
    };
  }

  return { session };
}
