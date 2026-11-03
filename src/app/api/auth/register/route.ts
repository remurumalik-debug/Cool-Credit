import { NextRequest, NextResponse } from 'next/server';
import { getDb, ensureIndexes } from '@/lib/db';
import { hashPassword, createToken, setSessionCookie, checkRateLimit } from '@/lib/auth';
import { recordAudit } from '@/lib/audit';

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') || 'local';
    if (!checkRateLimit(`register_${ip}`, 5, 60000)) {
      return NextResponse.json(
        { error: 'Too many registration requests. Please wait a minute and try again.' },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { name, email, password, phone, bankName, accountNumber, location, consent } = body;

    // Strict validation
    if (!name || typeof name !== 'string' || name.trim().length < 3) {
      return NextResponse.json({ error: 'Full name is required (minimum 3 characters).' }, { status: 400 });
    }

    if (!email || typeof email !== 'string' || !email.includes('@')) {
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
    if (accountNumber && !/^\d{10}$/.test(accountNumber.trim())) {
      return NextResponse.json({ error: 'Nigerian NUBAN account number must be exactly 10 digits.' }, { status: 400 });
    }

    await ensureIndexes();
    const db = await getDb();

    // Check if email already registered
    const existing = await db.collection('users').findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return NextResponse.json({ error: 'An account with this email address already exists.' }, { status: 409 });
    }

    const hash = await hashPassword(password);
    const now = new Date().toISOString();

    const newUser = {
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone.trim(),
      role: 'technician' as const, // Technicians self-register; staff roles are never self-selected
      hash,
      bank: {
        bankName: bankName?.trim() || '',
        accountNumber: accountNumber?.trim() || '',
      },
      location: location?.trim() || 'Lokoja, Kogi State',
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
  } catch (err: any) {
    console.error('Registration error:', err);
    return NextResponse.json({ error: 'An error occurred during registration. Please try again.' }, { status: 500 });
  }
}
