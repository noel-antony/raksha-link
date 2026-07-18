import { ChevronDown, Radio, ShieldCheck } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Badge from '../components/UI/Badge';
import Button from '../components/UI/Button';
import { MOCK_CRISIS_EVENTS, MISSION_STATUSES } from '../config/mockData';
import { useToast } from '../hooks/useToast';
import {
  getBreakGlassAuditLog,
  getBreakGlassStatus,
  getMissions,
  subscribeToMissions,
  updateMissionStatus,
} from '../services/firebaseService';

function formatElapsed(start) {
  if (!start) {
    return '0 mins';
  }
  const minutes = Math.max(1, Math.round((Date.now() - new Date(start).getTime()) / 60000));
  if (minutes < 60) {
    return `${minutes} mins`;
  }
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return `${hours}h ${remainder}m`;
}

function statusColor(status) {
  if (status === 'Notified') {
    return 'navy';
  }
  if (status === 'En Route') {
    return 'amber';
  }
  if (status === 'On Site') {
    return 'green';
  }
  return 'teal';
}

export default function MissionTracker() {
  const [searchParams] = useSearchParams();
  const crisisId = searchParams.get('crisisId') || 'c001';
  const crisis = useMemo(() => MOCK_CRISIS_EVENTS.find((item) => item.id === crisisId) || MOCK_CRISIS_EVENTS[0], [crisisId]);
  const { showToast } = useToast();
  const [missions, setMissions] = useState([]);
  const [auditLog, setAuditLog] = useState([]);
  const [expandedMissionId, setExpandedMissionId] = useState('');
  const [activatedAt, setActivatedAt] = useState('');

  useEffect(() => {
    let mounted = true;

    async function bootstrap() {
      try {
        const [initialMissions, audits, breakGlassStatus] = await Promise.all([
          getMissions(crisisId),
          getBreakGlassAuditLog(),
          getBreakGlassStatus(),
        ]);
        if (!mounted) {
          return;
        }
        setMissions(initialMissions);
        setAuditLog(audits.filter((entry) => entry.crisisId === crisisId));
        setActivatedAt(
          breakGlassStatus?.crisisId === crisisId ? breakGlassStatus.activatedAt : initialMissions[0]?.createdAt || '',
        );
      } catch (error) {
        showToast(error.message || 'Unable to load mission tracker.', 'error');
      }
    }

    bootstrap();
    const unsubscribe = subscribeToMissions(crisisId, (data) => setMissions(data));

    return () => {
      mounted = false;
      unsubscribe?.();
    };
  }, [crisisId, showToast]);

  const summary = useMemo(() => {
    const counts = {
      total: missions.length,
      notified: missions.filter((mission) => mission.status === 'Notified').length,
      enRoute: missions.filter((mission) => mission.status === 'En Route').length,
      onSite: missions.filter((mission) => mission.status === 'On Site').length,
      complete: missions.filter((mission) => mission.status === 'Complete').length,
    };
    return counts;
  }, [missions]);

  const handleAdvanceStatus = async (mission) => {
    const currentIndex = MISSION_STATUSES.indexOf(mission.status);
    const nextStatus = MISSION_STATUSES[Math.min(currentIndex + 1, MISSION_STATUSES.length - 1)];

    if (nextStatus === mission.status) {
      showToast('Mission is already complete.', 'info');
      return;
    }

    try {
      await updateMissionStatus(mission.id, mission.volunteerId, nextStatus);
      showToast(`Mission updated to ${nextStatus}.`, 'success');
    } catch (error) {
      showToast(error.message || 'Unable to update mission.', 'error');
    }
  };

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 rounded-[28px] border border-primary-100 bg-white p-6 shadow-card md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <Badge color="red" className="animate-pulse">
              LIVE
            </Badge>
            <span className="text-sm font-medium text-slate-500">Realtime mission tracker</span>
          </div>
          <h1 className="mt-3 text-3xl font-bold text-navy">{crisis.type} Mission Tracker</h1>
          <p className="mt-2 text-slate-600">
            {crisis.location} · Elapsed since activation: {formatElapsed(activatedAt)}
          </p>
        </div>
        <div className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3">
          <Radio className="h-5 w-5 animate-pulse text-red-600" />
          <span className="font-medium text-slate-700">LIVE updates active</span>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-4">
        {[
          { label: 'Total Dispatched', value: summary.total },
          { label: 'En Route', value: summary.enRoute },
          { label: 'On Site', value: summary.onSite },
          { label: 'Complete', value: summary.complete },
        ].map((item) => (
          <div key={item.label} className="rounded-3xl bg-white p-5 shadow-card">
            <p className="text-sm text-slate-500">{item.label}</p>
            <p className="mt-2 font-heading text-3xl font-bold text-navy">{item.value}</p>
          </div>
        ))}
      </div>

      <section className="mt-8 space-y-5">
        {missions.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-card">
            <p className="text-lg font-semibold text-navy">No missions dispatched yet.</p>
            <p className="mt-2 text-slate-500">Dispatch responders from the matching screen to begin live tracking.</p>
          </div>
        ) : (
          missions.map((mission) => (
            <article key={mission.id} className="rounded-[28px] border border-slate-100 bg-white p-6 shadow-card">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="font-heading text-xl font-semibold text-navy">{mission.volunteerName}</h2>
                    <Badge color={statusColor(mission.status)}>{mission.status}</Badge>
                  </div>
                  <p className="mt-2 text-sm font-medium text-slate-700">{mission.primarySkill}</p>
                  <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">{mission.assignedTask}</p>
                </div>
                <Button type="button" variant="secondary" onClick={() => handleAdvanceStatus(mission)}>
                  Advance Status
                </Button>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-4">
                {MISSION_STATUSES.map((status, index) => {
                  const completedIndex = MISSION_STATUSES.indexOf(mission.status);
                  const completed = index <= completedIndex;
                  const timestamp = mission.statusHistory?.find((entry) => entry.status === status)?.at;

                  return (
                    <div key={status} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                      <div className="flex items-center gap-3">
                        <span
                          className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold ${
                            completed ? 'bg-primary-500 text-white' : 'bg-slate-200 text-slate-500'
                          }`}
                        >
                          ●
                        </span>
                        <p className="font-medium text-slate-700">{status}</p>
                      </div>
                      <p className="mt-3 text-xs text-slate-500">{timestamp ? new Date(timestamp).toLocaleTimeString('en-IN') : 'Pending'}</p>
                    </div>
                  );
                })}
              </div>

              <div className="mt-5">
                <button
                  type="button"
                  onClick={() => setExpandedMissionId((current) => (current === mission.id ? '' : mission.id))}
                  className="flex items-center gap-2 text-sm font-semibold text-primary-700"
                >
                  WhatsApp message preview
                  <ChevronDown className={`h-4 w-4 transition-transform ${expandedMissionId === mission.id ? 'rotate-180' : ''}`} />
                </button>
                {expandedMissionId === mission.id && (
                  <div className="mt-3 rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm leading-7 text-slate-600 whitespace-pre-line">
                    {mission.whatsappPreview}
                  </div>
                )}
              </div>
            </article>
          ))
        )}
      </section>

      <section className="mt-10 rounded-[28px] border border-slate-100 bg-white p-6 shadow-card">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-primary-50 p-3 text-primary-600">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-navy">Audit Log</h2>
            <p className="text-sm text-slate-500">This log cannot be modified or deleted</p>
          </div>
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100 text-left text-sm">
            <thead>
              <tr className="text-slate-500">
                <th className="px-4 py-3 font-medium">Timestamp</th>
                <th className="px-4 py-3 font-medium">Coordinator</th>
                <th className="px-4 py-3 font-medium">Crisis</th>
                <th className="px-4 py-3 font-medium">Volunteer (hashed)</th>
                <th className="px-4 py-3 font-medium">Fields Accessed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {auditLog.map((entry, index) => (
                <tr key={`${entry.volunteerId_hashed}_${index}`}>
                  <td className="px-4 py-3 text-slate-600">{new Date(entry.timestamp).toLocaleString('en-IN')}</td>
                  <td className="px-4 py-3 text-slate-600">{entry.coordinatorId}</td>
                  <td className="px-4 py-3 text-slate-600">{entry.crisisId}</td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-600">{entry.volunteerId_hashed}</td>
                  <td className="px-4 py-3 text-slate-600">{entry.fieldsAccessed}</td>
                </tr>
              ))}
              {auditLog.length === 0 && (
                <tr>
                  <td className="px-4 py-6 text-slate-500" colSpan="5">
                    No audit log entries yet for this crisis.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
