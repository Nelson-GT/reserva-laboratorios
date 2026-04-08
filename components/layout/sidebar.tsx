'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, Microscope, Clock, Calendar, Flask } from 'lucide-react';

export function Sidebar() {
  const pathname = usePathname();

  const navItems = [
    {
      label: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
    },
    {
      label: 'Usuarios',
      href: '/users',
      icon: Users,
    },
    {
      label: 'Laboratorios',
      href: '/laboratories',
      icon: Microscope,
    },
    {
      label: 'Horarios',
      href: '/schedules',
      icon: Clock,
    },
    {
      label: 'Reservas',
      href: '/reservations',
      icon: Calendar,
    },
  ];

  return (
    <aside className="w-64 bg-gradient-to-b from-slate-900 to-slate-800 text-white h-screen border-r border-slate-700 flex flex-col">
      {/* Logo/Header */}
      <div className="p-6 border-b border-slate-700">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
            <Microscope className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-bold">Lab Manager</h1>
        </div>
        <p className="text-sm text-slate-400 mt-2">Gestión de Laboratorios</p>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
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

      {/* Footer */}
      <div className="p-4 border-t border-slate-700 text-xs text-slate-400 space-y-2">
        <p className="text-slate-500">© 2024 Lab Manager</p>
        <p>v1.0.0</p>
      </div>
    </aside>
  );
}
