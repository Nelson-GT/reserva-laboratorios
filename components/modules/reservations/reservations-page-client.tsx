'use client';

import { useState, useTransition } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { CheckCircle, XCircle, Ban, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

type Reservation = {
  id: string;
  status: string;
  type: string;
  date: string;
  startTime: string;
  endTime: string;
  purpose: string | null;
  createdAt: string;
  user: { fullName: string; cedula: string; role: string };
  laboratory: { name: string };
  computerReservations: { computer: { number: number } }[];
};

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

const TABS = ['pending', 'approved', 'rejected', 'cancelled', 'finished'];

async function patchReservation(id: string, status: string) {
  await fetch(`/api/reservations/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
}

export function ReservationsPageClient({
  reservations: initial,
  isAdmin,
  currentUserId,
}: {
  reservations: Reservation[];
  isAdmin: boolean;
  currentUserId: string;
}) {
  const [reservations, setReservations] = useState(initial);
  const [isPending, startTransition] = useTransition();

  function handleStatus(id: string, newStatus: string) {
    startTransition(async () => {
      await patchReservation(id, newStatus);
      setReservations((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r))
      );
    });
  }

  return (
    <Tabs defaultValue="pending">
      <TabsList className="flex-wrap h-auto">
        {TABS.map((tab) => {
          const count = reservations.filter((r) => r.status === tab).length;
          return (
            <TabsTrigger key={tab} value={tab} className="gap-1.5">
              {STATUS_LABELS[tab]}
              {count > 0 && (
                <span className="ml-1 bg-slate-200 text-slate-700 rounded-full px-1.5 py-0 text-xs">
                  {count}
                </span>
              )}
            </TabsTrigger>
          );
        })}
      </TabsList>

      {TABS.map((tab) => {
        const filtered = reservations.filter((r) => r.status === tab);
        return (
          <TabsContent key={tab} value={tab}>
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm mt-4">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    {isAdmin && <TableHead>Solicitante</TableHead>}
                    <TableHead>Laboratorio</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Horario</TableHead>
                    <TableHead>Propósito</TableHead>
                    {isAdmin && tab === 'pending' && (
                      <TableHead className="text-right">Acciones</TableHead>
                    )}
                    {!isAdmin && tab === 'pending' && (
                      <TableHead className="text-right">Acciones</TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={isAdmin ? 7 : 6}
                        className="text-center py-12 text-slate-400"
                      >
                        No hay reservas en esta categoría.
                      </TableCell>
                    </TableRow>
                  )}
                  {filtered.map((r) => (
                    <TableRow key={r.id} className="hover:bg-slate-50">
                      {isAdmin && (
                        <TableCell>
                          <div>
                            <p className="font-medium text-sm">{r.user.fullName}</p>
                            <p className="text-xs text-slate-400">{r.user.cedula}</p>
                          </div>
                        </TableCell>
                      )}
                      <TableCell className="font-medium">
                        {r.laboratory.name}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {r.type === 'lab' ? 'Laboratorio' : 'Computadora'}
                          {r.type === 'computer' &&
                            r.computerReservations[0] &&
                            ` #${r.computerReservations[0].computer.number}`}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-slate-600 text-sm">
                        {r.date}
                      </TableCell>
                      <TableCell className="text-slate-600 text-sm whitespace-nowrap">
                        {r.startTime} – {r.endTime}
                      </TableCell>
                      <TableCell className="text-slate-600 text-sm max-w-[200px] truncate">
                        {r.purpose ?? '—'}
                      </TableCell>
                      {isAdmin && tab === 'pending' && (
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-green-700 border-green-300 hover:bg-green-50"
                              disabled={isPending}
                              onClick={() => handleStatus(r.id, 'approved')}
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Aprobar
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-700 border-red-300 hover:bg-red-50"
                              disabled={isPending}
                              onClick={() => handleStatus(r.id, 'rejected')}
                            >
                              <XCircle className="w-4 h-4 mr-1" />
                              Rechazar
                            </Button>
                          </div>
                        </TableCell>
                      )}
                      {!isAdmin && tab === 'pending' && (
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-700 border-red-300 hover:bg-red-50"
                            disabled={isPending}
                            onClick={() => handleStatus(r.id, 'cancelled')}
                          >
                            <Ban className="w-4 h-4 mr-1" />
                            Cancelar
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        );
      })}
    </Tabs>
  );
}
