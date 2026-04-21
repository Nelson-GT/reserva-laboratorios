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
        include: { computer: { select: { number: true } } },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  const serialized = reservations.map((r) => ({
    ...r,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  }));

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-slate-900 mb-2">Reservas</h1>
        <p className="text-lg text-slate-600">
          {session.role === 'admin'
            ? 'Gestiona todas las solicitudes de reserva del sistema.'
            : 'Aquí puedes ver y gestionar tus solicitudes de reserva.'}
        </p>
        {(session.role === 'professor') && (
          <a
            href="/reservations/new"
            className="inline-flex items-center gap-2 mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            + Nueva reserva de laboratorio
          </a>
        )}
        {session.role === 'student' && (
          <a
            href="/computers"
            className="inline-flex items-center gap-2 mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            + Reservar computadora
          </a>
        )}
      </div>

      <ReservationsPageClient
        reservations={serialized}
        isAdmin={session.role === 'admin'}
        currentUserId={session.userId}
      />
    </div>
  );
}
