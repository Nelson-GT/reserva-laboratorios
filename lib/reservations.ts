/**
 * Utilidades para la lógica de disponibilidad y conflictos de reservas.
 */

/** Comprueba si dos rangos horarios se solapan.
 *  Formato esperado: "HH:MM" (e.g. "07:00", "09:30")
 */
export function timesOverlap(
  startA: string,
  endA: string,
  startB: string,
  endB: string
): boolean {
  return startA < endB && endA > startB;
}

export function getEffectiveStatus(reservation: {
  status: string;
  date: string;
  endTime: string;
}): string {
  if (reservation.status !== 'approved') return reservation.status;
  const dateStr = reservation.date.slice(0, 10);
  const endDateTime = new Date(`${dateStr}T${reservation.endTime}:00`);
  return new Date() > endDateTime ? 'finished' : reservation.status;
}

export const TIME_SLOTS = Array.from({ length: 14 }, (_, i) => {
  const pad = (h: number) => `${String(h).padStart(2, '0')}:00`;
  return { label: `${pad(7 + i)} - ${pad(8 + i)}`, start: pad(7 + i), end: pad(8 + i) };
});
