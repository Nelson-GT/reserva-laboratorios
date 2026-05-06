'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Pencil, Plus, AlertCircle, Trash, History } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ComputerCard, type ComputerCardData, type ComputerStatus } from './computer-card';

type LabStatus = 'available' | 'maintenance' | 'out_of_service';

type Lab = {
  id: string;
  name: string;
  description: string | null;
  capacity: number;
  operational: number;
  status: LabStatus;
  computers: ComputerCardData[];
};

type StatusFilter = 'all' | ComputerStatus;

const STATUS_LABELS: Record<ComputerStatus, string> = {
  available: 'Disponibles',
  maintenance: 'Mantenimiento',
  out_of_service: 'Fuera de Servicio',
};

const COMPUTER_STATUS_CONFIG: Record<ComputerStatus, { dot: string; text: string; label: string }> = {
  available: { dot: 'bg-green-500', text: 'text-green-700', label: 'Disponible' },
  maintenance: { dot: 'bg-yellow-500', text: 'text-yellow-700', label: 'Mantenimiento' },
  out_of_service: { dot: 'bg-red-500', text: 'text-red-700', label: 'Fuera de Servicio' },
};

const LAB_STATUS_CONFIG: Record<LabStatus, { label: string; className: string }> = {
  available: { label: 'Disponible', className: 'bg-green-100 text-green-800 border-green-300' },
  maintenance: { label: 'En Mantenimiento', className: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
  out_of_service: { label: 'Fuera de Servicio', className: 'bg-red-100 text-red-800 border-red-300' },
};

function StatCard({ label, value, color }: { label: string; value: number; color: 'slate' | 'green' | 'yellow' | 'red' }) {
  const styles = {
    slate: 'bg-slate-50 border-slate-200 text-slate-700',
    green: 'bg-green-50 border-green-200 text-green-700',
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-700',
    red: 'bg-red-50 border-red-200 text-red-700',
  };
  return (
    <div className={`rounded-xl border p-4 ${styles[color]}`}>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-sm font-medium">{label}</p>
    </div>
  );
}

export function LabDetailClient({ lab: initial, isAdmin }: { lab: Lab; isAdmin: boolean }) {
  const router = useRouter();
  const [lab, setLab] = useState(initial);
  const [computers, setComputers] = useState<ComputerCardData[]>(initial.computers);
  const [filter, setFilter] = useState<StatusFilter>('all');
  const [isPending, startTransition] = useTransition();

  // ── Edit Lab ──────────────────────────────────────────────────────────────
  const [editLabOpen, setEditLabOpen] = useState(false);
  const [editName, setEditName] = useState(lab.name);
  const [editDescription, setEditDescription] = useState(lab.description ?? '');
  const [editLabStatus, setEditLabStatus] = useState<LabStatus>(lab.status);
  const [editLabError, setEditLabError] = useState('');

  function openEditLab() {
    setEditName(lab.name);
    setEditDescription(lab.description ?? '');
    setEditLabStatus(lab.status);
    setEditLabError('');
    setEditLabOpen(true);
  }

  function handleSaveLab() {
    if (!editName.trim()) return;
    setEditLabError('');
    startTransition(async () => {
      const res = await fetch(`/api/laboratories/${lab.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName.trim(), description: editDescription.trim() || null, status: editLabStatus }),
      });
      if (res.ok) {
        const updated = await res.json();
        setLab((prev) => ({ ...prev, ...updated }));
        setEditLabOpen(false);
      } else {
        setEditLabError('No se pudo guardar. Inténtalo de nuevo.');
      }
    });
  }

  // ── Add Computer ──────────────────────────────────────────────────────────
  function handleAddComputer() {
    startTransition(async () => {
      const res = await fetch(`/api/laboratories/${lab.id}/computers`, { method: 'POST' });
      if (res.ok) {
        const newComputer = await res.json();
        setComputers((prev) => [...prev, { ...newComputer, _count: { computerReservations: 0 } }]);
        setLab((prev) => ({ ...prev, capacity: prev.capacity + 1 }));
      }
    });
  }

  // ── Computer Modal (view + edit status) ──────────────────────────────────
  const [computerModalOpen, setComputerModalOpen] = useState(false);
  const [selectedComputer, setSelectedComputer] = useState<ComputerCardData | null>(null);
  const [editComputerStatus, setEditComputerStatus] = useState<ComputerStatus>('available');

  function openComputerModal(computer: ComputerCardData) {
    setSelectedComputer(computer);
    setEditComputerStatus(computer.status);
    setComputerModalOpen(true);
  }

  function handleSaveComputer() {
    if (!selectedComputer) return;
    startTransition(async () => {
      const res = await fetch(`/api/computers/${selectedComputer.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: editComputerStatus }),
      });
      if (res.ok) {
        setComputers((prev) =>
          prev.map((c) => c.id === selectedComputer.id ? { ...c, status: editComputerStatus } : c)
        );
        setComputerModalOpen(false);
        setSelectedComputer(null);
      }
    });
  }

  // ── Delete Computer ───────────────────────────────────────────────────────
  const [deleteComputerOpen, setDeleteComputerOpen] = useState(false);
  const [deletingComputer, setDeletingComputer] = useState<ComputerCardData | null>(null);
  const [deleteError, setDeleteError] = useState('');

  function openDeleteComputer(computer: ComputerCardData) {
    setComputerModalOpen(false);
    setDeletingComputer(computer);
    setDeleteError('');
    setDeleteComputerOpen(true);
  }

  function handleDeleteComputer() {
    if (!deletingComputer) return;
    setDeleteError('');
    startTransition(async () => {
      const res = await fetch(`/api/computers/${deletingComputer.id}`, { method: 'DELETE' });
      if (res.ok) {
        setComputers((prev) => prev.filter((c) => c.id !== deletingComputer.id));
        setLab((prev) => ({ ...prev, capacity: prev.capacity - 1 }));
        setDeleteComputerOpen(false);
        setDeletingComputer(null);
      } else {
        const data = await res.json();
        setDeleteError(data.error ?? 'No se pudo eliminar el computador.');
      }
    });
  }

  // ── Delete Lab ────────────────────────────────────────────────────────────
  const [deleteLabOpen, setDeleteLabOpen] = useState(false);
  const [deleteLabError, setDeleteLabError] = useState('');

  function openDeleteLab() {
    setDeleteLabError('');
    setDeleteLabOpen(true);
  }

  function handleDeleteLab() {
    setDeleteLabError('');
    startTransition(async () => {
      const res = await fetch(`/api/laboratories/${lab.id}`, { method: 'DELETE' });
      if (res.ok) {
        router.push('/laboratories');
      } else {
        const data = await res.json();
        setDeleteLabError(data.error ?? 'No se pudo eliminar el laboratorio.');
      }
    });
  }

  // ── Derived ───────────────────────────────────────────────────────────────
  const counts = {
    total: computers.length,
    available: computers.filter((c) => c.status === 'available').length,
    maintenance: computers.filter((c) => c.status === 'maintenance').length,
    out_of_service: computers.filter((c) => c.status === 'out_of_service').length,
  };

  const filtered = filter === 'all' ? computers : computers.filter((c) => c.status === filter);

  return (
    <>
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-slate-900 mb-1">{lab.name}</h1>
          {lab.description && <p className="text-lg text-slate-600 mt-1">{lab.description}</p>}
        </div>
        {isAdmin && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={openEditLab} className="flex-shrink-0">
              <Pencil className="w-4 h-4 mr-0.5" />
              Actualizar
            </Button>
            <Button variant="destructive" size="sm" onClick={openDeleteLab} className="flex-shrink-0">
              <Trash className="w-4 h-4 mr-0.5" />
              Eliminar
            </Button>
          </div>
        )}
      </div>

      {/* ── Stats ──────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Total" value={counts.total} color="slate" />
        <StatCard label="Disponibles" value={counts.available} color="green" />
        <StatCard label="Mantenimiento" value={counts.maintenance} color="yellow" />
        <StatCard label="Fuera de Servicio" value={counts.out_of_service} color="red" />
      </div>

      {/* ── Filter bar + Add button ─────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {(['all', 'available', 'maintenance', 'out_of_service'] as const).map((f) => {
            const count = f === 'all' ? counts.total : counts[f];
            return (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                  filter === f
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-600 border-slate-300 hover:border-slate-500'
                }`}
              >
                {f === 'all' ? 'Todos' : STATUS_LABELS[f]}{' '}
                <span className="opacity-60">({count})</span>
              </button>
            );
          })}
        </div>
        {isAdmin && (
          <Button size="sm" onClick={handleAddComputer} disabled={isPending}>
            <Plus className="w-4 h-4 mr-0.5" />
            Registrar Computador
          </Button>
        )}
      </div>

      {/* ── Computer grid ──────────────────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400 shadow-sm">
          No hay computadores en esta categoría.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {filtered.map((computer) => (
            <ComputerCard
              key={computer.id}
              computer={computer}
              onClick={openComputerModal}
            />
          ))}
        </div>
      )}

      {/* ── Edit Lab Dialog ─────────────────────────────────────────────────── */}
      <Dialog open={editLabOpen} onOpenChange={setEditLabOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Actualizar Laboratorio</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="lab-name">Nombre</Label>
              <Input id="lab-name" value={editName} onChange={(e) => setEditName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lab-desc">Descripción</Label>
              <Textarea id="lab-desc" value={editDescription} onChange={(e) => setEditDescription(e.target.value)} rows={2} />
            </div>
            <div className="space-y-1.5">
              <Label>Estado</Label>
              <Select value={editLabStatus} onValueChange={(v) => setEditLabStatus(v as LabStatus)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">Disponible</SelectItem>
                  <SelectItem value="maintenance">En Mantenimiento</SelectItem>
                  <SelectItem value="out_of_service">Fuera de Servicio</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {editLabError && (
              <p className="text-sm text-red-600 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4" /> {editLabError}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditLabOpen(false)}>Cancelar</Button>
            <Button onClick={handleSaveLab} disabled={isPending || !editName.trim()}>Actualizar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Computer Detail Modal ────────────────────────────────────────────── */}
      <Dialog open={computerModalOpen} onOpenChange={(open) => { if (!open) { setComputerModalOpen(false); setSelectedComputer(null); } }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>
              <span className="font-mono text-slate-500 text-sm font-normal block mb-0.5">
                {selectedComputer?.publicId ?? '—'}
              </span>
              Computador #{String(selectedComputer?.number ?? 0).padStart(2, '0')}
            </DialogTitle>
          </DialogHeader>

          {selectedComputer && (
            <div className="space-y-4 py-2">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${COMPUTER_STATUS_CONFIG[selectedComputer.status].dot}`} />
                <span className={COMPUTER_STATUS_CONFIG[selectedComputer.status].text}>
                  {COMPUTER_STATUS_CONFIG[selectedComputer.status].label}
                </span>
                <span className="text-slate-300">·</span>
                <span className="text-slate-400">
                  {selectedComputer._count.computerReservations}{' '}
                  {selectedComputer._count.computerReservations === 1 ? 'reserva' : 'reservas'}
                </span>
              </div>

              {isAdmin && (
                <div className="space-y-1.5">
                  <Select
                    value={editComputerStatus}
                    onValueChange={(v) => setEditComputerStatus(v as ComputerStatus)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="available">Disponible</SelectItem>
                      <SelectItem value="maintenance">En Mantenimiento</SelectItem>
                      <SelectItem value="out_of_service">Fuera de Servicio</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <Link
                href={`/laboratories/${lab.id}/computers/${selectedComputer.id}`}
                className="flex items-center gap-1.5 w-full py-2 px-3 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-100 transition-colors"
              >
                <History className="w-4 h-4" />
                Ver historial de reservas
              </Link>
            </div>
          )}

          <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
            {isAdmin && selectedComputer && (
              <Button
                variant="destructive"
                className="sm:mr-auto"
                onClick={() => openDeleteComputer(selectedComputer)}
                disabled={isPending}
              >
                <Trash className="w-4 h-4 mr-1" />
                Eliminar
              </Button>
            )}
            {isAdmin && (
              <Button
                onClick={handleSaveComputer}
                disabled={isPending || editComputerStatus === selectedComputer?.status}
              >
                Actualizar
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Lab Dialog ────────────────────────────────────────────────── */}
      <Dialog open={deleteLabOpen} onOpenChange={setDeleteLabOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar Laboratorio</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-slate-600 text-sm">
              ¿Está seguro de que desea eliminar <strong>{lab.name}</strong>? El laboratorio
              desaparecerá del sistema, pero su historial de reservas se conservará.
            </p>
            <p className="text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
              Esta operación es reversible desde la base de datos.
            </p>
            {deleteLabError && (
              <p className="text-sm text-red-600 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {deleteLabError}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteLabOpen(false)} disabled={isPending}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDeleteLab} disabled={isPending}>Eliminar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Computer Dialog ───────────────────────────────────────────── */}
      <Dialog open={deleteComputerOpen} onOpenChange={setDeleteComputerOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar computador</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-slate-600 text-sm">
              ¿Estás seguro de que deseas eliminar el computador{' '}
              <strong>{deletingComputer?.publicId ?? `#${deletingComputer?.number}`}</strong>?
              Esta acción no se puede deshacer.
            </p>
            {deletingComputer && deletingComputer._count.computerReservations > 0 && (
              <p className="text-xs text-slate-500">
                Este equipo tiene <strong>{deletingComputer._count.computerReservations}</strong> reservas en su historial.
              </p>
            )}
            {deleteError && (
              <p className="text-sm text-red-600 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4" /> {deleteError}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteComputerOpen(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDeleteComputer} disabled={isPending}>Eliminar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
