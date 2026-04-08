'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { User, UserRole } from '@/lib/types';

interface UsersTableProps {
  users: User[];
}

export function UsersTable({ users }: UsersTableProps) {
  const getRoleLabel = (role: UserRole): string => {
    const roleMap: Record<UserRole, string> = {
      admin: 'Administrador',
      professor: 'Profesor',
      student: 'Estudiante',
    };
    return roleMap[role];
  };

  const getStatusVariant = (status: string) => {
    return status === 'active' ? 'default' : 'destructive';
  };

  const getStatusLabel = (status: string): string => {
    return status === 'active' ? 'Activo' : 'Bloqueado';
  };

  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden">
      <Table>
        <TableHeader className="bg-slate-100">
          <TableRow>
            <TableHead className="font-semibold text-slate-900">Cédula</TableHead>
            <TableHead className="font-semibold text-slate-900">Nombre Completo</TableHead>
            <TableHead className="font-semibold text-slate-900">Rol</TableHead>
            <TableHead className="font-semibold text-slate-900">Estado</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="text-center text-slate-500 py-8">
                No se encontraron usuarios
              </TableCell>
            </TableRow>
          ) : (
            users.map((user) => (
              <TableRow key={user.id} className="hover:bg-slate-50">
                <TableCell className="font-medium text-slate-900">
                  {user.cedula}
                </TableCell>
                <TableCell className="text-slate-700">{user.fullName}</TableCell>
                <TableCell>
                  <span className="text-slate-700">
                    {getRoleLabel(user.role)}
                  </span>
                </TableCell>
                <TableCell>
                  <Badge variant={getStatusVariant(user.status)}>
                    {getStatusLabel(user.status)}
                  </Badge>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
