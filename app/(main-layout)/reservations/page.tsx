import { ReservationsTabs } from '@/components/modules/reservations/reservations-tabs';
import { getMockReservations } from '@/lib/mock-data';

export const metadata = {
  title: 'Reservas - Lab Manager',
  description: 'Gestión de reservas de laboratorios',
};

export default function ReservationsPage() {
  const reservations = getMockReservations();

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-slate-900 mb-2">Reservas</h1>
        <p className="text-lg text-slate-600">
          Gestiona las reservas de laboratorios y su estado.
        </p>
      </div>

      <ReservationsTabs reservations={reservations} />
    </div>
  );
}
