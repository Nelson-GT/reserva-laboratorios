import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const { id } = await params;

  const computer = await prisma.computer.findUnique({
    where: { id },
    include: {
      laboratory: { select: { id: true, name: true } },
      computerReservations: {
        include: {
          reservation: {
            include: {
              user: { select: { fullName: true, cedula: true, role: true } },
            },
          },
        },
        orderBy: { reservation: { date: 'desc' } },
      },
    },
  });

  if (!computer) return NextResponse.json({ error: 'Computador no encontrado' }, { status: 404 });

  return NextResponse.json(computer);
}

export async function PATCH(request: Request, { params }: Params) {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json();

  const computer = await prisma.computer.update({
    where: { id },
    data: {
      ...(body.status !== undefined && { status: body.status }),
    },
  });

  return NextResponse.json(computer);
}

export async function DELETE(_req: Request, { params }: Params) {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const { id } = await params;

  const activeCount = await prisma.computerReservation.count({
    where: {
      computerId: id,
      reservation: { status: { in: ['pending', 'approved'] } },
    },
  });

  if (activeCount > 0) {
    return NextResponse.json(
      { error: 'No se puede eliminar un computador con reservaciones activas o pendientes.' },
      { status: 409 }
    );
  }

  await prisma.computer.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
