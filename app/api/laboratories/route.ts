import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  const labs = await prisma.laboratory.findMany({
    include: {
      _count: { select: { computers: true } },
    },
    orderBy: { name: 'asc' },
  });

  return NextResponse.json(labs);
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const body = await request.json();
  const { name, capacity, operational, status, description } = body;

  if (!name || !capacity) {
    return NextResponse.json(
      { error: 'Nombre y capacidad son requeridos' },
      { status: 400 }
    );
  }

  const lab = await prisma.laboratory.create({
    data: {
      name,
      capacity: Number(capacity),
      operational: Number(operational ?? capacity),
      status: status ?? 'available',
      description,
    },
  });

  // Crear computadoras automáticamente
  const computers = Array.from({ length: lab.capacity }, (_, i) => ({
    number: i + 1,
    laboratoryId: lab.id,
  }));
  await prisma.computer.createMany({ data: computers });

  return NextResponse.json(lab, { status: 201 });
}
