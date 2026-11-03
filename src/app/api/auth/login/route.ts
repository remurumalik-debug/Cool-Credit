import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { verifyPassword, createToken, setSessionCookie, checkRateLimit } from '@/lib/auth';
import { recordAudit } from '@/lib/audit';

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') || 'local';
    if (!checkRateLimit(`login_${ip}`, 8, 60000)) {
      return NextResponse.json(
        { error: 'Too many login attempts. Please wait 1 minute before trying again.' },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
    }

    const db = await getDb();
    const user = await db.collection('users').findOne({ email: email.toLowerCase().trim() });

    if (!user) {
      return NextResponse.json({ error: 'Invalid email address or password.' }, { status: 401 });
    }

    if (!user.active) {
      return NextResponse.json({ error: 'This account has been deactivated. Please contact Quantro support.' }, { status: 403 });
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
  } catch (err: any) {
    console.error('Login error:', err);
    return NextResponse.json({ error: 'An error occurred during login. Please try again.' }, { status: 500 });
  }
}
