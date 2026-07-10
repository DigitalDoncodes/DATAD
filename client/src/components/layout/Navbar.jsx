import { useEffect, useRef, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { ChevronDown, Heart, Moon, Settings, Sun, LogOut, Menu, X, Clapperboard, Crown, BookLock } from 'lucide-react';
import { DatadMark } from '../common/Logo';
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
  { to: '/news', label: 'News' },
];

// Secondary destinations live in the "More" dropdown to keep the bar uncluttered.
const moreLinks = [{ to: '/entertainment', label: 'Archive', icon: Clapperboard }];

const adminMoreLinks = [
  { to: '/admin', label: 'Admin', icon: Crown },
  { to: '/journal', label: 'Journal', icon: BookLock },
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

function MoreMenu({ extraLinks }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const close = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const itemClass = ({ isActive }) =>
    `flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm ${
      isActive
        ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300'
        : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
    }`;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-0.5 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
      >
        More <ChevronDown className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 max-h-[70vh] w-56 overflow-y-auto rounded-xl border border-gray-200 bg-white p-1.5 shadow-lg dark:border-gray-800 dark:bg-gray-900">
          {extraLinks.map((l) => {
            const Icon = l.icon;
            return (
              <NavLink key={l.to} to={l.to} onClick={() => setOpen(false)} className={itemClass}>
                <Icon className="h-4 w-4 text-indigo-500" />
                {l.label}
              </NavLink>
            );
          })}
          <p className="mt-1.5 border-t border-gray-100 px-2.5 pb-1 pt-2 text-[11px] font-medium uppercase tracking-wide text-gray-400 dark:border-gray-800">
            Coming soon
          </p>
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

export default function Navbar() {
  const { user, logout } = useAuth();
  const { dark, toggle } = useTheme();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const isAdmin = user?.role === 'admin';
  const extraLinks = isAdmin ? [...moreLinks, ...adminMoreLinks] : moreLinks;
  const initials = (user?.name || '')
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="glass sticky top-0 z-40 border-x-0 border-t-0 border-b border-gray-200/70 print:hidden dark:border-gray-800/70">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
        <div className="flex items-baseline gap-1.5 whitespace-nowrap font-semibold">
          <DatadMark />
        </div>

        <nav className="hidden items-center gap-0.5 sm:flex">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end} className={linkClass}>
              {l.label}
            </NavLink>
          ))}
          <MoreMenu extraLinks={extraLinks} />
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
          <span
            title={user?.name}
            className="hidden h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300 sm:flex"
          >
            {initials}
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
          {[...links, ...extraLinks].map((l) => (
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
          <NavLink to="/about" className={linkClass} onClick={() => setMenuOpen(false)}>
            About
          </NavLink>
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
