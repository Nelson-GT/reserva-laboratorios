import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { timesOverlap } from '@/lib/reservations';
import { sendReservationEmail } from '@/lib/email';

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();

  const reservation = await prisma.reservation.findUnique({
    where: { id },
    include: {
      user: { select: { email: true } },
      laboratory: { select: { name: true } },
      computerReservations: { include: { computer: { select: { number: true } } } },
    },
  });
  if (!reservation) {
    return NextResponse.json({ error: 'Reserva no encontrada' }, { status: 404 });
  }

  // ── Non-admin: cancelar o editar su propia reserva pendiente ──────────────
  if (session.role !== 'admin') {
    if (reservation.userId !== session.userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    // Cancelar (solo pendiente para no-admin)
    if (body.status === 'cancelled') {
      if (reservation.status !== 'pending') {
        return NextResponse.json(
          { error: 'Solo se pueden cancelar reservas pendientes' },
          { status: 400 }
        );
      }
      const updated = await prisma.reservation.update({ where: { id }, data: { status: 'cancelled' } });
      sendReservationEmail(reservation.user.email, 'cancelled', {
        labName: reservation.laboratory.name,
        date: reservation.date,
        startTime: reservation.startTime,
        endTime: reservation.endTime,
        type: reservation.type,
        purpose: reservation.purpose,
        computerNumber: reservation.computerReservations[0]?.computer.number,
      }).catch(() => {});
      return NextResponse.json(updated);
    }

    // Editar solo si está pendiente
    if (reservation.status !== 'pending') {
      return NextResponse.json(
        { error: 'Solo puedes editar reservas pendientes' },
        { status: 403 }
      );
    }

    // Profesor: cambiar laboratorio
    if (session.role === 'professor' && reservation.type === 'lab' && body.laboratoryId) {
      const newLabId: string = body.laboratoryId;

      const lab = await prisma.laboratory.findUnique({ where: { id: newLabId } });
      if (!lab || lab.deletedAt) {
        return NextResponse.json({ error: 'Laboratorio no encontrado' }, { status: 404 });
      }

      const conflict = await prisma.reservation.findFirst({
        where: {
          laboratoryId: newLabId,
          date: reservation.date,
          type: 'lab',
          status: { in: ['pending', 'approved'] },
          id: { not: id },
        },
      });

      if (conflict && timesOverlap(reservation.startTime, reservation.endTime, conflict.startTime, conflict.endTime)) {
        return NextResponse.json(
          { error: `El laboratorio ya tiene una reserva de ${conflict.startTime} a ${conflict.endTime} ese día.` },
          { status: 409 }
        );
      }

      const updated = await prisma.reservation.update({
        where: { id },
        data: { laboratoryId: newLabId },
        include: {
          laboratory: { select: { name: true } },
          computerReservations: { include: { computer: { select: { id: true, number: true, publicId: true } } } },
        },
      });
      return NextResponse.json(updated);
    }

    // Estudiante: cambiar laboratorio + computadora
    if (session.role === 'student' && reservation.type === 'computer' && body.laboratoryId && body.computerId) {
      const newLabId: string = body.laboratoryId;
      const newComputerId: string = body.computerId;

      const computer = await prisma.computer.findUnique({ where: { id: newComputerId } });
      if (!computer || computer.laboratoryId !== newLabId) {
        return NextResponse.json({ error: 'Computadora no encontrada en ese laboratorio' }, { status: 404 });
      }
      if (computer.status !== 'available') {
        return NextResponse.json({ error: `La computadora #${computer.number} no está disponible` }, { status: 400 });
      }

      const conflict = await prisma.computerReservation.findFirst({
        where: {
          computerId: newComputerId,
          reservation: {
            date: reservation.date,
            status: { in: ['pending', 'approved'] },
            id: { not: id },
          },
        },
        include: { reservation: true },
      });

      if (conflict && timesOverlap(reservation.startTime, reservation.endTime, conflict.reservation.startTime, conflict.reservation.endTime)) {
        return NextResponse.json(
          { error: `La computadora #${computer.number} ya está reservada en ese horario.` },
          { status: 409 }
        );
      }

      const cr = await prisma.computerReservation.findFirst({ where: { reservationId: id } });
      if (!cr) {
        return NextResponse.json({ error: 'Registro de computadora no encontrado' }, { status: 404 });
      }

      await prisma.$transaction([
        prisma.reservation.update({ where: { id }, data: { laboratoryId: newLabId } }),
        prisma.computerReservation.update({ where: { id: cr.id }, data: { computerId: newComputerId } }),
      ]);

      const updated = await prisma.reservation.findUnique({
        where: { id },
        include: {
          laboratory: { select: { name: true } },
          computerReservations: { include: { computer: { select: { id: true, number: true, publicId: true } } } },
        },
      });
      return NextResponse.json(updated);
    }

    return NextResponse.json({ error: 'Operación no permitida' }, { status: 403 });
  }

  // ── Admin: cambiar laboratorio ────────────────────────────────────────────
  if (body.laboratoryId && reservation.type === 'lab') {
    const newLabId: string = body.laboratoryId;

    const lab = await prisma.laboratory.findUnique({ where: { id: newLabId } });
    if (!lab || lab.deletedAt) {
      return NextResponse.json({ error: 'Laboratorio no encontrado' }, { status: 404 });
    }

    const conflict = await prisma.reservation.findFirst({
      where: {
        laboratoryId: newLabId,
        date: reservation.date,
        type: 'lab',
        status: { in: ['pending', 'approved'] },
        id: { not: id },
      },
    });

    if (conflict && timesOverlap(reservation.startTime, reservation.endTime, conflict.startTime, conflict.endTime)) {
      return NextResponse.json(
        { error: `El laboratorio ya tiene una reserva de ${conflict.startTime} a ${conflict.endTime} ese día.` },
        { status: 409 }
      );
    }

    const updated = await prisma.reservation.update({
      where: { id },
      data: { laboratoryId: newLabId },
      include: { laboratory: { select: { name: true } }, computerReservations: { include: { computer: { select: { id: true, number: true, publicId: true } } } } },
    });
    return NextResponse.json(updated);
  }

  // ── Admin: cambiar computadora ────────────────────────────────────────────
  if (body.computerId && reservation.type === 'computer') {
    const newComputerId: string = body.computerId;

    const computer = await prisma.computer.findUnique({ where: { id: newComputerId } });
    if (!computer) {
      return NextResponse.json({ error: 'Computadora no encontrada' }, { status: 404 });
    }

    const conflict = await prisma.computerReservation.findFirst({
      where: {
        computerId: newComputerId,
        reservation: { date: reservation.date, status: { in: ['pending', 'approved'] }, id: { not: id } },
      },
      include: { reservation: true },
    });

    if (conflict && timesOverlap(reservation.startTime, reservation.endTime, conflict.reservation.startTime, conflict.reservation.endTime)) {
      return NextResponse.json(
        { error: `La computadora #${computer.number} ya está reservada en ese horario.` },
        { status: 409 }
      );
    }

    const cr = await prisma.computerReservation.findFirst({ where: { reservationId: id } });
    if (!cr) {
      return NextResponse.json({ error: 'Registro de computadora no encontrado' }, { status: 404 });
    }

    await prisma.computerReservation.update({ where: { id: cr.id }, data: { computerId: newComputerId } });

    const updated = await prisma.reservation.findUnique({
      where: { id },
      include: { laboratory: { select: { name: true } }, computerReservations: { include: { computer: { select: { id: true, number: true, publicId: true } } } } },
    });
    return NextResponse.json(updated);
  }

  // ── Admin: cambiar estado ─────────────────────────────────────────────────
  const { status } = body;
  const adminStatuses = ['approved', 'rejected', 'cancelled', 'finished'];
  if (!adminStatuses.includes(status)) {
    return NextResponse.json({ error: 'Estado inválido' }, { status: 400 });
  }

  const updated = await prisma.reservation.update({
    where: { id },
    data: { status },
    include: {
      laboratory: { select: { name: true } },
      computerReservations: { include: { computer: { select: { id: true, number: true, publicId: true } } } },
    },
  });

  sendReservationEmail(reservation.user.email, status as 'approved' | 'rejected' | 'cancelled' | 'finished', {
    labName: updated.laboratory.name,
    date: reservation.date,
    startTime: reservation.startTime,
    endTime: reservation.endTime,
    type: reservation.type,
    purpose: reservation.purpose,
    computerNumber: reservation.computerReservations[0]?.computer.number,
  }).catch(() => {});

  return NextResponse.json(updated);
}
