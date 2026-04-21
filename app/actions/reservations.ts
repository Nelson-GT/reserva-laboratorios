'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { timesOverlap } from '@/lib/reservations';
import type { ActionState } from './auth';

// ─── Reserva de Laboratorio (Profesor) ───────────────────────────────────────

const labReservationSchema = z.object({
  laboratoryId: z.string().min(1, 'Selecciona un laboratorio'),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido (YYYY-MM-DD)'),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Hora de inicio inválida'),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, 'Hora de fin inválida'),
  purpose: z.string().min(3, 'Describe el propósito de la reserva').max(200),
});

export async function createLabReservationAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await getSession();
  if (!session || (session.role !== 'professor' && session.role !== 'admin')) {
    return { error: 'No tienes permiso para realizar esta acción.' };
  }

  const parsed = labReservationSchema.safeParse({
    laboratoryId: formData.get('laboratoryId'),
    date: formData.get('date'),
    startTime: formData.get('startTime'),
    endTime: formData.get('endTime'),
    purpose: formData.get('purpose'),
  });

  if (!parsed.success) {
    return { error: parsed.error.errors[0].message };
  }

  const { laboratoryId, date, startTime, endTime, purpose } = parsed.data;

  if (startTime >= endTime) {
    return { error: 'La hora de inicio debe ser anterior a la hora de fin.' };
  }

  // Verificar que el laboratorio existe y está disponible
  const lab = await prisma.laboratory.findUnique({
    where: { id: laboratoryId },
  });

  if (!lab) return { error: 'Laboratorio no encontrado.' };
  if (lab.status !== 'available') {
    return {
      error: `El laboratorio "${lab.name}" no está disponible (${lab.status}).`,
    };
  }

  // Verificar conflictos de horario para ese laboratorio en esa fecha
  const conflicting = await prisma.reservation.findFirst({
    where: {
      laboratoryId,
      date,
      type: 'lab',
      status: { in: ['pending', 'approved'] },
    },
  });

  if (
    conflicting &&
    timesOverlap(startTime, endTime, conflicting.startTime, conflicting.endTime)
  ) {
    return {
      error: `El laboratorio ya tiene una reserva de ${conflicting.startTime} a ${conflicting.endTime} ese día.`,
    };
  }

  await prisma.reservation.create({
    data: {
      userId: session.userId,
      laboratoryId,
      date,
      startTime,
      endTime,
      purpose,
      type: 'lab',
      status: 'pending',
    },
  });

  revalidatePath('/reservations');
  return { success: 'Reserva de laboratorio enviada. Pendiente de aprobación.' };
}

// ─── Reserva de Computadora (Estudiante) ─────────────────────────────────────

const computerReservationSchema = z.object({
  computerId: z.string().min(1, 'Selecciona una computadora'),
  laboratoryId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  purpose: z.string().min(3, 'Describe el propósito').max(200),
});

export async function createComputerReservationAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await getSession();
  if (!session || (session.role !== 'student' && session.role !== 'admin')) {
    return { error: 'No tienes permiso para realizar esta acción.' };
  }

  const parsed = computerReservationSchema.safeParse({
    computerId: formData.get('computerId'),
    laboratoryId: formData.get('laboratoryId'),
    date: formData.get('date'),
    startTime: formData.get('startTime'),
    endTime: formData.get('endTime'),
    purpose: formData.get('purpose'),
  });

  if (!parsed.success) {
    return { error: parsed.error.errors[0].message };
  }

  const { computerId, laboratoryId, date, startTime, endTime, purpose } =
    parsed.data;

  if (startTime >= endTime) {
    return { error: 'La hora de inicio debe ser anterior a la hora de fin.' };
  }

  // Verificar que la computadora existe y está disponible
  const computer = await prisma.computer.findUnique({
    where: { id: computerId },
    include: { laboratory: true },
  });

  if (!computer) return { error: 'Computadora no encontrada.' };
  if (computer.status !== 'available') {
    return { error: `La computadora ${computer.number} no está disponible.` };
  }

  // Verificar conflicto de esa computadora en fecha/hora
  const conflict = await prisma.computerReservation.findFirst({
    where: {
      computerId,
      reservation: {
        date,
        status: { in: ['pending', 'approved'] },
      },
    },
    include: { reservation: true },
  });

  if (
    conflict &&
    timesOverlap(
      startTime,
      endTime,
      conflict.reservation.startTime,
      conflict.reservation.endTime
    )
  ) {
    return {
      error: `La computadora ${computer.number} ya está reservada en ese horario.`,
    };
  }

  // Crear la reserva y asociar la computadora
  const reservation = await prisma.reservation.create({
    data: {
      userId: session.userId,
      laboratoryId,
      date,
      startTime,
      endTime,
      purpose,
      type: 'computer',
      status: 'pending',
    },
  });

  await prisma.computerReservation.create({
    data: { reservationId: reservation.id, computerId },
  });

  revalidatePath('/reservations');
  revalidatePath('/computers');
  return { success: 'Reserva de computadora enviada. Pendiente de aprobación.' };
}

// ─── Cancelar reserva (propio usuario) ───────────────────────────────────────

export async function cancelReservationAction(
  reservationId: string
): Promise<ActionState> {
  const session = await getSession();
  if (!session) return { error: 'No autenticado.' };

  const reservation = await prisma.reservation.findUnique({
    where: { id: reservationId },
  });

  if (!reservation) return { error: 'Reserva no encontrada.' };

  // Solo el dueño o el admin puede cancelar
  if (reservation.userId !== session.userId && session.role !== 'admin') {
    return { error: 'No tienes permiso para cancelar esta reserva.' };
  }

  if (!['pending', 'approved'].includes(reservation.status)) {
    return { error: 'Solo se pueden cancelar reservas pendientes o aprobadas.' };
  }

  await prisma.reservation.update({
    where: { id: reservationId },
    data: { status: 'cancelled' },
  });

  revalidatePath('/reservations');
  return { success: 'Reserva cancelada.' };
}

// ─── Aprobar / Rechazar reserva (admin) ──────────────────────────────────────

export async function updateReservationStatusAction(
  reservationId: string,
  status: 'approved' | 'rejected' | 'finished'
): Promise<ActionState> {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return { error: 'Solo el administrador puede realizar esta acción.' };
  }

  await prisma.reservation.update({
    where: { id: reservationId },
    data: { status },
  });

  revalidatePath('/reservations');
  revalidatePath('/admin/users');
  return { success: 'Estado de reserva actualizado.' };
}
