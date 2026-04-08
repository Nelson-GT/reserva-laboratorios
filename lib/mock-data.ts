import {
  Alert,
  User,
  Laboratory,
  Schedule,
  Reservation,
  TimeSlot,
} from './types';

// Mock Alerts
export const mockAlerts: Alert[] = [
  {
    id: 'alert-1',
    message: 'Laboratorio 4450 fuera de servicio por mantenimiento urgente',
    timestamp: '2024-04-08 14:30',
    severity: 'critical',
    type: 'Laboratorio',
  },
  {
    id: 'alert-2',
    message: 'Nueva reserva pendiente de aprobación para Laboratorio 4451',
    timestamp: '2024-04-08 12:15',
    severity: 'info',
    type: 'Reserva',
  },
];

// Mock Users
export const mockUsers: User[] = [
  {
    id: 'user-1',
    cedula: 'V-12345678',
    fullName: 'Nelson Guerrero',
    role: 'admin',
    status: 'active',
    email: 'nelson.guerrero@university.edu',
  },
  {
    id: 'user-2',
    cedula: 'V-87654321',
    fullName: 'Luis León',
    role: 'professor',
    status: 'active',
    email: 'luis.leon@university.edu',
  },
  {
    id: 'user-3',
    cedula: 'V-55555555',
    fullName: 'María Gómez',
    role: 'student',
    status: 'blocked',
    email: 'maria.gomez@university.edu',
  },
];

// Mock Laboratories
export const mockLaboratories: Laboratory[] = [
  {
    id: 'lab-1',
    name: 'Laboratorio 4450',
    capacity: 30,
    operational: 28,
    status: 'available',
    description: 'Laboratorio de Computadores',
  },
  {
    id: 'lab-2',
    name: 'Laboratorio 4451',
    capacity: 25,
    operational: 25,
    status: 'maintenance',
    description: 'Laboratorio de Electrónica',
  },
  {
    id: 'lab-3',
    name: 'Laboratorio 4452',
    capacity: 20,
    operational: 0,
    status: 'out_of_service',
    description: 'Laboratorio de Química',
  },
];

// Mock Schedules
const generateTimeSlots = (laboratoryId: string): TimeSlot[] => {
  const days: ('monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday')[] = [
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
  ];
  const slots: TimeSlot[] = [];
  let slotId = 1;

  days.forEach((day) => {
    // 8:00-10:00 - Occupied
    slots.push({
      id: `slot-${slotId++}`,
      day,
      startTime: '08:00',
      endTime: '10:00',
      status: 'occupied',
      laboratoryId,
    });
    // 10:00-12:00 - Available
    slots.push({
      id: `slot-${slotId++}`,
      day,
      startTime: '10:00',
      endTime: '12:00',
      status: 'available',
      laboratoryId,
    });
    // 12:00-14:00 - Occupied
    slots.push({
      id: `slot-${slotId++}`,
      day,
      startTime: '12:00',
      endTime: '14:00',
      status: 'occupied',
      laboratoryId,
    });
    // 14:00-16:00 - Available
    slots.push({
      id: `slot-${slotId++}`,
      day,
      startTime: '14:00',
      endTime: '16:00',
      status: 'available',
      laboratoryId,
    });
    // 16:00-18:00 - Available
    slots.push({
      id: `slot-${slotId++}`,
      day,
      startTime: '16:00',
      endTime: '18:00',
      status: 'available',
      laboratoryId,
    });
  });

  return slots;
};

export const mockSchedule: Schedule = {
  laboratoryId: 'lab-1',
  weekSlots: generateTimeSlots('lab-1'),
};

// Mock Reservations
export const mockReservations: Reservation[] = [
  {
    id: 'RES-001',
    requesterName: 'Nelson Guerrero',
    requesterCedula: 'V-12345678',
    laboratoryId: 'lab-1',
    laboratoryName: 'Laboratorio 4450',
    date: '2024-04-10',
    startTime: '08:00',
    endTime: '10:00',
    status: 'pending',
    createdAt: '2024-04-08 09:30',
  },
  {
    id: 'RES-002',
    requesterName: 'Luis León',
    requesterCedula: 'V-87654321',
    laboratoryId: 'lab-2',
    laboratoryName: 'Laboratorio 4451',
    date: '2024-04-12',
    startTime: '14:00',
    endTime: '16:00',
    status: 'approved',
    createdAt: '2024-04-07 15:45',
  },
  {
    id: 'RES-003',
    requesterName: 'María Gómez',
    requesterCedula: 'V-55555555',
    laboratoryId: 'lab-1',
    laboratoryName: 'Laboratorio 4450',
    date: '2024-04-15',
    startTime: '10:00',
    endTime: '12:00',
    status: 'rejected',
    createdAt: '2024-04-06 11:20',
  },
  {
    id: 'RES-004',
    requesterName: 'Nelson Guerrero',
    requesterCedula: 'V-12345678',
    laboratoryId: 'lab-3',
    laboratoryName: 'Laboratorio 4452',
    date: '2024-04-05',
    startTime: '16:00',
    endTime: '18:00',
    status: 'finished',
    createdAt: '2024-04-01 08:00',
  },
];

// Helper functions to get mock data
export function getMockAlerts(): Alert[] {
  return mockAlerts;
}

export function getMockUsers(): User[] {
  return mockUsers;
}

export function getMockLaboratories(): Laboratory[] {
  return mockLaboratories;
}

export function getMockSchedule(laboratoryId: string): Schedule {
  return {
    laboratoryId,
    weekSlots: generateTimeSlots(laboratoryId),
  };
}

export function getMockReservations(): Reservation[] {
  return mockReservations;
}

export function getMockReservationsByStatus(status: string): Reservation[] {
  return mockReservations.filter((res) => res.status === status);
}
