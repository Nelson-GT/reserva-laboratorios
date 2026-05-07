'use client';

import { Monitor } from 'lucide-react';

export type ComputerStatus = 'available' | 'maintenance' | 'out_of_service';

export type ComputerCardData = {
  id: string;
  publicId: string | null;
  number: number;
  status: ComputerStatus;
  createdAt: string;
  updatedAt: string;
  _count: { computerReservations: number };
};

const STATUS_CONFIG: Record<
  ComputerStatus,
  { dot: string; text: string; border: string; hover: string; label: string }
> = {
  available: {
    dot: 'bg-green-500',
    text: 'text-green-700',
    border: 'border-slate-200',
    hover: 'hover:border-green-300 hover:shadow-md',
    label: 'Disponible',
  },
  maintenance: {
    dot: 'bg-yellow-500',
    text: 'text-yellow-700',
    border: 'border-slate-200',
    hover: 'hover:border-yellow-300 hover:shadow-md',
    label: 'Mantenimiento',
  },
  out_of_service: {
    dot: 'bg-red-500',
    text: 'text-red-700',
    border: 'border-slate-200',
    hover: 'hover:border-red-300 hover:shadow-md',
    label: 'Fuera de Servicio',
  },
};

interface Props {
  computer: ComputerCardData;
  onClick?: (computer: ComputerCardData) => void;
}

export function ComputerCard({ computer, onClick }: Props) {
  const config = STATUS_CONFIG[computer.status];

  const inner = (
    <>
      <p className="text-[11px] font-mono font-semibold text-slate-400 truncate tracking-wide">
        {computer.publicId ?? '—'}
      </p>

      <div className="flex items-center gap-2">
        <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
          <Monitor className="w-4 h-4 text-slate-500" />
        </div>
        <span className="text-base font-bold text-slate-800">
          #{String(computer.number).padStart(2, '0')}
        </span>
      </div>

      <div className="flex items-center gap-1.5">
        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${config.dot}`} />
        <span className={`text-xs font-medium ${config.text}`}>{config.label}</span>
      </div>

      <p className="text-xs text-slate-400">
        {computer._count.computerReservations}{' '}
        {computer._count.computerReservations === 1 ? 'reserva' : 'reservas'}
      </p>
    </>
  );

  if (!onClick) {
    return (
      <div className={`bg-white rounded-xl border-2 p-4 shadow-sm flex flex-col gap-3 w-full ${config.border}`}>
        {inner}
      </div>
    );
  }

  return (
    <button
      onClick={() => onClick(computer)}
      className={`bg-white rounded-xl border-2 p-4 transition-all shadow-sm flex flex-col gap-3 w-full text-left cursor-pointer ${config.border} ${config.hover}`}
    >
      {inner}
    </button>
  );
}
