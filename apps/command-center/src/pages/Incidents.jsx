import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Activity, AlertTriangle, ShieldCheck, Clock, MapPin, ChevronRight } from 'lucide-react';
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

export default function Incidents() {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchIncidents = async () => {
      try {
        setLoading(true);
        const data = await api.getIncidents();
        setIncidents(data);
      } catch (err) {
        setError(err.message || 'Failed to load incidents');
      } finally {
        setLoading(false);
      }
    };
    fetchIncidents();
  }, []);

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-80px)] items-center justify-center">
        <p className="text-secondary-500 animate-pulse">Loading incidents...</p>
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-secondary">Incidents</h1>
          <p className="mt-2 text-secondary-500">Live feed of all reported emergencies and AI analysis.</p>
        </div>
        <Button>Report New Incident</Button>
      </div>

      <div className="grid gap-6">
        {incidents.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-12 text-center text-secondary-500 shadow-sm">
            No active incidents reported.
          </div>
        ) : (
          incidents.map((incident) => (
            <Link key={incident.id} to={`/incidents/${incident.id}`}>
              <article className="group rounded-2xl border border-border bg-card p-6 shadow-sm transition-all hover:shadow-elevated hover:border-primary-300">
                <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
                  <div className="flex-1 space-y-4">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider ${
                        incident.priority === 'Critical' ? 'bg-danger-100 text-danger' :
                        incident.priority === 'High' ? 'bg-warning-100 text-warning' :
                        'bg-secondary-100 text-secondary-700'
                      }`}>
                        {incident.priority === 'Critical' ? <AlertTriangle className="h-3 w-3" /> : <Activity className="h-3 w-3" />}
                        {incident.priority || 'Unassigned'} Priority
                      </span>
                      <span className="inline-flex items-center rounded-full bg-background border border-border px-3 py-1 text-xs font-medium text-secondary-600">
                        {incident.category || 'Uncategorized'}
                      </span>
                      <span className="flex items-center gap-1 text-sm text-secondary-400">
                        <Clock className="h-4 w-4" />
                        {timeAgo(incident.createdAt)}
                      </span>
                    </div>

                    <div>
                      <h2 className="text-xl font-bold text-secondary-900 group-hover:text-primary-600 transition-colors">
                        {incident.title}
                      </h2>
                      <p className="mt-2 text-secondary-600 line-clamp-2">
                        {incident.description}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-sm text-secondary-500">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="h-4 w-4" />
                        <span>Lat {incident.location?.lat?.toFixed(4)}, Lng {incident.location?.lon?.toFixed(4)}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <ShieldCheck className="h-4 w-4" />
                        <span>Status: <span className="font-semibold text-secondary-900 capitalize">{incident.status}</span></span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start md:self-center text-primary-600 font-medium">
                    View Details
                    <ChevronRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              </article>
            </Link>
          ))
        )}
      </div>
    </main>
  );
}
