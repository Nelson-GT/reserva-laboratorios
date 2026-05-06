import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// ─── publicId helper ──────────────────────────────────────────────────────────

const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

async function generatePublicId(): Promise<string> {
  while (true) {
    const suffix = Array.from(
      { length: 6 },
      () => CHARS[Math.floor(Math.random() * CHARS.length)]
    ).join('');
    const candidate = `PC-${suffix}`;
    const exists = await prisma.computer.findUnique({ where: { publicId: candidate } });
    if (!exists) return candidate;
  }
}

const usedCedulas = new Set<string>();

function randomCedula(): string {
  let cedula: string;
  do {
    cedula = String(Math.floor(Math.random() * (33_000_000 - 6_000_000 + 1)) + 6_000_000);
  } while (usedCedulas.has(cedula));
  usedCedulas.add(cedula);
  return cedula;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TIME_SLOTS = [
  { start: '07:00', end: '09:00' },
  { start: '09:00', end: '11:00' },
  { start: '11:00', end: '13:00' },
  { start: '13:00', end: '15:00' },
  { start: '15:00', end: '17:00' },
  { start: '17:00', end: '19:00' },
  { start: '19:00', end: '21:00' },
];

// Three distinct past dates per reservation slot to avoid same-computer conflicts
const RESERVATION_DATES = [
  '2026-03-10',
  '2026-03-24',
  '2026-04-14',
];

const RESERVATION_STATUSES: ('finished' | 'approved' | 'cancelled')[] = [
  'finished',
  'approved',
  'cancelled',
];

const PURPOSES = [
  'Proyecto final de programación',
  'Práctica de base de datos',
  'Laboratorio de redes',
  'Desarrollo de aplicaciones web',
  'Análisis y diseño de sistemas',
  'Trabajo de grado — fase de implementación',
  'Ejercicios de algoritmos y estructuras de datos',
];

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('Limpiando base de datos...');

  // Delete in FK-safe order
  await prisma.computerReservation.deleteMany();
  await prisma.reservation.deleteMany();
  await prisma.computer.deleteMany();
  await prisma.laboratory.deleteMany();
  await prisma.otpCode.deleteMany();
  await prisma.user.deleteMany();

  console.log('✓ Base de datos limpia\n');

  // ── Admin ──────────────────────────────────────────────────────────────────
  const adminPwd = await bcrypt.hash('Admin1234!', 12);
  await prisma.user.create({
    data: {
      cedula: '00000000',
      fullName: 'Administrador del Sistema de Reservas',
      email: 'admin@ujap.edu.ve',
      password: adminPwd,
      role: 'admin',
      status: 'active',
      emailVerified: true,
    },
  });
  console.log('✓ Admin: admin@ujap.edu.ve / Admin1234!');

  // ── Estudiantes ────────────────────────────────────────────────────────────
  const studentPwd = await bcrypt.hash('Student1234!', 12);
  const studentsData = [
    { fullName: 'Ana García López',       email: 'ana.garcia@ujap.edu.ve' },
    { fullName: 'Carlos Pérez Martínez',  email: 'carlos.perez@ujap.edu.ve' },
    { fullName: 'María Rodríguez Silva',  email: 'maria.rodriguez@ujap.edu.ve' },
    { fullName: 'Luis Hernández Torres',  email: 'luis.hernandez@ujap.edu.ve' },
    { fullName: 'Sofía Castro Moreno',    email: 'sofia.castro@ujap.edu.ve' },
  ];
  const students = await Promise.all(
    studentsData.map((d) =>
      prisma.user.create({
        data: {
          ...d,
          cedula: randomCedula(),
          password: studentPwd,
          role: 'student',
          status: 'active',
          emailVerified: true,
        },
      })
    )
  );
  console.log(`✓ Estudiantes (${students.length}): contraseña Student1234!`);

  // ── Profesores ─────────────────────────────────────────────────────────────
  const professorPwd = await bcrypt.hash('Professor1234!', 12);
  const professorsData = [
    { fullName: 'Dr. Roberto Méndez Ruiz',  email: 'r.mendez@ujap.edu.ve' },
    { fullName: 'Dra. Carmen Flores Vega',  email: 'c.flores@ujap.edu.ve' },
    { fullName: 'Prof. Jorge Ríos Salazar', email: 'j.rios@ujap.edu.ve' },
  ];
  const professors = await Promise.all(
    professorsData.map((d) =>
      prisma.user.create({
        data: {
          ...d,
          cedula: randomCedula(),
          password: professorPwd,
          role: 'professor',
          status: 'active',
          emailVerified: true,
        },
      })
    )
  );
  console.log(`✓ Profesores (${professors.length}): contraseña Professor1234!`);

  // ── Usuarios pendientes de aprobación ──────────────────────────────────────
  const pendingPwd = await bcrypt.hash('Pending1234!', 12);
  const pendingData = [
    { fullName: 'Valentina Núñez Arroyo',  email: 'v.nunez@ujap.edu.ve',   role: 'student'   },
    { fullName: 'Marcos Delgado Fuentes',   email: 'm.delgado@ujap.edu.ve', role: 'student'   },
    { fullName: 'Isabela Romero Castillo',  email: 'i.romero@ujap.edu.ve',  role: 'professor' },
  ] as const;
  await Promise.all(
    pendingData.map((d) =>
      prisma.user.create({
        data: {
          cedula: randomCedula(),
          fullName: d.fullName,
          email: d.email,
          password: pendingPwd,
          role: d.role,
          status: 'pending_approval',
          emailVerified: true,
        },
      })
    )
  );
  console.log(`✓ Pendientes de aprobación (${pendingData.length}): contraseña Pending1234!\n`);

  // ── Laboratorios + Computadoras + Reservas ─────────────────────────────────

  const labsData = [
    {
      name: 'Laboratorio A',
      description: 'Laboratorio de cómputo general, planta baja.',
    },
    {
      name: 'Laboratorio B',
      description: 'Laboratorio de redes y comunicaciones, primer piso.',
    },
    {
      name: 'Laboratorio C',
      description: 'Laboratorio de diseño gráfico, segundo piso.',
    },
  ];

  // Per-lab layout: 23 available | 5 maintenance | 2 out_of_service = 30 total
  const TOTAL = 30;
  const AVAILABLE_COUNT = 23;
  const MAINTENANCE_COUNT = 5;
  // OUT_OF_SERVICE_COUNT = 2 (remainder)

  for (const labData of labsData) {
    const lab = await prisma.laboratory.create({
      data: {
        name: labData.name,
        description: labData.description,
        capacity: TOTAL,
        operational: AVAILABLE_COUNT,
        status: 'available',
      },
    });

    console.log(`Procesando ${lab.name}...`);
    let reservationCount = 0;

    for (let n = 1; n <= TOTAL; n++) {
      const publicId = await generatePublicId();

      const computerStatus: 'available' | 'maintenance' | 'out_of_service' =
        n <= AVAILABLE_COUNT
          ? 'available'
          : n <= AVAILABLE_COUNT + MAINTENANCE_COUNT
          ? 'maintenance'
          : 'out_of_service';

      const computer = await prisma.computer.create({
        data: {
          number: n,
          laboratoryId: lab.id,
          publicId,
          status: computerStatus,
        },
      });

      // 3 reservations per computer — one per distinct date
      for (let r = 0; r < 3; r++) {
        const user = students[(n - 1 + r) % students.length];
        const date = RESERVATION_DATES[r];
        const slot = TIME_SLOTS[(n - 1 + r) % TIME_SLOTS.length];
        const status = RESERVATION_STATUSES[r];
        const purpose = PURPOSES[(n - 1 + r) % PURPOSES.length];

        const reservation = await prisma.reservation.create({
          data: {
            userId: user.id,
            laboratoryId: lab.id,
            date,
            startTime: slot.start,
            endTime: slot.end,
            status,
            type: 'computer',
            purpose,
          },
        });

        await prisma.computerReservation.create({
          data: { reservationId: reservation.id, computerId: computer.id },
        });

        reservationCount++;
      }
    }

    console.log(
      `✓ ${lab.name}: ${TOTAL} computadoras (${AVAILABLE_COUNT} disponibles, ${MAINTENANCE_COUNT} mantenimiento, 2 fuera de servicio) | ${reservationCount} reservas`
    );
  }

  console.log('\n✓ Seed completado.');
  console.log('\nCredenciales de acceso:');
  console.log('  Admin     → admin@ujap.edu.ve       / Admin1234!');
  console.log('  Docentes  → r.mendez@ujap.edu.ve    / Professor1234!');
  console.log('             c.flores@ujap.edu.ve    / Professor1234!');
  console.log('             j.rios@ujap.edu.ve      / Professor1234!');
  console.log('  Estudiantes → ana.garcia@ujap.edu.ve / Student1234!');
  console.log('               (y 4 más con la misma contraseña)');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
