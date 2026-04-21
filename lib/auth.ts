import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET ?? 'fallback-dev-secret-change-in-production'
);

export type SessionPayload = {
  userId: string;
  role: 'admin' | 'professor' | 'student';
  email: string;
};

export type OtpPendingPayload = {
  userId: string;
  purpose: 'register' | 'login';
};

// ─── Session ─────────────────────────────────────────────────────────────────

export async function createSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secret);
}

export async function verifyToken<T>(token: string): Promise<T | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as T;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('session')?.value;
  if (!token) return null;
  return verifyToken<SessionPayload>(token);
}

export async function setSession(payload: SessionPayload): Promise<void> {
  const token = await createSessionToken(payload);
  const cookieStore = await cookies();
  cookieStore.set('session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60,
    path: '/',
  });
}

export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete('session');
}

// ─── OTP pending state (cookie corto plazo) ───────────────────────────────────

export async function setOtpPending(
  userId: string,
  purpose: 'register' | 'login'
): Promise<void> {
  const token = await new SignJWT({ userId, purpose } as Record<string, unknown>)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('15m')
    .sign(secret);

  const cookieStore = await cookies();
  cookieStore.set('otp_pending', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 15 * 60,
    path: '/',
  });
}

export async function getOtpPending(): Promise<OtpPendingPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('otp_pending')?.value;
  if (!token) return null;
  return verifyToken<OtpPendingPayload>(token);
}

export async function clearOtpPending(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete('otp_pending');
}
