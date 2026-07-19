import { useEffect, useState } from 'react';
import { Send, Clock, FileText, AlertTriangle, Layers } from 'lucide-react';
import { api } from '../services/api';
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
      <main className="mx-auto max-w-[1600px] px-4 py-8 sm:px-6 lg:px-8 animate-fade-in">
        <div className="mb-8 space-y-3">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-[60vh] w-full rounded-2xl" />)}
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <div className="flex h-[calc(100vh-80px)] items-center justify-center px-4">
        <EmptyState 
          icon={AlertTriangle} 
          title="Mission Sync Failed" 
          description={error} 
          actionLabel="Retry"
          onAction={() => window.location.reload()}
        />
      </div>
    );
  }

  const columns = ['Pending', 'Assigned', 'In Progress', 'Completed'];
  
  const getCol = (status) => {
    const s = status ? status.toLowerCase() : '';
    if (s.includes('pend')) return 'Pending';
    if (s.includes('assign')) return 'Assigned';
    if (s.includes('progress') || s.includes('active')) return 'In Progress';
    if (s.includes('complet') || s.includes('resolv')) return 'Completed';
    return 'Pending';
  };

  const kanban = {
    'Pending': missions.filter(m => getCol(m.status) === 'Pending'),
    'Assigned': missions.filter(m => getCol(m.status) === 'Assigned'),
    'In Progress': missions.filter(m => getCol(m.status) === 'In Progress'),
    'Completed': missions.filter(m => getCol(m.status) === 'Completed'),
  };

  return (
    <main className="mx-auto max-w-[1600px] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-secondary-900">Mission Dispatch</h1>
        <p className="mt-2 text-secondary-500">Track active dispatch missions and deployed volunteers across the operational theater.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 h-full pb-8">
        {columns.map(col => (
          <div key={col} className="flex flex-col bg-background/50 rounded-2xl p-4 border border-border min-h-[60vh]">
            <div className="flex items-center justify-between mb-4 px-2">
              <h2 className="font-bold text-secondary-900">{col}</h2>
              <span className="bg-white border border-border text-secondary-600 text-xs font-bold px-2.5 py-1 rounded-full shadow-sm">
                {kanban[col].length}
              </span>
            </div>
            
            <div className="flex flex-col gap-4">
              {kanban[col].map(mission => (
                <div key={mission.id} className="bg-card rounded-xl p-4 border border-border shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-elevated hover:border-primary-200 cursor-pointer">
                  <div className="flex justify-between items-start mb-2">
                    <Badge color="secondary" className="font-mono bg-transparent border-0 px-0">
                      #{mission.id?.slice(0,6)}
                    </Badge>
                    <span className="flex items-center gap-1 text-[10px] text-secondary-400 uppercase tracking-wider font-bold">
                      <Clock className="h-3 w-3" />
                      {timeAgo(mission.createdAt)}
                    </span>
                  </div>
                  <h3 className="font-semibold text-secondary-900 text-sm leading-tight mb-2">{mission.title}</h3>
                  <div className="text-xs text-secondary-500 mb-4 line-clamp-2">
                    {mission.instructions}
                  </div>
                  <div className="border-t border-border pt-3 mt-auto">
                    <div className="flex items-center justify-between text-xs text-secondary-600">
                      <div className="flex items-center gap-1.5" title="Incident ID">
                        <FileText className="h-3.5 w-3.5 text-secondary-400" />
                        <span className="font-mono text-[10px] bg-secondary-100 px-1.5 py-0.5 rounded">{mission.incidentId?.slice(0,6)}</span>
                      </div>
                      <div className="flex items-center gap-1.5" title="Assigned Volunteers">
                        <Send className="h-3.5 w-3.5 text-primary-600" />
                        <span className="font-semibold bg-primary-50 text-primary-700 px-1.5 py-0.5 rounded">
                          {mission.assignedVolunteers?.length || 0}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {kanban[col].length === 0 && (
                <EmptyState 
                  icon={Layers} 
                  title="No missions" 
                  description={`No missions in ${col}`} 
                />
              )}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
