import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');

  // Admin ve todas; los demás solo ven las suyas
  const where = {
    ...(session.role !== 'admin' ? { userId: session.userId } : {}),
    ...(status ? { status: status as any } : {}),
  };

  const reservations = await prisma.reservation.findMany({
    where,
    include: {
      user: {
        select: { fullName: true, cedula: true, email: true, role: true },
      },
      laboratory: { select: { name: true } },
      computerReservations: {
        include: { computer: { select: { number: true } } },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(reservations);
}
