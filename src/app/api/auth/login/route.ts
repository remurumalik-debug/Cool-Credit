import { NextRequest, NextResponse } from 'next/server';
import { getDb, MongoConfigurationError } from '@/lib/db';
import {
  assertAuthConfiguration,
  verifyPassword,
  createToken,
  setSessionCookie,
  checkRateLimit,
} from '@/lib/auth';
import { recordAudit } from '@/lib/audit';

function logLoginFailure(err: unknown): void {
  if (err instanceof Error) {
    const code = 'code' in err && (typeof err.code === 'string' || typeof err.code === 'number')
      ? err.code
      : undefined;
    console.error('Login request failed', { name: err.name, code });
    return;
  }

  console.error('Login request failed', { name: 'UnknownError' });
}

function getLoginFailureMessage(err: unknown): string {
  if (err instanceof MongoConfigurationError) {
    return 'The database configuration is invalid. Check MONGODB_URI and MONGODB_DB_NAME.';
  }

  const name = err instanceof Error ? err.name : '';
  const code =
    err && typeof err === 'object' && 'code' in err ? err.code : undefined;

  if (name === 'MongoParseError') {
    return 'The database connection settings are invalid. Please contact the administrator.';
  }
  if (name === 'MongoServerSelectionError' || name === 'MongoNetworkError') {
    return 'The database is unreachable. Please try again later or contact the administrator.';
  }
  if (name === 'MongoServerError' && (code === 18 || code === 8000)) {
    return 'The database rejected its credentials. Please contact the administrator.';
  }
  return 'Sign-in is temporarily unavailable. Check the server configuration and try again.';
}

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') || 'local';
    if (!checkRateLimit(`login_${ip}`, 8, 60000)) {
      return NextResponse.json(
        { error: 'Too many login attempts. Please wait 1 minute before trying again.' },
        { status: 429 }
      );
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Request body must be valid JSON.' }, { status: 400 });
    }

    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
    }

    const { email, password } = body as Record<string, unknown>;

    if (typeof email !== 'string' || typeof password !== 'string' || !email.trim() || !password) {
      return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 });
    }

    try {
      assertAuthConfiguration();
    } catch {
      console.error('Login unavailable: JWT_SECRET is missing or shorter than 32 characters.');
      return NextResponse.json(
        { error: 'Sign-in is not configured on the server. Please contact the administrator.' },
        { status: 503 }
      );
    }

    const db = await getDb();
    const user = await db.collection('users').findOne({ email: normalizedEmail });

    if (!user) {
      return NextResponse.json({ error: 'Invalid email address or password.' }, { status: 401 });
    }

    if (!user.active) {
      return NextResponse.json({ error: 'This account has been deactivated. Please contact Quantro support.' }, { status: 403 });
    }

    if (typeof user.hash !== 'string' || !/^\$2[aby]\$\d{2}\$/.test(user.hash)) {
      return NextResponse.json({ error: 'Invalid email address or password.' }, { status: 401 });
    }

    const isValid = await verifyPassword(password, user.hash);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid email address or password.' }, { status: 401 });
    }

    const sessionPayload = {
      userId: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
      eligible: !!user.eligible,
      bankName: user.bank?.bankName || '',
      accountNumber: user.bank?.accountNumber || '',
    };

    const token = createToken(sessionPayload);
    const response = NextResponse.json({
      success: true,
      user: sessionPayload,
    });

    setSessionCookie(response, token);

    await recordAudit({
      actor: { id: sessionPayload.userId, name: sessionPayload.name, role: sessionPayload.role },
      action: 'USER_LOGIN',
      target: { type: 'user', id: sessionPayload.userId },
      beforeAfterSummary: `User logged in from ${ip}`,
    });

    return response;
  } catch (err: unknown) {
    logLoginFailure(err);
    return NextResponse.json(
      { error: getLoginFailureMessage(err) },
      { status: 503 }
    );
  }
}
