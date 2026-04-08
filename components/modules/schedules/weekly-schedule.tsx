'use client';

import { Schedule, DayOfWeek } from '@/lib/types';

interface WeeklyScheduleProps {
  schedule: Schedule;
}

export function WeeklySchedule({ schedule }: WeeklyScheduleProps) {
  const days: { name: string; value: DayOfWeek }[] = [
    { name: 'Lunes', value: 'monday' },
    { name: 'Martes', value: 'tuesday' },
    { name: 'Miércoles', value: 'wednesday' },
    { name: 'Jueves', value: 'thursday' },
    { name: 'Viernes', value: 'friday' },
  ];

  const timeSlots = [
    '08:00',
    '10:00',
    '12:00',
    '14:00',
    '16:00',
  ];

  return (
    <div className="bg-white rounded-lg border border-slate-200 overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="bg-slate-100 border-b border-slate-200">
            <th className="px-4 py-3 text-left font-semibold text-slate-900 text-sm">
              Hora
            </th>
            {days.map((day) => (
              <th
                key={day.value}
                className="px-4 py-3 text-center font-semibold text-slate-900 text-sm min-w-32"
              >
                {day.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {timeSlots.map((time, timeIndex) => (
            <tr key={time} className="border-b border-slate-200 hover:bg-slate-50">
              <td className="px-4 py-3 font-medium text-slate-900 bg-slate-50">
                {time} - {String(parseInt(time) + 2).padStart(2, '0')}:00
              </td>
              {days.map((day) => {
                const slot = schedule.weekSlots.find(
                  (s) => s.day === day.value && s.startTime === time
                );
                const isOccupied = slot?.status === 'occupied';

                return (
                  <td
                    key={`${day.value}-${time}`}
                    className="px-4 py-3 text-center"
                  >
                    <div
                      className={`py-3 px-2 rounded-lg font-medium text-sm transition-colors ${
                        isOccupied
                          ? 'bg-blue-600 text-white'
                          : 'bg-green-100 text-green-800'
                      }`}
                    >
                      {isOccupied ? 'Ocupado' : 'Disponible'}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
