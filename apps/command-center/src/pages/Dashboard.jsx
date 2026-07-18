import { AlertTriangle, BrainCircuit, Clock3, Activity, ShieldAlert, WifiOff, Map, MessageSquare, Database, ListChecks } from 'lucide-react';
import { useEffect, useState } from 'react';
import Sidebar from '../components/Layout/Sidebar';
import Badge from '../components/UI/Badge';
import { useToast } from '../hooks/useToast';

function timeAgo(dateString) {
  const diffMinutes = Math.max(1, Math.round((Date.now() - new Date(dateString).getTime()) / 60000));
  if (diffMinutes < 60) return `${diffMinutes} mins ago`;
  const hours = Math.round(diffMinutes / 60);
  return `${hours} hr${hours > 1 ? 's' : ''} ago`;
}

// Mocking the event stream for the UI
const MOCK_EVENT_STREAM = [
  { id: '1', time: new Date(Date.now() - 300000).toISOString(), agent: 'Sensor Fusion', message: 'Detected anomaly in flood gauges and voice SOS volume in Periyar basin. Confidence: 82%.', type: 'DETECT' },
  { id: '2', time: new Date(Date.now() - 280000).toISOString(), agent: 'Mission Planner', message: 'Decomposed incident into 2 missions: Swift Water Rescue and Medical Evac. Requires 3 Boats, 2 Medics.', type: 'PLAN' },
  { id: '3', time: new Date(Date.now() - 250000).toISOString(), agent: 'Privacy Guardian', message: 'HALT: Mission 2 requires revealing medical volunteer home addresses. Requesting Break-Glass approval.', type: 'DEBATE' },
  { id: '4', time: new Date(Date.now() - 100000).toISOString(), agent: 'Incident Commander', message: 'Break-glass approved by Human. Enforcing minimum-disclosure routing. Dispatching responders.', type: 'EXECUTE' }
];

