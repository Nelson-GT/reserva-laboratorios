'use client';

import { useState, useTransition, useMemo } from 'react';
import { CheckCircle, XCircle, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
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
  pending_email_verification: 'Pendiente por verificación de correo',
  pending_approval: 'Pendiente por aprobación',
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
  const [users, setUsers] = useState(initial);
  const [search, setSearch] = useState('');
  const [isPending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return q
      ? users.filter(
          (u) =>
            u.fullName.toLowerCase().includes(q) ||
            u.cedula.includes(q) ||
            u.email.toLowerCase().includes(q)
        )
      : users;
  }, [users, search]);

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
    <>
      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          placeholder="Buscar por nombre, cédula de identidad o correo electrónico..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 text-center text-slate-400">
          No se encontraron solicitudes.
        </div>
      ) : (
      <div className="bg-white border-y border-slate-200 overflow-hidden shadow-sm">
      <Table>
        <TableHeader>
          <TableRow className="bg-slate-50">
            <TableHead>Nombre Completo</TableHead>
            <TableHead>Cédula de Identidad</TableHead>
            <TableHead>Correo Electrónico</TableHead>
            <TableHead>Rol</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Registro</TableHead>
            <TableHead className="text-right"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.map((user) => (
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
                      <CheckCircle className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-700 border-red-300 hover:bg-red-50"
                      disabled={isPending}
                      onClick={() => handleReject(user.id)}
                    >
                      <XCircle className="w-4 h-4" />
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
      )}
    </>
  );
}
