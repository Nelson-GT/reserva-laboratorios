import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import * as XLSX from 'xlsx';

const ROLE_MAP: Record<string, string> = {
  estudiante: 'student',
  docente: 'professor',
  student: 'student',
  professor: 'professor',
};

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

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
    fullName: string;
    status: 'success' | 'error';
    errors?: string[];
  };

  const results: RowResult[] = [];
  const seenCedulas = new Set<string>();
  const seenEmails = new Set<string>();

  for (let i = 0; i < dataRows.length; i++) {
    const row = dataRows[i];
    const fullName = String(row[0] ?? '').trim();
    const cedula = String(row[1] ?? '').trim();
    const email = String(row[2] ?? '').trim().toLowerCase();
    const password = String(row[3] ?? '').trim();
    const rolRaw = String(row[4] ?? '').trim().toLowerCase();
    const rowNum = i + 2;

    const errors: string[] = [];

    if (!fullName || fullName.length < 3 || fullName.length > 100) {
      errors.push('Nombre completo inválido (3–100 caracteres)');
    }

    const cedulaValid = /^\d{6,10}$/.test(cedula);
    if (!cedulaValid) {
      errors.push('Cédula inválida (6–10 dígitos numéricos)');
    } else if (seenCedulas.has(cedula)) {
      errors.push('Cédula duplicada dentro del archivo');
    } else {
      seenCedulas.add(cedula);
    }

    const emailValid = isValidEmail(email);
    if (!emailValid) {
      errors.push('Correo electrónico inválido');
    } else if (seenEmails.has(email)) {
      errors.push('Correo duplicado dentro del archivo');
    } else {
      seenEmails.add(email);
    }

    if (!password || password.length < 8) {
      errors.push('Contraseña inválida (mínimo 8 caracteres)');
    }

    const role = ROLE_MAP[rolRaw];
    if (!role) {
      errors.push('Rol inválido (use "estudiante" o "docente")');
    }

    if (errors.length > 0) {
      results.push({ row: rowNum, fullName: fullName || `Fila ${rowNum}`, status: 'error', errors });
      continue;
    }

    const existing = await prisma.user.findFirst({
      where: { OR: [{ cedula }, { email }] },
    });
    if (existing) {
      const field = existing.email === email ? 'correo electrónico' : 'cédula';
      results.push({
        row: rowNum,
        fullName,
        status: 'error',
        errors: [`Ya existe un usuario con ese ${field}`],
      });
      continue;
    }

    try {
      const hashed = await bcrypt.hash(password, 12);
      await prisma.user.create({
        data: {
          fullName,
          cedula,
          email,
          password: hashed,
          role: role as any,
          status: 'active',
          emailVerified: true,
        },
      });
      results.push({ row: rowNum, fullName, status: 'success' });
    } catch {
      results.push({
        row: rowNum,
        fullName,
        status: 'error',
        errors: ['Error interno al crear el usuario'],
      });
    }
  }

  const created = results.filter((r) => r.status === 'success').length;
  const failed = results.filter((r) => r.status === 'error').length;

  return NextResponse.json({ created, failed, results });
}
