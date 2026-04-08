'use client';

import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { UserRole } from '@/lib/types';

interface UserFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedRole: string;
  onRoleChange: (role: string) => void;
}

export function UserFilters({
  searchQuery,
  onSearchChange,
  selectedRole,
  onRoleChange,
}: UserFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-6">
      <Input
        type="text"
        placeholder="Buscar por nombre o cédula..."
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        className="flex-1"
      />
      <Select value={selectedRole} onValueChange={onRoleChange}>
        <SelectTrigger className="w-full sm:w-48">
          <SelectValue placeholder="Filtrar por rol" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos los roles</SelectItem>
          <SelectItem value="admin">Administrador</SelectItem>
          <SelectItem value="professor">Profesor</SelectItem>
          <SelectItem value="student">Estudiante</SelectItem>
        </SelectContent>
      </Select>
      <Button className="w-full sm:w-auto">Agregar Usuario</Button>
    </div>
  );
}
