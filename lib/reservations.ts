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

export const TIME_SLOTS = [
  { label: '07:00 - 09:00', start: '07:00', end: '09:00' },
  { label: '09:00 - 11:00', start: '09:00', end: '11:00' },
  { label: '11:00 - 13:00', start: '11:00', end: '13:00' },
  { label: '13:00 - 15:00', start: '13:00', end: '15:00' },
  { label: '15:00 - 17:00', start: '15:00', end: '17:00' },
  { label: '17:00 - 19:00', start: '17:00', end: '19:00' },
  { label: '19:00 - 21:00', start: '19:00', end: '21:00' },
] as const;
