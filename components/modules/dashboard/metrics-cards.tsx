import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Reservation } from '@/lib/types';

interface MetricsCardsProps {
  totalReservationsToday: number;
  activeLaboratories: number;
}

export function MetricsCards({ totalReservationsToday, activeLaboratories }: MetricsCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
      {/* Reservations Today */}
      <Card className="bg-white border-slate-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-slate-900">
            Reservas de Hoy
          </CardTitle>
          <CardDescription className="text-slate-500">
            Reservaciones activas para hoy
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold text-blue-600">
            {totalReservationsToday}
          </div>
          <p className="text-sm text-slate-500 mt-2">
            Total de reservas pendientes y aprobadas
          </p>
        </CardContent>
      </Card>

      {/* Active Laboratories */}
      <Card className="bg-white border-slate-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-slate-900">
            Laboratorios Activos
          </CardTitle>
          <CardDescription className="text-slate-500">
            Laboratorios disponibles para uso
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold text-green-600">
            {activeLaboratories}
          </div>
          <p className="text-sm text-slate-500 mt-2">
            Laboratorios en estado disponible
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
