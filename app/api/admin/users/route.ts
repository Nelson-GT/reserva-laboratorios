import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function GET(request: Request) {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const role = searchParams.get('role');

  const users = await prisma.user.findMany({
    where: {
      ...(status ? { status: status as any } : {}),
      ...(role ? { role: role as any } : {}),
      role: { not: 'admin' },
    },
    select: {
      id: true,
      cedula: true,
      fullName: true,
      email: true,
      role: true,
      status: true,
      emailVerified: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(users);
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const body = await request.json();
  const { fullName, cedula, email, role, password } = body;

  if (!fullName?.trim() || !cedula?.trim() || !email?.trim() || !role || !password) {
    return NextResponse.json({ error: 'Todos los campos son requeridos.' }, { status: 400 });
  }
  if (!['student', 'professor'].includes(role)) {
    return NextResponse.json({ error: 'Rol no válido.' }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: 'La contraseña debe tener al menos 8 caracteres.' }, { status: 400 });
  }

  const existing = await prisma.user.findFirst({
    where: { OR: [{ email: email.trim() }, { cedula: cedula.trim() }] },
  });
  if (existing) {
    const field = existing.email === email.trim() ? 'correo electrónico' : 'cédula';
    return NextResponse.json({ error: `Ya existe un usuario con ese ${field}.` }, { status: 409 });
  }

  const hashed = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      fullName: fullName.trim(),
      cedula: cedula.trim(),
      email: email.trim(),
      role,
      password: hashed,
      status: 'active',
      emailVerified: true,
    },
    select: {
      id: true,
      cedula: true,
      fullName: true,
      email: true,
      role: true,
      status: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ ...user, createdAt: user.createdAt.toISOString() }, { status: 201 });
}
