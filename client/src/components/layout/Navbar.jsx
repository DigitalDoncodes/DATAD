import { useEffect, useRef, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { ChevronDown, Heart, Moon, Settings, Sun, LogOut, Menu, X } from 'lucide-react';
import { DSquareMark } from '../common/Logo';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { UPCOMING_FEATURES } from '../../utils/upcomingFeatures';

const links = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/notes', label: 'Notes' },
  { to: '/albums', label: 'Photos' },
  { to: '/planner', label: 'Planner' },
  { to: '/finance', label: 'Finance' },
  { to: '/resume', label: 'Resume' },
];

const linkClass = ({ isActive }) =>
  `rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
    isActive
      ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300'
      : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
  }`;

function SoonBadge() {
  return (
    <span className="ml-auto rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
      soon
    </span>
  );
}

function MoreMenu() {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const close = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-0.5 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
      >
        More <ChevronDown className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 w-56 rounded-xl border border-gray-200 bg-white p-1.5 shadow-lg dark:border-gray-800 dark:bg-gray-900">
          {UPCOMING_FEATURES.map((f) => {
            const Icon = f.icon;
            return (
              <NavLink
                key={f.slug}
                to={`/${f.slug}`}
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                <Icon className="h-4 w-4 text-indigo-500" />
                {f.name}
                <SoonBadge />
              </NavLink>
            );
          })}
        </div>
      )}
    </div>
  );
}

const adminLinks = [
  { to: '/admin', label: 'Admin' },
  { to: '/journal', label: 'Journal' },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const { dark, toggle } = useTheme();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const isAdmin = user?.role === 'admin';
  const navLinks = isAdmin ? [...links, ...adminLinks] : links;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/90 backdrop-blur print:hidden dark:border-gray-800 dark:bg-gray-950/90">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <div className="flex items-baseline gap-1.5 whitespace-nowrap font-semibold">
          <DSquareMark />
          <span className="text-indigo-500 dark:text-indigo-400">Labs</span>
        </div>

        <nav className="hidden items-center gap-1 sm:flex">
          {navLinks.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end} className={linkClass}>
              {l.label}
            </NavLink>
          ))}
          <MoreMenu />
        </nav>

        <div className="flex items-center gap-2">
          <NavLink
            to="/support"
            aria-label="Support the Hub"
            className="rounded-lg p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30"
          >
            <Heart className="h-5 w-5" />
          </NavLink>
          <NavLink
            to="/settings"
            aria-label="Settings"
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
          >
            <Settings className="h-5 w-5" />
          </NavLink>
          <button
            onClick={toggle}
            aria-label="Toggle dark mode"
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
          >
            {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
          <span className="hidden text-sm text-gray-500 dark:text-gray-400 sm:block">
            {user?.name}
          </span>
          <button
            onClick={handleLogout}
            aria-label="Log out"
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
          >
            <LogOut className="h-5 w-5" />
          </button>
          <button
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="Menu"
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 sm:hidden"
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <nav className="flex flex-col gap-1 border-t border-gray-200 px-4 py-2 dark:border-gray-800 sm:hidden">
          {navLinks.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              className={linkClass}
              onClick={() => setMenuOpen(false)}
            >
              {l.label}
            </NavLink>
          ))}
          <p className="mt-2 px-3 text-[11px] font-medium uppercase tracking-wide text-gray-400">
            Coming soon
          </p>
          {UPCOMING_FEATURES.map((f) => (
            <NavLink
              key={f.slug}
              to={`/${f.slug}`}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
              onClick={() => setMenuOpen(false)}
            >
              {f.name}
              <SoonBadge />
            </NavLink>
          ))}
        </nav>
      )}
    </header>
  );
}
