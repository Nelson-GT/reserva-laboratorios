'use client';

import { useState, useMemo, useTransition } from 'react';
import { Pencil, Ban, CheckCircle, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';

type User = {
  id: string;
  cedula: string;
  fullName: string;
  email: string;
  role: string;
  status: string;
  createdAt: string;
};

const ROLE_LABELS: Record<string, string> = {
  professor: 'Docente',
  student: 'Estudiante',
};

async function patchUser(id: string, data: Record<string, string>) {
  const res = await fetch(`/api/admin/users/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const json = await res.json();
    throw new Error(json.error ?? 'Error al guardar');
  }
  return res.json();
}

export function UsersClient({ users: initial }: { users: User[] }) {
  const [users, setUsers] = useState(initial);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [editTarget, setEditTarget] = useState<User | null>(null);
  const [editForm, setEditForm] = useState({ fullName: '', cedula: '', email: '', role: '' });
  const [editError, setEditError] = useState('');
  const [isPending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return users.filter((u) => {
      const matchSearch =
        u.fullName.toLowerCase().includes(q) ||
        u.cedula.includes(q) ||
        u.email.toLowerCase().includes(q);
      const matchRole = roleFilter === 'all' || u.role === roleFilter;
      return matchSearch && matchRole;
    });
  }, [users, search, roleFilter]);

  function openEdit(user: User) {
    setEditForm({ fullName: user.fullName, cedula: user.cedula, email: user.email, role: user.role });
    setEditError('');
    setEditTarget(user);
  }

  function handleToggleStatus(user: User) {
    const newStatus = user.status === 'active' ? 'blocked' : 'active';
    startTransition(async () => {
      const updated = await patchUser(user.id, { status: newStatus }).catch(() => null);
      if (updated) {
        setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, status: newStatus } : u)));
      }
    });
  }

  function handleSaveEdit() {
    if (!editTarget) return;
    setEditError('');
    startTransition(async () => {
      try {
        const updated = await patchUser(editTarget.id, editForm);
        setUsers((prev) => prev.map((u) => (u.id === editTarget.id ? { ...u, ...updated } : u)));
        setEditTarget(null);
      } catch (e: any) {
        setEditError(e.message);
      }
    });
  }

  return (
    <>
      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Buscar por nombre, cédula o correo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Todos los roles" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los roles</SelectItem>
            <SelectItem value="professor">Docentes</SelectItem>
            <SelectItem value="student">Estudiantes</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Contador */}
      <p className="text-sm text-slate-500">
        {filtered.length} usuario{filtered.length !== 1 ? 's' : ''}
      </p>

      {/* Tabla */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50">
              <TableHead>Nombre</TableHead>
              <TableHead>Cédula</TableHead>
              <TableHead>Correo</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-slate-400">
                  No se encontraron usuarios.
                </TableCell>
              </TableRow>
            )}
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
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border ${
                      user.status === 'active'
                        ? 'bg-green-100 text-green-800 border-green-200'
                        : 'bg-red-100 text-red-800 border-red-200'
                    }`}
                  >
                    {user.status === 'active' ? 'Activo' : 'Bloqueado'}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openEdit(user)}
                      disabled={isPending}
                    >
                      <Pencil className="w-3.5 h-3.5 mr-1" />
                      Editar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={isPending}
                      onClick={() => handleToggleStatus(user)}
                      className={
                        user.status === 'active'
                          ? 'text-red-700 border-red-300 hover:bg-red-50'
                          : 'text-green-700 border-green-300 hover:bg-green-50'
                      }
                    >
                      {user.status === 'active' ? (
                        <>
                          <Ban className="w-3.5 h-3.5 mr-1" />
                          Bloquear
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-3.5 h-3.5 mr-1" />
                          Activar
                        </>
                      )}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Dialog de edición */}
      <Dialog open={!!editTarget} onOpenChange={(open) => !open && setEditTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar usuario</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label htmlFor="edit-fullName">Nombre completo</Label>
              <Input
                id="edit-fullName"
                value={editForm.fullName}
                onChange={(e) => setEditForm((f) => ({ ...f, fullName: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="edit-cedula">Cédula</Label>
              <Input
                id="edit-cedula"
                value={editForm.cedula}
                inputMode="numeric"
                onChange={(e) => setEditForm((f) => ({ ...f, cedula: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="edit-email">Correo electrónico</Label>
              <Input
                id="edit-email"
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="edit-role">Rol</Label>
              <Select
                value={editForm.role}
                onValueChange={(v) => setEditForm((f) => ({ ...f, role: v }))}
              >
                <SelectTrigger id="edit-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="professor">Docente</SelectItem>
                  <SelectItem value="student">Estudiante</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {editError && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {editError}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditTarget(null)} disabled={isPending}>
              Cancelar
            </Button>
            <Button onClick={handleSaveEdit} disabled={isPending}>
              {isPending ? 'Guardando...' : 'Guardar cambios'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
