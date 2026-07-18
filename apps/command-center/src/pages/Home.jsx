import { ArrowRight, ShieldCheck, Activity, Users, Send, FileWarning, EyeOff } from 'lucide-react';
import { Link } from 'react-router-dom';
import Button from '../components/UI/Button';

const features = [
  {
    icon: Activity,
    title: 'AI Incident Intelligence',
    description: 'Automatically classify emergencies, detect severity, and extract required resources from incoming reports using Gemini AI.',
  },
  {
    icon: Users,
    title: 'Volunteer Matching',
    description: 'Instantly find nearby volunteers with the exact skills needed (medical, boat operations, heavy machinery) for any given incident.',
  },
  {
    icon: Send,
    title: 'Mission Dispatch',
    description: 'Convert AI recommendations into actionable missions, assigning vetted volunteers to critical tasks with a single click.',
  },
  {
    icon: ShieldCheck,
    title: 'Real-time Dashboard',
    description: 'Monitor active incidents, available volunteers, and ongoing missions through a centralized, live-updating command center.',
  },
  {
    icon: FileWarning,
    title: 'Duplicate Detection',
    description: 'Prevent resource misallocation by automatically identifying and flagging overlapping reports from the same disaster area.',
  },
  {
    icon: EyeOff,
    title: 'Break-Glass Privacy',
    description: 'Volunteer data remains secure until a formal mission is activated, ensuring minimum necessary exposure of personal information.',
  },
];

export default function Home() {
  return (
    <main className="overflow-hidden">
      <section className="relative isolate pt-14 lg:pt-20">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 pb-16 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-8 lg:pb-24">
          <div className="flex flex-col justify-center">
            <span className="mb-4 inline-flex w-fit rounded-full bg-primary-50 px-4 py-2 text-sm font-semibold text-primary-700">
              AI-powered Disaster Response
            </span>
            <h1 className="max-w-3xl text-4xl font-bold leading-tight text-secondary sm:text-5xl">
              Coordinate emergency response with intelligent precision.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-secondary-500">
              RakshaLink analyzes crisis reports in real-time, matches incidents with the closest qualified volunteers, and manages dispatch missions—turning chaos into structured response.
            </p>
            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <Link to="/incidents">
                <Button size="lg" className="w-full sm:w-auto">
                  Report Incident
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/register">
                <Button size="lg" variant="secondary" className="w-full sm:w-auto">
                  Register as Volunteer
                </Button>
              </Link>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -left-10 top-10 hidden h-32 w-32 rounded-full bg-primary-100 blur-3xl lg:block" />
            <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-elevated">
              <div className="flex items-center justify-between border-b border-border pb-4">
                <div className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-primary-600" />
                  <span className="font-heading font-semibold text-secondary">Live Incident Preview</span>
                </div>
                <span className="animate-pulse rounded-full bg-danger-100 px-2 py-1 text-xs font-bold text-danger">
                  ACTIVE
                </span>
              </div>
              <div className="mt-5 space-y-4">
                <div className="rounded-xl bg-background p-4 border border-border">
                  <p className="text-xs font-medium uppercase tracking-wider text-secondary-500">AI Analysis</p>
                  <p className="mt-1 text-sm font-medium text-secondary-900">
                    Flash flood reported in residential area. Water levels rising rapidly. Multiple families trapped.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-xl bg-background p-4 border border-border">
                    <p className="text-xs text-secondary-500">Category</p>
                    <p className="mt-1 font-semibold text-secondary-900">Flood</p>
                  </div>
                  <div className="rounded-xl bg-danger-100/50 p-4 border border-danger-100">
                    <p className="text-xs text-danger">Priority</p>
                    <p className="mt-1 font-semibold text-danger">Critical</p>
                  </div>
                  <div className="rounded-xl bg-background p-4 border border-border">
                    <p className="text-xs text-secondary-500">AI Confidence</p>
                    <p className="mt-1 font-semibold text-primary-600">95%</p>
                  </div>
                  <div className="rounded-xl bg-background p-4 border border-border">
                    <p className="text-xs text-secondary-500">Matched Volunteers</p>
                    <p className="mt-1 font-semibold text-primary-600">8 Nearby</p>
                  </div>
                </div>
                <div className="rounded-xl bg-background p-4 border border-border">
                  <p className="text-xs text-secondary-500 mb-2">Required Resources</p>
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-md bg-secondary-100 px-2 py-1 text-xs font-medium text-secondary-700">Rescue Boats</span>
                    <span className="rounded-md bg-secondary-100 px-2 py-1 text-xs font-medium text-secondary-700">Medical Team</span>
                    <span className="rounded-md bg-secondary-100 px-2 py-1 text-xs font-medium text-secondary-700">Shelter</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 rounded-xl border border-warning-100 bg-warning-100/30 px-4 py-3">
                  <FileWarning className="h-4 w-4 text-warning" />
                  <p className="text-xs font-medium text-warning">2 duplicate reports merged</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-border bg-white px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold text-secondary">A unified backend for community resilience</h2>
            <p className="mt-4 text-secondary-500">
              RakshaLink replaces chaotic, unorganized panic with structured data, automated intelligence, and rapid coordination.
            </p>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <article key={feature.title} className="rounded-2xl border border-border bg-background p-6 shadow-sm transition-shadow hover:shadow-card">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="mt-5 text-lg font-semibold text-secondary">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-secondary-500">{feature.description}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>
    </main>
  );
}
