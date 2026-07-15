import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Flame, Briefcase, TrendingUp, Star, ArrowRight } from 'lucide-react';
import { listNotes } from '../api/notes';
import { listTasks } from '../api/tasks';
import { getTodayCase } from '../api/dailyCase';
import { getTodayReflection } from '../api/reflection';
import { useAuth } from '../context/AuthContext';
import useDocumentTitle from '../hooks/useDocumentTitle';
import { daysUntil } from '../utils/dateUtils';
import { Skeleton } from '../components/common/Skeleton';
import TodayFocus from '../components/dashboard/TodayFocus';
import { Page } from '../components/common/motion';

const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
};

// Fallback encouragement when the AI reflection isn't published yet.
const PROMPTS = [
  'One page today is better than ten pages someday.',
  'You don’t have to do everything today. Just the next right thing.',
  'Progress is quiet. Keep going.',
  'Showing up today is enough. The rest follows.',
  'Small steps, taken daily, become the person you’re becoming.',
  'You’ve handled every hard day so far. Today is no different.',
  'Comparison is noise. Your pace is the plan.',
];

// One small optional positive stat: the streak if there is one,
// otherwise the most recent note as a quiet win. Nothing if neither.
function SmallWin({ streak, note }) {
  if (streak > 0) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-gray-200/80 bg-white p-4 dark:border-gray-800/80 dark:bg-gray-900">
        <Flame className="h-4 w-4 shrink-0 text-amber-500" />
        <p className="text-sm text-gray-700 dark:text-gray-200">
          <span className="font-medium">{streak}-day streak.</span>{' '}
          <span className="text-gray-500 dark:text-gray-400">You keep showing up — that&rsquo;s the whole secret.</span>
        </p>
      </div>
    );
  }
  if (note) {
    return (
      <Link
        to={`/study/notes/${note._id}`}
        className="flex items-center gap-3 rounded-2xl border border-gray-200/80 bg-white p-4 transition-colors hover:border-indigo-300 dark:border-gray-800/80 dark:bg-gray-900 dark:hover:border-indigo-700"
      >
        <BookOpen className="h-4 w-4 shrink-0 text-indigo-500" />
        <p className="min-w-0 flex-1 truncate text-sm text-gray-700 dark:text-gray-200">
          <span className="text-gray-500 dark:text-gray-400">A recent win:&nbsp;</span>
          <span className="font-medium">{note.title}</span>
        </p>
      </Link>
    );
  }
  return null;
}

function ExperienceToolkit() {
  return (
    <div className="rounded-2xl border border-amber-200/80 bg-amber-50 p-4 dark:border-amber-900/40 dark:bg-amber-950/20">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-400">
        Experience toolkit
      </p>
      <div className="space-y-2">
        <Link to="/career/stories" className="flex items-center justify-between rounded-xl bg-white/70 px-3 py-2.5 text-sm transition-colors hover:bg-white dark:bg-gray-900/50 dark:hover:bg-gray-900">
          <div className="flex items-center gap-2.5">
            <Star className="h-4 w-4 shrink-0 text-amber-500" />
            <span className="font-medium text-gray-800 dark:text-gray-200">STAR Story Bank</span>
          </div>
          <ArrowRight className="h-3.5 w-3.5 text-gray-400" />
        </Link>
        <Link to="/career/pivot" className="flex items-center justify-between rounded-xl bg-white/70 px-3 py-2.5 text-sm transition-colors hover:bg-white dark:bg-gray-900/50 dark:hover:bg-gray-900">
          <div className="flex items-center gap-2.5">
            <Briefcase className="h-4 w-4 shrink-0 text-indigo-500" />
            <span className="font-medium text-gray-800 dark:text-gray-200">Career Pivot Tracker</span>
          </div>
          <ArrowRight className="h-3.5 w-3.5 text-gray-400" />
        </Link>
        <Link to="/me/finance/roi" className="flex items-center justify-between rounded-xl bg-white/70 px-3 py-2.5 text-sm transition-colors hover:bg-white dark:bg-gray-900/50 dark:hover:bg-gray-900">
          <div className="flex items-center gap-2.5">
            <TrendingUp className="h-4 w-4 shrink-0 text-emerald-500" />
            <span className="font-medium text-gray-800 dark:text-gray-200">ROI Calculator</span>
          </div>
          <ArrowRight className="h-3.5 w-3.5 text-gray-400" />
        </Link>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  useDocumentTitle('Home');
  const { user } = useAuth();
  const [data, setData] = useState(null);

  useEffect(() => {
    Promise.allSettled([
      listTasks(), listNotes(), getTodayCase(), getTodayReflection(),
    ]).then(([tasksRes, notesRes, caseRes, reflectionRes]) => {
      const tasks = tasksRes.status === 'fulfilled' ? tasksRes.value.data : [];
      const notes = notesRes.status === 'fulfilled' ? notesRes.value.data : [];
      const caseData = caseRes.status === 'fulfilled' ? caseRes.value.data : null;
      const reflection = reflectionRes.status === 'fulfilled' ? reflectionRes.value.data : null;

      const open = tasks.filter((t) => t.status !== 'done' && t.dueDate);

      setData({
        // Today's Focus (rule engine input)
        earlier: open.filter((t) => daysUntil(t.dueDate) < 0 && daysUntil(t.dueDate) >= -7),
        today: open.filter((t) => daysUntil(t.dueDate) === 0),
        streak: caseData?.streak ?? 0,
        caseSolved: caseData?.solved ?? false,
        caseTitle: caseData?.case?.title,
        // Encouragement line under the greeting
        quote: reflection?.quote || null,
        // Small win
        lastNote: notes[0] || null,
      });
    });
  }, []);

  if (!data) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-6">
        <Skeleton className="mb-2 h-3 w-32" />
        <Skeleton className="mb-6 h-8 w-56" />
        <div className="space-y-3">
          <Skeleton className="h-24 w-full rounded-2xl" />
          <Skeleton className="h-14 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  const dateLabel = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
  const encouragement = data.quote?.text || PROMPTS[new Date().getDay() % PROMPTS.length];

  return (
    <Page className="mx-auto max-w-2xl px-4 py-6">
      {/* 1 — Greeting with one encouraging line */}
      <div className="mb-6">
        <p className="text-xs font-medium uppercase tracking-wide text-gray-400">{dateLabel}</p>
        <h1 className="text-2xl font-semibold tracking-tight">
          {greeting()}, <span className="gradient-text">{user?.name?.split(' ')[0]}</span>
        </h1>
        <p className="mt-1.5 text-sm leading-relaxed text-gray-500 dark:text-gray-400">
          {encouragement}
          {data.quote?.author && <span className="text-gray-400"> — {data.quote.author}</span>}
        </p>
      </div>

      <div className="space-y-3">
        {/* 2 — One suggested action */}
        <TodayFocus data={data} />
        {/* 3 — Experience toolkit (for those with experience) */}
        {user?.studentType === 'experienced' && <ExperienceToolkit />}
        {/* 4 — One small optional positive stat */}
        <SmallWin streak={data.streak} note={data.lastNote} />
      </div>
    </Page>
  );
}