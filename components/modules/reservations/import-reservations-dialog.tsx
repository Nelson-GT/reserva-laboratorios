'use client';

import { useState, useRef, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Download, Upload, CheckCircle2, XCircle, Loader2, AlertCircle, FileSpreadsheet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

type RowResult = {
  row: number;
  label: string;
  status: 'success' | 'error';
  errors?: string[];
};

type ImportSummary = {
  created: number;
  failed: number;
  results: RowResult[];
};

type ImportState = 'idle' | 'done';

export function ImportReservationsDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [state, setState] = useState<ImportState>('idle');
  const [summary, setSummary] = useState<ImportSummary | null>(null);
  const [fileName, setFileName] = useState('');
  const [fileError, setFileError] = useState('');
  const [isPending, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  function handleClose() {
    if (isPending) return;
    onOpenChange(false);
    setTimeout(() => {
      setState('idle');
      setSummary(null);
      setFileName('');
      setFileError('');
      setSelectedFile(null);
      if (fileRef.current) fileRef.current.value = '';
    }, 200);
  }

  function handleReset() {
    setState('idle');
    setSummary(null);
    setFileName('');
    setFileError('');
    setSelectedFile(null);
    if (fileRef.current) fileRef.current.value = '';
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    setFileError('');
    setSelectedFile(f);
    setFileName(f?.name ?? '');
  }

  function handleImport() {
    if (!selectedFile) {
      setFileError('Seleccione un archivo Excel (.xlsx) antes de continuar.');
      return;
    }
    if (!selectedFile.name.endsWith('.xlsx') && !selectedFile.name.endsWith('.xls')) {
      setFileError('El archivo debe ser un Excel (.xlsx o .xls).');
      return;
    }
    setFileError('');
    startTransition(async () => {
      const fd = new FormData();
      fd.append('file', selectedFile);
      try {
        const res = await fetch('/api/reservations/import', { method: 'POST', body: fd });
        const data = await res.json();
        if (!res.ok) {
          setFileError(data.error ?? 'Error al procesar el archivo.');
          return;
        }
        setSummary(data as ImportSummary);
        setState('done');
        if (data.created > 0) router.refresh();
      } catch {
        setFileError('Error de red al procesar el archivo.');
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Importar Reservas</DialogTitle>
        </DialogHeader>

        {state === 'idle' && (
          <div className="flex flex-col gap-5 py-2 min-h-0">
            <p className="text-sm text-slate-600">
              Descargue la plantilla, complete los datos y suba el archivo para registrar reservas en lote.
              Las reservas se crearán en estado <strong>Pendiente</strong>.
            </p>

            {/* Download template */}
            <a
              href="/api/reservations/template"
              download
              className="flex items-center gap-3 rounded-lg border border-dashed border-slate-300 px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <FileSpreadsheet className="w-5 h-5 text-green-600 flex-shrink-0" />
              <span className="flex-1">
                <span className="font-medium">Descargar plantilla Excel</span>
                <span className="block text-xs text-slate-400">plantilla-reservas.xlsx · incluye laboratorios disponibles</span>
              </span>
              <Download className="w-4 h-4 text-slate-400" />
            </a>

            {/* File upload */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Archivo a importar</label>
              <label
                htmlFor="import-reservations-file"
                className={`flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-6 cursor-pointer transition-colors ${
                  fileName
                    ? 'border-slate-400 bg-slate-50'
                    : 'border-slate-200 hover:border-slate-400 hover:bg-slate-50'
                }`}
              >
                <Upload className="w-6 h-6 text-slate-400" />
                {fileName ? (
                  <span className="text-sm font-medium text-slate-700">{fileName}</span>
                ) : (
                  <span className="text-sm text-slate-500">
                    Haga clic para seleccionar un archivo <span className="font-medium">.xlsx</span>
                  </span>
                )}
                <input
                  id="import-reservations-file"
                  type="file"
                  accept=".xlsx,.xls"
                  ref={fileRef}
                  onChange={handleFileChange}
                  className="sr-only"
                />
              </label>
              {fileError && (
                <p className="text-sm text-red-600 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {fileError}
                </p>
              )}
            </div>
          </div>
        )}

        {state === 'done' && summary && (
          <div className="flex flex-col gap-4 py-2 min-h-0 overflow-hidden">
            {/* Summary banner */}
            <div
              className={`rounded-lg px-4 py-3 text-sm font-medium flex items-center gap-2 ${
                summary.failed === 0
                  ? 'bg-green-50 border border-green-200 text-green-800'
                  : summary.created === 0
                  ? 'bg-red-50 border border-red-200 text-red-800'
                  : 'bg-amber-50 border border-amber-200 text-amber-800'
              }`}
            >
              {summary.failed === 0 ? (
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              ) : summary.created === 0 ? (
                <XCircle className="w-4 h-4 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
              )}
              {summary.created} creada{summary.created !== 1 ? 's' : ''} ·{' '}
              {summary.failed} error{summary.failed !== 1 ? 'es' : ''}
            </div>

            {/* Results */}
            <div className="overflow-y-auto flex-1 min-h-0 max-h-72 rounded-lg border border-slate-200">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left px-3 py-2 text-slate-500 font-semibold w-12">#</th>
                    <th className="text-left px-3 py-2 text-slate-500 font-semibold">Solicitante</th>
                    <th className="text-left px-3 py-2 text-slate-500 font-semibold w-24">Estado</th>
                    <th className="text-left px-3 py-2 text-slate-500 font-semibold">Detalle</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {summary.results.map((r) => (
                    <tr key={r.row} className={r.status === 'error' ? 'bg-red-50' : ''}>
                      <td className="px-3 py-2 text-slate-400">{r.row}</td>
                      <td className="px-3 py-2 font-medium text-slate-700">{r.label}</td>
                      <td className="px-3 py-2">
                        {r.status === 'success' ? (
                          <span className="inline-flex items-center gap-1 text-green-700">
                            <CheckCircle2 className="w-3 h-3" /> Creada
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-red-600">
                            <XCircle className="w-3 h-3" /> Error
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-slate-500">
                        {r.errors?.join('; ') ?? '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <DialogFooter className="mt-2">
          {state === 'idle' ? (
            <>
              <Button variant="outline" onClick={handleClose} disabled={isPending}>
                Cancelar
              </Button>
              <Button onClick={handleImport} disabled={isPending || !selectedFile}>
                {isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                    Importando…
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-1.5" />
                    Importar
                  </>
                )}
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={handleReset}>
                Importar otro archivo
              </Button>
              <Button onClick={handleClose}>Cerrar</Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
