'use client';

import { useState, useMemo } from 'react';
import { UserFilters } from '@/components/modules/users/user-filters';
import { UsersTable } from '@/components/modules/users/users-table';
import { getMockUsers } from '@/lib/mock-data';

export default function UsersPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');

  const allUsers = getMockUsers();

  // Filter users based on search and role
  const filteredUsers = useMemo(() => {
    return allUsers.filter((user) => {
      const matchesSearch =
        user.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.cedula.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRole = selectedRole === 'all' || user.role === selectedRole;
      return matchesSearch && matchesRole;
    });
  }, [searchQuery, selectedRole]);

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-slate-900 mb-2">Gestión de Usuarios</h1>
        <p className="text-lg text-slate-600">
          Administra los usuarios del sistema y sus roles de acceso.
        </p>
      </div>

      <UserFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedRole={selectedRole}
        onRoleChange={setSelectedRole}
      />

      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-slate-900">
            Usuarios ({filteredUsers.length})
          </h2>
        </div>
        <UsersTable users={filteredUsers} />
      </div>
    </div>
  );
}
