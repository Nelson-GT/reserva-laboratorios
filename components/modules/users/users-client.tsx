'use client';

import { useState, useMemo, useTransition } from 'react';
import { Pencil, Ban, CheckCircle, Search, UserPlus, Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react';
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

  // ── Register ──────────────────────────────────────────────────────────────
  const [registerOpen, setRegisterOpen] = useState(false);
  const [regForm, setRegForm] = useState({ fullName: '', cedula: '', email: '', role: 'student', password: '' });
  const [regError, setRegError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  function openRegister() {
    setRegForm({ fullName: '', cedula: '', email: '', role: 'student', password: '' });
    setRegError('');
    setShowPassword(false);
    setRegisterOpen(true);
  }

  function handleRegister() {
    if (!regForm.fullName.trim() || !regForm.cedula.trim() || !regForm.email.trim() || !regForm.password) {
      setRegError('Todos los campos son requeridos.');
      return;
    }
    setRegError('');
    startTransition(async () => {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(regForm),
      });
      const data = await res.json();
      if (res.ok) {
        setUsers((prev) => [data, ...prev]);
        setRegisterOpen(false);
      } else {
        setRegError(data.error ?? 'No se pudo registrar el usuario.');
      }
    });
  }

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
      {/* Filtros + acción */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Buscar por nombre, cédula de identidad o correo electrónico..."
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
        <Button onClick={openRegister} className="flex-shrink-0 self-start sm:self-auto">
          <UserPlus className="w-4 h-4 mr-0.5" />
          Registrar
        </Button>
      </div>

      {/* Tabla */}
      <div className="bg-white border-y border-slate-200 overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50">
              <TableHead>Nombre Completo</TableHead>
              <TableHead>Cédula de Identidad</TableHead>
              <TableHead>Correo Electrónico</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right"></TableHead>
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
                      <Pencil className="w-3.5 h-3.5" />
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
                          <Ban className="w-3.5 h-3.5" />
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-3.5 h-3.5" />
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

      {/* Dialog de registro */}
      <Dialog open={registerOpen} onOpenChange={setRegisterOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Registrar Usuario</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="reg-fullName">Nombre Completo</Label>
              <Input
                id="reg-fullName"
                placeholder="Ej: Juan Pérez González"
                value={regForm.fullName}
                onChange={(e) => setRegForm((f) => ({ ...f, fullName: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reg-cedula">Cédula de Identidad</Label>
              <Input
                id="reg-cedula"
                placeholder="Ej: 12345678"
                inputMode="numeric"
                value={regForm.cedula}
                onChange={(e) => setRegForm((f) => ({ ...f, cedula: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reg-email">Correo Electrónico</Label>
              <Input
                id="reg-email"
                type="email"
                placeholder="Ej: usuario@ujap.edu.ve"
                value={regForm.email}
                onChange={(e) => setRegForm((f) => ({ ...f, email: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Rol</Label>
              <Select
                value={regForm.role}
                onValueChange={(v) => setRegForm((f) => ({ ...f, role: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">Estudiante</SelectItem>
                  <SelectItem value="professor">Docente</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="reg-password">Contraseña</Label>
              <div className="relative">
                <Input
                  id="reg-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Mínimo 8 caracteres"
                  value={regForm.password}
                  onChange={(e) => setRegForm((f) => ({ ...f, password: e.target.value }))}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            {regError && (
              <p className="text-sm text-red-600 flex items-center gap-1.5 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {regError}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRegisterOpen(false)} disabled={isPending}>
              Cancelar
            </Button>
            <Button onClick={handleRegister} disabled={isPending}>
              {isPending ? (
                <><Loader2 className="w-4 h-4 mr-1.5 animate-spin" />Registrando…</>
              ) : (
                'Registrar'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de edición */}
      <Dialog open={!!editTarget} onOpenChange={(open) => !open && setEditTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Actualizar Usuario</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="edit-fullName">Nombre Completo</Label>
              <Input
                id="edit-fullName"
                value={editForm.fullName}
                onChange={(e) => setEditForm((f) => ({ ...f, fullName: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-cedula">Cédula de Identidad</Label>
              <Input
                id="edit-cedula"
                value={editForm.cedula}
                inputMode="numeric"
                onChange={(e) => setEditForm((f) => ({ ...f, cedula: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email">Correo Electrónico</Label>
              <Input
                id="edit-email"
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
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
              {isPending ? 'Actualizando...' : 'Actualizar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
