'use client';

import { useState, useMemo, useEffect } from 'react';
import { getEffectiveStatus } from '@/lib/reservations';
import { TablePagination } from '@/components/ui/table-pagination';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendiente',
  approved: 'Aprobada',
  rejected: 'Rechazada',
  cancelled: 'Cancelada',
  finished: 'Finalizada',
};

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  approved: 'bg-green-100 text-green-800 border-green-200',
  rejected: 'bg-red-100 text-red-800 border-red-200',
  cancelled: 'bg-slate-100 text-slate-600 border-slate-200',
  finished: 'bg-blue-100 text-blue-800 border-blue-200',
};

const STRIP: readonly [string, string, string][] = [
  ['pending', 'Pendientes', 'text-yellow-700 bg-yellow-50 border-yellow-200'],
  ['approved', 'Aprobadas', 'text-green-700 bg-green-50 border-green-200'],
  ['finished', 'Finalizadas', 'text-blue-700 bg-blue-50 border-blue-200'],
  ['rejected', 'Rechazadas', 'text-red-700 bg-red-50 border-red-200'],
  ['cancelled', 'Canceladas', 'text-slate-600 bg-slate-50 border-slate-200'],
];

type Reservation = {
  id: string;
  type: string;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  purpose: string | null;
  createdAt: string;
  laboratory: { name: string };
  computerReservations: { computer: { number: number; publicId: string | null } }[];
};

export function UserReservationsClient({ reservations }: { reservations: Reservation[] }) {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return reservations;
    return reservations.filter(
      (r) =>
        r.laboratory.name.toLowerCase().includes(q) ||
        (r.purpose ?? '').toLowerCase().includes(q) ||
        r.date.includes(q) ||
        STATUS_LABELS[getEffectiveStatus(r)]?.toLowerCase().includes(q)
    );
  }, [reservations, search]);

  const PAGE_SIZE = 10;
  const [page, setPage] = useState(1);
  useEffect(() => setPage(1), [search]);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const counts = Object.fromEntries(
    STRIP.map(([key]) => [key, reservations.filter((r) => getEffectiveStatus(r) === key).length])
  );

  return (
    <div className="space-y-4">
      {reservations.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
          {STRIP.map(([key, label, cls]) => (
            <div key={key} className={`rounded-xl border p-3 text-center ${cls}`}>
              <p className="text-xl font-bold">{counts[key]}</p>
              <p className="text-xs font-medium">{label}</p>
            </div>
          ))}
        </div>
      )}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          placeholder="Buscar por laboratorio o propósito..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {reservations.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400 shadow-sm">
          Este usuario no tiene reservaciones registradas.
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400 shadow-sm">
          No se encontraron reservaciones.
        </div>
      ) : (
        <div className="bg-white border-y border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">Laboratorio</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">Recurso</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">Fecha</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">Horario</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">Propósito</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">Estado</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((r) => (
                  <tr key={r.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 text-sm font-medium text-slate-800">{r.laboratory.name}</td>
                    <td className="px-4 py-3">
                      <Badge variant="outline">
                        {r.type === 'lab'
                          ? 'Laboratorio'
                          : `Computadora #${r.computerReservations[0]?.computer.number ?? '?'}`}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {format(new Date(`${r.date}T00:00:00`), 'dd/MM/yyyy')}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600 whitespace-nowrap">
                      {r.startTime} – {r.endTime}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600 max-w-[200px]">
                      <span className="truncate block">{r.purpose ?? '—'}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[getEffectiveStatus(r)] ?? ''}`}>
                        {STATUS_LABELS[getEffectiveStatus(r)] ?? r.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <TablePagination total={filtered.length} page={page} pageSize={PAGE_SIZE} onPageChange={setPage} />
        </div>
      )}
    </div>
  );
}
