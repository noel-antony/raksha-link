import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Activity, AlertTriangle, ShieldCheck, MapPin, Users, BrainCircuit, FileWarning, ArrowLeft, Send } from 'lucide-react';
import { api } from '../services/api';
import Button from '../components/UI/Button';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import EmptyState from '../components/UI/EmptyState';
import Badge from '../components/UI/Badge';

export default function IncidentDetails() {
  const { id } = useParams();
  const [incident, setIncident] = useState(null);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dispatching, setDispatching] = useState(false);
  const [dispatched, setDispatched] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [incidentData, matchesData] = await Promise.all([
          api.getIncidentById(id),
          api.getIncidentMatches(id).catch(() => ({ recommendedVolunteers: [] })) // Fallback to empty array if no matches endpoint
        ]);
        setIncident(incidentData);
        setMatches(matchesData?.recommendedVolunteers || (Array.isArray(matchesData) ? matchesData : []));
      } catch (err) {
        setError(err.message || 'Failed to load incident details');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleDispatch = async () => {
    try {
      setDispatching(true);
      await api.createMission({
        incidentId: id,
        title: `Response: ${incident.title}`,
        description: incident.description,
        selectedVolunteerIds: matches.map(m => m.volunteerId),
      });
      setDispatched(true);
    } catch (err) {
      console.error('Failed to dispatch mission:', err);
      alert('Failed to dispatch mission. Please try again.');
    } finally {
      setDispatching(false);
    }
  };

  if (loading) return <LoadingSpinner label="Decrypting Incident Intel..." />;

  if (error || !incident) {
    return (
      <div className="flex h-[calc(100vh-80px)] items-center justify-center px-4">
        <EmptyState 
          icon={AlertTriangle} 
          title={error || 'Incident not found'} 
          description="The requested incident record is unavailable or has been archived." 
          actionLabel="Return to Incidents"
          onAction={() => window.history.back()}
        />
      </div>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Link to="/incidents" className="inline-flex items-center gap-2 text-sm font-medium text-secondary-500 hover:text-primary-600 mb-6 transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back to Incidents
      </Link>

      <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <Badge color={incident.priority === 'Critical' ? 'danger' : incident.priority === 'High' ? 'warning' : 'secondary'}>
                {incident.priority === 'Critical' ? <AlertTriangle className="h-3 w-3 mr-1 inline" /> : <Activity className="h-3 w-3 mr-1 inline" />}
                {incident.priority || 'Unassigned'} Priority
              </Badge>
              <Badge color="secondary">{incident.category || 'Uncategorized'}</Badge>
              <span className="flex items-center gap-1 text-sm font-medium text-secondary-600 capitalize">
                <ShieldCheck className="h-4 w-4" /> Status: {incident.status}
              </span>
            </div>
            
            <h1 className="text-3xl font-bold text-secondary-900">{incident.title}</h1>
            
            <div className="mt-4 flex items-center gap-2 text-sm text-secondary-500">
              <MapPin className="h-4 w-4" />
              <span>Location: Lat {incident.location?.lat?.toFixed(4)}, Lng {incident.location?.lng?.toFixed(4) || incident.location?.lon?.toFixed(4)}</span>
            </div>
            
            <div className="mt-6">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-secondary-500 mb-2">Original Report</h3>
              <p className="text-secondary-700 leading-relaxed bg-background p-4 rounded-xl border border-border">
                {incident.description}
              </p>
            </div>
          </section>

          {incident.duplicateOf && (
            <section className="rounded-2xl border border-warning-100 bg-gradient-to-r from-warning-100/50 to-transparent p-6 flex items-start gap-4">
              <div className="rounded-xl bg-warning-100 p-2 text-warning mt-1 shadow-sm">
                <FileWarning className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-warning">Duplicate Detected</h3>
                <p className="mt-1 text-sm text-warning/80">This incident has been identified as a duplicate report of a master incident.</p>
                <Link to={`/incidents/${incident.duplicateOf}`} className="mt-2 inline-block text-sm font-bold text-warning hover:underline hover:text-warning/80 transition-colors">
                  View Master Incident &rarr;
                </Link>
              </div>
            </section>
          )}

          {incident.aiAnalysis && (
            <section className="rounded-3xl border border-primary-200 bg-gradient-to-br from-primary-50 via-white to-primary-50/30 p-8 shadow-card relative overflow-hidden group hover:shadow-elevated transition-shadow">
              <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none transition-transform duration-700 group-hover:scale-110 group-hover:rotate-6">
                <BrainCircuit className="h-48 w-48 text-primary-900" />
              </div>
              <div className="flex items-center gap-3 mb-8">
                <div className="rounded-xl bg-primary-100 p-2 text-primary-700">
                  <BrainCircuit className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-primary-900 tracking-tight">AI Intelligence Report</h2>
                  <p className="text-xs font-semibold uppercase tracking-wider text-primary-600/70 mt-1">Generated by Gemini</p>
                </div>
              </div>
              
              <div className="space-y-6 relative z-10">
                <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 border border-primary-100/50 shadow-sm transition-transform hover:-translate-y-1 duration-300">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-primary-400 mb-3 flex items-center gap-2">
                    <Activity className="h-3 w-3" /> Situation Summary
                  </h3>
                  <p className="text-secondary-900 leading-relaxed font-medium text-lg">
                    {incident.aiAnalysis.summary || 'No summary available.'}
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-2xl bg-white/80 backdrop-blur-md p-5 border border-primary-100/50 shadow-sm transition-transform hover:-translate-y-1 duration-300">
                    <p className="text-xs font-bold uppercase tracking-widest text-primary-400">Confidence Score</p>
                    <p className="mt-2 text-3xl font-bold text-primary-700">{incident.aiAnalysis?.confidence ? `${Math.round(incident.aiAnalysis.confidence * 100)}%` : 'N/A'}</p>
                  </div>
                  <div className="rounded-2xl bg-white/80 backdrop-blur-md p-5 border border-primary-100/50 shadow-sm transition-transform hover:-translate-y-1 duration-300">
                    <p className="text-xs font-bold uppercase tracking-widest text-primary-400">Recommended Priority</p>
                    <p className="mt-2 text-3xl font-bold text-secondary-900">{incident.priority || 'N/A'}</p>
                  </div>
                </div>

                {incident.aiAnalysis?.recommendedResources && incident.aiAnalysis.recommendedResources.length > 0 && (
                  <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 border border-primary-100/50 shadow-sm">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-primary-400 mb-4">Required Resources</h3>
                    <div className="flex flex-wrap gap-2">
                      {incident.aiAnalysis.recommendedResources.map((resource, i) => (
                        <span key={i} className="rounded-lg bg-primary-50 border border-primary-200/50 px-3 py-1.5 text-sm font-bold text-primary-800 shadow-sm">
                          {resource}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}
        </div>

        <div className="space-y-6">
          <section className="rounded-2xl border border-border bg-card p-6 shadow-sm flex flex-col h-full min-h-[400px]">
            <div className="flex items-center justify-between border-b border-border pb-4 mb-4">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-accent-700" />
                <h2 className="text-xl font-bold text-secondary-900">Matched Responders</h2>
              </div>
              <Badge color="accent">
                {matches.length} Available
              </Badge>
            </div>

            <div className="flex-1 overflow-y-auto pr-2">
              {matches.length === 0 ? (
                <EmptyState 
                  icon={Users}
                  title="No Responders Found"
                  description="There are currently no volunteers matching these requirements nearby."
                />
              ) : (
                <div className="space-y-4">
                  {matches.map((match) => (
                    <div key={match.volunteerId} className="rounded-xl border border-border bg-background p-4 transition-colors hover:bg-slate-50">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-semibold text-secondary-900">{match.name}</p>
                          <p className="text-xs text-secondary-500">{match.distanceKm?.toFixed(1)} km away • Score: {match.score?.toFixed(0)}/100</p>
                        </div>
                        <Badge color="primary">Match</Badge>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-1">
                        {match.matchingSkills?.map((skill, idx) => (
                          <span key={idx} className="text-[10px] uppercase font-bold bg-secondary-100 text-secondary-600 border border-border px-1.5 py-0.5 rounded">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-border">
              <Button 
                className="w-full justify-center gap-2" 
                disabled={matches.length === 0 || dispatched}
                loading={dispatching}
                onClick={handleDispatch}
              >
                {dispatched ? (
                  <>
                    <ShieldCheck className="h-4 w-4" /> Mission Dispatched
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" /> Dispatch Mission
                  </>
                )}
              </Button>
              <p className="mt-2 text-center text-xs text-secondary-500">
                Dispatching will unlock responder contact details via break-glass privacy.
              </p>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
