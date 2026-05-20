'use client';

import { useState, useTransition, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  CheckCircle, XCircle, Ban, Pencil, AlertCircle, Loader2,
  Search, Plus, Upload, CalendarCheck, RefreshCw, Monitor, ChevronRight,
} from 'lucide-react';
import { ImportReservationsDialog } from './import-reservations-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { TablePagination } from '@/components/ui/table-pagination';
import {
  createLabReservationAction,
  createRecurringLabReservationAction,
  createComputerReservationAction,
} from '@/app/actions/reservations';
import { TIME_SLOTS, getEffectiveStatus } from '@/lib/reservations';
import { format } from 'date-fns';

type Lab = { id: string; name: string; capacity: number; operational: number };
type Computer = { id: string; number: number; publicId: string | null };
type ComputerInfo = { id: string; number: number; status: string; available: boolean };
type UserOption = { id: string; fullName: string; cedula: string };

type Reservation = {
  id: string;
  userId: string;
  status: string;
  type: string;
  date: string;
  startTime: string;
  endTime: string;
  purpose: string | null;
  createdAt: string;
  laboratoryId: string;
  user: { fullName: string; cedula: string; role: string };
  laboratory: { name: string };
  computerReservations: { computer: Computer }[];
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendiente',
  approved: 'Aprobada',
  rejected: 'Rechazada',
  cancelled: 'Cancelada',
  finished: 'Finalizada',
};

const DAY_NAMES = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const TABS = ['pending', 'approved', 'rejected', 'cancelled', 'finished'];
const PAGE_SIZE = 10;

// Shared select class
const SELECT_CLS =
  'w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring';

