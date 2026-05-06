import Link from 'next/link';
import {
  CalendarCheck,
  CalendarClock,
  Monitor,
  Microscope,
  Users,
  UserCheck,
  TrendingUp,
  ArrowUpRight,
} from 'lucide-react';

// ─── Base card ────────────────────────────────────────────────────────────────

interface KpiCardProps {
  icon: React.ElementType;
  label: string;
  value: number | string;
  sub?: string;
  iconBg: string;
  iconColor: string;
  href?: string;
  alert?: boolean;
}

function KpiCard({ icon: Icon, label, value, sub, iconBg, iconColor, href, alert }: KpiCardProps) {
  return (
    <div
      className={`bg-white rounded-xl border shadow-sm p-5 flex flex-col gap-4 transition-shadow hover:shadow-md ${
        alert ? 'border-amber-300' : 'border-slate-200'
      }`}
    >
      <div className="flex items-start justify-between">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${iconBg}`}>
          <Icon className={`w-5 h-5 ${iconColor}`} />
        </div>
        {href && (
          <Link
            href={href}
            className="text-slate-400 hover:text-slate-600 transition-colors"
            title="Ver detalle"
          >
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        )}
      </div>

      <div>
        <p className="text-3xl font-bold text-slate-900 leading-none mb-2">{value}</p>
        <p className="text-sm font-medium text-slate-600">{label}</p>
      </div>
    </div>
  );
}

// ─── Admin metrics ────────────────────────────────────────────────────────────

interface AdminMetrics {
  todayApproved: number;
  todayPending: number;
  weekReservations: number;
  availableComputers: number;
  totalComputers: number;
  availableLabs: number;
  totalLabs: number;
  activeUsers: number;
  pendingUsers: number;
}

function AdminCards({ m }: { m: AdminMetrics }) {
  const todayTotal = m.todayApproved + m.todayPending;
  return (
    <div className="space-y-4">
      {/* Row 1 — primary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard
          icon={CalendarCheck}
          label="Reservas de hoy"
          value={todayTotal}
          iconBg="bg-blue-100"
          iconColor="text-blue-600"
          href="/reservations"
        />
        <KpiCard
          icon={Monitor}
          label="Computadoras disponibles"
          value={`${m.availableComputers}/${m.totalComputers}`}
          iconBg="bg-green-100"
          iconColor="text-green-600"
          href="/laboratories"
        />
        <KpiCard
          icon={UserCheck}
          label="Pendientes por aprobación"
          value={m.pendingUsers}
          iconBg="bg-amber-100"
          iconColor="text-amber-600"
          href="/admin/users"
          alert={m.pendingUsers > 0}
        />
      </div>

      {/* Row 2 — secondary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard
          icon={TrendingUp}
          label="Reservas de la semana"
          value={m.weekReservations}
          iconBg="bg-indigo-100"
          iconColor="text-indigo-600"
        />
        <KpiCard
          icon={Microscope}
          label="Laboratorios operativos"
          value={`${m.availableLabs}/${m.totalLabs}`}
          iconBg="bg-teal-100"
          iconColor="text-teal-600"
          href="/laboratories"
        />
        <KpiCard
          icon={Users}
          label="Usuarios habilitados"
          value={m.activeUsers}
          iconBg="bg-slate-100"
          iconColor="text-slate-600"
          href="/users"
        />
      </div>
    </div>
  );
}

// ─── Professor / Student metrics ──────────────────────────────────────────────

interface UserMetrics {
  myActive: number;
  myWeek: number;
  availableComputers: number;
  totalComputers: number;
  availableLabs: number;
  totalLabs: number;
}

function UserCards({ m, role }: { m: UserMetrics; role: 'professor' | 'student' }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <KpiCard
        icon={CalendarCheck}
        label="Mis reservas activas"
        value={m.myActive}
        iconBg="bg-blue-100"
        iconColor="text-blue-600"
        href="/reservations"
      />
      <KpiCard
        icon={role === 'professor' ? Microscope : Monitor}
        label={role === 'professor' ? 'Laboratorios disponibles' : 'Computadoras disponibles'}
        value={role === 'professor' ? `${m.availableLabs}/${m.totalLabs}` : `${m.availableComputers}/${m.totalComputers}`}
        iconBg={role === 'professor' ? 'bg-teal-100' : 'bg-green-100'}
        iconColor={role === 'professor' ? 'text-teal-600' : 'text-green-600'}
        href={role === 'professor' ? '/laboratories' : '/computers'}
      />
      <KpiCard
        icon={CalendarClock}
        label="Reservas de la semana"
        value={m.myWeek}
        iconBg="bg-indigo-100"
        iconColor="text-indigo-600"
        href="/reservations"
      />
    </div>
  );
}

// ─── Exported component ───────────────────────────────────────────────────────

type Props =
  | { role: 'admin'; metrics: AdminMetrics }
  | { role: 'professor' | 'student'; metrics: UserMetrics };

export function MetricsCards(props: Props) {
  if (props.role === 'admin') {
    return <AdminCards m={props.metrics} />;
  }
  return <UserCards m={props.metrics} role={props.role} />;
}
