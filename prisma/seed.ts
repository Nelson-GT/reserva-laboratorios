import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // ─── Admin ───────────────────────────────────────────────────────────────────
  const adminPassword = await bcrypt.hash('Admin1234!', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@ujap.edu.ve' },
    update: {},
    create: {
      cedula: '00000000',
      fullName: 'Administrador del Sistema',
      email: 'admin@ujap.edu.ve',
      password: adminPassword,
      role: 'admin',
      status: 'active',
      emailVerified: true,
    },
  });
  console.log('Admin creado:', admin.email);

  // ─── Laboratorios ─────────────────────────────────────────────────────────────
  const labsData = [
    {
      name: 'Laboratorio A',
      capacity: 30,
      operational: 28,
      status: 'available' as const,
      description: 'Laboratorio de cómputo general, planta baja.',
    },
    {
      name: 'Laboratorio B',
      capacity: 25,
      operational: 25,
      status: 'available' as const,
      description: 'Laboratorio de redes y comunicaciones, primer piso.',
    },
    {
      name: 'Laboratorio C',
      capacity: 20,
      operational: 18,
      status: 'maintenance' as const,
      description: 'Laboratorio de diseño gráfico, segundo piso.',
    },
    {
      name: 'Laboratorio D',
      capacity: 35,
      operational: 35,
      status: 'available' as const,
      description: 'Laboratorio de ingeniería de software, tercer piso.',
    },
  ];

  for (const labData of labsData) {
    let lab = await prisma.laboratory.findFirst({ where: { name: labData.name } });
    if (!lab) {
      lab = await prisma.laboratory.create({ data: labData });
    } else {
      lab = await prisma.laboratory.update({
        where: { id: lab.id },
        data: { status: labData.status, operational: labData.operational },
      });
    }

    // Crear computadoras si no existen
    const existingComputers = await prisma.computer.count({
      where: { laboratoryId: lab.id },
    });

    if (existingComputers === 0) {
      const computers = Array.from({ length: lab.capacity }, (_, i) => ({
        number: i + 1,
        laboratoryId: lab.id,
        status:
          i < lab.operational
            ? ('available' as const)
            : ('maintenance' as const),
      }));

      await prisma.computer.createMany({ data: computers });
      console.log(
        `Creadas ${lab.capacity} computadoras para ${lab.name}`
      );
    }
  }

  console.log('Seed completado.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
