import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { timesOverlap } from '@/lib/reservations';
import * as XLSX from 'xlsx';

const TYPE_MAP: Record<string, string> = {
  laboratorio: 'lab',
  computadora: 'computer',
  lab: 'lab',
  computer: 'computer',
};

const VALID_TIMES = new Set([
  '07:00', '09:00', '11:00', '13:00', '15:00', '17:00', '19:00', '21:00',
]);

const TIME_RE = /^\d{2}:\d{2}$/;

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: 'Formato de solicitud inválido.' }, { status: 400 });
  }

  const file = formData.get('file') as File | null;
  if (!file) {
    return NextResponse.json({ error: 'No se recibió ningún archivo.' }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const wb = XLSX.read(buffer, { type: 'buffer' });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rawRows = XLSX.utils.sheet_to_json<(string | number | null)[]>(ws, {
    header: 1,
    defval: null,
  });

  const dataRows = rawRows
    .slice(1)
    .filter((r) => r.some((c) => c !== null && String(c).trim() !== ''));

  if (dataRows.length === 0) {
    return NextResponse.json({ error: 'El archivo no contiene filas de datos.' }, { status: 400 });
  }

  type RowResult = {
    row: number;
    label: string;
    status: 'success' | 'error';
    errors?: string[];
  };

  const results: RowResult[] = [];

  for (let i = 0; i < dataRows.length; i++) {
    const row = dataRows[i];
    const cedula = String(row[0] ?? '').trim();
    const typeRaw = String(row[1] ?? '').trim().toLowerCase();
    const labName = String(row[2] ?? '').trim();
    const dateStr = String(row[3] ?? '').trim();
    const startTime = String(row[4] ?? '').trim();
    const endTime = String(row[5] ?? '').trim();
    const computerNumRaw = String(row[6] ?? '').trim();
    const purpose = String(row[7] ?? '').trim();
    const rowNum = i + 2;
    const label = cedula ? `C.I. ${cedula}` : `Fila ${rowNum}`;

    const errors: string[] = [];

    // Validate cedula format
    if (!cedula || !/^\d{6,10}$/.test(cedula)) {
      errors.push('Cédula del solicitante inválida (6–10 dígitos)');
    }

    // Validate type
    const type = TYPE_MAP[typeRaw];
    if (!type) {
      errors.push('Tipo inválido (use "laboratorio" o "computadora")');
    }

    // Validate lab name
    if (!labName) {
      errors.push('Nombre del laboratorio requerido');
    }

    // Validate date
    if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      errors.push('Fecha inválida (use YYYY-MM-DD, ej: 2026-06-15)');
    } else {
      const d = new Date(`${dateStr}T00:00:00`);
      if (isNaN(d.getTime())) errors.push('Fecha inválida');
    }

    // Validate times
    if (!startTime || !TIME_RE.test(startTime)) {
      errors.push('Hora de inicio inválida (use HH:MM, ej: 07:00)');
    } else if (!VALID_TIMES.has(startTime)) {
      errors.push(`Hora de inicio no válida. Valores permitidos: 07:00, 09:00, 11:00, 13:00, 15:00, 17:00, 19:00`);
    }

    if (!endTime || !TIME_RE.test(endTime)) {
      errors.push('Hora de fin inválida (use HH:MM, ej: 09:00)');
    } else if (!VALID_TIMES.has(endTime)) {
      errors.push(`Hora de fin no válida. Valores permitidos: 09:00, 11:00, 13:00, 15:00, 17:00, 19:00, 21:00`);
    }

    if (startTime && endTime && TIME_RE.test(startTime) && TIME_RE.test(endTime) && startTime >= endTime) {
      errors.push('La hora de inicio debe ser anterior a la hora de fin');
    }

    // Validate purpose
    if (!purpose || purpose.length < 3 || purpose.length > 200) {
      errors.push('Propósito inválido (3–200 caracteres)');
    }

    // Validate computer number if type is "computer"
    let computerNum: number | null = null;
    if (type === 'computer') {
      if (!computerNumRaw) {
        errors.push('Número de computadora requerido para tipo "computadora"');
      } else {
        const n = parseInt(computerNumRaw, 10);
        if (isNaN(n) || n < 1) {
          errors.push('Número de computadora inválido (entero positivo)');
        } else {
          computerNum = n;
        }
      }
    }

    if (errors.length > 0) {
      results.push({ row: rowNum, label, status: 'error', errors });
      continue;
    }

    // Lookup user
    const user = await prisma.user.findUnique({ where: { cedula } });
    if (!user) {
      results.push({ row: rowNum, label, status: 'error', errors: ['No existe un usuario con esa cédula'] });
      continue;
    }
    if (user.status !== 'active') {
      results.push({ row: rowNum, label: user.fullName, status: 'error', errors: ['El usuario no está activo'] });
      continue;
    }

    // Validate role vs type
    if (type === 'lab' && user.role !== 'professor') {
      results.push({ row: rowNum, label: user.fullName, status: 'error', errors: ['Solo los docentes pueden reservar laboratorios completos'] });
      continue;
    }
    if (type === 'computer' && user.role !== 'student') {
      results.push({ row: rowNum, label: user.fullName, status: 'error', errors: ['Solo los estudiantes pueden reservar computadoras individuales'] });
      continue;
    }

    // Lookup lab
    const lab = await prisma.laboratory.findFirst({
      where: {
        name: { equals: labName, mode: 'insensitive' },
        deletedAt: null,
      },
    });
    if (!lab) {
      results.push({ row: rowNum, label: user.fullName, status: 'error', errors: [`No se encontró el laboratorio "${labName}"`] });
      continue;
    }
    if (lab.status !== 'available') {
      results.push({ row: rowNum, label: user.fullName, status: 'error', errors: [`El laboratorio "${lab.name}" no está disponible`] });
      continue;
    }

    if (type === 'lab') {
      // Check lab time conflicts
      const conflicts = await prisma.reservation.findMany({
        where: {
          laboratoryId: lab.id,
          date: dateStr,
          type: 'lab',
          status: { in: ['pending', 'approved'] },
        },
        select: { startTime: true, endTime: true },
      });

      const hasConflict = conflicts.some((c) =>
        timesOverlap(startTime, endTime, c.startTime, c.endTime)
      );
      if (hasConflict) {
        results.push({
          row: rowNum,
          label: user.fullName,
          status: 'error',
          errors: [`El laboratorio ya tiene una reserva en ese horario (${dateStr} ${startTime}–${endTime})`],
        });
        continue;
      }

      try {
        await prisma.reservation.create({
          data: {
            userId: user.id,
            laboratoryId: lab.id,
            date: dateStr,
            startTime,
            endTime,
            purpose,
            type: 'lab',
            status: 'pending',
          },
        });
        results.push({ row: rowNum, label: user.fullName, status: 'success' });
      } catch {
        results.push({ row: rowNum, label: user.fullName, status: 'error', errors: ['Error interno al crear la reserva'] });
      }
    } else {
      // type === 'computer'
      const computer = await prisma.computer.findFirst({
        where: { laboratoryId: lab.id, number: computerNum! },
      });
      if (!computer) {
        results.push({
          row: rowNum,
          label: user.fullName,
          status: 'error',
          errors: [`No existe la computadora #${computerNum} en "${lab.name}"`],
        });
        continue;
      }
      if (computer.status !== 'available') {
        results.push({
          row: rowNum,
          label: user.fullName,
          status: 'error',
          errors: [`La computadora #${computerNum} no está disponible`],
        });
        continue;
      }

      const conflicts = await prisma.computerReservation.findMany({
        where: { computerId: computer.id },
        include: { reservation: { select: { date: true, startTime: true, endTime: true, status: true } } },
      });
      const hasConflict = conflicts.some(
        (cr) =>
          cr.reservation.date === dateStr &&
          ['pending', 'approved'].includes(cr.reservation.status) &&
          timesOverlap(startTime, endTime, cr.reservation.startTime, cr.reservation.endTime)
      );
      if (hasConflict) {
        results.push({
          row: rowNum,
          label: user.fullName,
          status: 'error',
          errors: [`La computadora #${computerNum} ya está reservada en ese horario`],
        });
        continue;
      }

      try {
        await prisma.$transaction(async (tx) => {
          const reservation = await tx.reservation.create({
            data: {
              userId: user.id,
              laboratoryId: lab.id,
              date: dateStr,
              startTime,
              endTime,
              purpose,
              type: 'computer',
              status: 'pending',
            },
          });
          await tx.computerReservation.create({
            data: { reservationId: reservation.id, computerId: computer.id },
          });
        });
        results.push({ row: rowNum, label: user.fullName, status: 'success' });
      } catch {
        results.push({ row: rowNum, label: user.fullName, status: 'error', errors: ['Error interno al crear la reserva'] });
      }
    }
  }

  const created = results.filter((r) => r.status === 'success').length;
  const failed = results.filter((r) => r.status === 'error').length;

  return NextResponse.json({ created, failed, results });
}
