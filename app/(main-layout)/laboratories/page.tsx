import { prisma } from '@/lib/prisma';
import { LaboratoryCard } from '@/components/modules/laboratories/laboratory-card';

export const metadata = {
  title: 'Laboratorios — Lab Manager',
};

export default async function LaboratoriesPage() {
  const laboratories = await prisma.laboratory.findMany({
    orderBy: { name: 'asc' },
  });

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-slate-900 mb-2">Laboratorios</h1>
        <p className="text-lg text-slate-600">
          Estado y disponibilidad de los laboratorios de informática.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {laboratories.map((lab) => (
          <LaboratoryCard key={lab.id} laboratory={lab} />
        ))}
      </div>
    </div>
  );
}
