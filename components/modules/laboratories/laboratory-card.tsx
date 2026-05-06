import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronRight } from 'lucide-react';

type ComputerStatus = 'available' | 'maintenance' | 'out_of_service';
type LabStatus = 'available' | 'maintenance' | 'out_of_service';

interface LaboratoryCardProps {
  laboratory: {
    id: string;
    name: string;
    description: string | null;
    capacity: number;
    operational: number;
    status: LabStatus;
    computers: { status: ComputerStatus }[];
  };
}

const LAB_STATUS_CONFIG: Record<LabStatus, { label: string; className: string }> = {
  available: {
    label: 'Disponible',
    className: 'bg-green-100 text-green-800 border-green-300',
  },
  maintenance: {
    label: 'En Mantenimiento',
    className: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  },
  out_of_service: {
    label: 'Fuera de Servicio',
    className: 'bg-red-100 text-red-800 border-red-300',
  },
};

export function LaboratoryCard({ laboratory }: LaboratoryCardProps) {
  const statusConfig = LAB_STATUS_CONFIG[laboratory.status];
  const available = laboratory.computers.filter((c) => c.status === 'available').length;
  const maintenance = laboratory.computers.filter((c) => c.status === 'maintenance').length;
  const outOfService = laboratory.computers.filter((c) => c.status === 'out_of_service').length;
  const total = laboratory.computers.length;

  const availablePct = total > 0 ? Math.round((available / total) * 100) : 0;

  const barColor =
    laboratory.status === 'available'
      ? 'bg-green-500'
      : laboratory.status === 'maintenance'
      ? 'bg-yellow-500'
      : 'bg-red-500';

  return (
    <Link href={`/laboratories/${laboratory.id}`} className="block group">
      <Card className="bg-white border-slate-200 hover:shadow-lg transition-all group-hover:border-slate-300 h-full">
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center justify-center gap-4">
              {/* Laboratory name */}
              <CardTitle className="text-lg text-slate-900 group-hover:text-blue-600 transition-colors">
                {laboratory.name}
              </CardTitle>

              {/* Status badge */}
              <span
                className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusConfig.className}`}
              >
                {statusConfig.label}
              </span>
            </div>

            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-500 flex-shrink-0 mt-0.5 transition-colors" />
          </div>

          {/* Laboratory description */}
          {laboratory.description && (
            <p className="text-sm text-slate-500 mt-1 line-clamp-2">
              {laboratory.description}
            </p>
          )}
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Availability bar */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-xs font-medium text-slate-600">Disponibilidad</span>
              <span className="text-xs font-semibold text-slate-700">
                {available}/{total}
              </span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${barColor}`}
                style={{ width: `${availablePct}%` }}
              />
            </div>
          </div>

          {/* Computer status breakdown */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-green-50 rounded-lg p-2">
              <p className="text-base font-bold text-green-700">{available}</p>
              <p className="text-[10px] text-green-600 font-medium">Disponibles</p>
            </div>
            <div className="bg-yellow-50 rounded-lg p-2">
              <p className="text-base font-bold text-yellow-700">{maintenance}</p>
              <p className="text-[10px] text-yellow-600 font-medium">Mantenimiento</p>
            </div>
            <div className="bg-red-50 rounded-lg p-2">
              <p className="text-base font-bold text-red-700">{outOfService}</p>
              <p className="text-[10px] text-red-600 font-medium">Fuera de Servicio</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
