'use client';

import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { TablePagination } from '@/components/ui/table-pagination';
import { User, UserRole } from '@/lib/types';

interface UsersTableProps {
  users: User[];
}

export function UsersTable({ users }: UsersTableProps) {
  const PAGE_SIZE = 10;
  const [page, setPage] = useState(1);
  const paginated = users.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

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
        <TableHeader>
          <TableRow className="bg-slate-50 border-b border-slate-200">
            <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Cédula</TableHead>
            <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Nombre Completo</TableHead>
            <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Rol</TableHead>
            <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Estado</TableHead>
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
            paginated.map((user) => (
              <TableRow key={user.id} className="hover:bg-slate-50">
                <TableCell className="font-medium text-slate-900">
                  C.I. {user.cedula}
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
      <TablePagination total={users.length} page={page} pageSize={PAGE_SIZE} onPageChange={setPage} />
    </div>
  );
}
