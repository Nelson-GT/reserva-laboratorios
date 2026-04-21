import { randomInt } from 'crypto';
import { prisma } from './prisma';

export function generateCode(): string {
  return randomInt(100000, 999999).toString();
}

/** Invalida OTPs anteriores del mismo usuario/purpose y crea uno nuevo. */
export async function createOtp(userId: string, purpose: string): Promise<string> {
  // Invalidar códigos anteriores no usados
  await prisma.otpCode.updateMany({
    where: { userId, purpose, used: false },
    data: { used: true },
  });

  const code = generateCode();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min

  await prisma.otpCode.create({
    data: { userId, code, purpose, expiresAt },
  });

  return code;
}

/** Verifica el código y lo marca como usado si es válido. */
export async function verifyOtp(
  userId: string,
  code: string,
  purpose: string
): Promise<boolean> {
  const otp = await prisma.otpCode.findFirst({
    where: {
      userId,
      code,
      purpose,
      used: false,
      expiresAt: { gt: new Date() },
    },
  });

  if (!otp) return false;

  await prisma.otpCode.update({
    where: { id: otp.id },
    data: { used: true },
  });

  return true;
}
