'use client';

import { useState, useTransition, useMemo } from 'react';
import { Plus, AlertCircle, Loader2, Search } from 'lucide-react';
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
import { LaboratoryCard } from './laboratory-card';

type ComputerStatus = 'available' | 'maintenance' | 'out_of_service';
type LabStatus = 'available' | 'maintenance' | 'out_of_service';

type Lab = {
  id: string;
  name: string;
  description: string | null;
  capacity: number;
  operational: number;
  status: LabStatus;
  computers: { status: ComputerStatus }[];
};

export function LaboratoriesClient({
  labs: initial,
  isAdmin,
}: {
  labs: Lab[];
  isAdmin: boolean;
}) {
  const [labs, setLabs] = useState(initial);
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return q ? labs.filter((l) => l.name.toLowerCase().includes(q) || (l.description ?? '').toLowerCase().includes(q)) : labs;
  }, [labs, search]);

  const [name, setName] = useState('');
  const [capacity, setCapacity] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<LabStatus>('available');
  const [error, setError] = useState('');

  function handleOpen() {
    setName('');
    setCapacity('');
    setDescription('');
    setStatus('available');
    setError('');
    setOpen(true);
  }

  function handleSubmit() {
    const cap = parseInt(capacity, 10);

    if (!name.trim()) {
      setError('El nombre es requerido.');
      return;
    }
    if (!cap || cap < 1) {
      setError('La capacidad debe ser un número entero mayor a 0.');
      return;
    }
    if (cap > 100) {
      setError('La capacidad máxima es 100 computadoras.');
      return;
    }

    setError('');
    startTransition(async () => {
      const res = await fetch('/api/laboratories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          capacity: cap,
          operational: cap,
          description: description.trim() || null,
          status,
        }),
      });

      if (res.ok) {
        const newLab: Lab = await res.json();
        setLabs((prev) =>
          [...prev, newLab].sort((a, b) => a.name.localeCompare(b.name))
        );
        setOpen(false);
      } else {
        const data = await res.json();
        setError(data.error ?? 'No se pudo crear el laboratorio.');
      }
    });
  }

  return (
    <>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-slate-900 mb-2">Laboratorios</h1>
        <p className="text-lg text-slate-600">
          Gestione el estado y la disponibilidad de los laboratorios de informática.
        </p>
      </div>

      {/* Search + action */}
      <div className="flex gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Buscar laboratorio..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        {isAdmin && (
          <Button onClick={handleOpen} className="flex-shrink-0">
            <Plus className="w-4 h-4 mr-0.5" />
            Registrar
          </Button>
        )}
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400 shadow-sm">
          {labs.length === 0 ? 'No hay laboratorios registrados aún.' : 'No se encontraron laboratorios.'}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((lab) => (
            <LaboratoryCard key={lab.id} laboratory={lab} />
          ))}
        </div>
      )}

      {/* New Lab Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Laboratorio</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="new-lab-name">
                Nombre <span className="text-red-500">*</span>
              </Label>
              <Input
                id="new-lab-name"
                placeholder="Ej: Laboratorio E"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="new-lab-capacity">
                Número de Computadoras <span className="text-red-500">*</span>
              </Label>
              <Input
                id="new-lab-capacity"
                type="number"
                min={1}
                max={100}
                placeholder="Ej: 30"
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              />
              <p className="text-xs text-slate-500">
                Se crearán automáticamente las computadoras con sus IDs públicos.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="new-lab-desc">Descripción</Label>
              <Textarea
                id="new-lab-desc"
                placeholder="Ej: Laboratorio de cómputo general, planta baja."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Estado</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as LabStatus)}>
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

            {error && (
              <p className="text-sm text-red-600 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-0.5 animate-spin" />
                  Registrando…
                </>
              ) : (
                'Registrar'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
