import { Menu, ShieldCheck, X } from 'lucide-react';
import { useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import Button from '../UI/Button';

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  const links = [
    { label: 'Home', to: '/' },
    { label: 'Incidents', to: '/incidents' },
    { label: 'Volunteers', to: '/volunteers' },
    { label: 'Missions', to: '/missions' },
    { label: 'Dashboard', to: '/dashboard' },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur shadow-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-white shadow-card">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <p className="font-heading text-lg font-bold text-secondary">RakshaLink</p>
            <p className="text-xs text-secondary-500">Disaster Response Platform</p>
          </div>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `text-sm font-medium transition-colors ${isActive ? 'text-primary-600' : 'text-secondary-500 hover:text-secondary-900'}`
              }
            >
              {link.label}
            </NavLink>
          ))}
          <Link to="/dashboard">
            <Button size="sm" variant="secondary" className="ml-4">
              Coordinator Login
            </Button>
          </Link>
        </nav>

        <button
          type="button"
          className="rounded-xl border border-border p-2 md:hidden"
          onClick={() => setOpen((current) => !current)}
          aria-label="Toggle navigation menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-border bg-card md:hidden">
          <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-4 sm:px-6">
            {links.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setOpen(false)}
                className={`rounded-xl px-3 py-2 text-sm font-medium ${
                  location.pathname === link.to ? 'bg-primary-50 text-primary-700' : 'text-secondary-500'
                }`}
              >
                {link.label}
              </Link>
            ))}
            <Link to="/dashboard" onClick={() => setOpen(false)} className="mt-2">
              <Button size="sm" variant="secondary" className="w-full">
                Coordinator Login
              </Button>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
