import { LaboratoryCard } from '@/components/modules/laboratories/laboratory-card';
import { getMockLaboratories } from '@/lib/mock-data';

export const metadata = {
  title: 'Laboratorios - Lab Manager',
  description: 'Gestión de laboratorios disponibles',
};

export default function LaboratoriesPage() {
  const laboratories = getMockLaboratories();

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-slate-900 mb-2">Laboratorios</h1>
        <p className="text-lg text-slate-600">
          Gestiona el estado y disponibilidad de los laboratorios.
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
