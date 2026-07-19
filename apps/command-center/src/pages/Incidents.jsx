import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Activity, AlertTriangle, ShieldCheck, Clock, MapPin, ChevronRight, Inbox } from 'lucide-react';
import { api } from '../services/api';
import Button from '../components/UI/Button';
import Skeleton from '../components/UI/Skeleton';
import EmptyState from '../components/UI/EmptyState';
import Badge from '../components/UI/Badge';

function timeAgo(dateString) {
  const diffMinutes = Math.max(1, Math.round((Date.now() - new Date(dateString).getTime()) / 60000));
  if (diffMinutes < 60) return `${diffMinutes} mins ago`;
  const hours = Math.round(diffMinutes / 60);
  if (hours < 24) return `${hours} hr${hours > 1 ? 's' : ''} ago`;
  const days = Math.round(hours / 24);
  return `${days} day${days > 1 ? 's' : ''} ago`;
}

export default function Incidents() {
  const navigate = useNavigate();
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
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 animate-fade-in">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
          <div className="space-y-3">
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-4 w-96" />
          </div>
          <Skeleton className="h-10 w-40 rounded-xl" />
        </div>
        <div className="grid gap-6">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-40 w-full rounded-2xl" />)}
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <div className="flex h-[calc(100vh-80px)] items-center justify-center px-4">
        <EmptyState 
          icon={AlertTriangle} 
          title="Failed to load incidents" 
          description={error} 
          actionLabel="Try Again"
          onAction={() => window.location.reload()}
        />
      </div>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-secondary-900">Incidents</h1>
          <p className="mt-2 text-secondary-500">Live feed of all reported emergencies and AI analysis.</p>
        </div>
        <Button onClick={() => navigate('/report')}>Report New Incident</Button>
      </div>

      <div className="grid gap-6">
        {incidents.length === 0 ? (
          <EmptyState 
            title="No active incidents" 
            description="There are currently no emergencies reported in the system." 
            actionLabel="Report Incident"
            onAction={() => navigate('/report')}
          />
        ) : (
          incidents.map((incident) => (
            <Link key={incident.id} to={`/incidents/${incident.id}`}>
              <article className="group rounded-2xl border border-border bg-card p-6 shadow-sm transition-all hover:shadow-elevated hover:border-primary-300">
                <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
                  <div className="flex-1 space-y-4">
                    <div className="flex flex-wrap items-center gap-3">
                      <Badge color={incident.priority === 'Critical' ? 'danger' : incident.priority === 'High' ? 'warning' : 'secondary'}>
                        {incident.priority === 'Critical' ? <AlertTriangle className="h-3 w-3 mr-1 inline" /> : <Activity className="h-3 w-3 mr-1 inline" />}
                        {incident.priority || 'Unassigned'} Priority
                      </Badge>
                      <Badge color="secondary">{incident.category || 'Uncategorized'}</Badge>
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
                        <span>Lat {incident.location?.lat?.toFixed(4)}, Lng {incident.location?.lng?.toFixed(4) || incident.location?.lon?.toFixed(4)}</span>
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
