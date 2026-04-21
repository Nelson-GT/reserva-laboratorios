'use client';

import { useState, useTransition } from 'react';
import { CheckCircle, XCircle } from 'lucide-react';
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
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

type User = {
  id: string;
  cedula: string;
  fullName: string;
  email: string;
  role: string;
  status: string;
  emailVerified: boolean;
  createdAt: string;
};

const STATUS_LABELS: Record<string, string> = {
  pending_email_verification: 'Pendiente de correo',
  pending_approval: 'Pendiente de aprobación',
};

const STATUS_COLORS: Record<string, string> = {
  pending_email_verification: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  pending_approval: 'bg-blue-100 text-blue-800 border-blue-200',
};

const ROLE_LABELS: Record<string, string> = {
  professor: 'Docente',
  student: 'Estudiante',
};

async function patchUser(id: string, status: string) {
  const res = await fetch(`/api/admin/users/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
  return res.ok;
}

export function PendingUsersTable({ users: initial }: { users: User[] }) {
  // Al aprobar o rechazar, el usuario sale de la lista
  const [users, setUsers] = useState(initial);
  const [isPending, startTransition] = useTransition();

  function remove(id: string) {
    setUsers((prev) => prev.filter((u) => u.id !== id));
  }

  function handleApprove(id: string) {
    startTransition(async () => {
      const ok = await patchUser(id, 'active');
      if (ok) remove(id);
    });
  }

  function handleReject(id: string) {
    startTransition(async () => {
      const ok = await patchUser(id, 'blocked');
      if (ok) remove(id);
    });
  }

  if (users.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 text-center text-slate-400">
        No hay solicitudes pendientes.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
      <Table>
        <TableHeader>
          <TableRow className="bg-slate-50">
            <TableHead>Nombre</TableHead>
            <TableHead>Cédula</TableHead>
            <TableHead>Correo</TableHead>
            <TableHead>Rol</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Registro</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id} className="hover:bg-slate-50">
              <TableCell className="font-medium">{user.fullName}</TableCell>
              <TableCell className="text-slate-600">{user.cedula}</TableCell>
              <TableCell className="text-slate-600 text-sm">{user.email}</TableCell>
              <TableCell>
                <Badge variant="outline">{ROLE_LABELS[user.role] ?? user.role}</Badge>
              </TableCell>
              <TableCell>
                <span
                  className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[user.status] ?? ''}`}
                >
                  {STATUS_LABELS[user.status] ?? user.status}
                </span>
              </TableCell>
              <TableCell className="text-slate-500 text-sm">
                {format(new Date(user.createdAt), 'dd/MM/yyyy', { locale: es })}
              </TableCell>
              <TableCell className="text-right">
                {user.status === 'pending_approval' ? (
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-green-700 border-green-300 hover:bg-green-50"
                      disabled={isPending}
                      onClick={() => handleApprove(user.id)}
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Aprobar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-700 border-red-300 hover:bg-red-50"
                      disabled={isPending}
                      onClick={() => handleReject(user.id)}
                    >
                      <XCircle className="w-4 h-4 mr-1" />
                      Rechazar
                    </Button>
                  </div>
                ) : (
                  <span className="text-xs text-slate-400 italic">
                    Esperando verificación de correo
                  </span>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
