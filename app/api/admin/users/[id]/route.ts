import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json();

  // Campos editables
  const allowedStatus = ['active', 'blocked', 'pending_approval'];
  const allowedRoles = ['professor', 'student'];

  const data: Record<string, unknown> = {};

  if (body.status !== undefined) {
    if (!allowedStatus.includes(body.status)) {
      return NextResponse.json({ error: 'Estado inválido' }, { status: 400 });
    }
    data.status = body.status;
  }

  if (body.role !== undefined) {
    if (!allowedRoles.includes(body.role)) {
      return NextResponse.json({ error: 'Rol inválido' }, { status: 400 });
    }
    data.role = body.role;
  }

  if (body.fullName !== undefined) {
    const name = String(body.fullName).trim();
    if (name.length < 3) {
      return NextResponse.json({ error: 'Nombre demasiado corto' }, { status: 400 });
    }
    data.fullName = name;
  }

  if (body.cedula !== undefined) {
    const cedula = String(body.cedula).trim();
    if (!/^\d{6,10}$/.test(cedula)) {
      return NextResponse.json({ error: 'Cédula inválida' }, { status: 400 });
    }
    // Verificar unicidad
    const existing = await prisma.user.findFirst({
      where: { cedula, NOT: { id } },
    });
    if (existing) {
      return NextResponse.json({ error: 'Esa cédula ya está registrada' }, { status: 409 });
    }
    data.cedula = cedula;
  }

  if (body.email !== undefined) {
    const email = String(body.email).trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Correo inválido' }, { status: 400 });
    }
    // Verificar unicidad
    const existing = await prisma.user.findFirst({
      where: { email, NOT: { id } },
    });
    if (existing) {
      return NextResponse.json({ error: 'Ese correo ya está registrado' }, { status: 409 });
    }
    data.email = email;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: 'No hay campos para actualizar' }, { status: 400 });
  }

  const user = await prisma.user.update({
    where: { id },
    data,
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

  return NextResponse.json(user);
}
