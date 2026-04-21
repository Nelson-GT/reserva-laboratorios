'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { createOtp, verifyOtp } from '@/lib/otp';
import { sendOtpEmail } from '@/lib/email';
import {
  setSession,
  setOtpPending,
  getOtpPending,
  clearOtpPending,
  clearSession,
} from '@/lib/auth';

export type ActionState = { error?: string; success?: string };

// ─── Registro ─────────────────────────────────────────────────────────────────

const registerSchema = z.object({
  cedula: z
    .string()
    .min(6, 'La cédula debe tener al menos 6 dígitos')
    .max(10, 'La cédula no puede superar 10 dígitos')
    .regex(/^\d+$/, 'La cédula solo debe contener números'),
  fullName: z
    .string()
    .min(3, 'El nombre debe tener al menos 3 caracteres')
    .max(100),
  email: z.string().email('Correo inválido'),
  password: z
    .string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres'),
  role: z.enum(['professor', 'student'], {
    errorMap: () => ({ message: 'Selecciona un rol válido' }),
  }),
});

export async function registerAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = registerSchema.safeParse({
    cedula: formData.get('cedula'),
    fullName: formData.get('fullName'),
    email: formData.get('email'),
    password: formData.get('password'),
    role: formData.get('role'),
  });

  if (!parsed.success) {
    const firstError = parsed.error.errors[0];
    return { error: firstError.message };
  }

  const { cedula, fullName, email, password, role } = parsed.data;

  const existing = await prisma.user.findFirst({
    where: { OR: [{ email }, { cedula }] },
  });

  if (existing) {
    if (existing.email === email)
      return { error: 'Este correo ya está registrado.' };
    return { error: 'Esta cédula ya está registrada.' };
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      cedula,
      fullName,
      email,
      password: hashedPassword,
      role,
      status: 'pending_email_verification',
    },
  });

  const code = await createOtp(user.id, 'register');

  try {
    await sendOtpEmail(email, code, 'register');
  } catch (err) {
    console.error('[OTP] Error enviando correo de registro — código disponible en la DB:', err);
  }

  await setOtpPending(user.id, 'register');

  redirect('/verify-otp');
}

// ─── Login ────────────────────────────────────────────────────────────────────

const loginSchema = z.object({
  email: z.string().email('Correo inválido'),
  password: z.string().min(1, 'Ingresa tu contraseña'),
});

export async function loginAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  });

  if (!parsed.success) {
    return { error: parsed.error.errors[0].message };
  }

  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || !(await bcrypt.compare(password, user.password))) {
    return { error: 'Correo o contraseña incorrectos.' };
  }

  if (!user.emailVerified) {
    // Reenviar OTP de verificación
    const code = await createOtp(user.id, 'register');
    try {
      await sendOtpEmail(email, code, 'register');
    } catch {}
    await setOtpPending(user.id, 'register');
    redirect('/verify-otp?msg=email_unverified');
  }

  if (user.status === 'pending_approval') {
    return {
      error:
        'Tu cuenta está pendiente de aprobación por el administrador. Recibirás una notificación cuando sea activada.',
    };
  }

  if (user.status === 'blocked') {
    return {
      error: 'Tu cuenta ha sido bloqueada. Contacta al administrador.',
    };
  }

  const code = await createOtp(user.id, 'login');

  try {
    await sendOtpEmail(email, code, 'login');
  } catch (err) {
    // El código igual se guarda en DB. El admin puede verlo en Prisma Studio.
    console.error('[OTP] Error enviando correo — el código sigue disponible en la DB:', err);
  }

  await setOtpPending(user.id, 'login');

  redirect('/verify-otp');
}

// ─── Verificar OTP ────────────────────────────────────────────────────────────

export async function verifyOtpAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const rawCode = (formData.get('code') as string | null) ?? '';
  const code = rawCode.replace(/\s/g, '');

  if (code.length !== 6 || !/^\d+$/.test(code)) {
    return { error: 'Ingresa el código de 6 dígitos.' };
  }

  const pending = await getOtpPending();
  if (!pending) {
    return {
      error:
        'La sesión expiró. Por favor inicia el proceso nuevamente.',
    };
  }

  const { userId, purpose } = pending;
  const valid = await verifyOtp(userId, code, purpose);

  if (!valid) {
    return { error: 'Código incorrecto o expirado.' };
  }

  await clearOtpPending();

  if (purpose === 'register') {
    await prisma.user.update({
      where: { id: userId },
      data: { emailVerified: true, status: 'pending_approval' },
    });
    redirect('/login?verified=1');
  } else {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return { error: 'Usuario no encontrado.' };

    await setSession({ userId: user.id, role: user.role, email: user.email });
    redirect('/dashboard');
  }
}

// ─── Reenviar OTP ─────────────────────────────────────────────────────────────

export async function resendOtpAction(
  _prevState: ActionState,
  _formData: FormData
): Promise<ActionState> {
  const pending = await getOtpPending();
  if (!pending) {
    return { error: 'La sesión expiró. Reinicia el proceso.' };
  }

  const user = await prisma.user.findUnique({ where: { id: pending.userId } });
  if (!user) return { error: 'Usuario no encontrado.' };

  const code = await createOtp(user.id, pending.purpose);

  try {
    await sendOtpEmail(user.email, code, pending.purpose);
    await setOtpPending(user.id, pending.purpose);
    return { success: 'Código reenviado. Revisa tu correo.' };
  } catch {
    return { error: 'No se pudo reenviar el código.' };
  }
}

// ─── Logout ───────────────────────────────────────────────────────────────────

export async function logoutAction(): Promise<void> {
  await clearSession();
  redirect('/login');
}
