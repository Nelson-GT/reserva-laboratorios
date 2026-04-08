import { Alert } from '@/lib/types';
import { AlertCircle, Info, AlertTriangle } from 'lucide-react';

interface AlertsPanelProps {
  alerts: Alert[];
}

export function AlertsPanel({ alerts }: AlertsPanelProps) {
  const getSeverityColors = (severity: string) => {
    switch (severity) {
      case 'critical':
        return {
          bg: 'bg-red-50',
          border: 'border-red-200',
          icon: 'text-red-600',
          badge: 'bg-red-100 text-red-800',
        };
      case 'warning':
        return {
          bg: 'bg-yellow-50',
          border: 'border-yellow-200',
          icon: 'text-yellow-600',
          badge: 'bg-yellow-100 text-yellow-800',
        };
      case 'info':
        return {
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          icon: 'text-blue-600',
          badge: 'bg-blue-100 text-blue-800',
        };
      default:
        return {
          bg: 'bg-slate-50',
          border: 'border-slate-200',
          icon: 'text-slate-600',
          badge: 'bg-slate-100 text-slate-800',
        };
    }
  };

  const getAlertIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertCircle className="w-5 h-5" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5" />;
      case 'info':
        return <Info className="w-5 h-5" />;
      default:
        return <AlertCircle className="w-5 h-5" />;
    }
  };

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-6">
      <h2 className="text-lg font-semibold text-slate-900 mb-4">
        Alertas del Sistema
      </h2>

      {alerts.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-slate-500">No hay alertas en este momento</p>
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert) => {
            const colors = getSeverityColors(alert.severity);
            return (
              <div
                key={alert.id}
                className={`${colors.bg} ${colors.border} border rounded-lg p-4 flex gap-4`}
              >
                <div className={`flex-shrink-0 ${colors.icon}`}>
                  {getAlertIcon(alert.severity)}
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <p className="text-sm font-medium text-slate-900">
                      {alert.message}
                    </p>
                    <span
                      className={`${colors.badge} text-xs px-2 py-1 rounded font-medium flex-shrink-0`}
                    >
                      {alert.type}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1">
                    {alert.timestamp}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
