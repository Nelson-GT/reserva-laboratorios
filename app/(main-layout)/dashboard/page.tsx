import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { MetricsCards } from '@/components/modules/dashboard/metrics-cards';

export const metadata = { title: 'Dashboard — Lab Manager' };

function weekRange() {
  const now = new Date();
  const day = now.getDay();
  const daysFromMonday = day === 0 ? 6 : day - 1;
  const start = new Date(now);
  start.setDate(now.getDate() - daysFromMonday);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0],
  };
}

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  const today = new Date().toISOString().split('T')[0];
  const week = weekRange();

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { fullName: true },
  });

  // ── Admin metrics ──────────────────────────────────────────────────────────
  if (session.role === 'admin') {
    const [
      todayApproved,
      todayPending,
      weekReservations,
      availableComputers,
      totalComputers,
      availableLabs,
      totalLabs,
      activeUsers,
      pendingUsers,
    ] = await Promise.all([
      prisma.reservation.count({ where: { date: today, status: 'approved' } }),
      prisma.reservation.count({ where: { date: today, status: 'pending' } }),
      prisma.reservation.count({
        where: { date: { gte: week.start, lte: week.end } },
      }),
      prisma.computer.count({ where: { status: 'available' } }),
      prisma.computer.count(),
      prisma.laboratory.count({ where: { status: 'available', deletedAt: null } }),
      prisma.laboratory.count({ where: { deletedAt: null } }),
      prisma.user.count({ where: { status: 'active', role: { not: 'admin' } } }),
      prisma.user.count({ where: { status: 'pending_approval' } }),
    ]);

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-4xl font-bold text-slate-900 mb-1">Inicio</h1>
          <p className="text-slate-500">
            Bienvenido, <strong className="text-slate-700">{user?.fullName ?? 'Administrador'}</strong>.
          </p>
        </div>

        <MetricsCards
          role="admin"
          metrics={{
            todayApproved,
            todayPending,
            weekReservations,
            availableComputers,
            totalComputers,
            availableLabs,
            totalLabs,
            activeUsers,
            pendingUsers,
          }}
        />
      </div>
    );
  }

  // ── Professor / Student metrics ────────────────────────────────────────────
  const [myActive, myWeek, availableComputers, totalComputers, availableLabs, totalLabs] =
    await Promise.all([
      prisma.reservation.count({
        where: { userId: session.userId, status: { in: ['pending', 'approved'] } },
      }),
      prisma.reservation.count({
        where: {
          userId: session.userId,
          date: { gte: week.start, lte: week.end },
        },
      }),
      prisma.computer.count({ where: { status: 'available' } }),
      prisma.computer.count(),
      prisma.laboratory.count({ where: { status: 'available', deletedAt: null } }),
      prisma.laboratory.count({ where: { deletedAt: null } }),
    ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold text-slate-900 mb-1">Inicio</h1>
        <p className="text-slate-500">
          Bienvenido, <strong className="text-slate-700">{user?.fullName ?? 'Usuario'}</strong>.
        </p>
      </div>

      <MetricsCards
        role={session.role}
        metrics={{
          myActive,
          myWeek,
          availableComputers,
          totalComputers,
          availableLabs,
          totalLabs,
        }}
      />
    </div>
  );
}
