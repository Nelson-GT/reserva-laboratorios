import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const { status } = body;

  const reservation = await prisma.reservation.findUnique({ where: { id } });
  if (!reservation) {
    return NextResponse.json({ error: 'Reserva no encontrada' }, { status: 404 });
  }

  // El dueño solo puede cancelar sus propias reservas pendientes/aprobadas
  if (session.role !== 'admin') {
    if (reservation.userId !== session.userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }
    if (status !== 'cancelled') {
      return NextResponse.json({ error: 'Solo puedes cancelar tus reservas' }, { status: 403 });
    }
    if (!['pending', 'approved'].includes(reservation.status)) {
      return NextResponse.json(
        { error: 'Solo se pueden cancelar reservas pendientes o aprobadas' },
        { status: 400 }
      );
    }
  }

  const adminStatuses = ['approved', 'rejected', 'cancelled', 'finished'];
  if (session.role === 'admin' && !adminStatuses.includes(status)) {
    return NextResponse.json({ error: 'Estado inválido' }, { status: 400 });
  }

  const updated = await prisma.reservation.update({
    where: { id },
    data: { status },
    include: {
      user: { select: { fullName: true, email: true } },
      laboratory: { select: { name: true } },
    },
  });

  return NextResponse.json(updated);
}
