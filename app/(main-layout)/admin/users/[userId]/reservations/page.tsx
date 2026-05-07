import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { UserReservationsClient } from '@/components/modules/users/user-reservations-client';

const ROLE_LABELS: Record<string, string> = {
  professor: 'Docente',
  student: 'Estudiante',
};

type Props = { params: Promise<{ userId: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { userId } = await params;
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { fullName: true } });
  return { title: `${user?.fullName ?? 'Usuario'} — Reservas — Lab Manager` };
}

export default async function UserReservationsPage({ params }: Props) {
  const session = await getSession();
  if (!session || session.role !== 'admin') redirect('/dashboard');

  const { userId } = await params;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, fullName: true, cedula: true, email: true, role: true },
  });

  if (!user) notFound();

  const reservations = await prisma.reservation.findMany({
    where: { userId },
    include: {
      laboratory: { select: { name: true } },
      computerReservations: {
        include: { computer: { select: { number: true, publicId: true } } },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  const serialized = reservations.map((r) => ({
    ...r,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  }));

  return (
    <div className="space-y-6">
      <nav className="flex items-center gap-1.5 text-sm text-slate-500">
        <Link href="/users" className="hover:text-slate-700 transition-colors">
          Usuarios
        </Link>
        <span>/</span>
        <span className="text-slate-700 font-medium">{user.fullName}</span>
      </nav>

      <div>
        <h1 className="text-4xl font-bold text-slate-900 mb-1">Historial de Reservas</h1>
        <p className="text-slate-500 text-sm mt-1">
          {user.fullName} · C.I. {user.cedula} · {user.email}
        </p>
      </div>

      <UserReservationsClient reservations={serialized} />
    </div>
  );
}
