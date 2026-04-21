import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { timesOverlap } from '@/lib/reservations';

/**
 * GET /api/computers?laboratoryId=X&date=YYYY-MM-DD&startTime=HH:MM&endTime=HH:MM
 *
 * Devuelve las computadoras de un laboratorio con su disponibilidad
 * para el horario solicitado.
 */
export async function GET(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const laboratoryId = searchParams.get('laboratoryId');
  const date = searchParams.get('date');
  const startTime = searchParams.get('startTime');
  const endTime = searchParams.get('endTime');

  if (!laboratoryId) {
    return NextResponse.json(
      { error: 'laboratoryId es requerido' },
      { status: 400 }
    );
  }

  const computers = await prisma.computer.findMany({
    where: { laboratoryId },
    orderBy: { number: 'asc' },
    include:
      date && startTime && endTime
        ? {
            computerReservations: {
              where: {
                reservation: {
                  date,
                  status: { in: ['pending', 'approved'] },
                },
              },
              include: { reservation: true },
            },
          }
        : undefined,
  });

  // Marcar disponibilidad si se proporcionó horario
  const result = computers.map((c) => {
    let isOccupied = false;
    if (date && startTime && endTime && 'computerReservations' in c) {
      isOccupied = (c.computerReservations as any[]).some((cr) =>
        timesOverlap(startTime, endTime, cr.reservation.startTime, cr.reservation.endTime)
      );
    }
    return {
      id: c.id,
      number: c.number,
      laboratoryId: c.laboratoryId,
      status: c.status,
      available: c.status === 'available' && !isOccupied,
    };
  });

  return NextResponse.json(result);
}
