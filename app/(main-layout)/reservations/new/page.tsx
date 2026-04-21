import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { NewLabReservationForm } from '@/components/modules/reservations/new-lab-reservation-form';

export const metadata = {
  title: 'Nueva Reserva de Laboratorio — Lab Manager',
};

export default async function NewLabReservationPage() {
  const session = await getSession();
  if (!session || (session.role !== 'professor' && session.role !== 'admin')) {
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
          Reservar Laboratorio
        </h1>
        <p className="text-lg text-slate-600">
          Solicita la reserva de un laboratorio para tus clases. El administrador
          aprobará tu solicitud.
        </p>
      </div>

      <NewLabReservationForm laboratories={laboratories} />
    </div>
  );
}
