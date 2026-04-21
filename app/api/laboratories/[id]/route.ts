import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  const { id } = await params;

  const lab = await prisma.laboratory.findUnique({
    where: { id },
    include: {
      computers: { orderBy: { number: 'asc' } },
    },
  });

  if (!lab) {
    return NextResponse.json({ error: 'Laboratorio no encontrado' }, { status: 404 });
  }

  return NextResponse.json(lab);
}

export async function PATCH(request: Request, { params }: Params) {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json();

  const lab = await prisma.laboratory.update({
    where: { id },
    data: {
      ...(body.name !== undefined && { name: body.name }),
      ...(body.status !== undefined && { status: body.status }),
      ...(body.operational !== undefined && {
        operational: Number(body.operational),
      }),
      ...(body.description !== undefined && { description: body.description }),
    },
  });

  return NextResponse.json(lab);
}

export async function DELETE(_req: Request, { params }: Params) {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const { id } = await params;

  await prisma.laboratory.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
