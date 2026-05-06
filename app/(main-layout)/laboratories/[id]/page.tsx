import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect, notFound } from 'next/navigation';
import { generatePublicId } from '@/lib/computers';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { LabDetailClient } from '@/components/modules/laboratories/lab-detail-client';
import type { Metadata } from 'next';

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const lab = await prisma.laboratory.findUnique({ where: { id }, select: { name: true } });
  return { title: `${lab?.name ?? 'Laboratorio'} — Lab Manager` };
}

export default async function LaboratoryDetailPage({ params }: Props) {
  const session = await getSession();
  if (!session) redirect('/login');

  const { id } = await params;

  const lab = await prisma.laboratory.findUnique({
    where: { id },
    include: {
      computers: {
        orderBy: { number: 'asc' },
        include: {
          _count: { select: { computerReservations: true } },
        },
      },
    },
  });

  if (!lab || lab.deletedAt) notFound();

  // Auto-assign publicIds to any computer that doesn't have one yet
  const computers = await Promise.all(
    lab.computers.map(async (c) => {
      if (c.publicId) return c;
      const publicId = await generatePublicId();
      await prisma.computer.update({ where: { id: c.id }, data: { publicId } });
      return { ...c, publicId };
    })
  );

  const serialized = {
    ...lab,
    createdAt: lab.createdAt.toISOString(),
    updatedAt: lab.updatedAt.toISOString(),
    computers: computers.map((c) => ({
      ...c,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
    })),
  };

  return (
    <div className="space-y-6">
      <Link
        href="/laboratories"
        className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        Laboratorios
      </Link>

      <LabDetailClient lab={serialized} isAdmin={session.role === 'admin'} />
    </div>
  );
}
