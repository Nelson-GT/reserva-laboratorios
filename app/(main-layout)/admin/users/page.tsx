import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { PendingUsersTable } from '@/components/modules/admin/pending-users-table';

export const metadata = { title: 'Solicitudes de acceso — Lab Manager' };

export default async function AdminUsersPage() {
  const session = await getSession();
  if (!session || session.role !== 'admin') redirect('/dashboard');

  // Solo pendientes (no aprobados, no bloqueados)
  const pendingUsers = await prisma.user.findMany({
    where: {
      status: { in: ['pending_email_verification', 'pending_approval'] },
      role: { not: 'admin' },
    },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      cedula: true,
      fullName: true,
      email: true,
      role: true,
      status: true,
      emailVerified: true,
      createdAt: true,
    },
  });

  const serialized = pendingUsers.map((u) => ({
    ...u,
    createdAt: u.createdAt.toISOString(),
  }));

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-slate-900 mb-2">
          Solicitudes de acceso
        </h1>
        <p className="text-lg text-slate-600">
          Usuarios que han solicitado acceso al sistema y están pendientes de
          validación de identidad.
        </p>
      </div>

      {serialized.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 text-center text-slate-400">
          No hay solicitudes de acceso pendientes.
        </div>
      ) : (
        <PendingUsersTable users={serialized} />
      )}
    </div>
  );
}
