import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { ComputerReservationClient } from '@/components/modules/computers/computer-reservation-client';

export const metadata = {
  title: 'Reservar Computadora — Lab Manager',
};

export default async function ComputersPage() {
  const session = await getSession();
  if (!session || (session.role !== 'student' && session.role !== 'admin')) {
    redirect('/dashboard');
  }

  const laboratories = await prisma.laboratory.findMany({
    where: { status: 'available' },
    orderBy: { name: 'asc' },
    select: { id: true, name: true, capacity: true, operational: true },
  });

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-slate-900 mb-2">
          Reservar Computadora
        </h1>
        <p className="text-lg text-slate-600">
          Selecciona un laboratorio, la fecha y el horario para ver las
          computadoras disponibles.
        </p>
      </div>

      <ComputerReservationClient laboratories={laboratories} />
    </div>
  );
}
