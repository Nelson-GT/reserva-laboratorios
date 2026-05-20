import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import * as XLSX from 'xlsx';

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const labs = await prisma.laboratory.findMany({
    where: { status: 'available', deletedAt: null },
    select: { name: true },
    orderBy: { name: 'asc' },
  });

  const wb = XLSX.utils.book_new();

  const headers = [
    'Cédula del Solicitante',
    'Tipo (laboratorio / computadora)',
    'Nombre del Laboratorio',
    'Fecha (YYYY-MM-DD)',
    'Hora de Inicio',
    'Hora de Fin',
    'Número de Computadora',
    'Propósito',
  ];
  const sampleLab = labs[0]?.name ?? 'Laboratorio de Informática I';
  const sampleRow1 = ['12345678', 'laboratorio', sampleLab, '2026-06-10', '07:00', '09:00', '', 'Práctica de Bases de Datos — Sección 01'];
  const sampleRow2 = ['87654321', 'computadora', sampleLab, '2026-06-10', '09:00', '11:00', '3', 'Proyecto Final — Programación'];
  const ws = XLSX.utils.aoa_to_sheet([headers, sampleRow1, sampleRow2]);
  ws['!cols'] = [
    { wch: 24 }, { wch: 28 }, { wch: 30 }, { wch: 20 },
    { wch: 15 }, { wch: 15 }, { wch: 22 }, { wch: 40 },
  ];
  XLSX.utils.book_append_sheet(wb, ws, 'Reservas');

  const instrData = [
    ['Campo', 'Obligatorio', 'Descripción', 'Valores válidos'],
    ['Cédula del Solicitante', 'Sí', 'Cédula del usuario que realizará la reserva', 'Usuario activo en el sistema'],
    ['Tipo', 'Sí', 'Tipo de recurso a reservar', '"laboratorio" (docentes) o "computadora" (estudiantes)'],
    ['Nombre del Laboratorio', 'Sí', 'Nombre exacto del laboratorio', 'Ver hoja "Laboratorios Disponibles"'],
    ['Fecha', 'Sí', 'Fecha de la reserva en formato YYYY-MM-DD', 'Ej: 2026-06-15'],
    ['Hora de Inicio', 'Sí', 'Hora de inicio del bloque', '07:00 · 09:00 · 11:00 · 13:00 · 15:00 · 17:00 · 19:00'],
    ['Hora de Fin', 'Sí', 'Hora de fin del bloque', '09:00 · 11:00 · 13:00 · 15:00 · 17:00 · 19:00 · 21:00'],
    ['Número de Computadora', 'Solo si tipo = computadora', 'Número de la computadora en el laboratorio', 'Entero positivo (ej: 1, 5, 12)'],
    ['Propósito', 'Sí', 'Descripción del uso de la reserva', 'Texto de 3 a 200 caracteres'],
  ];
  const wsI = XLSX.utils.aoa_to_sheet(instrData);
  wsI['!cols'] = [{ wch: 28 }, { wch: 30 }, { wch: 45 }, { wch: 55 }];
  XLSX.utils.book_append_sheet(wb, wsI, 'Instrucciones');

  if (labs.length > 0) {
    const labData = [['Laboratorios Disponibles'], ...labs.map((l) => [l.name])];
    const wsL = XLSX.utils.aoa_to_sheet(labData);
    wsL['!cols'] = [{ wch: 40 }];
    XLSX.utils.book_append_sheet(wb, wsL, 'Laboratorios Disponibles');
  }

  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

  return new NextResponse(buf, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="plantilla-reservas.xlsx"',
    },
  });
}
