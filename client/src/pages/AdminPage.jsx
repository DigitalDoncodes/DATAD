import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BookLock,
  BookOpen,
  Camera,
  CalendarDays,
  Crown,
  Megaphone,
  Users,
  Clapperboard,
  ScrollText,
  Gift,
  ChevronRight,
} from 'lucide-react';
import { getStats, listStudents } from '../api/admin';
import { useAuth } from '../context/AuthContext';
import Loader from '../components/common/Loader';
import { AnimatedNumber, Stagger, StaggerItem } from '../components/common/motion';

function StatTile({ icon: Icon, label, value }) {
  return (
    <div className="card-hover rounded-2xl border border-gray-200/80 bg-white p-4 dark:border-gray-800/80 dark:bg-gray-900">
      <div className="flex items-center gap-2 text-xs text-gray-400">
        <Icon className="h-4 w-4 text-indigo-500" /> {label}
      </div>
      <AnimatedNumber value={value} className="mt-1 block text-2xl font-bold tabular-nums" />
    </div>
  );
}

function NavCard({ to, icon: Icon, title, description, badge }) {
  return (
    <Link
      to={to}
      className="card-hover group flex items-center gap-4 rounded-2xl border border-gray-200/80 bg-white p-5 dark:border-gray-800/80 dark:bg-gray-900"
    >
      <div className="rounded-xl bg-indigo-100 p-3 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-400">
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-2 font-semibold">
          {title}
          {badge > 0 && (
            <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[11px] font-semibold text-orange-700 dark:bg-orange-900/40 dark:text-orange-300">
              {badge}
            </span>
          )}
        </p>
        <p className="truncate text-xs text-gray-500 dark:text-gray-400">{description}</p>
      </div>
      <ChevronRight className="h-4 w-4 shrink-0 text-gray-300 transition-transform group-hover:translate-x-0.5 group-hover:text-indigo-500 dark:text-gray-600" />
    </Link>
  );
}

export default function AdminPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [pending, setPending] = useState(0);

  useEffect(() => {
    getStats().then((res) => setStats(res.data));
    listStudents().then((res) =>
      setPending(res.data.filter((s) => s.status === 'pending').length)
    );
  }, []);

  if (!stats) return <Loader />;

  const sections = [
    {
      to: '/admin/students',
      icon: Users,
      title: 'Students & approvals',
      description: pending
        ? `${pending} signup${pending === 1 ? '' : 's'} waiting for review`
        : 'Member register — everyone approved',
      badge: pending,
    },
    {
      to: '/admin/announcements',
      icon: Megaphone,
      title: 'Announcements',
      description: 'Post to the dashboard, optionally email the batch',
    },
    {
      to: '/admin/logs',
      icon: ScrollText,
      title: 'Activity log',
      description: 'Registrations, approvals, resets — everything, timestamped',
    },
    {
      to: '/admin/referrals',
      icon: Gift,
      title: 'Referral network',
      description: 'Who invited whom, and every code’s status',
    },
    {
      to: '/admin/archive',
      icon: Clapperboard,
      title: 'Nostalgia Archive',
      description: 'Publish and manage entertainment content',
    },
    {
      to: '/journal',
      icon: BookLock,
      title: 'Journal',
      description: 'Your private diary — visible only to you',
    },
  ];

  return (
    <div className="animate-in mx-auto max-w-4xl px-4 py-6">
      <h1 className="mb-1 flex items-center gap-2 text-xl font-bold">
        <Crown className="h-5 w-5 text-amber-500" /> Admin Console
      </h1>
      <p className="mb-5 text-sm text-gray-500 dark:text-gray-400">
        Welcome back, {user?.name?.split(' ')[0]} — here's your platform at a glance.
      </p>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile icon={Users} label="Students" value={stats.students} />
        <StatTile icon={BookOpen} label="Notes" value={stats.notes} />
        <StatTile icon={Camera} label="Photos" value={stats.photos} />
        <StatTile icon={CalendarDays} label="Tasks" value={stats.tasks} />
      </div>

      <Stagger className="grid gap-3 sm:grid-cols-2">
        {sections.map((s) => (
          <StaggerItem key={s.to}>
            <NavCard {...s} />
          </StaggerItem>
        ))}
      </Stagger>
    </div>
  );
}
