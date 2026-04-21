'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Microscope,
  Calendar,
  Monitor,
  UserCheck,
  LogOut,
} from 'lucide-react';
import { logoutAction } from '@/app/actions/auth';

type Role = 'admin' | 'professor' | 'student';

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  roles: Role[];
}

const NAV_ITEMS: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    roles: ['admin', 'professor', 'student'],
  },
  {
    label: 'Usuarios',
    href: '/users',
    icon: Users,
    roles: ['admin'],
  },
  {
    label: 'Aprobar Usuarios',
    href: '/admin/users',
    icon: UserCheck,
    roles: ['admin'],
  },
  {
    label: 'Laboratorios',
    href: '/laboratories',
    icon: Microscope,
    roles: ['admin', 'professor', 'student'],
  },
  {
    label: 'Reservar Laboratorio',
    href: '/reservations/new',
    icon: Calendar,
    roles: ['professor'],
  },
  {
    label: 'Reservar Computadora',
    href: '/computers',
    icon: Monitor,
    roles: ['student'],
  },
  {
    label: 'Mis Reservas',
    href: '/reservations',
    icon: Calendar,
    roles: ['professor', 'student'],
  },
  {
    label: 'Todas las Reservas',
    href: '/reservations',
    icon: Calendar,
    roles: ['admin'],
  },
];

export function Sidebar({ role }: { role: Role }) {
  const pathname = usePathname();

  const visibleItems = NAV_ITEMS.filter((item) => item.roles.includes(role));

  return (
    <aside className="w-64 bg-gradient-to-b from-slate-900 to-slate-800 text-white h-screen border-r border-slate-700 flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-slate-700">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
            <Microscope className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-bold">Lab Manager</h1>
        </div>
        <p className="text-sm text-slate-400 mt-2">UJAP</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + '/');

          return (
            <Link
              key={item.href + item.label}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span className="font-medium text-sm">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer / Logout */}
      <div className="p-4 border-t border-slate-700">
        <form action={logoutAction}>
          <button
            type="submit"
            className="flex items-center gap-3 px-4 py-3 rounded-lg w-full text-slate-300 hover:bg-slate-700 hover:text-white transition-all"
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            <span className="font-medium text-sm">Cerrar sesión</span>
          </button>
        </form>
        <p className="text-slate-500 text-xs mt-3 px-1">© 2025 Lab Manager</p>
      </div>
    </aside>
  );
}
