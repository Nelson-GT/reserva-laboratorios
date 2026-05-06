import { prisma } from './prisma';

const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export async function generatePublicId(): Promise<string> {
  while (true) {
    const suffix = Array.from(
      { length: 6 },
      () => CHARS[Math.floor(Math.random() * CHARS.length)]
    ).join('');
    const candidate = `PC-${suffix}`;
    const exists = await prisma.computer.findUnique({ where: { publicId: candidate } });
    if (!exists) return candidate;
  }
}
