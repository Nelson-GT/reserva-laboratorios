import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface MetricsCardsProps {
  totalReservationsToday: number;
  activeLaboratories: number;
  pendingUsers?: number;
}

export function MetricsCards({ totalReservationsToday, activeLaboratories, pendingUsers }: MetricsCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
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
      {pendingUsers !== undefined && (
        <Card className="bg-white border-slate-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-slate-900">
              Usuarios Pendientes
            </CardTitle>
            <CardDescription className="text-slate-500">
              Esperando aprobación del administrador
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-amber-600">{pendingUsers}</div>
            <p className="text-sm text-slate-500 mt-2">
              Usuarios por validar
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
