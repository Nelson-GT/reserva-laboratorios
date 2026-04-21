import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { UsersClient } from '@/components/modules/users/users-client';

export const metadata = { title: 'Usuarios — Lab Manager' };

export default async function UsersPage() {
  const session = await getSession();
  if (!session || session.role !== 'admin') redirect('/dashboard');

  // Solo usuarios ya aprobados (activos o bloqueados), sin admins
  const users = await prisma.user.findMany({
    where: { status: { in: ['active', 'blocked'] }, role: { not: 'admin' } },
    orderBy: { fullName: 'asc' },
    select: {
      id: true,
      cedula: true,
      fullName: true,
      email: true,
      role: true,
      status: true,
      createdAt: true,
    },
  });

  const serialized = users.map((u) => ({
    ...u,
    createdAt: u.createdAt.toISOString(),
  }));

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-slate-900 mb-2">Usuarios</h1>
        <p className="text-lg text-slate-600">
          Administra los usuarios activos del sistema. Los nuevos usuarios pendientes
          de aprobación se gestionan en{' '}
          <a href="/admin/users" className="text-blue-600 hover:underline">
            Solicitudes de acceso
          </a>
          .
        </p>
      </div>

      <UsersClient users={serialized} />
    </div>
  );
}
