import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { LaboratoriesClient } from '@/components/modules/laboratories/laboratories-client';

export const metadata = {
  title: 'Laboratorios — Lab Manager',
};

export default async function LaboratoriesPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  const laboratories = await prisma.laboratory.findMany({
    where: { deletedAt: null },
    orderBy: { name: 'asc' },
    include: {
      computers: { select: { status: true } },
    },
  });

  return (
    <div className="space-y-6">
      <LaboratoriesClient
        labs={laboratories}
        isAdmin={session.role === 'admin'}
      />
    </div>
  );
}
