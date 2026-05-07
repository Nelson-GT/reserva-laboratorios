import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { ReservationsPageClient } from '@/components/modules/reservations/reservations-page-client';

export const metadata = {
  title: 'Reservas — Lab Manager',
};

export default async function ReservationsPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  const reservations = await prisma.reservation.findMany({
    where: session.role === 'admin' ? {} : { userId: session.userId },
    include: {
      user: { select: { fullName: true, cedula: true, role: true } },
      laboratory: { select: { name: true } },
      computerReservations: {
        include: { computer: { select: { id: true, number: true, publicId: true } } },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  const serialized = reservations.map((r) => ({
    ...r,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  }));

  const laboratories =
    session.role === 'admin' || session.role === 'professor' || session.role === 'student'
      ? await prisma.laboratory.findMany({
          where: { status: 'available', deletedAt: null },
          orderBy: { name: 'asc' },
          select: { id: true, name: true, capacity: true, operational: true },
        })
      : [];

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-slate-900 mb-2">Reservas</h1>
        <p className="text-lg text-slate-600">
          {session.role === 'admin'
            ? 'Gestione las solicitudes de reserva.'
            : 'Aquí puedes ver y gestionar tus solicitudes de reserva.'}
        </p>
      </div>

      <ReservationsPageClient
        reservations={serialized}
        isAdmin={session.role === 'admin'}
        currentUserId={session.userId}
        laboratories={laboratories}
        role={session.role}
      />
    </div>
  );
}
