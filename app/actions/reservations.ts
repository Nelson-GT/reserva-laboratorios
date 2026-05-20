'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { timesOverlap } from '@/lib/reservations';
import { sendReservationEmail } from '@/lib/email';
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

  // Admin puede crear en nombre de otro usuario
  const targetUserId =
    session.role === 'admin' && formData.get('userId')
      ? (formData.get('userId') as string)
      : session.userId;

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
      userId: targetUserId,
      laboratoryId,
      date,
      startTime,
      endTime,
      purpose,
      type: 'lab',
      status: 'pending',
    },
  });

  const targetUser = await prisma.user.findUnique({ where: { id: targetUserId }, select: { email: true } });
  if (targetUser) {
    sendReservationEmail(targetUser.email, 'created', { labName: lab.name, date, startTime, endTime, type: 'lab', purpose }).catch(() => {});
  }

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

  // Admin puede crear en nombre de otro usuario
  const targetUserId =
    session.role === 'admin' && formData.get('userId')
      ? (formData.get('userId') as string)
      : session.userId;

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
      userId: targetUserId,
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

  const targetUser = await prisma.user.findUnique({ where: { id: targetUserId }, select: { email: true } });
  if (targetUser) {
    sendReservationEmail(targetUser.email, 'created', { labName: computer.laboratory.name, date, startTime, endTime, type: 'computer', purpose, computerNumber: computer.number }).catch(() => {});
  }

  revalidatePath('/reservations');
  revalidatePath('/computers');
  return { success: 'Reserva de computadora enviada. Pendiente de aprobación.' };
}

// ─── Reserva Recurrente de Laboratorio (Profesor) ────────────────────────────

export async function createRecurringLabReservationAction(
  _prevState: unknown,
  formData: FormData
): Promise<{ error?: string; success?: string; created?: string[]; skipped?: string[] }> {
  const session = await getSession();
  if (!session || (session.role !== 'professor' && session.role !== 'admin')) {
    return { error: 'No tienes permiso para realizar esta acción.' };
  }

  const laboratoryId = (formData.get('laboratoryId') as string) ?? '';
  const startDate = (formData.get('startDate') as string) ?? '';
  const endDate = (formData.get('endDate') as string) ?? '';
  const startTime = (formData.get('startTime') as string) ?? '';
  const endTime = (formData.get('endTime') as string) ?? '';
  const purpose = (formData.get('purpose') as string) ?? '';

  const targetUserId =
    session.role === 'admin' && formData.get('userId')
      ? (formData.get('userId') as string)
      : session.userId;

  if (!laboratoryId || !startDate || !endDate || !startTime || !endTime || !purpose.trim()) {
    return { error: 'Todos los campos son requeridos.' };
  }

  if (startTime >= endTime) {
    return { error: 'La hora de inicio debe ser anterior a la hora de fin.' };
  }

  if (purpose.trim().length < 3) {
    return { error: 'Describe el propósito de la reserva (mínimo 3 caracteres).' };
  }

  const lab = await prisma.laboratory.findUnique({ where: { id: laboratoryId } });
  if (!lab || lab.deletedAt) return { error: 'Laboratorio no encontrado.' };
  if (lab.status !== 'available') {
    return { error: `El laboratorio "${lab.name}" no está disponible.` };
  }

  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (start < today) return { error: 'La fecha de inicio no puede ser anterior a hoy.' };
  if (end <= start) return { error: 'La fecha de fin debe ser posterior a la fecha de inicio.' };

  const dayOfWeek = start.getDay();

  // Collect all matching dates (max 52 occurrences = ~1 year)
  const dates: string[] = [];
  const cur = new Date(start);
  while (cur <= end && dates.length < 52) {
    if (cur.getDay() === dayOfWeek) {
      dates.push(cur.toISOString().split('T')[0]);
    }
    cur.setDate(cur.getDate() + 1);
  }

  if (dates.length === 0) {
    return { error: 'No hay fechas disponibles en el rango indicado.' };
  }

  const created: string[] = [];
  const skipped: string[] = [];

  for (const date of dates) {
    const conflict = await prisma.reservation.findFirst({
      where: { laboratoryId, date, type: 'lab', status: { in: ['pending', 'approved'] } },
    });

    if (conflict && timesOverlap(startTime, endTime, conflict.startTime, conflict.endTime)) {
      skipped.push(date);
      continue;
    }

    await prisma.reservation.create({
      data: { userId: targetUserId, laboratoryId, date, startTime, endTime, purpose: purpose.trim(), type: 'lab', status: 'pending' },
    });
    created.push(date);
  }

  revalidatePath('/reservations');

  if (created.length === 0) {
    return { error: 'No se pudo crear ninguna reserva. Todas las fechas tienen conflictos de horario.', skipped };
  }

  // Enviar un correo resumen con la primera fecha creada como referencia
  const targetUser = await prisma.user.findUnique({ where: { id: targetUserId }, select: { email: true } });
  if (targetUser && created.length > 0) {
    const purpose = `${(formData.get('purpose') as string ?? '').trim()} (${created.length} fecha${created.length > 1 ? 's' : ''} recurrente${created.length > 1 ? 's' : ''})`;
    sendReservationEmail(targetUser.email, 'created', { labName: lab.name, date: created[0], startTime, endTime, type: 'lab', purpose }).catch(() => {});
  }

  return {
    success: `Se crearon ${created.length} reserva${created.length > 1 ? 's' : ''}.${skipped.length > 0 ? ` (${skipped.length} omitida${skipped.length > 1 ? 's' : ''} por conflicto)` : ''}`,
    created,
    skipped,
  };
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

  const isAdmin = session.role === 'admin';
  const isOwner = reservation.userId === session.userId;

  if (!isOwner && !isAdmin) {
    return { error: 'No tienes permiso para cancelar esta reserva.' };
  }

  const allowedStatuses = isAdmin ? ['pending', 'approved'] : ['pending'];
  if (!allowedStatuses.includes(reservation.status)) {
    return { error: isAdmin ? 'Solo se pueden cancelar reservas pendientes o aprobadas.' : 'Solo se pueden cancelar reservas pendientes.' };
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
