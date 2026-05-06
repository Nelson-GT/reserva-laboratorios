'use client';

import { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';

const RESERVATION_STATUS_LABELS: Record<string, string> = {
  pending: 'Pendiente',
  approved: 'Aprobada',
  rejected: 'Rechazada',
  cancelled: 'Cancelada',
  finished: 'Finalizada',
};

const RESERVATION_STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  approved: 'bg-green-100 text-green-800 border-green-200',
  rejected: 'bg-red-100 text-red-800 border-red-200',
  cancelled: 'bg-slate-100 text-slate-600 border-slate-200',
  finished: 'bg-blue-100 text-blue-800 border-blue-200',
};

const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrador',
  professor: 'Docente',
  student: 'Estudiante',
};

type Reservation = {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  purpose: string | null;
  user: { fullName: string; cedula: string; role: string };
};

export function ComputerHistoryTable({ reservations }: { reservations: Reservation[] }) {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return reservations;
    return reservations.filter(
      (r) =>
        r.user.fullName.toLowerCase().includes(q) ||
        r.user.cedula.includes(q) ||
        (r.purpose ?? '').toLowerCase().includes(q) ||
        r.date.includes(q) ||
        RESERVATION_STATUS_LABELS[r.status]?.toLowerCase().includes(q)
    );
  }, [reservations, search]);

  if (reservations.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400 shadow-sm">
        Este equipo aún no tiene reservaciones registradas.
      </div>
    );
  }

  return (
    <>
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          placeholder="Buscar por usuario, cédula de identidad o propósito..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400 shadow-sm">
          No se encontraron reservaciones.
        </div>
      ) : (
        <div className="bg-white border-y border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">
                    Usuario
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">
                    Fecha
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">
                    Horario
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">
                    Propósito
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">
                    Estado
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-slate-800">{r.user.fullName}</p>
                      <p className="text-xs text-slate-400">
                        C.I. {r.user.cedula} · {ROLE_LABELS[r.user.role] ?? r.user.role}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {format(new Date(`${r.date}T00:00:00`), 'dd/MM/yyyy')}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600 whitespace-nowrap">
                      {r.startTime} – {r.endTime}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600 max-w-[220px]">
                      <span className="truncate block">{r.purpose ?? '—'}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                          RESERVATION_STATUS_COLORS[r.status] ?? ''
                        }`}
                      >
                        {RESERVATION_STATUS_LABELS[r.status] ?? r.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}
