import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Heart, Moon, Sun, LogOut, Menu, X } from 'lucide-react';
import { DSquareMark } from '../common/Logo';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

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

export default function Navbar() {
  const { user, logout } = useAuth();
  const { dark, toggle } = useTheme();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

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
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end} className={linkClass}>
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <NavLink
            to="/support"
            aria-label="Support the Hub"
            className="rounded-lg p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30"
          >
            <Heart className="h-5 w-5" />
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
          {links.map((l) => (
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
        </nav>
      )}
    </header>
  );
}