async function patchReservation(id: string, body: Record<string, string>) {
  const res = await fetch(`/api/reservations/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return res;
}

export function ReservationsPageClient({
  reservations: initial,
  isAdmin,
  currentUserId,
  laboratories = [],
  role = '',
}: {
  reservations: Reservation[];
  isAdmin: boolean;
  currentUserId: string;
  laboratories?: Lab[];
  role?: string;
}) {
  const router = useRouter();
  const [reservations, setReservations] = useState(initial);
  const [isPending, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState('pending');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => { setReservations(initial); }, [initial]);
  useEffect(() => { setPage(1); }, [activeTab, search]);

  // ── Status change ──────────────────────────────────────────────────────────
  function handleStatus(id: string, newStatus: string) {
    startTransition(async () => {
      const res = await patchReservation(id, { status: newStatus });
      if (res.ok) {
        setReservations((prev) => prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r)));
      }
    });
  }

  // ── Filter + pagination ────────────────────────────────────────────────────
  const byStatus = useMemo(
    () => reservations.filter((r) => getEffectiveStatus(r) === activeTab),
    [reservations, activeTab]
  );

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return byStatus;
    return byStatus.filter(
      (r) =>
        r.laboratory.name.toLowerCase().includes(q) ||
        (r.purpose ?? '').toLowerCase().includes(q) ||
        r.date.includes(q) ||
        r.user.fullName.toLowerCase().includes(q) ||
        r.user.cedula.includes(q)
    );
  }, [byStatus, search]);

  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const showActions = activeTab === 'pending' || (isAdmin && activeTab === 'approved');

  // ────────────────────────────────────────────────────────────────────────────
  // ADMIN: Registrar reserva (multi-paso)
  // ────────────────────────────────────────────────────────────────────────────
  const [importOpen, setImportOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const [adminStep, setAdminStep] = useState<1 | 2>(1);
  const [adminTargetRole, setAdminTargetRole] = useState<'' | 'professor' | 'student'>('');
  const [adminUsers, setAdminUsers] = useState<UserOption[]>([]);
  const [adminUsersLoading, setAdminUsersLoading] = useState(false);
  const [adminSelectedUserId, setAdminSelectedUserId] = useState('');
  // Formulario profesor
  const [adminLabId, setAdminLabId] = useState('');
  const [adminDate, setAdminDate] = useState('');
  const [adminStartTime, setAdminStartTime] = useState('');
  const [adminEndTime, setAdminEndTime] = useState('');
  const [adminPurpose, setAdminPurpose] = useState('');
  const [adminIsRecurring, setAdminIsRecurring] = useState(false);
  const [adminRecurStart, setAdminRecurStart] = useState('');
  const [adminRecurEnd, setAdminRecurEnd] = useState('');
  // Formulario estudiante
  const [adminStuLabId, setAdminStuLabId] = useState('');
  const [adminStuDate, setAdminStuDate] = useState('');
  const [adminStuStartTime, setAdminStuStartTime] = useState('');
  const [adminStuEndTime, setAdminStuEndTime] = useState('');
  const [adminStuComputers, setAdminStuComputers] = useState<ComputerInfo[]>([]);
  const [adminStuSelectedComputer, setAdminStuSelectedComputer] = useState('');
  const [adminStuLoadingComputers, setAdminStuLoadingComputers] = useState(false);
  const [adminStuPurpose, setAdminStuPurpose] = useState('');
  // Feedback
  const [adminError, setAdminError] = useState('');
  const [adminSuccess, setAdminSuccess] = useState('');

  const adminRecurDayName = useMemo(() => {
    if (!adminRecurStart) return '';
    return DAY_NAMES[new Date(`${adminRecurStart}T00:00:00`).getDay()];
  }, [adminRecurStart]);

  const adminPreviewCount = useMemo(() => {
    if (!adminRecurStart || !adminRecurEnd) return 0;
    const start = new Date(`${adminRecurStart}T00:00:00`);
    const end = new Date(`${adminRecurEnd}T00:00:00`);
    if (end <= start) return 0;
    let count = 0;
    const cur = new Date(start);
    const dow = start.getDay();
    while (cur <= end && count < 52) {
      if (cur.getDay() === dow) count++;
      cur.setDate(cur.getDate() + 1);
    }
    return count;
  }, [adminRecurStart, adminRecurEnd]);

  function openAdminDialog() {
    setAdminStep(1);
    setAdminTargetRole('');
    setAdminUsers([]);
    setAdminSelectedUserId('');
    resetAdminForms();
    setAdminOpen(true);
  }

  function resetAdminForms() {
    setAdminLabId(''); setAdminDate(''); setAdminStartTime(''); setAdminEndTime('');
    setAdminPurpose(''); setAdminIsRecurring(false); setAdminRecurStart(''); setAdminRecurEnd('');
    setAdminStuLabId(''); setAdminStuDate(''); setAdminStuStartTime(''); setAdminStuEndTime('');
    setAdminStuComputers([]); setAdminStuSelectedComputer(''); setAdminStuPurpose('');
    setAdminError(''); setAdminSuccess('');
  }

  async function handleAdminRoleSelect(r: 'professor' | 'student') {
    setAdminTargetRole(r);
    setAdminSelectedUserId('');
    setAdminUsers([]);
    setAdminUsersLoading(true);
    try {
      const res = await fetch(`/api/admin/users?role=${r}&status=active`);
      const data = await res.json();
      setAdminUsers(data);
    } finally {
      setAdminUsersLoading(false);
    }
  }

  async function loadAdminStuComputers() {
    if (!adminStuLabId || !adminStuDate || !adminStuStartTime || !adminStuEndTime) return;
    setAdminStuLoadingComputers(true);
    setAdminStuSelectedComputer('');
    try {
      const params = new URLSearchParams({
        laboratoryId: adminStuLabId, date: adminStuDate,
        startTime: adminStuStartTime, endTime: adminStuEndTime,
      });
      const res = await fetch(`/api/computers?${params}`);
      setAdminStuComputers(await res.json());
    } finally {
      setAdminStuLoadingComputers(false);
    }
  }

  function handleAdminSubmit() {
    setAdminError('');
    const formData = new FormData();
    formData.set('userId', adminSelectedUserId);

    if (adminTargetRole === 'professor') {
      formData.set('laboratoryId', adminLabId);
      formData.set('startTime', adminStartTime);
      formData.set('endTime', adminEndTime);
      formData.set('purpose', adminPurpose);

      if (adminIsRecurring) {
        formData.set('startDate', adminRecurStart);
        formData.set('endDate', adminRecurEnd);
        startTransition(async () => {
          const res = await createRecurringLabReservationAction({}, formData);
          if (res.error) { setAdminError(res.error); }
          else {
            setAdminSuccess(res.success ?? 'Reservas creadas.');
            router.refresh();
            setTimeout(() => { setAdminOpen(false); setAdminSuccess(''); }, 1800);
          }
        });
      } else {
        formData.set('date', adminDate);
        startTransition(async () => {
          const res = await createLabReservationAction({}, formData);
          if (res.error) { setAdminError(res.error); }
          else {
            setAdminSuccess(res.success ?? 'Reserva creada.');
            router.refresh();
            setTimeout(() => { setAdminOpen(false); setAdminSuccess(''); }, 1500);
          }
        });
      }
    } else {
      formData.set('laboratoryId', adminStuLabId);
      formData.set('date', adminStuDate);
      formData.set('startTime', adminStuStartTime);
      formData.set('endTime', adminStuEndTime);
      formData.set('computerId', adminStuSelectedComputer);
      formData.set('purpose', adminStuPurpose);
      startTransition(async () => {
        const res = await createComputerReservationAction({}, formData);
        if (res.error) { setAdminError(res.error); }
        else {
          setAdminSuccess(res.success ?? 'Reserva creada.');
          router.refresh();
          setTimeout(() => { setAdminOpen(false); setAdminSuccess(''); }, 1500);
        }
      });
    }
  }

  const adminStep2ProfValid =
    adminLabId && adminStartTime && adminEndTime && adminPurpose.trim() &&
    (adminIsRecurring ? adminRecurStart && adminRecurEnd : adminDate);
  const adminStep2StuValid =
    adminStuLabId && adminStuDate && adminStuStartTime && adminStuEndTime &&
    adminStuSelectedComputer && adminStuPurpose.trim();

  // ────────────────────────────────────────────────────────────────────────────
  // PROFESOR: crear reserva propia (con recurrente)
  // ────────────────────────────────────────────────────────────────────────────
  const [profOpen, setProfOpen] = useState(false);
  const [profLabId, setProfLabId] = useState('');
  const [profDate, setProfDate] = useState('');
  const [profStartTime, setProfStartTime] = useState('');
  const [profEndTime, setProfEndTime] = useState('');
  const [profPurpose, setProfPurpose] = useState('');
  const [profIsRecurring, setProfIsRecurring] = useState(false);
  const [profRecurStart, setProfRecurStart] = useState('');
  const [profRecurEnd, setProfRecurEnd] = useState('');
  const [profError, setProfError] = useState('');
  const [profSuccess, setProfSuccess] = useState('');

  const profRecurDayName = useMemo(() => {
    if (!profRecurStart) return '';
    return DAY_NAMES[new Date(`${profRecurStart}T00:00:00`).getDay()];
  }, [profRecurStart]);

  const profPreviewCount = useMemo(() => {
    if (!profRecurStart || !profRecurEnd) return 0;
    const start = new Date(`${profRecurStart}T00:00:00`);
    const end = new Date(`${profRecurEnd}T00:00:00`);
    if (end <= start) return 0;
    let count = 0;
    const cur = new Date(start);
    const dow = start.getDay();
    while (cur <= end && count < 52) {
      if (cur.getDay() === dow) count++;
      cur.setDate(cur.getDate() + 1);
    }
    return count;
  }, [profRecurStart, profRecurEnd]);

  function openProfDialog() {
    setProfLabId(''); setProfDate(''); setProfStartTime(''); setProfEndTime('');
    setProfPurpose(''); setProfIsRecurring(false); setProfRecurStart('');
    setProfRecurEnd(''); setProfError(''); setProfSuccess('');
    setProfOpen(true);
  }

  function handleProfSubmit() {
    setProfError('');
    const formData = new FormData();
    formData.set('laboratoryId', profLabId);
    formData.set('startTime', profStartTime);
    formData.set('endTime', profEndTime);
    formData.set('purpose', profPurpose);

    if (profIsRecurring) {
      formData.set('startDate', profRecurStart);
      formData.set('endDate', profRecurEnd);
      startTransition(async () => {
        const res = await createRecurringLabReservationAction({}, formData);
        if (res.error) { setProfError(res.error); }
        else {
          setProfSuccess(res.success ?? 'Reservas creadas.');
          router.refresh();
          setTimeout(() => { setProfOpen(false); setProfSuccess(''); }, 2000);
        }
      });
    } else {
      formData.set('date', profDate);
      startTransition(async () => {
        const res = await createLabReservationAction({}, formData);
        if (res.error) { setProfError(res.error); }
        else {
          setProfSuccess(res.success ?? 'Reserva creada.');
          router.refresh();
          setTimeout(() => { setProfOpen(false); setProfSuccess(''); }, 1500);
        }
      });
    }
  }

  // ────────────────────────────────────────────────────────────────────────────
  // ESTUDIANTE: crear reserva propia
  // ────────────────────────────────────────────────────────────────────────────
  const [studentOpen, setStudentOpen] = useState(false);
  const [stuKey, setStuKey] = useState(0);
  const [stuLabId, setStuLabId] = useState('');
  const [stuDate, setStuDate] = useState('');
  const [stuStartTime, setStuStartTime] = useState('');
  const [stuEndTime, setStuEndTime] = useState('');
  const [stuComputers, setStuComputers] = useState<ComputerInfo[]>([]);
  const [stuSelectedComputer, setStuSelectedComputer] = useState('');
  const [stuLoadingComputers, setStuLoadingComputers] = useState(false);
  const [stuPurpose, setStuPurpose] = useState('');
  const [stuError, setStuError] = useState('');
  const [stuSuccess, setStuSuccess] = useState('');

  function openStudentDialog() {
    setStuLabId(''); setStuDate(''); setStuStartTime(''); setStuEndTime('');
    setStuComputers([]); setStuSelectedComputer(''); setStuPurpose('');
    setStuError(''); setStuSuccess('');
    setStuKey((k) => k + 1);
    setStudentOpen(true);
  }

  const stuCanSearch = stuLabId && stuDate && stuStartTime && stuEndTime && stuStartTime < stuEndTime;

  async function loadStuComputers() {
    if (!stuCanSearch) return;
    setStuLoadingComputers(true);
    setStuSelectedComputer('');
    try {
      const params = new URLSearchParams({ laboratoryId: stuLabId, date: stuDate, startTime: stuStartTime, endTime: stuEndTime });
      setStuComputers(await (await fetch(`/api/computers?${params}`)).json());
    } finally {
      setStuLoadingComputers(false);
    }
  }

  function handleStuSubmit() {
    setStuError('');
    const formData = new FormData();
    formData.set('computerId', stuSelectedComputer);
    formData.set('laboratoryId', stuLabId);
    formData.set('date', stuDate);
    formData.set('startTime', stuStartTime);
    formData.set('endTime', stuEndTime);
    formData.set('purpose', stuPurpose);
    startTransition(async () => {
      const res = await createComputerReservationAction({}, formData);
      if (res.error) { setStuError(res.error); }
      else {
        setStuSuccess(res.success ?? 'Reserva creada.');
        router.refresh();
        setTimeout(() => { setStudentOpen(false); setStuSuccess(''); }, 1500);
      }
    });
  }

  // ────────────────────────────────────────────────────────────────────────────
  // SELF-EDIT: profesor/estudiante editan su propia reserva pendiente
  // ────────────────────────────────────────────────────────────────────────────
  const [selfEditTarget, setSelfEditTarget] = useState<Reservation | null>(null);
  const [selfEditLabId, setSelfEditLabId] = useState('');
  const [selfEditComputers, setSelfEditComputers] = useState<ComputerInfo[]>([]);
  const [selfEditSelectedComputer, setSelfEditSelectedComputer] = useState('');
  const [selfEditLoadingComputers, setSelfEditLoadingComputers] = useState(false);
  const [selfEditError, setSelfEditError] = useState('');

  function openSelfEdit(r: Reservation) {
    setSelfEditTarget(r);
    setSelfEditLabId(r.laboratoryId);
    setSelfEditComputers([]);
    setSelfEditSelectedComputer(r.computerReservations[0]?.computer.id ?? '');
    setSelfEditError('');
  }

  async function loadSelfEditComputers(labId: string, r: Reservation) {
    setSelfEditLoadingComputers(true);
    setSelfEditSelectedComputer('');
    try {
      const params = new URLSearchParams({ laboratoryId: labId, date: r.date, startTime: r.startTime, endTime: r.endTime });
      setSelfEditComputers(await (await fetch(`/api/computers?${params}`)).json());
    } finally {
      setSelfEditLoadingComputers(false);
    }
  }

  function handleSelfEditSave() {
    if (!selfEditTarget) return;
    setSelfEditError('');
    const body: Record<string, string> = {};

    if (selfEditTarget.type === 'lab') {
      if (selfEditLabId === selfEditTarget.laboratoryId) { setSelfEditTarget(null); return; }
      body.laboratoryId = selfEditLabId;
    } else {
      if (!selfEditSelectedComputer) { setSelfEditError('Seleccione una computadora.'); return; }
      body.laboratoryId = selfEditLabId;
      body.computerId = selfEditSelectedComputer;
    }

    startTransition(async () => {
      const res = await patchReservation(selfEditTarget.id, body);
      if (res.ok) {
        const updated: Reservation = await res.json();
        setReservations((prev) => prev.map((r) => (r.id === selfEditTarget.id ? { ...r, ...updated } : r)));
        setSelfEditTarget(null);
      } else {
        const data = await res.json();
        setSelfEditError(data.error ?? 'Error al guardar.');
      }
    });
  }

  // ────────────────────────────────────────────────────────────────────────────
  // ADMIN: editar reserva existente
  // ────────────────────────────────────────────────────────────────────────────
  const [editTarget, setEditTarget] = useState<Reservation | null>(null);
  const [editNewLabId, setEditNewLabId] = useState('');
  const [editNewComputerId, setEditNewComputerId] = useState('');
  const [editError, setEditError] = useState('');
  const [dialogLabs, setDialogLabs] = useState<{ id: string; name: string }[]>([]);
  const [dialogComputers, setDialogComputers] = useState<Computer[]>([]);
  const [dialogLoading, setDialogLoading] = useState(false);

  function openEdit(r: Reservation) {
    setEditTarget(r);
    setEditNewLabId(r.laboratoryId);
    setEditNewComputerId(r.computerReservations[0]?.computer.id ?? '');
    setEditError('');
    setDialogLoading(true);
    setDialogLabs([]);
    setDialogComputers([]);
  }

  useEffect(() => {
    if (!editTarget || !dialogLoading) return;
    if (editTarget.type === 'lab') {
      fetch('/api/laboratories')
        .then((r) => r.json())
        .then((data) => { setDialogLabs(data); setDialogLoading(false); })
        .catch(() => setDialogLoading(false));
    } else {
      fetch(`/api/laboratories/${editTarget.laboratoryId}/computers`)
        .then((r) => r.json())
        .then((data) => { setDialogComputers(data); setDialogLoading(false); })
        .catch(() => setDialogLoading(false));
    }
  }, [editTarget, dialogLoading]);

  function handleSaveEdit() {
    if (!editTarget) return;
    setEditError('');
    const body: Record<string, string> = {};
    if (editTarget.type === 'lab' && editNewLabId && editNewLabId !== editTarget.laboratoryId) {
      body.laboratoryId = editNewLabId;
    } else if (editTarget.type === 'computer' && editNewComputerId && editNewComputerId !== editTarget.computerReservations[0]?.computer.id) {
      body.computerId = editNewComputerId;
    }
    if (Object.keys(body).length === 0) { setEditTarget(null); return; }
    startTransition(async () => {
      const res = await patchReservation(editTarget.id, body);
      if (res.ok) {
        const updated: Reservation = await res.json();
        setReservations((prev) => prev.map((r) => (r.id === editTarget.id ? { ...r, ...updated } : r)));
        setEditTarget(null);
      } else {
        const data = await res.json();
        setEditError(data.error ?? 'Error al guardar.');
      }
    });
  }

  function handleCancelFromEdit() {
    if (!editTarget) return;
    startTransition(async () => {
      const res = await patchReservation(editTarget.id, { status: 'cancelled' });
      if (res.ok) {
        setReservations((prev) => prev.map((r) => (r.id === editTarget.id ? { ...r, status: 'cancelled' } : r)));
        setEditTarget(null);
      }
    });
  }

  // ────────────────────────────────────────────────────────────────────────────
  // RENDER
  // ────────────────────────────────────────────────────────────────────────────
  return (
    <>
      {/* Pills + acción */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {TABS.map((tab) => {
            const count = reservations.filter((r) => getEffectiveStatus(r) === tab).length;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                  activeTab === tab
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-600 border-slate-300 hover:border-slate-500'
                }`}
              >
                {STATUS_LABELS[tab]}{' '}
                <span className={activeTab === tab ? 'opacity-70' : 'opacity-60'}>({count})</span>
              </button>
            );
          })}
        </div>
        {isAdmin && (
          <div className="flex gap-2 flex-shrink-0 self-start sm:self-auto">
            <Button variant="outline" onClick={() => setImportOpen(true)}>
              <Upload className="w-4 h-4 mr-0.5" />
              Importar
            </Button>
            <Button onClick={openAdminDialog}>
              <Plus className="w-4 h-4 mr-0.5" />
              Registrar Reserva
            </Button>
          </div>
        )}
        {role === 'professor' && (
          <Button onClick={openProfDialog} className="flex-shrink-0 self-start sm:self-auto">
            <Plus className="w-4 h-4 mr-0.5" />
            Registrar Reserva
          </Button>
        )}
        {role === 'student' && (
          <Button onClick={openStudentDialog} className="flex-shrink-0 self-start sm:self-auto">
            <Plus className="w-4 h-4 mr-0.5" />
            Registrar Reserva
          </Button>
        )}
      </div>

      {/* Barra de búsqueda */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          placeholder={isAdmin ? 'Buscar por solicitante, laboratorio, propósito o fecha...' : 'Buscar por laboratorio, propósito o fecha...'}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Tabla */}
      <div className="bg-white border-y border-slate-200 overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50 border-b border-slate-200">
              {isAdmin && <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Solicitante</TableHead>}
              <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Laboratorio</TableHead>
              <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Recurso</TableHead>
              <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Fecha</TableHead>
              <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Horario</TableHead>
              <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Propósito</TableHead>
              {showActions && <TableHead className="text-right"></TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginated.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={isAdmin ? (showActions ? 7 : 6) : (showActions ? 6 : 5)}
                  className="text-center py-12 text-slate-400"
                >
                  {search ? 'No se encontraron reservas.' : 'No hay reservas en esta categoría.'}
                </TableCell>
              </TableRow>
            )}
            {paginated.map((r) => (
              <TableRow key={r.id} className="hover:bg-slate-50">
                {isAdmin && (
                  <TableCell>
                    <p className="font-medium text-sm">{r.user.fullName}</p>
                    <p className="text-xs text-slate-400">C.I. {r.user.cedula}</p>
                  </TableCell>
                )}
                <TableCell className="font-medium">{r.laboratory.name}</TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {r.type === 'lab' ? 'Laboratorio' : 'Computadora'}
                    {r.type === 'computer' && r.computerReservations[0] &&
                      ` #${r.computerReservations[0].computer.number}`}
                  </Badge>
                </TableCell>
                <TableCell className="text-slate-600 text-sm">
                  {format(new Date(`${r.date}T00:00:00`), 'dd/MM/yyyy')}
                </TableCell>
                <TableCell className="text-slate-600 text-sm whitespace-nowrap">
                  {r.startTime} – {r.endTime}
                </TableCell>
                <TableCell className="text-slate-600 text-sm max-w-[200px] truncate">
                  {r.purpose ?? '—'}
                </TableCell>

                {/* Admin: pending */}
                {isAdmin && activeTab === 'pending' && (
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button size="sm" variant="outline" className="text-green-700 border-green-300 hover:bg-green-50" disabled={isPending} onClick={() => handleStatus(r.id, 'approved')}>
                        <CheckCircle className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="outline" className="text-red-700 border-red-300 hover:bg-red-50" disabled={isPending} onClick={() => handleStatus(r.id, 'rejected')}>
                        <XCircle className="w-4 h-4" /> 
                      </Button>
                      <Button size="sm" variant="outline" disabled={isPending} onClick={() => openEdit(r)}>
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                )}

                {/* Admin: approved */}
                {isAdmin && activeTab === 'approved' && (
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button size="sm" variant="outline" disabled={isPending} onClick={() => openEdit(r)}>
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button size="sm" variant="outline" className="text-red-700 border-red-300 hover:bg-red-50" disabled={isPending} onClick={() => handleStatus(r.id, 'cancelled')}>
                        <Ban className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                )}

                {/* Non-admin: pending (own) */}
                {!isAdmin && activeTab === 'pending' && r.userId === currentUserId && (
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      {/* Editar: profesor→lab, estudiante→computer */}
                      {((role === 'professor' && r.type === 'lab') || (role === 'student' && r.type === 'computer')) && (
                        <Button size="sm" variant="outline" disabled={isPending} onClick={() => openSelfEdit(r)}>
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                      )}
                      <Button size="sm" variant="outline" className="text-red-700 border-red-300 hover:bg-red-50" disabled={isPending} onClick={() => handleStatus(r.id, 'cancelled')}>
                        <Ban className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                )}
                {!isAdmin && activeTab === 'pending' && r.userId !== currentUserId && (
                  <TableCell />
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <TablePagination total={filtered.length} page={page} pageSize={PAGE_SIZE} onPageChange={setPage} />
      </div>

      {/* ══ ADMIN: importación masiva ══════════════════════════════════════════ */}
      {isAdmin && (
        <ImportReservationsDialog open={importOpen} onOpenChange={setImportOpen} />
      )}

      {/* ══ ADMIN: registrar reserva (multi-paso) ══════════════════════════════ */}
      {isAdmin && (
        <Dialog open={adminOpen} onOpenChange={(open) => { if (!open && !isPending) { setAdminOpen(false); } }}>
          <DialogContent className="sm:max-w-lg max-h-[92vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Registrar Reserva</DialogTitle>
            </DialogHeader>

            {/* Paso 1: seleccionar rol y usuario */}
            {adminStep === 1 && (
              <div className="space-y-5 py-2">
                <div className="grid grid-cols-2 gap-3">
                  {(['professor', 'student'] as const).map((r) => (
                    <button
                      key={r}
                      onClick={() => handleAdminRoleSelect(r)}
                      className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all text-sm font-medium ${
                        adminTargetRole === r
                          ? 'border-slate-900 bg-slate-900 text-white'
                          : 'border-slate-200 hover:border-slate-400 text-slate-700'
                      }`}
                    >
                      {r === 'professor' ? <CalendarCheck className="w-5 h-5" /> : <Monitor className="w-5 h-5" />}
                      {r === 'professor' ? 'Docente' : 'Estudiante'}
                    </button>
                  ))}
                </div>

                {adminTargetRole && (
                  <div className="space-y-1.5">
                    <Label>Solicitante</Label>
                    {adminUsersLoading ? (
                      <div className="flex items-center gap-2 text-sm text-slate-400 py-2">
                        <Loader2 className="w-4 h-4 animate-spin" /> Cargando usuarios…
                      </div>
                    ) : (
                      <select
                        value={adminSelectedUserId}
                        onChange={(e) => setAdminSelectedUserId(e.target.value)}
                        className={SELECT_CLS}
                      >
                        <option value="">Seleccione un usuario</option>
                        {adminUsers.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.fullName} — C.I. {u.cedula}
                          </option>
                        ))}
                      </select>
                    )}
                    {!adminUsersLoading && adminUsers.length === 0 && (
                      <p className="text-xs text-slate-400">No hay usuarios activos con este rol.</p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Paso 2: formulario */}
            {adminStep === 2 && adminTargetRole === 'professor' && (
              <div className="space-y-4 py-2">
                <div className="space-y-1.5">
                  <Label>Laboratorio</Label>
                  <select value={adminLabId} onChange={(e) => setAdminLabId(e.target.value)} className={SELECT_CLS}>
                    <option value="">Seleccione un laboratorio</option>
                    {laboratories.map((lab) => (
                      <option key={lab.id} value={lab.id}>{lab.name} — {lab.operational}/{lab.capacity} equipos</option>
                    ))}
                  </select>
                </div>

                {/* Toggle recurrente */}
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => { setAdminIsRecurring((v) => !v); setAdminError(''); }}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${adminIsRecurring ? 'bg-slate-900' : 'bg-slate-300'}`}
                  >
                    <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${adminIsRecurring ? 'translate-x-4.5' : 'translate-x-0.5'}`} />
                  </button>
                  <span className="text-sm text-slate-700 flex items-center gap-1.5">
                    <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                    Reserva recurrente (semanal)
                  </span>
                </div>

                {!adminIsRecurring ? (
                  <div className="space-y-1.5">
                    <Label>Fecha</Label>
                    <Input type="date" min={today} value={adminDate} onChange={(e) => setAdminDate(e.target.value)} />
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label>Primera Sesión</Label>
                        <Input type="date" min={today} value={adminRecurStart} onChange={(e) => setAdminRecurStart(e.target.value)} />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Última Sesión</Label>
                        <Input type="date" min={adminRecurStart || today} value={adminRecurEnd} onChange={(e) => setAdminRecurEnd(e.target.value)} />
                      </div>
                    </div>
                    {adminRecurDayName && adminRecurEnd && adminPreviewCount > 0 && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 text-sm text-blue-800">
                        Se crearán hasta <strong>{adminPreviewCount}</strong> reservas los <strong>{adminRecurDayName}</strong>.
                      </div>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Hora de Inicio</Label>
                    <select value={adminStartTime} onChange={(e) => setAdminStartTime(e.target.value)} className={SELECT_CLS}>
                      <option value="">Seleccione</option>
                      {TIME_SLOTS.map((s) => <option key={s.start} value={s.start}>{s.start}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Hora de Fin</Label>
                    <select value={adminEndTime} onChange={(e) => setAdminEndTime(e.target.value)} className={SELECT_CLS}>
                      <option value="">Seleccione</option>
                      {TIME_SLOTS.map((s) => <option key={s.end} value={s.end}>{s.end}</option>)}
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label>Propósito de la Reserva</Label>
                  <Textarea placeholder="Ej: Práctica de Bases de Datos — Sección 01" value={adminPurpose} onChange={(e) => setAdminPurpose(e.target.value)} rows={2} />
                </div>
              </div>
            )}

            {adminStep === 2 && adminTargetRole === 'student' && (
              <div className="space-y-4 py-2">
                <div className="space-y-1.5">
                  <Label>Laboratorio</Label>
                  <select value={adminStuLabId} onChange={(e) => { setAdminStuLabId(e.target.value); setAdminStuComputers([]); setAdminStuSelectedComputer(''); }} className={SELECT_CLS}>
                    <option value="">Seleccione un laboratorio</option>
                    {laboratories.map((lab) => <option key={lab.id} value={lab.id}>{lab.name}</option>)}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label>Fecha</Label>
                  <Input type="date" min={today} value={adminStuDate} onChange={(e) => { setAdminStuDate(e.target.value); setAdminStuComputers([]); setAdminStuSelectedComputer(''); }} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Hora de Inicio</Label>
                    <select value={adminStuStartTime} onChange={(e) => { setAdminStuStartTime(e.target.value); setAdminStuComputers([]); setAdminStuSelectedComputer(''); }} className={SELECT_CLS}>
                      <option value="">Seleccione</option>
                      {TIME_SLOTS.map((s) => <option key={s.start} value={s.start}>{s.start}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Hora de Fin</Label>
                    <select value={adminStuEndTime} onChange={(e) => { setAdminStuEndTime(e.target.value); setAdminStuComputers([]); setAdminStuSelectedComputer(''); }} className={SELECT_CLS}>
                      <option value="">Seleccione</option>
                      {TIME_SLOTS.map((s) => <option key={s.end} value={s.end}>{s.end}</option>)}
                    </select>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  onClick={loadAdminStuComputers}
                  disabled={!adminStuLabId || !adminStuDate || !adminStuStartTime || !adminStuEndTime || adminStuLoadingComputers}
                  className="w-full"
                >
                  {adminStuLoadingComputers ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Buscando...</> : 'Ver computadoras disponibles'}
                </Button>

                {adminStuComputers.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex gap-3 text-xs text-slate-500">
                      <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block" />Disponible</span>
                      <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-slate-300 inline-block" />Ocupada</span>
                    </div>
                    <div className="grid grid-cols-6 gap-2">
                      {adminStuComputers.map((c) => (
                        <button key={c.id} type="button" disabled={!c.available}
                          onClick={() => setAdminStuSelectedComputer(c.id === adminStuSelectedComputer ? '' : c.id)}
                          className={`flex flex-col items-center justify-center p-2 rounded-lg border-2 text-xs font-medium transition-all ${
                            !c.available ? 'border-slate-200 bg-slate-50 text-slate-300 cursor-not-allowed'
                            : c.id === adminStuSelectedComputer ? 'border-slate-900 bg-slate-900 text-white shadow-md'
                            : 'border-green-300 bg-green-50 text-green-700 hover:border-green-500'
                          }`}
                        >
                          <Monitor className="w-3.5 h-3.5 mb-0.5" />{c.number}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label>Propósito de la Reserva</Label>
                  <Textarea placeholder="Ej: Trabajo de programación — Proyecto Final" value={adminStuPurpose} onChange={(e) => setAdminStuPurpose(e.target.value)} rows={2} />
                </div>
              </div>
            )}

            {/* Feedback */}
            {adminError && (
              <p className="text-sm text-red-600 flex items-center gap-1.5 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />{adminError}
              </p>
            )}
            {adminSuccess && (
              <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg px-3 py-2 text-sm flex items-center gap-2">
                <CalendarCheck className="w-4 h-4" />{adminSuccess}
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setAdminOpen(false)} disabled={isPending}>Cancelar</Button>
              {adminStep === 1 ? (
                <Button
                  onClick={() => { setAdminStep(2); resetAdminForms(); setAdminError(''); }}
                  disabled={!adminTargetRole || !adminSelectedUserId}
                >
                  Continuar <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              ) : (
                <Button
                  onClick={handleAdminSubmit}
                  disabled={isPending || (adminTargetRole === 'professor' ? !adminStep2ProfValid : !adminStep2StuValid)}
                >
                  {isPending ? <><Loader2 className="w-4 h-4 mr-1 animate-spin" />Enviando...</> : 'Registrar Reserva'}
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* ══ PROFESOR: crear reserva (con recurrente) ══════════════════════════ */}
      {role === 'professor' && (
        <Dialog open={profOpen} onOpenChange={(open) => { if (!open && !isPending) setProfOpen(false); }}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader><DialogTitle>Registrar Reserva</DialogTitle></DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label>Laboratorio</Label>
                <select value={profLabId} onChange={(e) => setProfLabId(e.target.value)} className={SELECT_CLS}>
                  <option value="">Seleccione un laboratorio</option>
                  {laboratories.map((lab) => (
                    <option key={lab.id} value={lab.id}>{lab.name} — {lab.operational}/{lab.capacity} equipos</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => { setProfIsRecurring((v) => !v); setProfError(''); }}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${profIsRecurring ? 'bg-slate-900' : 'bg-slate-300'}`}
                >
                  <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${profIsRecurring ? 'translate-x-4.5' : 'translate-x-0.5'}`} />
                </button>
                <span className="text-sm text-slate-700 flex items-center gap-1.5">
                  <RefreshCw className="w-3.5 h-3.5 text-slate-500" />Reserva recurrente semanal
                </span>
              </div>

              {!profIsRecurring ? (
                <div className="space-y-1.5">
                  <Label>Fecha</Label>
                  <Input type="date" min={today} value={profDate} onChange={(e) => setProfDate(e.target.value)} />
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label>Primera Sesión</Label>
                      <Input type="date" min={today} value={profRecurStart} onChange={(e) => setProfRecurStart(e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Última Sesión</Label>
                      <Input type="date" min={profRecurStart || today} value={profRecurEnd} onChange={(e) => setProfRecurEnd(e.target.value)} />
                    </div>
                  </div>
                  {profRecurDayName && profRecurEnd && profPreviewCount > 0 && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 text-sm text-blue-800">
                      Se crearán hasta <strong>{profPreviewCount}</strong> reservas los <strong>{profRecurDayName}</strong>.
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Hora de Inicio</Label>
                  <select value={profStartTime} onChange={(e) => setProfStartTime(e.target.value)} className={SELECT_CLS}>
                    <option value="">Seleccione</option>
                    {TIME_SLOTS.map((s) => <option key={s.start} value={s.start}>{s.start}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label>Hora de Fin</Label>
                  <select value={profEndTime} onChange={(e) => setProfEndTime(e.target.value)} className={SELECT_CLS}>
                    <option value="">Seleccione</option>
                    {TIME_SLOTS.map((s) => <option key={s.end} value={s.end}>{s.end}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Propósito de la Reserva</Label>
                <Textarea placeholder="Ej: Práctica de Bases de Datos — Sección 01" value={profPurpose} onChange={(e) => setProfPurpose(e.target.value)} rows={3} />
              </div>

              {profError && <p className="text-sm text-red-600 flex items-center gap-1.5 bg-red-50 border border-red-200 rounded-lg px-3 py-2"><AlertCircle className="w-4 h-4 flex-shrink-0" />{profError}</p>}
              {profSuccess && <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg px-3 py-2 text-sm flex items-center gap-2"><CalendarCheck className="w-4 h-4" />{profSuccess}</div>}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setProfOpen(false)} disabled={isPending}>Cancelar</Button>
              <Button
                onClick={handleProfSubmit}
                disabled={isPending || !profLabId || !profStartTime || !profEndTime || !profPurpose.trim() || (profIsRecurring ? !profRecurStart || !profRecurEnd : !profDate)}
              >
                {isPending ? <><Loader2 className="w-4 h-4 mr-1 animate-spin" />Enviando...</> : profIsRecurring ? 'Solicitar Reservas' : 'Solicitar Reserva'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* ══ ESTUDIANTE: crear reserva ══════════════════════════════════════════ */}
      {role === 'student' && (
        <Dialog open={studentOpen} onOpenChange={(open) => { if (!open && !isPending) setStudentOpen(false); }}>
          <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Registrar Reserva</DialogTitle></DialogHeader>
            <div key={stuKey} className="space-y-5 py-2">
              <div className="space-y-1.5">
                <Label>Laboratorio</Label>
                <select value={stuLabId} onChange={(e) => { setStuLabId(e.target.value); setStuComputers([]); setStuSelectedComputer(''); }} className={SELECT_CLS}>
                  <option value="">Seleccione un laboratorio</option>
                  {laboratories.map((lab) => <option key={lab.id} value={lab.id}>{lab.name}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Fecha</Label>
                <Input type="date" min={today} value={stuDate} onChange={(e) => { setStuDate(e.target.value); setStuComputers([]); setStuSelectedComputer(''); }} />
              </div>
              <div className="grid grid-cols-2 gap-4">        
                <div className="space-y-1.5">
                  <Label>Hora de Inicio</Label>
                  <select value={stuStartTime} onChange={(e) => { setStuStartTime(e.target.value); setStuComputers([]); setStuSelectedComputer(''); }} className={SELECT_CLS}>
                    <option value="">Seleccione</option>
                    {TIME_SLOTS.map((s) => <option key={s.start} value={s.start}>{s.start}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label>Hora de Fin</Label>
                  <select value={stuEndTime} onChange={(e) => { setStuEndTime(e.target.value); setStuComputers([]); setStuSelectedComputer(''); }} className={SELECT_CLS}>
                    <option value="">Seleccione</option>
                    {TIME_SLOTS.map((s) => <option key={s.end} value={s.end}>{s.end}</option>)}
                  </select>
                </div>
              </div>
              <Button type="button" variant="outline" onClick={loadStuComputers} disabled={!stuCanSearch || stuLoadingComputers} className="w-full">
                {stuLoadingComputers ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Buscando...</> : 'Ver computadoras disponibles'}
              </Button>

              {stuComputers.length > 0 && (
                <div className="space-y-3">
                  <div className="flex gap-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block" />Disponible</span>
                    <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-slate-300 inline-block" />Ocupada</span>
                  </div>
                  <div className="grid grid-cols-6 sm:grid-cols-8 gap-2">
                    {stuComputers.map((c) => (
                      <button key={c.id} type="button" disabled={!c.available}
                        onClick={() => setStuSelectedComputer(c.id === stuSelectedComputer ? '' : c.id)}
                        className={`flex flex-col items-center justify-center p-2 rounded-lg border-2 text-xs font-medium transition-all ${
                          !c.available ? 'border-slate-200 bg-slate-50 text-slate-300 cursor-not-allowed'
                          : c.id === stuSelectedComputer ? 'border-slate-900 bg-slate-900 text-white shadow-md'
                          : 'border-green-300 bg-green-50 text-green-700 hover:border-green-500'
                        }`}
                      >
                        <Monitor className="w-3.5 h-3.5 mb-0.5" />{c.number}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {stuSelectedComputer && (
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label>Propósito de la Reserva</Label>
                    <Textarea placeholder="Ej: Trabajo de programación — Proyecto Final" value={stuPurpose} onChange={(e) => setStuPurpose(e.target.value)} rows={2} />
                  </div>
                </div>
              )}

              {stuError && <p className="text-sm text-red-600 flex items-center gap-1.5 bg-red-50 border border-red-200 rounded-lg px-3 py-2"><AlertCircle className="w-4 h-4 flex-shrink-0" />{stuError}</p>}
              {stuSuccess && <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg px-3 py-2 text-sm flex items-center gap-2"><CalendarCheck className="w-4 h-4" />{stuSuccess}</div>}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setStudentOpen(false)} disabled={isPending}>Cancelar</Button>
              <Button onClick={handleStuSubmit} disabled={isPending || !stuSelectedComputer || !stuPurpose.trim()}>
                {isPending ? <><Loader2 className="w-4 h-4 mr-1 animate-spin" />Reservando...</> : 'Solicitar Reserva'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* ══ SELF-EDIT: profesor/estudiante editan reserva pendiente ═══════════ */}
      <Dialog open={!!selfEditTarget} onOpenChange={(open) => { if (!open) setSelfEditTarget(null); }}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Modificar Reserva
            </DialogTitle>
          </DialogHeader>

          {selfEditTarget && (
            <div className="space-y-4 py-2">
              {/* Info actual */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm space-y-0.5">
                <p className="font-medium text-slate-800">{selfEditTarget.laboratory.name}</p>
                <p className="text-slate-500">
                  {format(new Date(`${selfEditTarget.date}T00:00:00`), 'dd/MM/yyyy')} · {selfEditTarget.startTime}–{selfEditTarget.endTime}
                  {selfEditTarget.type === 'computer' && selfEditTarget.computerReservations[0] &&
                    ` · Computadora #${selfEditTarget.computerReservations[0].computer.number}`}
                </p>
              </div>

              {/* Selector de laboratorio */}
              <div className="space-y-1.5">
                <Label>
                  Laboratorio
                </Label>
                <Select
                  value={selfEditLabId}
                  onValueChange={(v) => {
                    setSelfEditLabId(v);
                    setSelfEditComputers([]);
                    setSelfEditSelectedComputer('');
                  }}
                >
                  <SelectTrigger><SelectValue placeholder="Seleccione un laboratorio" /></SelectTrigger>
                  <SelectContent>
                    {laboratories.map((lab) => (
                      <SelectItem key={lab.id} value={lab.id}>
                        {lab.name} — {lab.operational}/{lab.capacity} equipos
                        {lab.id === selfEditTarget.laboratoryId && ' (actual)'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Picker de computadora (solo estudiante) */}
              {selfEditTarget.type === 'computer' && (
                <div className="space-y-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => selfEditTarget && loadSelfEditComputers(selfEditLabId, selfEditTarget)}
                    disabled={!selfEditLabId || selfEditLoadingComputers}
                    className="w-full"
                  >
                    {selfEditLoadingComputers
                      ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Buscando...</>
                      : 'Ver computadoras disponibles'}
                  </Button>

                  {selfEditComputers.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex gap-3 text-xs text-slate-500">
                        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block" />Disponible</span>
                        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-slate-300 inline-block" />Ocupada</span>
                      </div>
                      <div className="grid grid-cols-6 gap-2">
                        {selfEditComputers.map((c) => (
                          <button
                            key={c.id}
                            type="button"
                            disabled={!c.available}
                            onClick={() => setSelfEditSelectedComputer(c.id === selfEditSelectedComputer ? '' : c.id)}
                            className={`flex flex-col items-center justify-center p-2 rounded-lg border-2 text-xs font-medium transition-all ${
                              !c.available ? 'border-slate-200 bg-slate-50 text-slate-300 cursor-not-allowed'
                              : c.id === selfEditSelectedComputer ? 'border-slate-900 bg-slate-900 text-white shadow-md'
                              : 'border-green-300 bg-green-50 text-green-700 hover:border-green-500'
                            }`}
                          >
                            <Monitor className="w-3.5 h-3.5 mb-0.5" />{c.number}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {selfEditError && (
                <p className="text-sm text-red-600 flex items-center gap-1.5 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />{selfEditError}
                </p>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelfEditTarget(null)} disabled={isPending}>Cancelar</Button>
            <Button
              onClick={handleSelfEditSave}
              disabled={
                isPending ||
                (selfEditTarget?.type === 'computer' ? !selfEditSelectedComputer : false)
              }
            >
              {isPending ? <><Loader2 className="w-4 h-4 mr-1 animate-spin" />Guardando…</> : 'Guardar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ══ ADMIN: editar reserva existente ═══════════════════════════════════ */}
      <Dialog open={!!editTarget} onOpenChange={(open) => { if (!open) setEditTarget(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              Modificar Reserva
            </DialogTitle>
          </DialogHeader>

          {editTarget && (
            <div className="space-y-4 py-2">
              <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm space-y-0.5">
                <p className="font-medium text-slate-800">{editTarget.user.fullName}</p>
                <p className="text-slate-500">
                  {editTarget.laboratory.name} · {format(new Date(`${editTarget.date}T00:00:00`), 'dd/MM/yyyy')} · {editTarget.startTime}–{editTarget.endTime}
                </p>
              </div>

              {editTarget.type === 'lab' && (
                <div className="space-y-1.5">
                  <Label>Laboratorio</Label>
                  {dialogLoading ? (
                    <div className="flex items-center gap-2 text-sm text-slate-400">
                      <Loader2 className="w-4 h-4 animate-spin" /> Cargando…
                    </div>
                  ) : (
                    <Select value={editNewLabId} onValueChange={setEditNewLabId}>
                      <SelectTrigger><SelectValue placeholder="Seleccione un laboratorio" /></SelectTrigger>
                      <SelectContent>
                        {dialogLabs.map((lab) => (
                          <SelectItem key={lab.id} value={lab.id}>
                            {lab.name}{lab.id === editTarget.laboratoryId && ' (actual)'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              )}

              {editTarget.type === 'computer' && (
                <div className="space-y-1.5">
                  <Label>Computadora</Label>
                  {dialogLoading ? (
                    <div className="flex items-center gap-2 text-sm text-slate-400">
                      <Loader2 className="w-4 h-4 animate-spin" /> Cargando…
                    </div>
                  ) : (
                    <Select value={editNewComputerId} onValueChange={setEditNewComputerId}>
                      <SelectTrigger><SelectValue placeholder="Seleccione una computadora" /></SelectTrigger>
                      <SelectContent>
                        {dialogComputers.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            #{String(c.number).padStart(2, '0')}
                            {c.publicId ? ` — ${c.publicId}` : ''}
                            {c.id === editTarget.computerReservations[0]?.computer.id && ' (actual)'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              )}

              {editError && (
                <p className="text-sm text-red-600 flex items-center gap-1.5 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />{editError}
                </p>
              )}
            </div>
          )}

          <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
            <Button variant="outline" className="text-red-700 border-red-300 hover:bg-red-50 sm:mr-auto" onClick={handleCancelFromEdit} disabled={isPending}>
              <Ban className="w-4 h-4 mr-1" />Cancelar
            </Button>
            <Button variant="outline" onClick={() => setEditTarget(null)} disabled={isPending}>Cerrar</Button>
            <Button onClick={handleSaveEdit} disabled={isPending || dialogLoading}>
              {isPending ? <><Loader2 className="w-4 h-4 mr-1 animate-spin" />Guardando…</> : 'Guardar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
