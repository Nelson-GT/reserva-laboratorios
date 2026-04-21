import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const role = searchParams.get('role');

  const users = await prisma.user.findMany({
    where: {
      ...(status ? { status: status as any } : {}),
      ...(role ? { role: role as any } : {}),
      role: { not: 'admin' }, // No mostrar admins en este panel
    },
    select: {
      id: true,
      cedula: true,
      fullName: true,
      email: true,
      role: true,
      status: true,
      emailVerified: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(users);
}
