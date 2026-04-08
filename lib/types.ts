// Alert types
export type AlertSeverity = 'critical' | 'warning' | 'info';

export interface Alert {
  id: string;
  message: string;
  timestamp: string;
  severity: AlertSeverity;
  type: string;
}

// User types
export type UserRole = 'admin' | 'professor' | 'student';
export type UserStatus = 'active' | 'blocked';

export interface User {
  id: string;
  cedula: string;
  fullName: string;
  role: UserRole;
  status: UserStatus;
  email?: string;
}

// Laboratory types
export type LaboratoryStatus = 'available' | 'maintenance' | 'out_of_service';

export interface Laboratory {
  id: string;
  name: string;
  capacity: number;
  operational: number;
  status: LaboratoryStatus;
  description?: string;
}

// Schedule types
export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday';

export interface TimeSlot {
  id: string;
  day: DayOfWeek;
  startTime: string;
  endTime: string;
  status: 'available' | 'occupied';
  laboratoryId: string;
}

export interface Schedule {
  laboratoryId: string;
  weekSlots: TimeSlot[];
}

// Reservation types
export type ReservationStatus = 'pending' | 'approved' | 'rejected' | 'cancelled' | 'finished';

export interface Reservation {
  id: string;
  requesterName: string;
  requesterCedula: string;
  laboratoryId: string;
  laboratoryName: string;
  date: string;
  startTime: string;
  endTime: string;
  status: ReservationStatus;
  createdAt: string;
}
