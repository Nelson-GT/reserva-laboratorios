import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { MetricsCards } from '@/components/modules/dashboard/metrics-cards';
import { AlertsPanel } from '@/components/modules/dashboard/alerts-panel';

export const metadata = {
  title: 'Dashboard — Lab Manager',
};

export default async function DashboardPage() {
  const session = await getSession();

  const today = new Date().toISOString().split('T')[0];

  const [activeLabs, todayReservations, pendingUsers, user] = await Promise.all([
    prisma.laboratory.count({ where: { status: 'available' } }),
    prisma.reservation.count({
      where: { date: today, status: { in: ['pending', 'approved'] } },
    }),
    session?.role === 'admin'
      ? prisma.user.count({
          where: { status: 'pending_approval', role: { not: 'admin' } },
        })
      : Promise.resolve(0),
    prisma.user.findUnique({
      where: { id: session?.userId },
      select: { fullName: true, role: true },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-slate-900 mb-2">Dashboard</h1>
        <p className="text-lg text-slate-600">
          Bienvenido, <strong>{user?.fullName ?? 'Usuario'}</strong>. Aquí puedes
          ver el estado actual del sistema.
        </p>
      </div>

      <MetricsCards
        totalReservationsToday={todayReservations}
        activeLaboratories={activeLabs}
        pendingUsers={session?.role === 'admin' ? pendingUsers : undefined}
      />

      {session?.role === 'admin' && pendingUsers > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-amber-500 flex-shrink-0" />
          <p className="text-amber-800 text-sm">
            Hay <strong>{pendingUsers}</strong> usuario(s) pendientes de aprobación.{' '}
            <a href="/admin/users" className="underline font-medium">
              Revisar ahora
            </a>
          </p>
        </div>
      )}

      <AlertsPanel alerts={[]} />
    </div>
  );
}
