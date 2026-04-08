import { MetricsCards } from '@/components/modules/dashboard/metrics-cards';
import { AlertsPanel } from '@/components/modules/dashboard/alerts-panel';
import { getMockAlerts, getMockReservations, getMockLaboratories } from '@/lib/mock-data';

export const metadata = {
  title: 'Dashboard - Lab Manager',
  description: 'Tablero principal de gestión de laboratorios',
};

export default function DashboardPage() {
  const alerts = getMockAlerts();
  const reservations = getMockReservations();
  const laboratories = getMockLaboratories();

  // Calculate metrics
  const totalReservationsToday = reservations.filter(
    (res) => res.status === 'pending' || res.status === 'approved'
  ).length;

  const activeLaboratories = laboratories.filter(
    (lab) => lab.status === 'available'
  ).length;

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-slate-900 mb-2">Dashboard</h1>
        <p className="text-lg text-slate-600">
          Bienvenido al gestor de laboratorios. Aquí puede ver el estado actual del sistema.
        </p>
      </div>

      <MetricsCards
        totalReservationsToday={totalReservationsToday}
        activeLaboratories={activeLaboratories}
      />

      <AlertsPanel alerts={alerts} />
    </div>
  );
}
