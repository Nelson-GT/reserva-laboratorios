'use client';

import { useState } from 'react';
import { WeeklySchedule } from '@/components/modules/schedules/weekly-schedule';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getMockSchedule, getMockLaboratories } from '@/lib/mock-data';

export default function SchedulesPage() {
  const [selectedLabId, setSelectedLabId] = useState('lab-1');
  const laboratories = getMockLaboratories();
  const schedule = getMockSchedule(selectedLabId);

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-slate-900 mb-2">Horarios</h1>
        <p className="text-lg text-slate-600">
          Vista semanal de disponibilidad de laboratorios.
        </p>
      </div>

      <div>
        <label className="text-sm font-medium text-slate-700 block mb-2">
          Seleccionar Laboratorio
        </label>
        <Select value={selectedLabId} onValueChange={setSelectedLabId}>
          <SelectTrigger className="w-full md:w-64">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {laboratories.map((lab) => (
              <SelectItem key={lab.id} value={lab.id}>
                {lab.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <WeeklySchedule schedule={schedule} />
    </div>
  );
}
