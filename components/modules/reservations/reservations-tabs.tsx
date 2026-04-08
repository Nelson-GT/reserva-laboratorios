'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Reservation, ReservationStatus } from '@/lib/types';
import { ReservationRow } from './reservation-row';

interface ReservationsTabsProps {
  reservations: Reservation[];
}

export function ReservationsTabs({ reservations }: ReservationsTabsProps) {
  const statuses: { value: ReservationStatus; label: string }[] = [
    { value: 'pending', label: 'Pendiente' },
    { value: 'approved', label: 'Aprobada' },
    { value: 'rejected', label: 'Rechazada' },
    { value: 'cancelled', label: 'Cancelada' },
    { value: 'finished', label: 'Finalizada' },
  ];

  const getReservationsByStatus = (status: ReservationStatus) => {
    return reservations.filter((res) => res.status === status);
  };

  return (
    <Tabs defaultValue="pending" className="w-full">
      <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 bg-slate-100">
        {statuses.map((status) => {
          const count = getReservationsByStatus(status.value).length;
          return (
            <TabsTrigger key={status.value} value={status.value}>
              {status.label}
              <span className="ml-2 text-xs bg-slate-300 px-2 py-1 rounded">
                {count}
              </span>
            </TabsTrigger>
          );
        })}
      </TabsList>

      {statuses.map((status) => {
        const statusReservations = getReservationsByStatus(status.value);
        return (
          <TabsContent key={status.value} value={status.value} className="mt-4">
            {statusReservations.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                No hay reservas {status.label.toLowerCase()}
              </div>
            ) : (
              <div className="space-y-3">
                {statusReservations.map((reservation) => (
                  <ReservationRow
                    key={reservation.id}
                    reservation={reservation}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        );
      })}
    </Tabs>
  );
}
