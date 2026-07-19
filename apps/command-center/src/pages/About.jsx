import { ShieldCheck, BrainCircuit, Users, Globe, Cpu, Activity, Send } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function About() {
  const pillars = [
    {
      icon: BrainCircuit,
      title: 'AI-Powered Intelligence',
      desc: 'Our Gemini-integrated backend processes raw disaster reports in real-time to detect duplicates, assess severity, and determine the exact resources needed.'
    },
    {
      icon: Users,
      title: 'Community Responders',
      desc: 'We maintain a highly detailed, dynamically updated roster of local volunteers, their skills, languages, and specialized rescue assets.'
    },
    {
      icon: ShieldCheck,
      title: 'Strict Privacy',
      desc: 'Volunteer data is heavily encrypted. Contact details are strictly locked behind break-glass protocols and only revealed to coordinators during active dispatch.'
    }
  ];

  return (
    <main className="min-h-screen bg-slate-50 pb-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-secondary-900 via-primary-800 to-primary-600 px-4 py-24 sm:px-6 lg:px-8 text-white shadow-card">
        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none scale-150 translate-x-1/4 -translate-y-1/4">
          <Globe className="h-96 w-96 text-primary-100" />
        </div>
        
        <div className="mx-auto max-w-4xl text-center relative z-10">
          <Badge className="mb-6 inline-flex border border-white/20 bg-white/10 px-4 py-1.5 backdrop-blur">
            <span className="text-sm font-bold uppercase tracking-widest text-primary-100">About the Project</span>
          </Badge>
          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight mb-6">
            Intelligent Disaster Response
          </h1>
          <p className="text-xl md:text-2xl font-medium text-white/80 max-w-2xl mx-auto leading-relaxed">
            RakshaLink is a state-of-the-art coordination platform designed to eliminate chaos during natural disasters by connecting real-time intelligence with local capability.
          </p>
        </div>
      </section>

      {/* Core Pillars */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 -mt-12 relative z-20">
        <div className="grid gap-6 md:grid-cols-3">
          {pillars.map((pillar, idx) => {
            const Icon = pillar.icon;
            return (
              <div key={idx} className="group rounded-[28px] border border-border bg-white/70 backdrop-blur-md p-8 shadow-card transition-all duration-300 hover:-translate-y-2 hover:shadow-elevated hover:bg-white cursor-default">
                <div className="mb-6 inline-flex rounded-2xl bg-primary-50 p-4 text-primary-600 shadow-sm transition-transform group-hover:scale-110 group-hover:bg-primary-100">
                  <Icon className="h-8 w-8" />
                </div>
                <h3 className="mb-3 text-xl font-bold text-secondary-900">{pillar.title}</h3>
                <p className="text-secondary-600 leading-relaxed">
                  {pillar.desc}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Mission */}
      <section className="mx-auto max-w-4xl px-4 py-24 sm:px-6 lg:px-8 text-center">
        <Cpu className="mx-auto h-12 w-12 text-primary-500 mb-6 opacity-80" />
        <h2 className="text-3xl font-bold text-secondary-900 mb-6">The Command Center Architecture</h2>
        <p className="text-lg text-secondary-600 leading-relaxed mb-8">
          Built on a highly scalable <strong>FastAPI</strong> and <strong>Firebase</strong> backend, RakshaLink processes thousands of concurrent reports. The command center dashboard allows coordinators to instantly view AI-assessed incident severity, find the absolute best-matched local responders, and dispatch rescue missions with a single click.
        </p>
        <div className="flex justify-center gap-4">
          <Link to="/report" className="inline-flex items-center gap-2 rounded-full bg-primary-600 px-6 py-3 font-bold text-white transition-all hover:bg-primary-700 hover:shadow-lg hover:-translate-y-0.5">
            <Activity className="h-5 w-5" /> Report an Incident
          </Link>
          <Link to="/dashboard" className="inline-flex items-center gap-2 rounded-full border-2 border-primary-100 bg-white px-6 py-3 font-bold text-primary-700 transition-all hover:border-primary-200 hover:bg-primary-50 hover:shadow-md hover:-translate-y-0.5">
            <Send className="h-5 w-5" /> View Command Center
          </Link>
        </div>
      </section>
    </main>
  );
}

function Badge({ children, className }) {
  return (
    <div className={`rounded-full ${className}`}>
      {children}
    </div>
  );
}
