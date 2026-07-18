import { useEffect, useState } from 'react';
import { Shield, ShieldAlert, Users, MapPin, Search } from 'lucide-react';
import { api } from '../services/api';

export default function VolunteerDirectory() {
  const [volunteers, setVolunteers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchVolunteers = async () => {
      try {
        setLoading(true);
        const data = await api.getVolunteers();
        setVolunteers(data);
      } catch (err) {
        setError(err.message || 'Failed to load volunteers');
      } finally {
        setLoading(false);
      }
    };
    fetchVolunteers();
  }, []);

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-80px)] items-center justify-center">
        <p className="text-secondary-500 animate-pulse">Loading volunteer directory...</p>
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
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-secondary">Volunteer Directory</h1>
          <p className="mt-2 text-secondary-500">Manage registered community responders and their capabilities.</p>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 shadow-sm">
          <Search className="h-4 w-4 text-secondary-400" />
          <input 
            type="text" 
            placeholder="Search volunteers..." 
            className="border-none bg-transparent focus:outline-none text-sm w-48"
          />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {volunteers.length === 0 ? (
          <div className="col-span-full rounded-2xl border border-border bg-card p-12 text-center text-secondary-500 shadow-sm">
            No volunteers registered in the system yet.
          </div>
        ) : (
          volunteers.map((volunteer) => (
            <article key={volunteer.id} className="rounded-2xl border border-border bg-card p-5 shadow-sm transition-shadow hover:shadow-elevated">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary-100 text-secondary-600">
                    <Users className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-secondary-900">{volunteer.fullName}</h3>
                    <p className="text-xs text-secondary-500">ID: {volunteer.id.slice(0, 8)}...</p>
                  </div>
                </div>
                <span className={`inline-flex items-center rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-wide ${
                  volunteer.status === 'active' ? 'bg-accent-100 text-accent-700' :
                  volunteer.status === 'busy' ? 'bg-warning-100 text-warning' :
                  'bg-secondary-100 text-secondary-600'
                }`}>
                  {volunteer.status}
                </span>
              </div>
              
              <div className="mb-4 flex items-center gap-2 text-sm text-secondary-500">
                <MapPin className="h-4 w-4" />
                <span>Lat {volunteer.location?.lat?.toFixed(4)}, Lng {volunteer.location?.lon?.toFixed(4)}</span>
              </div>

              <div className="space-y-3 border-t border-border pt-4">
                {volunteer.skills?.length > 0 && (
                  <div>
                    <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-secondary-400">Skills</p>
                    <div className="flex flex-wrap gap-1">
                      {volunteer.skills.map(skill => (
                        <span key={skill} className="rounded bg-primary-50 px-2 py-1 text-[10px] font-semibold text-primary-700">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {volunteer.assets?.length > 0 && (
                  <div>
                    <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-secondary-400">Assets</p>
                    <div className="flex flex-wrap gap-1">
                      {volunteer.assets.map(asset => (
                        <span key={asset} className="rounded bg-secondary-100 px-2 py-1 text-[10px] font-semibold text-secondary-700">
                          {asset}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </article>
          ))
        )}
      </div>
    </main>
  );
}
