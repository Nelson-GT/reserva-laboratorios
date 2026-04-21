'use client';

import { useState, useActionState } from 'react';
import { Loader2, Monitor, CalendarCheck } from 'lucide-react';
import { createComputerReservationAction } from '@/app/actions/reservations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { TIME_SLOTS } from '@/lib/reservations';

type Lab = { id: string; name: string; capacity: number; operational: number };
type ComputerInfo = {
  id: string;
  number: number;
  status: string;
  available: boolean;
};

const initialState = { error: undefined, success: undefined };

export function ComputerReservationClient({
  laboratories,
}: {
  laboratories: Lab[];
}) {
  const [state, formAction, isPending] = useActionState(
    createComputerReservationAction,
    initialState
  );

  const [selectedLab, setSelectedLab] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [computers, setComputers] = useState<ComputerInfo[]>([]);
  const [selectedComputer, setSelectedComputer] = useState('');
  const [loadingComputers, setLoadingComputers] = useState(false);

  const today = new Date().toISOString().split('T')[0];

  async function loadComputers() {
    if (!selectedLab || !date || !startTime || !endTime) return;
    setLoadingComputers(true);
    setSelectedComputer('');
    try {
      const params = new URLSearchParams({
        laboratoryId: selectedLab,
        date,
        startTime,
        endTime,
      });
      const res = await fetch(`/api/computers?${params}`);
      const data = await res.json();
      setComputers(data);
    } finally {
      setLoadingComputers(false);
    }
  }

  const canSearch =
    selectedLab && date && startTime && endTime && startTime < endTime;

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <h3 className="text-base font-semibold text-slate-800 mb-4">
          1. Selecciona el horario
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2 space-y-1">
            <Label>Laboratorio</Label>
            <select
              value={selectedLab}
              onChange={(e) => {
                setSelectedLab(e.target.value);
                setComputers([]);
              }}
              className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="">Selecciona un laboratorio</option>
              {laboratories.map((lab) => (
                <option key={lab.id} value={lab.id}>
                  {lab.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <Label>Fecha</Label>
            <Input
              type="date"
              min={today}
              value={date}
              onChange={(e) => {
                setDate(e.target.value);
                setComputers([]);
              }}
            />
          </div>

          <div className="space-y-1">
            <Label>Hora de inicio</Label>
            <select
              value={startTime}
              onChange={(e) => {
                setStartTime(e.target.value);
                setComputers([]);
              }}
              className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="">Selecciona</option>
              {TIME_SLOTS.map((s) => (
                <option key={s.start} value={s.start}>
                  {s.start}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <Label>Hora de fin</Label>
            <select
              value={endTime}
              onChange={(e) => {
                setEndTime(e.target.value);
                setComputers([]);
              }}
              className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="">Selecciona</option>
              {TIME_SLOTS.map((s) => (
                <option key={s.end} value={s.end}>
                  {s.end}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2">
            <Button
              type="button"
              variant="outline"
              onClick={loadComputers}
              disabled={!canSearch || loadingComputers}
              className="w-full"
            >
              {loadingComputers ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Buscando...
                </>
              ) : (
                'Ver computadoras disponibles'
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Grid de computadoras */}
      {computers.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h3 className="text-base font-semibold text-slate-800 mb-2">
            2. Selecciona una computadora
          </h3>
          <div className="flex gap-4 mb-4 text-sm">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-green-500 inline-block" />
              Disponible
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-slate-300 inline-block" />
              Ocupada / Fuera de servicio
            </span>
          </div>
          <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2">
            {computers.map((c) => (
              <button
                key={c.id}
                type="button"
                disabled={!c.available}
                onClick={() =>
                  setSelectedComputer(c.id === selectedComputer ? '' : c.id)
                }
                className={`
                  flex flex-col items-center justify-center p-2 rounded-lg border-2 text-xs font-medium transition-all
                  ${
                    !c.available
                      ? 'border-slate-200 bg-slate-50 text-slate-300 cursor-not-allowed'
                      : c.id === selectedComputer
                      ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-md'
                      : 'border-green-300 bg-green-50 text-green-700 hover:border-green-500 hover:shadow-sm'
                  }
                `}
              >
                <Monitor className="w-4 h-4 mb-0.5" />
                {c.number}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Formulario de reserva */}
      {selectedComputer && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h3 className="text-base font-semibold text-slate-800 mb-4">
            3. Confirma tu reserva
          </h3>
          <form action={formAction} className="space-y-4">
            <input type="hidden" name="computerId" value={selectedComputer} />
            <input type="hidden" name="laboratoryId" value={selectedLab} />
            <input type="hidden" name="date" value={date} />
            <input type="hidden" name="startTime" value={startTime} />
            <input type="hidden" name="endTime" value={endTime} />

            <div className="bg-slate-50 rounded-lg p-3 text-sm text-slate-600 space-y-1">
              <p>
                <strong>Computadora:</strong>{' '}
                {computers.find((c) => c.id === selectedComputer)?.number}
              </p>
              <p>
                <strong>Laboratorio:</strong>{' '}
                {laboratories.find((l) => l.id === selectedLab)?.name}
              </p>
              <p>
                <strong>Fecha y hora:</strong> {date} de {startTime} a {endTime}
              </p>
            </div>

            <div className="space-y-1">
              <Label htmlFor="purpose">Propósito / Actividad</Label>
              <Textarea
                id="purpose"
                name="purpose"
                placeholder="Ej: Trabajo de programación — Proyecto Final"
                required
                rows={2}
              />
            </div>

            {state?.error && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
                {state.error}
              </div>
            )}

            {state?.success && (
              <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg px-4 py-3 text-sm flex items-center gap-2">
                <CalendarCheck className="w-4 h-4" />
                {state.success}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Reservando...
                </>
              ) : (
                'Confirmar reserva'
              )}
            </Button>
          </form>
        </div>
      )}
    </div>
  );
}