export default function Dashboard() {
  const { showToast } = useToast();
  const [now, setNow] = useState(new Date());
  const [isOffline, setIsOffline] = useState(false);
  
  // Clock tick
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Simulate network toggle for Gemma testing
  const toggleNetwork = () => {
    setIsOffline(!isOffline);
    showToast(isOffline ? 'Cloud connectivity restored. Syncing World Model.' : 'Cloud connection lost. Gemma Edge Commander taking over.', isOffline ? 'success' : 'warning');
  };

  return (
    <main className="min-h-[calc(100vh-80px)] bg-slate-900 text-slate-100">
      <div className="grid min-h-[calc(100vh-80px)] lg:grid-cols-[380px_1fr]">
        
        {/* LEFT SIDEBAR: Agent Status & System State */}
        <Sidebar className="p-6 bg-slate-800 border-r border-slate-700">
          <div className="flex h-full flex-col">
            <div className="border-b border-slate-700 pb-5">
              <p className="text-xs uppercase tracking-[0.2em] text-cyan-400">SentinelOS Kernel</p>
              <h1 className="mt-2 text-2xl font-bold text-white">EOC Command Center</h1>
              <p className="mt-2 flex items-center gap-2 text-sm text-slate-400">
                <Clock3 className="h-4 w-4" />
                {now.toLocaleString('en-IN', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', second: '2-digit' })}
              </p>
            </div>

            {/* Network Status */}
            <div className="mt-4 rounded-xl bg-slate-900/50 p-4 border border-slate-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {isOffline ? <WifiOff className="h-4 w-4 text-amber-400 animate-pulse" /> : <Activity className="h-4 w-4 text-green-400" />}
                  <p className="text-sm font-semibold">System Link</p>
                </div>
                <button onClick={toggleNetwork} className="text-xs underline text-cyan-400">Toggle</button>
              </div>
              <div className="mt-3 text-xs">
                {isOffline ? (
                  <p className="text-amber-400 flex items-center gap-2"><BrainCircuit className="h-4 w-4"/> Gemma Edge Commander Active</p>
                ) : (
                  <p className="text-green-400 flex items-center gap-2"><Database className="h-4 w-4"/> Cloud Hybrid AI Active</p>
                )}
              </div>
            </div>

            {/* Active Agents */}
            <div className="mt-6 flex-1">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500 mb-3">Managed Agents</h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg border border-slate-700 border-l-4 border-l-purple-500">
                  <span className="text-sm font-medium">Incident Commander</span>
                  <Badge color="purple">IDLE</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg border border-slate-700 border-l-4 border-l-blue-500">
                  <span className="text-sm font-medium">Sensor Fusion</span>
                  <Badge color="blue" className="animate-pulse">SENSING</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg border border-slate-700 border-l-4 border-l-cyan-500">
                  <span className="text-sm font-medium">Mission Planner</span>
                  <Badge color="cyan">IDLE</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg border border-slate-700 border-l-4 border-l-amber-500">
                  <span className="text-sm font-medium">Privacy Guardian</span>
                  <Badge color="amber">ENFORCING</Badge>
                </div>
              </div>
            </div>
          </div>
        </Sidebar>

        {/* MAIN DASHBOARD */}
        <section className="p-4 sm:p-6 lg:p-8 flex flex-col gap-6">
          
          {/* Top KPI Row */}
          <div className="grid gap-4 md:grid-cols-4">
            <div className="rounded-xl bg-slate-800 p-5 border border-slate-700">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-red-900/30 p-2 text-red-400"><AlertTriangle className="h-5 w-5" /></div>
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wider">Active Missions</p>
                  <p className="text-xl font-bold text-white">2</p>
                </div>
              </div>
            </div>
            <div className="rounded-xl bg-slate-800 p-5 border border-slate-700">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-cyan-900/30 p-2 text-cyan-400"><Map className="h-5 w-5" /></div>
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wider">World Model Nodes</p>
                  <p className="text-xl font-bold text-white">1,482</p>
                </div>
              </div>
            </div>
            <div className="rounded-xl bg-slate-800 p-5 border border-slate-700">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-amber-900/30 p-2 text-amber-400"><ShieldAlert className="h-5 w-5" /></div>
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wider">Zero-Trust Status</p>
                  <p className="text-xl font-bold text-white">Secured</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-6 flex-1">
            {/* Agent Collaboration Stream */}
            <div className="rounded-xl bg-slate-800 border border-slate-700 flex flex-col overflow-hidden">
              <div className="p-4 border-b border-slate-700 bg-slate-800/50 flex justify-between items-center">
                <h2 className="font-semibold flex items-center gap-2"><MessageSquare className="h-4 w-4 text-cyan-400"/> Agent Collaboration Bus</h2>
                <Badge color="green">LIVE</Badge>
              </div>
              <div className="p-4 flex-1 overflow-y-auto space-y-4">
                {MOCK_EVENT_STREAM.map((evt) => (
                  <div key={evt.id} className="bg-slate-900/50 p-4 rounded-lg border border-slate-700 relative">
                    {evt.type === 'DEBATE' && <div className="absolute top-0 left-0 w-1 h-full bg-amber-500 rounded-l-lg"></div>}
                    <div className="flex justify-between items-start mb-2">
                      <span className={`text-xs font-bold ${evt.type === 'DEBATE' ? 'text-amber-400' : 'text-cyan-400'}`}>{evt.agent}</span>
                      <span className="text-xs text-slate-500">{timeAgo(evt.time)}</span>
                    </div>
                    <p className="text-sm text-slate-300 leading-relaxed">{evt.message}</p>
                    {evt.type === 'DEBATE' && (
                      <div className="mt-3 pt-3 border-t border-slate-700 flex gap-2">
                        <button className="px-3 py-1 bg-red-500/20 text-red-400 text-xs font-medium rounded hover:bg-red-500/30 transition">Approve Break-Glass</button>
                        <button className="px-3 py-1 bg-slate-700 text-slate-300 text-xs font-medium rounded hover:bg-slate-600 transition">Reject & Modify</button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Current Goals & World Model Insights */}
            <div className="flex flex-col gap-6">
              {/* Goals */}
              <div className="rounded-xl bg-slate-800 border border-slate-700 p-4">
                <h2 className="font-semibold flex items-center gap-2 mb-4"><ListChecks className="h-4 w-4 text-purple-400"/> Current System Goals</h2>
                <div className="space-y-3">
                  <div className="flex justify-between items-center bg-slate-900/50 p-3 rounded border border-slate-700">
                    <div>
                      <p className="text-sm font-medium">Extract 4 civilians from Sector 7</p>
                      <p className="text-xs text-slate-400">Assigned to: Mission Planner</p>
                    </div>
                    <Badge color="yellow">IN PROGRESS</Badge>
                  </div>
                  <div className="flex justify-between items-center bg-slate-900/50 p-3 rounded border border-slate-700">
                    <div>
                      <p className="text-sm font-medium">Route Medical Team Alpha</p>
                      <p className="text-xs text-slate-400">Assigned to: Routing Agent</p>
                    </div>
                    <Badge color="yellow">IN PROGRESS</Badge>
                  </div>
                </div>
              </div>

              {/* Explainable AI Evidence */}
              <div className="rounded-xl bg-slate-800 border border-slate-700 p-4 flex-1">
                <h2 className="font-semibold flex items-center gap-2 mb-4"><BrainCircuit className="h-4 w-4 text-blue-400"/> Explainable AI Reasoning</h2>
                <div className="bg-slate-900/80 p-4 rounded-lg border border-slate-700 font-mono text-xs text-slate-300 overflow-hidden">
                  <p className="text-green-400 mb-2">{'>'} World Model Graph Update detected.</p>
                  <p className="mb-1 text-cyan-300">Resolving shortest path constraint...</p>
                  <p className="mb-1 text-slate-400">Node [Hospital_General] unreachable due to Edge [Bridge_4] collapse.</p>
                  <p className="mb-3 text-cyan-300">Evaluating alternatives...</p>
                  <table className="w-full text-left mb-3">
                    <thead><tr className="border-b border-slate-700"><th className="pb-1">Option</th><th className="pb-1">Confidence</th><th className="pb-1">Trade-off</th></tr></thead>
                    <tbody>
                      <tr><td className="py-1">Route B (Hill)</td><td className="text-green-400">89%</td><td>+14 mins ETA</td></tr>
                      <tr><td className="py-1">Air Evac</td><td className="text-amber-400">45%</td><td>Asset unavailable</td></tr>
                    </tbody>
                  </table>
                  <p className="text-purple-400">{'>'} Action: Routing Agent assigned Route B.</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
