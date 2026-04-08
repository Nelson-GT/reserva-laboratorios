'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Laboratory, LaboratoryStatus } from '@/lib/types';
import { useState } from 'react';

interface LaboratoryCardProps {
  laboratory: Laboratory;
}

export function LaboratoryCard({ laboratory }: LaboratoryCardProps) {
  const [status, setStatus] = useState<LaboratoryStatus>(laboratory.status);

  const getStatusColor = (status: LaboratoryStatus) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'out_of_service':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-300';
    }
  };

  const getStatusLabel = (status: LaboratoryStatus) => {
    const labels: Record<LaboratoryStatus, string> = {
      available: 'Disponible',
      maintenance: 'En Mantenimiento',
      out_of_service: 'Fuera de Servicio',
    };
    return labels[status];
  };

  const getProgressColor = (status: LaboratoryStatus) => {
    switch (status) {
      case 'available':
        return 'bg-green-500';
      case 'maintenance':
        return 'bg-yellow-500';
      case 'out_of_service':
        return 'bg-red-500';
      default:
        return 'bg-slate-500';
    }
  };

  const operationPercentage = (laboratory.operational / laboratory.capacity) * 100;

  return (
    <Card className="bg-white border-slate-200 hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg text-slate-900">
          {laboratory.name}
        </CardTitle>
        <p className="text-sm text-slate-600 mt-1">{laboratory.description}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Capacity Progress */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-sm font-medium text-slate-700">
              Capacidad Operacional
            </label>
            <span className="text-sm font-semibold text-slate-900">
              {laboratory.operational}/{laboratory.capacity}
            </span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${getProgressColor(status)}`}
              style={{ width: `${operationPercentage}%` }}
            />
          </div>
        </div>

        {/* Status Dropdown */}
        <div>
          <label className="text-sm font-medium text-slate-700 block mb-2">
            Estado
          </label>
          <Select value={status} onValueChange={(value) => setStatus(value as LaboratoryStatus)}>
            <SelectTrigger className={`border-2 ${getStatusColor(status)}`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="available">Disponible</SelectItem>
              <SelectItem value="maintenance">En Mantenimiento</SelectItem>
              <SelectItem value="out_of_service">Fuera de Servicio</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}
