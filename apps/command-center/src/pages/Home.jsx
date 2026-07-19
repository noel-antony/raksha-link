import { ArrowRight, ShieldCheck, Activity, Users, Send, MapPin, Target, Shield, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { api } from '../services/api';
import Button from '../components/UI/Button';
import Skeleton from '../components/UI/Skeleton';

export default function Home() {
  const [latestIncident, setLatestIncident] = useState(null);
  const [matchCount, setMatchCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLatest = async () => {
      try {
        const incidents = await api.getIncidents();
        if (incidents && incidents.length > 0) {
          const latest = incidents[0];
          setLatestIncident(latest);
          
          try {
            const matches = await api.getIncidentMatches(latest.id);
            setMatchCount(matches ? matches.length : 0);
          } catch (e) {
            setMatchCount(0);
          }
        }
      } catch (err) {
        console.error('Failed to load preview:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchLatest();
  }, []);

  return (
    <main className="overflow-hidden animate-fade-in">
      {/* 1. HERO SECTION */}
      <section className="relative isolate pt-14 lg:pt-24 pb-16 bg-gradient-to-b from-primary-50/50 to-transparent">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-8">
          <div className="flex flex-col justify-center animate-slide-up">
            <h1 className="max-w-3xl text-4xl font-bold leading-tight text-secondary-900 sm:text-5xl lg:text-6xl tracking-tight">
              When seconds matter,<br/>intelligence acts.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-secondary-500">
              RakshaLink cuts through the chaos of disaster response. We instantly transform raw reports into precise rescue missions, dispatching the right volunteers to the exact location they are needed.
            </p>
            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <Link to="/report">
                <Button size="lg" className="w-full sm:w-auto shadow-elevated group">
                  <span className="flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5" /> Report Incident
                  </span>
                </Button>
              </Link>
              <Link to="/register">
                <Button size="lg" variant="secondary" className="w-full sm:w-auto bg-white">
                  Register as Volunteer
                </Button>
              </Link>
            </div>
          </div>

          <div className="relative animate-slide-up" style={{ animationDelay: '100ms' }}>
            <div className="relative overflow-hidden rounded-3xl border border-border bg-white p-6 sm:p-8 shadow-elevated transition-transform hover:-translate-y-1 duration-300">
              <div className="flex items-center justify-between border-b border-border pb-5 mb-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
                    <Activity className="h-5 w-5" />
                  </div>
                  <span className="font-heading font-semibold text-secondary-900">Live Incident Preview</span>
                </div>
                {latestIncident && (
                  <span className="flex items-center gap-1.5 rounded-full bg-danger-100 px-2.5 py-1 text-xs font-bold text-danger uppercase tracking-wide">
                    <span className="h-2 w-2 rounded-full bg-danger animate-pulse" />
                    Active
                  </span>
                )}
              </div>
              
              <div className="min-h-[280px]">
                {loading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-20 w-full" />
                    <div className="grid grid-cols-2 gap-4">
                      <Skeleton className="h-24 w-full" />
                      <Skeleton className="h-24 w-full" />
                    </div>
                  </div>
                ) : !latestIncident ? (
                  <div className="flex h-[280px] flex-col items-center justify-center text-center">
                    <div className="h-16 w-16 rounded-full bg-secondary-50 flex items-center justify-center mb-4 text-secondary-300">
                      <Shield className="h-8 w-8" />
                    </div>
                    <p className="font-semibold text-secondary-900">Kerala is currently safe.</p>
                    <p className="text-sm text-secondary-500 mt-1">No active incidents reported.</p>
                  </div>
                ) : (
                  <div className="space-y-5">
                    <div className="rounded-2xl bg-secondary-50 p-4 border border-border/50">
                      <p className="text-xs font-bold uppercase tracking-wider text-secondary-500 mb-2">AI Summary</p>
                      <p className="text-sm font-medium text-secondary-900 leading-relaxed line-clamp-3">
                        {latestIncident.aiAnalysis?.summary || latestIncident.description}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="rounded-2xl border border-border p-4 bg-white">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-secondary-400">Matched</p>
                        <p className="mt-1 flex items-center gap-2 font-bold text-primary-600">
                          <Users className="h-4 w-4" /> {matchCount} Volunteers
                        </p>
                      </div>
                      <div className="rounded-2xl border border-border p-4 bg-white">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-secondary-400">Confidence</p>
                        <p className="mt-1 font-bold text-secondary-900">
                          {latestIncident.aiAnalysis?.confidenceScore ? `${latestIncident.aiAnalysis.confidenceScore}%` : 'N/A'}
                        </p>
                      </div>
                    </div>
                    
                    <Link to={`/incidents/${latestIncident.id}`} className="block">
                      <Button variant="ghost" className="w-full justify-between px-2 text-primary-600 hover:bg-primary-50">
                        View Full Details <ArrowRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. HOW IT WORKS / FEATURES */}
      <section className="bg-white py-16 relative isolate border-b border-border">
        <div className="absolute inset-0 bg-gradient-to-b from-secondary-50/50 to-transparent pointer-events-none" />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="relative">
            {/* Connecting Line */}
            <div className="absolute top-12 left-1/2 -translate-x-1/2 w-full max-w-4xl h-0.5 bg-border hidden md:block" />
            
            <div className="grid md:grid-cols-3 gap-8 lg:gap-12 relative z-10 max-w-6xl mx-auto">
              <div className="text-center group">
                <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full border-4 border-white bg-white shadow-sm mb-8 relative transition-transform duration-300 group-hover:-translate-y-2 group-hover:shadow-card">
                  <Activity className="h-8 w-8 text-primary-500" />
                  <div className="absolute -top-2 -right-2 h-8 w-8 rounded-full bg-primary-500 text-white font-bold flex items-center justify-center text-sm shadow-sm">1</div>
                </div>
                <h3 className="text-xl font-bold text-secondary-900">AI Classification</h3>
                <p className="mt-3 text-secondary-500 leading-relaxed">Citizens report emergencies with location data. Gemini instantly analyzes the raw reports to detect severity and required resources.</p>
              </div>
              <div className="text-center group">
                <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full border-4 border-white bg-white shadow-sm mb-8 relative transition-transform duration-300 group-hover:-translate-y-2 group-hover:shadow-card">
                  <Target className="h-8 w-8 text-accent-600" />
                  <div className="absolute -top-2 -right-2 h-8 w-8 rounded-full bg-primary-500 text-white font-bold flex items-center justify-center text-sm shadow-sm">2</div>
                </div>
                <h3 className="text-xl font-bold text-secondary-900">Precision Matching</h3>
                <p className="mt-3 text-secondary-500 leading-relaxed">The system automatically finds and matches nearby volunteers based on exact skills (e.g., medical, boat handling) and proximity.</p>
              </div>
              <div className="text-center group">
                <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full border-4 border-white bg-white shadow-sm mb-8 relative transition-transform duration-300 group-hover:-translate-y-2 group-hover:shadow-card">
                  <Shield className="h-8 w-8 text-primary-700" />
                  <div className="absolute -top-2 -right-2 h-8 w-8 rounded-full bg-primary-500 text-white font-bold flex items-center justify-center text-sm shadow-sm">3</div>
                </div>
                <h3 className="text-xl font-bold text-secondary-900">Break-Glass Privacy</h3>
                <p className="mt-3 text-secondary-500 leading-relaxed">Volunteer contact info remains strictly encrypted until a formal mission is dispatched and they accept the assignment.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. CTA */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
          <h2 className="text-3xl font-bold text-secondary-900 sm:text-4xl">Ready to protect your community?</h2>
          <p className="mt-4 text-lg text-secondary-500">Join the network of verified responders in Kerala today.</p>
          <div className="mt-10 flex justify-center">
            <Link to="/register">
              <Button size="lg" className="px-8 shadow-elevated transition-transform hover:scale-105">
                Register as Volunteer
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* 5. FOOTER */}
      <footer className="border-t border-border bg-white py-8 text-center text-secondary-500 text-sm">
        <p>&copy; {new Date().getFullYear()} RakshaLink. Built for Kerala.</p>
      </footer>
    </main>
  );
}
