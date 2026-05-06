import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generatePublicId } from '@/lib/computers';

type Params = { params: Promise<{ id: string }> };

export async function POST(_req: Request, { params }: Params) {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const { id: laboratoryId } = await params;

  const lab = await prisma.laboratory.findUnique({ where: { id: laboratoryId } });
  if (!lab) return NextResponse.json({ error: 'Laboratorio no encontrado' }, { status: 404 });

  const lastComputer = await prisma.computer.findFirst({
    where: { laboratoryId },
    orderBy: { number: 'desc' },
  });
  const nextNumber = (lastComputer?.number ?? 0) + 1;

  const publicId = await generatePublicId();

  const computer = await prisma.computer.create({
    data: { number: nextNumber, laboratoryId, publicId },
  });

  await prisma.laboratory.update({
    where: { id: laboratoryId },
    data: { capacity: { increment: 1 } },
  });

  return NextResponse.json(computer, { status: 201 });
}
