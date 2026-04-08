'use client';

import { Reservation } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Check, X } from 'lucide-react';
import { useState } from 'react';

interface ReservationRowProps {
  reservation: Reservation;
}

export function ReservationRow({ reservation }: ReservationRowProps) {
  const [status, setStatus] = useState(reservation.status);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      case 'finished':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  const getStatusLabel = (status: string): string => {
    const labels: Record<string, string> = {
      pending: 'Pendiente',
      approved: 'Aprobada',
      rejected: 'Rechazada',
      cancelled: 'Cancelada',
      finished: 'Finalizada',
    };
    return labels[status] || status;
  };

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-4 flex items-center justify-between hover:shadow-md transition-shadow">
      <div className="flex-1">
        <div className="flex items-center gap-4 mb-2">
          <h3 className="font-semibold text-slate-900">{reservation.id}</h3>
          <Badge className={getStatusColor(status)}>
            {getStatusLabel(status)}
          </Badge>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm text-slate-600">
          <div>
            <p className="font-medium text-slate-700">Solicitante</p>
            <p>{reservation.requesterName}</p>
            <p className="text-xs">{reservation.requesterCedula}</p>
          </div>
          <div>
            <p className="font-medium text-slate-700">Laboratorio</p>
            <p>{reservation.laboratoryName}</p>
          </div>
          <div>
            <p className="font-medium text-slate-700">Fecha y Hora</p>
            <p>
              {new Date(reservation.date).toLocaleDateString('es-ES', {
                weekday: 'short',
                day: 'numeric',
                month: 'short',
              })}
            </p>
            <p className="text-xs">
              {reservation.startTime} - {reservation.endTime}
            </p>
          </div>
          <div>
            <p className="font-medium text-slate-700">Creada</p>
            <p className="text-xs">{reservation.createdAt}</p>
          </div>
        </div>
      </div>

      {/* Action Buttons for Pending Reservations */}
      {status === 'pending' && (
        <div className="flex gap-2 ml-4 flex-shrink-0">
          <Button
            size="sm"
            className="bg-green-600 hover:bg-green-700 text-white"
            onClick={() => setStatus('approved')}
          >
            <Check className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            className="bg-red-600 hover:bg-red-700 text-white"
            onClick={() => setStatus('rejected')}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
