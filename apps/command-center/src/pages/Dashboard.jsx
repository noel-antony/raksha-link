import { useEffect, useState } from 'react';
import { AlertTriangle, ShieldCheck, Activity, Users, Send, ActivitySquare, Inbox, Globe } from 'lucide-react';
import { api } from '../services/api';
import { Link } from 'react-router-dom';
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

export default function Dashboard() {
  const [data, setData] = useState({
    stats: null,
    activities: [],
    incidents: [],
    missions: [],
    volunteers: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [dashData, activityData, incidentData, missionData, volunteerData] = await Promise.all([
          api.getDashboard(),
          api.getActivity(),
          api.getIncidents(),
          api.getMissions(),
          api.getVolunteers()
        ]);
        
        setData({
          stats: dashData.statistics,
          activities: activityData,
          incidents: incidentData,
          missions: missionData,
          volunteers: volunteerData
        });
      } catch (err) {
        setError(err.message || 'Failed to load operations data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <main className="min-h-[calc(100vh-80px)] bg-slate-50 p-4 sm:p-6 lg:p-8 animate-fade-in">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 space-y-3">
            <Skeleton className="h-12 w-64 rounded-xl" />
            <Skeleton className="h-4 w-96 rounded-lg" />
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5 mb-10">
            {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-36 w-full rounded-[24px]" />)}
          </div>
          <div className="grid gap-6 lg:grid-cols-3 mb-10">
            {[1,2,3].map(i => <Skeleton key={i} className="h-[450px] w-full rounded-[28px]" />)}
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <div className="flex h-[calc(100vh-80px)] bg-slate-50 items-center justify-center px-4">
        <EmptyState 
          icon={AlertTriangle} 
          title="Connection Error" 
          description={error} 
          actionLabel="Retry Connection"
          onAction={() => window.location.reload()}
        />
      </div>
    );
  }

  const { stats, activities, incidents, missions, volunteers } = data;

  const kpis = [
    { title: 'Active Incidents', value: stats.activeIncidents, icon: AlertTriangle, color: 'text-warning', bgIcon: 'bg-warning-50' },
    { title: 'Critical Incidents', value: stats.criticalIncidents || 0, icon: Activity, color: 'text-danger', bgIcon: 'bg-danger-50' },
    { title: 'Active Missions', value: stats.activeMissions, icon: Send, color: 'text-primary-600', bgIcon: 'bg-primary-50' },
    { title: 'Available Responders', value: stats.availableVolunteers, icon: Users, color: 'text-accent-700', bgIcon: 'bg-accent-50' },
    { title: 'Resolved Incidents', value: stats.resolvedIncidents, icon: ShieldCheck, color: 'text-secondary-500', bgIcon: 'bg-secondary-100' }
  ];

  return (
    <main className="min-h-screen bg-slate-50 pb-20">
      <div className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6 lg:px-8">
        
        {/* Header Section */}
        <div className="mb-8 rounded-[32px] bg-gradient-to-br from-secondary-900 via-primary-800 to-primary-600 p-8 sm:p-10 text-white shadow-card flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none transform scale-150 translate-x-1/4 -translate-y-1/4">
            <Globe className="h-64 w-64" />
          </div>
          <div className="relative z-10">
            <h1 className="text-4xl font-extrabold tracking-tight">Command Center</h1>
            <p className="mt-2 text-lg font-medium text-primary-100 max-w-xl">Live operations tracking across the RakshaLink network.</p>
          </div>
          <div className="relative z-10 flex items-center gap-3 bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 shadow-sm">
            <Badge color="warning" className="animate-pulse bg-warning text-white border-0 shadow-sm">LIVE</Badge>
            <span className="text-sm font-bold tracking-wide text-white">SYSTEM ONLINE</span>
          </div>
        </div>

        {/* KPI Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5 mb-10">
          {kpis.map((kpi, idx) => {
            const Icon = kpi.icon;
            return (
              <div key={idx} className="group rounded-[24px] border border-border bg-white/70 backdrop-blur-md p-6 shadow-sm transition-all duration-300 hover:-translate-y-2 hover:shadow-elevated hover:border-primary-200 hover:bg-white cursor-default overflow-hidden relative">
                <div className={`absolute -bottom-4 -right-4 p-4 opacity-5 transition-transform duration-500 group-hover:scale-150 ${kpi.color}`}>
                  <Icon className="h-24 w-24" />
                </div>
                <div className="relative z-10 flex flex-col h-full justify-between">
                  <div className="flex justify-between items-start mb-4">
                    <p className="text-[11px] font-bold uppercase tracking-widest text-secondary-500">{kpi.title}</p>
                    <div className={`rounded-xl p-2.5 shadow-sm transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6 bg-white ${kpi.color}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                  </div>
                  <p className={`text-4xl font-extrabold tracking-tight ${kpi.color}`}>{kpi.value}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Core Feeds */}
        <div className="grid gap-6 lg:grid-cols-3 mb-10">
          
          {/* Incidents Column */}
          <div className="rounded-[28px] border border-border bg-white/60 backdrop-blur-xl shadow-sm flex flex-col h-[480px] transition-shadow hover:shadow-elevated">
            <div className="p-6 border-b border-border bg-white/50 flex items-center justify-between rounded-t-[28px]">
              <h2 className="font-bold text-secondary-900 flex items-center gap-3 text-lg">
                <div className="rounded-xl bg-warning-50 p-2 text-warning"><AlertTriangle className="h-5 w-5" /></div> Incidents
              </h2>
              <Link to="/incidents" className="text-sm font-bold text-primary-600 hover:text-primary-700 transition-colors">View All &rarr;</Link>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {incidents.length === 0 ? (
                <EmptyState title="No active incidents" description="No incidents are currently reported." />
              ) : (
                incidents.slice(0, 10).map(inc => (
                  <div key={inc.id} className="group rounded-2xl p-4 bg-white/50 hover:bg-white hover:shadow-sm transition-all border border-transparent hover:border-border cursor-pointer">
                    <div className="flex justify-between items-start mb-3">
                      <span className="text-sm font-bold text-secondary-900 truncate pr-2 group-hover:text-primary-700 transition-colors">{inc.title}</span>
                      <span className="text-xs font-medium text-secondary-400 whitespace-nowrap bg-secondary-50 px-2 py-1 rounded-md">{timeAgo(inc.createdAt)}</span>
                    </div>
                    <div className="flex gap-2">
                      <Badge color={inc.priority === 'Critical' ? 'danger' : inc.priority === 'High' ? 'warning' : 'secondary'}>
                        {inc.priority}
                      </Badge>
                      <Badge color="secondary">{inc.category}</Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Missions Column */}
          <div className="rounded-[28px] border border-border bg-white/60 backdrop-blur-xl shadow-sm flex flex-col h-[480px] transition-shadow hover:shadow-elevated">
            <div className="p-6 border-b border-border bg-white/50 flex items-center justify-between rounded-t-[28px]">
              <h2 className="font-bold text-secondary-900 flex items-center gap-3 text-lg">
                <div className="rounded-xl bg-primary-50 p-2 text-primary-600"><Send className="h-5 w-5" /></div> Active Missions
              </h2>
              <Link to="/missions" className="text-sm font-bold text-primary-600 hover:text-primary-700 transition-colors">View All &rarr;</Link>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {missions.length === 0 ? (
                <EmptyState title="No active missions" description="No dispatch missions have been created." />
              ) : (
                missions.slice(0, 10).map(mission => (
                  <div key={mission.id} className="group rounded-2xl p-4 bg-white/50 hover:bg-white hover:shadow-sm transition-all border border-transparent hover:border-border cursor-pointer">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-sm font-bold text-secondary-900 truncate pr-2 group-hover:text-primary-700 transition-colors">{mission.title}</span>
                      <div className="relative flex items-center justify-center">
                         {(mission.status === 'Active' || mission.status === 'In Progress') && <span className="absolute h-2 w-2 rounded-full bg-primary-500 animate-ping" />}
                         <Badge color={mission.status === 'Active' || mission.status === 'In Progress' ? 'primary' : 'secondary'} className="relative z-10">
                           {mission.status}
                         </Badge>
                      </div>
                    </div>
                    <p className="text-xs text-secondary-500 line-clamp-2 mt-2 leading-relaxed">{mission.instructions || mission.description || 'No instructions provided.'}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Volunteers Column */}
          <div className="rounded-[28px] border border-border bg-white/60 backdrop-blur-xl shadow-sm flex flex-col h-[480px] transition-shadow hover:shadow-elevated">
            <div className="p-6 border-b border-border bg-white/50 flex items-center justify-between rounded-t-[28px]">
              <h2 className="font-bold text-secondary-900 flex items-center gap-3 text-lg">
                <div className="rounded-xl bg-accent-50 p-2 text-accent-700"><Users className="h-5 w-5" /></div> Responder Roster
              </h2>
              <Link to="/volunteers" className="text-sm font-bold text-primary-600 hover:text-primary-700 transition-colors">View All &rarr;</Link>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {volunteers.length === 0 ? (
                <EmptyState title="No volunteers" description="No volunteers have registered yet." />
              ) : (
                volunteers.slice(0, 10).map(vol => (
                  <div key={vol.id} className="flex justify-between items-center group rounded-2xl p-4 bg-white/50 hover:bg-white hover:shadow-sm transition-all border border-transparent hover:border-border cursor-pointer">
                    <div>
                      <p className="text-sm font-bold text-secondary-900 group-hover:text-primary-700 transition-colors">{vol.fullName}</p>
                      <div className="flex gap-1 mt-2 flex-wrap">
                        {vol.skills?.slice(0, 2).map((skill, i) => (
                           <span key={i} className="text-[10px] uppercase font-bold bg-secondary-100 text-secondary-600 px-1.5 py-0.5 rounded">
                             {skill}
                           </span>
                        ))}
                        {vol.skills?.length > 2 && <span className="text-[10px] uppercase font-bold text-secondary-400">+{vol.skills.length - 2} MORE</span>}
                      </div>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      <span className={`h-3 w-3 rounded-full shadow-sm ${
                        vol.status?.toLowerCase() === 'active' || vol.availability?.toLowerCase() === 'available' ? 'bg-green-500' : 'bg-warning'
                      }`} title={vol.status} />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="mt-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="rounded-xl bg-secondary-100 p-2 text-secondary-600"><ActivitySquare className="h-6 w-6" /></div>
            <h2 className="text-2xl font-bold text-secondary-900">System Activity</h2>
          </div>
          <div className="rounded-[32px] border border-border bg-white/80 backdrop-blur-xl shadow-sm overflow-hidden transition-shadow hover:shadow-elevated p-8">
            {activities.length === 0 ? (
              <EmptyState title="No activity" description="The system is quiet right now." />
            ) : (
              <div className="relative border-l-2 border-slate-200 ml-4 space-y-8 py-4">
                {activities.slice(0, 15).map((activity, idx) => {
                  let dotColor = 'bg-slate-300';
                  if (activity.type === 'incident') dotColor = 'bg-warning';
                  if (activity.type === 'mission') dotColor = 'bg-primary-500';
                  if (activity.type === 'volunteer') dotColor = 'bg-accent-500';

                  return (
                    <div key={idx} className="relative pl-8 group">
                      {/* Timeline Dot */}
                      <span className={`absolute -left-[9px] top-1 h-4 w-4 rounded-full border-4 border-white shadow-sm ${dotColor} transition-transform group-hover:scale-125`} />
                      
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 bg-slate-50 p-4 rounded-2xl border border-transparent group-hover:border-slate-200 group-hover:bg-white transition-all">
                        <div className="space-y-1">
                          <div className="flex items-center gap-3">
                            <span className="text-xs font-bold uppercase tracking-widest text-secondary-900 bg-secondary-100 px-2 py-1 rounded-md">{activity.type}</span>
                            <span className="text-sm font-bold text-secondary-800">{activity.title || activity.description || 'System Update'}</span>
                          </div>
                        </div>
                        <span className="text-xs font-semibold text-secondary-400 bg-white px-3 py-1.5 rounded-full border border-slate-100 shadow-sm whitespace-nowrap">
                          {timeAgo(activity.timestamp)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
