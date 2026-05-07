import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { Monitor } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { Metadata } from 'next';
import { ComputerHistoryTable } from '@/components/modules/laboratories/computer-history-table';

type Props = { params: Promise<{ id: string; computerId: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { computerId } = await params;
  const computer = await prisma.computer.findUnique({
    where: { id: computerId },
    select: { publicId: true, number: true },
  });
  const label = computer?.publicId ?? `Computador #${computer?.number}`;
  return { title: `${label} — Lab Manager` };
}

const COMPUTER_STATUS_CONFIG: Record<
  string,
  { label: string; className: string; dot: string }
> = {
  available: {
    label: 'Disponible',
    className: 'bg-green-100 text-green-800 border-green-200',
    dot: 'bg-green-500',
  },
  maintenance: {
    label: 'En Mantenimiento',
    className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    dot: 'bg-yellow-500',
  },
  out_of_service: {
    label: 'Fuera de Servicio',
    className: 'bg-red-100 text-red-800 border-red-200',
    dot: 'bg-red-500',
  },
};

export default async function ComputerHistoryPage({ params }: Props) {
  const session = await getSession();
  if (!session) redirect('/login');
  if (session.role !== 'admin') redirect('/laboratories');

  const { id: laboratoryId, computerId } = await params;

  const computer = await prisma.computer.findFirst({
    where: { id: computerId, laboratoryId },
    include: {
      laboratory: { select: { id: true, name: true } },
      computerReservations: {
        include: {
          reservation: {
            include: {
              user: { select: { fullName: true, cedula: true, role: true } },
            },
          },
        },
        orderBy: { reservation: { date: 'desc' } },
      },
    },
  });

  if (!computer) notFound();

  const reservations = computer.computerReservations.map((cr) => ({
    ...cr.reservation,
    user: cr.reservation.user,
  }));

  const statusConfig = COMPUTER_STATUS_CONFIG[computer.status];

  const statusCounts = {
    pending: reservations.filter((r) => r.status === 'pending').length,
    approved: reservations.filter((r) => r.status === 'approved').length,
    rejected: reservations.filter((r) => r.status === 'rejected').length,
    cancelled: reservations.filter((r) => r.status === 'cancelled').length,
    finished: reservations.filter((r) => r.status === 'finished').length,
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-slate-500">
        <Link href="/laboratories" className="hover:text-slate-700 transition-colors">
          Laboratorios
        </Link>
        <span>/</span>
        <Link href={`/laboratories/${laboratoryId}`} className="hover:text-slate-700 transition-colors">
          {computer.laboratory.name}
        </Link>
        <span>/</span>
        <span className="text-slate-700 font-medium">
          {computer.publicId ?? `Computador #${computer.number}`}
        </span>
      </nav>

      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0">
          <Monitor className="w-6 h-6 text-slate-500" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            {computer.publicId ?? `Computador #${computer.number}`}
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Computadora #{String(computer.number).padStart(2, '0')} — {computer.laboratory.name}
          </p>
        </div>
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">
            Estado operativo
          </p>
          <div className="flex items-center gap-1.5">
            <span className={`w-2.5 h-2.5 rounded-full ${statusConfig.dot}`} />
            <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusConfig.className}`}>
              {statusConfig.label}
            </span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">
            Registrado en
          </p>
          <p className="text-sm font-medium text-slate-800">
            {format(computer.createdAt, "dd 'de' MMMM, yyyy", { locale: es })}
          </p>
        </div>
      </div>

      {/* Stats strip */}
      {reservations.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
          {(
            [
              ['pending', 'Pendientes', 'text-yellow-700 bg-yellow-50 border-yellow-200'],
              ['approved', 'Aprobadas', 'text-green-700 bg-green-50 border-green-200'],
              ['finished', 'Finalizadas', 'text-blue-700 bg-blue-50 border-blue-200'],
              ['rejected', 'Rechazadas', 'text-red-700 bg-red-50 border-red-200'],
              ['cancelled', 'Canceladas', 'text-slate-600 bg-slate-50 border-slate-200'],
            ] as const
          ).map(([key, label, cls]) => (
            <div key={key} className={`rounded-xl border p-3 text-center ${cls}`}>
              <p className="text-xl font-bold">{statusCounts[key]}</p>
              <p className="text-xs font-medium">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Reservation history */}
      <div>
        <h2 className="text-xl font-semibold text-slate-800 mb-4">
          Historial de reservaciones
          <span className="ml-2 text-sm font-normal text-slate-500">
            ({reservations.length})
          </span>
        </h2>
        <ComputerHistoryTable reservations={reservations} />
      </div>
    </div>
  );
}
