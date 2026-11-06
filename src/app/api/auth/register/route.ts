import { NextRequest, NextResponse } from 'next/server';
import { getDb, ensureIndexes, MongoConfigurationError } from '@/lib/db';
import {
  assertAuthConfiguration,
  hashPassword,
  createToken,
  setSessionCookie,
  checkRateLimit,
} from '@/lib/auth';
import { recordAudit } from '@/lib/audit';

function logRegistrationFailure(err: unknown): void {
  if (err instanceof Error) {
    const code = 'code' in err && (typeof err.code === 'string' || typeof err.code === 'number')
      ? err.code
      : undefined;
    console.error('Registration request failed', { name: err.name, code });
    return;
  }

  console.error('Registration request failed', { name: 'UnknownError' });
}

function getRegistrationFailureMessage(err: unknown): string {
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
  return 'Registration is temporarily unavailable. Check the server configuration and try again.';
}

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') || 'local';
    if (!checkRateLimit(`register_${ip}`, 5, 60000)) {
      return NextResponse.json(
        { error: 'Too many registration requests. Please wait a minute and try again.' },
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
      return NextResponse.json({ error: 'Registration details are required.' }, { status: 400 });
    }

    const { name, email, password, phone, bankName, accountNumber, location, consent } =
      body as Record<string, unknown>;

    // Strict validation
    if (!name || typeof name !== 'string' || name.trim().length < 3) {
      return NextResponse.json({ error: 'Full name is required (minimum 3 characters).' }, { status: 400 });
    }

    if (
      !email ||
      typeof email !== 'string' ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
    ) {
      return NextResponse.json({ error: 'A valid email address is required.' }, { status: 400 });
    }

    if (!password || typeof password !== 'string' || password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters long.' }, { status: 400 });
    }

    if (!phone || typeof phone !== 'string' || phone.trim().length < 10) {
      return NextResponse.json({ error: 'A valid 10-11 digit Nigerian phone number is required.' }, { status: 400 });
    }

    if (!consent) {
      return NextResponse.json(
        { error: 'You must consent to data processing under the Nigeria Data Protection Act.' },
        { status: 400 }
      );
    }

    // Bank validation for technicians
    if (
      accountNumber &&
      (typeof accountNumber !== 'string' || !/^\d{10}$/.test(accountNumber.trim()))
    ) {
      return NextResponse.json({ error: 'Nigerian NUBAN account number must be exactly 10 digits.' }, { status: 400 });
    }

    try {
      assertAuthConfiguration();
    } catch {
      console.error('Registration unavailable: JWT_SECRET is missing or shorter than 32 characters.');
      return NextResponse.json(
        { error: 'Registration is not configured on the server. Please contact the administrator.' },
        { status: 503 }
      );
    }

    await ensureIndexes();
    const db = await getDb();
    const normalizedEmail = email.trim().toLowerCase();

    // Check if email already registered
    const existing = await db.collection('users').findOne({ email: normalizedEmail });
    if (existing) {
      return NextResponse.json({ error: 'An account with this email address already exists.' }, { status: 409 });
    }

    const hash = await hashPassword(password);
    const now = new Date().toISOString();

    const newUser = {
      name: name.trim(),
      email: normalizedEmail,
      phone: phone.trim(),
      role: 'technician' as const, // Technicians self-register; staff roles are never self-selected
      hash,
      bank: {
        bankName: typeof bankName === 'string' ? bankName.trim() : '',
        accountNumber: typeof accountNumber === 'string' ? accountNumber.trim() : '',
      },
      location: typeof location === 'string' ? location.trim() || 'Lokoja, Kogi State' : 'Lokoja, Kogi State',
      active: true,
      eligible: false, // Per Section 6.6: Ineligible until admin verifies training/certification
      consentAt: now,
      createdAt: now,
    };

    const result = await db.collection('users').insertOne(newUser);
    const userId = result.insertedId.toString();

    // Audit log
    await recordAudit({
      actor: { id: userId, name: newUser.name, role: 'technician' },
      action: 'TECHNICIAN_REGISTERED',
      target: { type: 'user', id: userId },
      beforeAfterSummary: `Self-registered technician with bank: ${newUser.bank.bankName} (${newUser.bank.accountNumber})`,
    });

    const sessionPayload = {
      userId,
      email: newUser.email,
      name: newUser.name,
      role: newUser.role,
      eligible: newUser.eligible,
      bankName: newUser.bank.bankName,
      accountNumber: newUser.bank.accountNumber,
    };

    const token = createToken(sessionPayload);
    const response = NextResponse.json({
      success: true,
      user: sessionPayload,
      message: 'Registration successful. Account is pending certification verification before recoveries can be logged.',
    });

    setSessionCookie(response, token);
    return response;
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'code' in err && err.code === 11000) {
      return NextResponse.json(
        { error: 'An account with this email address already exists.' },
        { status: 409 }
      );
    }

    logRegistrationFailure(err);
    return NextResponse.json(
      { error: getRegistrationFailureMessage(err) },
      { status: 503 }
    );
  }
}
