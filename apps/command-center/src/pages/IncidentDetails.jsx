import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Activity, AlertTriangle, ShieldCheck, MapPin, Users, BrainCircuit, FileWarning, ArrowLeft, Send } from 'lucide-react';
import { api } from '../services/api';
import Button from '../components/UI/Button';

export default function IncidentDetails() {
  const { id } = useParams();
  const [incident, setIncident] = useState(null);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [incidentData, matchesData] = await Promise.all([
          api.getIncidentById(id),
          api.getIncidentMatches(id).catch(() => []) // Fallback to empty array if no matches endpoint
        ]);
        setIncident(incidentData);
        setMatches(matchesData);
      } catch (err) {
        setError(err.message || 'Failed to load incident details');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-80px)] items-center justify-center">
        <p className="text-secondary-500 animate-pulse">Loading incident intel...</p>
      </div>
    );
  }

  if (error || !incident) {
    return (
      <div className="flex h-[calc(100vh-80px)] items-center justify-center">
        <p className="text-danger">{error || 'Incident not found'}</p>
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
              <span className="flex items-center gap-1 text-sm font-medium text-secondary-600 capitalize">
                <ShieldCheck className="h-4 w-4" /> Status: {incident.status}
              </span>
            </div>
            
            <h1 className="text-3xl font-bold text-secondary-900">{incident.title}</h1>
            
            <div className="mt-4 flex items-center gap-2 text-sm text-secondary-500">
              <MapPin className="h-4 w-4" />
              <span>Location: Lat {incident.location?.lat?.toFixed(4)}, Lng {incident.location?.lon?.toFixed(4)}</span>
            </div>
            
            <div className="mt-6">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-secondary-500 mb-2">Original Report</h3>
              <p className="text-secondary-700 leading-relaxed bg-background p-4 rounded-xl border border-border">
                {incident.description}
              </p>
            </div>
          </section>

          {incident.duplicateOf && (
            <section className="rounded-2xl border border-warning-100 bg-warning-100/30 p-6 flex items-start gap-4">
              <div className="rounded-xl bg-warning/10 p-2 text-warning mt-1">
                <FileWarning className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-warning">Duplicate Detected</h3>
                <p className="mt-1 text-sm text-warning/80">This incident has been identified as a duplicate report of a master incident.</p>
                <Link to={`/incidents/${incident.duplicateOf}`} className="mt-2 inline-block text-sm font-medium text-warning hover:underline">
                  View Master Incident &rarr;
                </Link>
              </div>
            </section>
          )}

          {incident.aiAnalysis && (
            <section className="rounded-2xl border border-border bg-card p-6 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
                <BrainCircuit className="h-32 w-32" />
              </div>
              <div className="flex items-center gap-2 mb-6">
                <BrainCircuit className="h-5 w-5 text-primary-600" />
                <h2 className="text-xl font-bold text-secondary-900">AI Intelligence Report</h2>
              </div>
              
              <div className="space-y-6 relative z-10">
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-secondary-500 mb-2">Situation Summary</h3>
                  <p className="text-secondary-800 leading-relaxed font-medium">
                    {incident.aiAnalysis.summary || 'No summary available.'}
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-xl bg-background p-4 border border-border">
                    <p className="text-xs text-secondary-500">Confidence Score</p>
                    <p className="mt-1 font-semibold text-primary-600">{incident.aiAnalysis.confidenceScore ? `${incident.aiAnalysis.confidenceScore}%` : 'N/A'}</p>
                  </div>
                  <div className="rounded-xl bg-background p-4 border border-border">
                    <p className="text-xs text-secondary-500">Recommended Priority</p>
                    <p className="mt-1 font-semibold text-secondary-900">{incident.aiAnalysis.priority || 'N/A'}</p>
                  </div>
                </div>

                {incident.aiAnalysis.requiredResources && incident.aiAnalysis.requiredResources.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-secondary-500 mb-3">Required Resources</h3>
                    <div className="flex flex-wrap gap-2">
                      {incident.aiAnalysis.requiredResources.map((resource, i) => (
                        <span key={i} className="rounded-md bg-secondary-100 px-3 py-1.5 text-xs font-medium text-secondary-800">
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
          <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-border pb-4 mb-4">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-accent" />
                <h2 className="text-xl font-bold text-secondary-900">Matched Responders</h2>
              </div>
              <span className="rounded-full bg-accent-100 px-3 py-1 text-xs font-bold text-accent-700">
                {matches.length} Available
              </span>
            </div>

            {matches.length === 0 ? (
              <p className="text-sm text-secondary-500 text-center py-6">No matching responders found nearby.</p>
            ) : (
              <div className="space-y-4">
                {matches.map((match) => (
                  <div key={match.volunteerId} className="rounded-xl border border-border bg-background p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-semibold text-secondary-900">{match.fullName}</p>
                        <p className="text-xs text-secondary-500">{match.distanceKm?.toFixed(1)} km away • Score: {match.matchScore?.toFixed(0)}/100</p>
                      </div>
                      <span className="text-xs font-medium bg-primary-50 text-primary-700 px-2 py-1 rounded">Match</span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-1">
                      {match.matchedSkills?.map((skill, idx) => (
                        <span key={idx} className="text-[10px] uppercase font-bold bg-secondary-200 text-secondary-700 px-1.5 py-0.5 rounded">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-6">
              <Button className="w-full justify-center gap-2" disabled={matches.length === 0}>
                <Send className="h-4 w-4" /> Dispatch Mission
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
