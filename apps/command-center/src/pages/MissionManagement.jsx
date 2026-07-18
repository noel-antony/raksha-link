import { useEffect, useState } from 'react';
import { Send, Clock, Users, ShieldCheck, FileText } from 'lucide-react';
import { api } from '../services/api';
import Button from '../components/UI/Button';

function timeAgo(dateString) {
  const diffMinutes = Math.max(1, Math.round((Date.now() - new Date(dateString).getTime()) / 60000));
  if (diffMinutes < 60) return `${diffMinutes} mins ago`;
  const hours = Math.round(diffMinutes / 60);
  if (hours < 24) return `${hours} hr${hours > 1 ? 's' : ''} ago`;
  const days = Math.round(hours / 24);
  return `${days} day${days > 1 ? 's' : ''} ago`;
}

export default function MissionManagement() {
  const [missions, setMissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMissions = async () => {
      try {
        setLoading(true);
        const data = await api.getMissions();
        setMissions(data);
      } catch (err) {
        setError(err.message || 'Failed to load missions');
      } finally {
        setLoading(false);
      }
    };
    fetchMissions();
  }, []);

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-80px)] items-center justify-center">
        <p className="text-secondary-500 animate-pulse">Loading mission control...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-[calc(100vh-80px)] items-center justify-center">
        <p className="text-danger">{error}</p>
      </div>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-secondary">Mission Management</h1>
          <p className="mt-2 text-secondary-500">Track active dispatch missions and deployed volunteers.</p>
        </div>
      </div>

      <div className="grid gap-6">
        {missions.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-12 text-center text-secondary-500 shadow-sm">
            No active missions to track.
          </div>
        ) : (
          missions.map((mission) => (
            <div key={mission.id} className="rounded-2xl border border-border bg-card p-6 shadow-sm flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex-1 space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider ${
                    mission.status === 'Active' ? 'bg-primary-50 text-primary-700' :
                    mission.status === 'Pending' ? 'bg-warning-100 text-warning' :
                    'bg-secondary-100 text-secondary-700'
                  }`}>
                    <Send className="h-3 w-3" />
                    {mission.status || 'Unknown'}
                  </span>
                  <span className="flex items-center gap-1 text-sm text-secondary-400">
                    <Clock className="h-4 w-4" />
                    {timeAgo(mission.createdAt)}
                  </span>
                </div>
                
                <div>
                  <h2 className="text-xl font-bold text-secondary-900">{mission.title}</h2>
                  <div className="mt-2 flex items-center gap-2 text-sm text-secondary-600">
                    <FileText className="h-4 w-4" />
                    <span>Associated Incident ID: <span className="font-mono text-xs">{mission.incidentId}</span></span>
                  </div>
                </div>

                {mission.instructions && (
                  <div className="rounded-xl bg-background p-4 border border-border text-sm text-secondary-700">
                    <span className="font-semibold block mb-1">Mission Directives:</span>
                    {mission.instructions}
                  </div>
                )}
              </div>

              <div className="w-full lg:w-72 space-y-4">
                <div className="rounded-xl border border-border bg-background p-4">
                  <div className="flex items-center gap-2 mb-3 border-b border-border pb-2">
                    <Users className="h-4 w-4 text-secondary-500" />
                    <h3 className="text-sm font-semibold text-secondary-900">Deployed Responders</h3>
                  </div>
                  {mission.assignedVolunteers && mission.assignedVolunteers.length > 0 ? (
                    <ul className="space-y-3">
                      {mission.assignedVolunteers.map((vol, idx) => (
                        <li key={idx} className="flex items-center justify-between text-sm">
                          <span className="font-medium text-secondary-800">
                            {vol.volunteerId ? `Vol-${vol.volunteerId.slice(0,4)}` : 'Unknown'}
                          </span>
                          <span className="text-xs capitalize text-secondary-500">
                            <ShieldCheck className="h-3 w-3 inline mr-1 text-primary-500"/>
                            {vol.status || 'dispatched'}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-secondary-500">No responders assigned yet.</p>
                  )}
                </div>
                
                <Button variant="secondary" className="w-full justify-center">Manage Mission</Button>
              </div>
            </div>
          ))
        )}
      </div>
    </main>
  );
}
