import { AlertTriangle, ShieldCheck, Activity, Users, Send } from 'lucide-react';
import { useEffect, useState } from 'react';
import { api } from '../services/api';

function timeAgo(dateString) {
  const diffMinutes = Math.max(1, Math.round((Date.now() - new Date(dateString).getTime()) / 60000));
  if (diffMinutes < 60) return `${diffMinutes} mins ago`;
  const hours = Math.round(diffMinutes / 60);
  return `${hours} hr${hours > 1 ? 's' : ''} ago`;
}

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [dashData, activityData] = await Promise.all([
          api.getDashboard(),
          api.getActivity()
        ]);
        setStats(dashData.statistics);
        setActivities(activityData);
      } catch (err) {
        setError(err.message || 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-80px)] items-center justify-center">
        <p className="text-secondary-500 animate-pulse">Loading command center...</p>
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

  const kpis = [
    { title: 'Active Incidents', value: stats.activeIncidents, icon: AlertTriangle, color: 'text-warning' },
    { title: 'Critical Incidents', value: stats.criticalIncidents || 0, icon: Activity, color: 'text-danger' },
    { title: 'Active Missions', value: stats.activeMissions, icon: Send, color: 'text-primary' },
    { title: 'Available Volunteers', value: stats.availableVolunteers, icon: Users, color: 'text-accent' },
    { title: 'Resolved Incidents', value: stats.resolvedIncidents, icon: ShieldCheck, color: 'text-secondary-500' }
  ];

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-secondary">Command Center Dashboard</h1>
        <p className="mt-2 text-secondary-500">Live aggregated statistics and real-time activity feed.</p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div key={idx} className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-secondary-500">{kpi.title}</p>
                  <p className={`mt-2 text-3xl font-bold ${kpi.color}`}>{kpi.value}</p>
                </div>
                <div className={`rounded-xl p-3 bg-secondary-100/50 ${kpi.color}`}>
                  <Icon className="h-6 w-6" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-10">
        <h2 className="text-xl font-bold text-secondary mb-4">Recent Activity</h2>
        <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
          {activities.length === 0 ? (
            <div className="p-8 text-center text-secondary-500">No recent activity detected.</div>
          ) : (
            <ul className="divide-y divide-border">
              {activities.map((activity, idx) => (
                <li key={idx} className="flex items-start gap-4 p-6 hover:bg-background/50 transition-colors">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-secondary-900">{activity.type}</p>
                      <span className="text-sm text-secondary-500">{timeAgo(activity.timestamp)}</span>
                    </div>
                    <p className="text-sm text-secondary-600">{activity.description}</p>
                    <p className="text-xs font-mono text-secondary-400 mt-2">Entity ID: {activity.entityId}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </main>
  );
}
