'use client';

import { useActionState } from 'react';
import { Loader2, CalendarCheck } from 'lucide-react';
import { createLabReservationAction } from '@/app/actions/reservations';
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
import { TIME_SLOTS } from '@/lib/reservations';

type Lab = { id: string; name: string; capacity: number; operational: number };

const initialState = { error: undefined, success: undefined };

export function NewLabReservationForm({ laboratories }: { laboratories: Lab[] }) {
  const [state, formAction, isPending] = useActionState(
    createLabReservationAction,
    initialState
  );

  // Fecha mínima: hoy
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="max-w-xl">
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <form action={formAction} className="space-y-5">
          {/* Laboratorio */}
          <div className="space-y-1">
            <Label htmlFor="laboratoryId">Laboratorio</Label>
            <select
              id="laboratoryId"
              name="laboratoryId"
              required
              className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="">Selecciona un laboratorio</option>
              {laboratories.map((lab) => (
                <option key={lab.id} value={lab.id}>
                  {lab.name} — {lab.operational}/{lab.capacity} equipos
                </option>
              ))}
            </select>
          </div>

          {/* Fecha */}
          <div className="space-y-1">
            <Label htmlFor="date">Fecha</Label>
            <Input
              id="date"
              name="date"
              type="date"
              min={today}
              required
            />
          </div>

          {/* Horario */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="startTime">Hora de inicio</Label>
              <select
                id="startTime"
                name="startTime"
                required
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
              <Label htmlFor="endTime">Hora de fin</Label>
              <select
                id="endTime"
                name="endTime"
                required
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
          </div>

          {/* Propósito */}
          <div className="space-y-1">
            <Label htmlFor="purpose">Propósito / Asignatura</Label>
            <Textarea
              id="purpose"
              name="purpose"
              placeholder="Ej: Práctica de Bases de Datos — Sección 01"
              required
              rows={3}
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
                Enviando solicitud...
              </>
            ) : (
              'Solicitar reserva'
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
