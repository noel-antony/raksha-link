import { useMemo } from 'react';
import { MOCK_CRISIS_EVENTS } from '../config/mockData';
import { AlertTriangle, Clock, MapPin, Info } from 'lucide-react';
import Badge from '../components/UI/Badge';

export default function Alerts() {
  // For demo purposes, we're just showing the mock crisis events here.
  // In a real application, you would filter these based on the volunteer's region.
  const activeAlerts = useMemo(() => MOCK_CRISIS_EVENTS.filter(event => event.status === 'active'), []);

  return (
    <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-navy">Emergency Alerts</h1>
          <p className="mt-2 text-slate-500">Live crisis events in your vicinity</p>
        </div>
        <div className="rounded-2xl bg-red-50 p-4 flex items-center gap-3">
          <AlertTriangle className="h-6 w-6 text-red-600" />
          <span className="font-bold text-red-700">{activeAlerts.length} Active</span>
        </div>
      </div>

      {activeAlerts.length === 0 ? (
        <div className="rounded-[28px] bg-white p-12 text-center shadow-card border border-slate-100">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-50 text-green-600 mb-4">
            <Info className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-bold text-navy">All clear</h2>
          <p className="mt-2 text-slate-500">There are no active emergencies in your area right now.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {activeAlerts.map(alert => (
            <div key={alert.id} className="rounded-[28px] bg-white p-6 shadow-card border-l-4 border-red-500">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <Badge color="red" className="animate-pulse">LIVE</Badge>
                    <span className="text-sm font-semibold uppercase tracking-wider text-red-600">
                      Severity: {alert.severity}
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-navy">{alert.type}</h2>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-slate-500 flex items-center gap-1 justify-end">
                    <Clock className="h-4 w-4" />
                    {new Date(alert.reportedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-xl">
                  <p className="text-xs text-slate-500 mb-1 flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> Location
                  </p>
                  <p className="font-medium text-slate-800">{alert.location}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl">
                  <p className="text-xs text-slate-500 mb-1">Estimated Affected</p>
                  <p className="font-medium text-slate-800">{alert.affectedEstimate}</p>
                </div>
              </div>

              {alert.signals && alert.signals.length > 0 && (
                <div className="mt-4 border-t border-slate-100 pt-4">
                  <p className="text-xs font-semibold text-slate-500 mb-2">KEY SIGNALS</p>
                  <ul className="list-disc pl-5 text-sm text-slate-700 space-y-1">
                    {alert.signals.map((signal, idx) => (
                      <li key={idx}>{signal}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
