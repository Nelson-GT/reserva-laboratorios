'use client';

import { useState, useTransition, useMemo } from 'react';
import { Loader2, CalendarCheck, RefreshCw, AlertCircle } from 'lucide-react';
import { createLabReservationAction, createRecurringLabReservationAction } from '@/app/actions/reservations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { TIME_SLOTS } from '@/lib/reservations';

type Lab = { id: string; name: string; capacity: number; operational: number };

const DAY_NAMES = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

export function NewLabReservationForm({ laboratories }: { laboratories: Lab[] }) {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{
    error?: string;
    success?: string;
    created?: string[];
    skipped?: string[];
  }>({});

  // Shared fields
  const [labId, setLabId] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [purpose, setPurpose] = useState('');

  // Single
  const [date, setDate] = useState('');

  // Recurring
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurStartDate, setRecurStartDate] = useState('');
  const [recurEndDate, setRecurEndDate] = useState('');

  const today = new Date().toISOString().split('T')[0];

  // Derived: day name from recurStartDate
  const recurDayName = useMemo(() => {
    if (!recurStartDate) return '';
    return DAY_NAMES[new Date(`${recurStartDate}T00:00:00`).getDay()];
  }, [recurStartDate]);

  // Preview count
  const previewCount = useMemo(() => {
    if (!recurStartDate || !recurEndDate) return 0;
    const start = new Date(`${recurStartDate}T00:00:00`);
    const end = new Date(`${recurEndDate}T00:00:00`);
    if (end <= start) return 0;
    const dow = start.getDay();
    let count = 0;
    const cur = new Date(start);
    while (cur <= end && count < 52) {
      if (cur.getDay() === dow) count++;
      cur.setDate(cur.getDate() + 1);
    }
    return count;
  }, [recurStartDate, recurEndDate]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setResult({});

    const formData = new FormData();
    formData.set('laboratoryId', labId);
    formData.set('startTime', startTime);
    formData.set('endTime', endTime);
    formData.set('purpose', purpose);

    if (isRecurring) {
      formData.set('startDate', recurStartDate);
      formData.set('endDate', recurEndDate);
      startTransition(async () => {
        const res = await createRecurringLabReservationAction({}, formData);
        setResult(res);
        if (res.success) {
          setLabId('');
          setStartTime('');
          setEndTime('');
          setPurpose('');
          setRecurStartDate('');
          setRecurEndDate('');
        }
      });
    } else {
      formData.set('date', date);
      startTransition(async () => {
        const res = await createLabReservationAction({}, formData);
        setResult(res);
        if (res.success) {
          setLabId('');
          setDate('');
          setStartTime('');
          setEndTime('');
          setPurpose('');
        }
      });
    }
  }

  return (
    <div className="max-w-xl">
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Laboratorio */}
          <div className="space-y-1">
            <Label htmlFor="laboratoryId">Laboratorio</Label>
            <select
              id="laboratoryId"
              value={labId}
              onChange={(e) => setLabId(e.target.value)}
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

          {/* Recurrence toggle */}
          <div className="flex items-center gap-3 py-1">
            <button
              type="button"
              role="switch"
              aria-checked={isRecurring}
              onClick={() => { setIsRecurring((v) => !v); setResult({}); }}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${
                isRecurring ? 'bg-blue-600' : 'bg-slate-300'
              }`}
            >
              <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${isRecurring ? 'translate-x-4.5' : 'translate-x-0.5'}`} />
            </button>
            <span className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
              <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
              Reserva recurrente semanal
            </span>
          </div>

          {/* Date / Recurrence dates */}
          {!isRecurring ? (
            <div className="space-y-1">
              <Label htmlFor="date">Fecha</Label>
              <Input
                id="date"
                type="date"
                min={today}
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="recurStart">Primera sesión</Label>
                  <Input
                    id="recurStart"
                    type="date"
                    min={today}
                    value={recurStartDate}
                    onChange={(e) => setRecurStartDate(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="recurEnd">Última posible</Label>
                  <Input
                    id="recurEnd"
                    type="date"
                    min={recurStartDate || today}
                    value={recurEndDate}
                    onChange={(e) => setRecurEndDate(e.target.value)}
                    required
                  />
                </div>
              </div>
              {recurDayName && recurEndDate && previewCount > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 text-sm text-blue-800">
                  Se crearán hasta <strong>{previewCount}</strong> reservas los{' '}
                  <strong>{recurDayName}s</strong> entre{' '}
                  {recurStartDate} y {recurEndDate}.
                </div>
              )}
            </div>
          )}

          {/* Horario */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="startTime">Hora de Inicio</Label>
              <select
                id="startTime"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
                className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="">Selecciona</option>
                {TIME_SLOTS.map((s) => (
                  <option key={s.start} value={s.start}>{s.start}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="endTime">Hora de Fin</Label>
              <select
                id="endTime"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
                className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="">Selecciona</option>
                {TIME_SLOTS.map((s) => (
                  <option key={s.end} value={s.end}>{s.end}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Propósito */}
          <div className="space-y-1">
            <Label htmlFor="purpose">Propósito / Asignatura</Label>
            <Textarea
              id="purpose"
              placeholder="Ej: Práctica de Bases de Datos — Sección 01"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              required
              rows={3}
            />
          </div>

          {/* Feedback */}
          {result.error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm flex items-start gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              {result.error}
            </div>
          )}

          {result.success && (
            <div className="space-y-2">
              <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg px-4 py-3 text-sm flex items-center gap-2">
                <CalendarCheck className="w-4 h-4" />
                {result.success}
              </div>
              {result.skipped && result.skipped.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 text-amber-700 rounded-lg px-4 py-3 text-sm">
                  <p className="font-medium mb-1">Sesiones omitidas por conflicto:</p>
                  <ul className="list-disc list-inside space-y-0.5">
                    {result.skipped.map((d) => <li key={d}>{d}</li>)}
                  </ul>
                </div>
              )}
            </div>
          )}

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Enviando solicitud...</>
            ) : isRecurring ? (
              'Solicitar reservas recurrentes'
            ) : (
              'Solicitar reserva'
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
