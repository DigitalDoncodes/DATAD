import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import {
  Plus, Trash2, Wallet, Pencil, TrendingUp, TrendingDown,
  Download, LayoutDashboard, List, Calculator, BookOpen,
  IndianRupee, Percent, CalendarDays, Target, PiggyBank,
  ArrowRight, Info,
} from 'lucide-react';
import {
  listExpenses, createExpense, deleteExpense, getSummary, setBudget,
} from '../api/finance';
import { formatDate } from '../utils/dateUtils';
import DateInput from '../components/common/DateInput';
import Loader from '../components/common/Loader';
import EmptyState from '../components/common/EmptyState';
import Modal from '../components/common/Modal';
import ConfirmModal from '../components/common/ConfirmModal';
import CategoryChart from '../components/finance/CategoryChart';
import BudgetBar from '../components/finance/BudgetBar';

/* ─── constants ─────────────────────────────────────────── */
const CATEGORIES = ['Food', 'Travel', 'Rent', 'Books & Courses', 'Entertainment', 'Shopping', 'Other'];
const SOURCES    = ['Allowance', 'Stipend', 'Salary', 'Freelance', 'Scholarship', 'Gift', 'Other'];
const formatINR  = (n) => '₹' + Number(n || 0).toLocaleString('en-IN');
const currentMonth = () => new Date().toISOString().slice(0, 7);

const TABS = [
  { key: 'overview',    label: 'Overview',    icon: LayoutDashboard },
  { key: 'tracker',     label: 'Tracker',     icon: List },
  { key: 'calculator',  label: 'Calculator',  icon: Calculator },
  { key: 'learn',       label: 'Learn',       icon: BookOpen },
];


/* ─── CSV export ─────────────────────────────────────────── */
const exportCSV = (expenses, month) => {
  const rows = [['Date', 'Type', 'Category / Source', 'Note', 'Amount (INR)']];
  expenses.forEach((e) => {
    rows.push([
      e.date ? e.date.slice(0, 10) : '',
      e.kind === 'income' ? 'Income' : 'Expense',
      e.kind === 'income' ? (e.source || '') : (e.category || ''),
      e.note || '',
      e.kind === 'income' ? e.amount : -e.amount,
    ]);
  });
  const csv = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `finance-${month}.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
};

/* ─── SIP Calculator ────────────────────────────────────── */
function SIPCalculator() {
  const [sip, setSip] = useState({ monthly: '', rate: '12', years: '2' });
  const monthly = parseFloat(sip.monthly) || 0;
  const rate    = parseFloat(sip.rate) || 0;
  const months  = (parseFloat(sip.years) || 0) * 12;
  const r = rate / 100 / 12;
  const maturity = r > 0 ? monthly * ((Math.pow(1 + r, months) - 1) / r) * (1 + r) : monthly * months;
  const invested = monthly * months;
  const gains    = maturity - invested;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
      <h3 className="mb-4 flex items-center gap-2 font-semibold">
        <PiggyBank className="h-4 w-4 text-indigo-500" /> SIP Calculator
      </h3>
      <div className="grid grid-cols-3 gap-3 mb-4">
        {[
          { key: 'monthly', label: 'Monthly SIP (₹)', placeholder: '5000' },
          { key: 'rate',    label: 'Expected return (%/yr)', placeholder: '12' },
          { key: 'years',   label: 'Duration (years)', placeholder: '2' },
        ].map(({ key, label, placeholder }) => (
          <div key={key}>
            <label className="mb-1 block text-xs text-gray-500">{label}</label>
            <input
              type="number"
              placeholder={placeholder}
              value={sip[key]}
              onChange={(e) => setSip((p) => ({ ...p, [key]: e.target.value }))}
              className="input"
            />
          </div>
        ))}
      </div>
      {monthly > 0 && (
        <div className="grid grid-cols-3 gap-3 rounded-lg bg-indigo-50 p-4 text-center dark:bg-indigo-900/20">
          <div>
            <p className="text-xs text-gray-500">Invested</p>
            <p className="mt-1 font-bold text-gray-800 dark:text-gray-100">{formatINR(Math.round(invested))}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Est. gains</p>
            <p className="mt-1 font-bold text-green-600 dark:text-green-400">{formatINR(Math.round(gains))}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Maturity value</p>
            <p className="mt-1 font-bold text-indigo-600 dark:text-indigo-400">{formatINR(Math.round(maturity))}</p>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Loan / EMI Calculator ─────────────────────────────── */
function EMICalculator() {
  const [loan, setLoan] = useState({ principal: '', rate: '10', months: '24' });
  const P = parseFloat(loan.principal) || 0;
  const r = (parseFloat(loan.rate) || 0) / 100 / 12;
  const n = parseFloat(loan.months) || 0;
  const emi = r > 0 && n > 0 ? P * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1) : P / (n || 1);
  const totalPay = emi * n;
  const interest = totalPay - P;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
      <h3 className="mb-4 flex items-center gap-2 font-semibold">
        <IndianRupee className="h-4 w-4 text-amber-500" /> Loan / EMI Calculator
      </h3>
      <div className="grid grid-cols-3 gap-3 mb-4">
        {[
          { key: 'principal', label: 'Loan amount (₹)', placeholder: '500000' },
          { key: 'rate',      label: 'Interest rate (%/yr)', placeholder: '10' },
          { key: 'months',    label: 'Tenure (months)', placeholder: '24' },
        ].map(({ key, label, placeholder }) => (
          <div key={key}>
            <label className="mb-1 block text-xs text-gray-500">{label}</label>
            <input
              type="number"
              placeholder={placeholder}
              value={loan[key]}
              onChange={(e) => setLoan((p) => ({ ...p, [key]: e.target.value }))}
              className="input"
            />
          </div>
        ))}
      </div>
      {P > 0 && (
        <div className="grid grid-cols-3 gap-3 rounded-lg bg-amber-50 p-4 text-center dark:bg-amber-900/20">
          <div>
            <p className="text-xs text-gray-500">Monthly EMI</p>
            <p className="mt-1 font-bold text-gray-800 dark:text-gray-100">{formatINR(Math.round(emi))}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Total interest</p>
            <p className="mt-1 font-bold text-red-500">{formatINR(Math.round(interest))}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Total payable</p>
            <p className="mt-1 font-bold text-amber-600 dark:text-amber-400">{formatINR(Math.round(totalPay))}</p>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Savings Goal Calculator ────────────────────────────── */
function GoalCalculator() {
  const [g, setG] = useState({ goal: '', saved: '', months: '' });
  const goal   = parseFloat(g.goal) || 0;
  const saved  = parseFloat(g.saved) || 0;
  const months = parseFloat(g.months) || 1;
  const needed = Math.max(0, goal - saved);
  const monthly = needed / months;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
      <h3 className="mb-4 flex items-center gap-2 font-semibold">
        <Target className="h-4 w-4 text-emerald-500" /> Savings Goal Planner
      </h3>
      <div className="grid grid-cols-3 gap-3 mb-4">
        {[
          { key: 'goal',   label: 'Target amount (₹)', placeholder: '100000' },
          { key: 'saved',  label: 'Already saved (₹)', placeholder: '0' },
          { key: 'months', label: 'Months to goal', placeholder: '12' },
        ].map(({ key, label, placeholder }) => (
          <div key={key}>
            <label className="mb-1 block text-xs text-gray-500">{label}</label>
            <input
              type="number"
              placeholder={placeholder}
              value={g[key]}
              onChange={(e) => setG((p) => ({ ...p, [key]: e.target.value }))}
              className="input"
            />
          </div>
        ))}
      </div>
      {goal > 0 && (
        <div className="grid grid-cols-2 gap-3 rounded-lg bg-emerald-50 p-4 text-center dark:bg-emerald-900/20">
          <div>
            <p className="text-xs text-gray-500">Still needed</p>
            <p className="mt-1 font-bold text-gray-800 dark:text-gray-100">{formatINR(Math.round(needed))}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Save per month</p>
            <p className="mt-1 font-bold text-emerald-600 dark:text-emerald-400">{formatINR(Math.round(monthly))}</p>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Learn tab ─────────────────────────────────────────── */
const LEARN_TOPICS = [
  {
    title: 'Time Value of Money',
    color: 'indigo',
    points: [
      'A rupee today is worth more than a rupee tomorrow — it can be invested and grow.',
      'PV = FV / (1+r)^n  ·  FV = PV × (1+r)^n',
      'Used for comparing investment options, valuing cash flows, DCF models.',
    ],
  },
  {
    title: 'Compounding',
    color: 'green',
    points: [
      'Earnings generate further earnings — the "8th wonder of the world."',
      'Starting 5 years earlier can double the corpus due to compounding.',
      'SIP of ₹5,000/month at 12% for 20 yrs → ₹49L invested grows to ~₹49L gain.',
    ],
  },
  {
    title: 'Budgeting Frameworks',
    color: 'amber',
    points: [
      '50-30-20 Rule: 50% needs, 30% wants, 20% savings/investments.',
      'Zero-based budgeting: every rupee is assigned a purpose each month.',
      'Envelope method: allocate cash to physical/virtual buckets per category.',
    ],
  },
  {
    title: 'Credit & Debt',
    color: 'rose',
    points: [
      'Good debt builds assets (education loan, home). Bad debt funds consumption.',
      'Credit score (CIBIL) affects future loan rates. Pay on time, keep utilisation <30%.',
      'Avalanche method: clear highest-interest debt first. Snowball: smallest first.',
    ],
  },
  {
    title: 'Investment Basics',
    color: 'purple',
    points: [
      'Equity (stocks/MFs): higher return, higher risk. Debt (FD/bonds): lower risk, steady.',
      'Diversification reduces unsystematic risk — don\'t put all eggs in one basket.',
      'Index funds vs active: most active funds underperform the index over 10+ yrs.',
    ],
  },
  {
    title: 'Career Finance',
    color: 'cyan',
    points: [
      'Track your CTC vs in-hand: PF, gratuity, and taxes reduce take-home significantly.',
      'Negotiate joining bonus carefully — many have clawback clauses if you leave early.',
      'Build a 3-6 month emergency fund before making high-risk investments.',
    ],
  },
];

const colorMap = {
  indigo: 'bg-indigo-50 border-indigo-200 dark:bg-indigo-900/10 dark:border-indigo-800',
  green:  'bg-green-50 border-green-200 dark:bg-green-900/10 dark:border-green-800',
  amber:  'bg-amber-50 border-amber-200 dark:bg-amber-900/10 dark:border-amber-800',
  rose:   'bg-rose-50 border-rose-200 dark:bg-rose-900/10 dark:border-rose-800',
  purple: 'bg-purple-50 border-purple-200 dark:bg-purple-900/10 dark:border-purple-800',
  cyan:   'bg-cyan-50 border-cyan-200 dark:bg-cyan-900/10 dark:border-cyan-800',
};
const dotMap = {
  indigo: 'bg-indigo-400', green: 'bg-green-500', amber: 'bg-amber-400',
  rose: 'bg-rose-400', purple: 'bg-purple-400', cyan: 'bg-cyan-400',
};

function LearnTab() {
  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Core finance concepts every student should know — from classroom to career.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        {LEARN_TOPICS.map((t) => (
          <div key={t.title} className={`rounded-xl border p-4 ${colorMap[t.color]}`}>
            <h3 className="mb-2 text-sm font-semibold text-gray-800 dark:text-gray-100">{t.title}</h3>
            <ul className="space-y-1.5">
              {t.points.map((p, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-gray-600 dark:text-gray-300">
                  <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${dotMap[t.color]}`} />
                  {p}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Main page ─────────────────────────────────────────── */
export default function FinancePage() {
  const [tab, setTab]               = useState('overview');
  const [month, setMonth]           = useState(currentMonth());
  const [expenses, setExpenses]     = useState(null);
  const [summary, setSummary]       = useState(null);
  const [entryModal, setEntryModal] = useState(null);
  const [budgetModal, setBudgetModal] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const expenseForm = useForm({ defaultValues: { category: 'Food', source: 'Allowance' } });
  const budgetForm  = useForm();

  const load = useCallback(() => {
    listExpenses(month).then((res) => setExpenses(res.data));
    getSummary(month).then((res) => setSummary(res.data));
  }, [month]);
  useEffect(load, [load]);

  const onAddEntry = async (data) => {
    try {
      await createExpense({ ...data, kind: entryModal });
      toast.success(entryModal === 'income' ? 'Income added' : 'Expense added');
      expenseForm.reset({ category: data.category, source: data.source });
      setEntryModal(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add entry');
    }
  };

  const onSetBudget = async ({ monthlyAmount }) => {
    try {
      await setBudget(Number(monthlyAmount));
      toast.success('Budget saved');
      setBudgetModal(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save budget');
    }
  };

  const onDelete = async (id) => {
    await deleteExpense(id);
    load();
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <div className="mb-5">
        <h1 className="text-xl font-bold">Finance</h1>
        <p className="mt-0.5 text-xs text-gray-400">Private to your account — no one else can see this.</p>
      </div>

      {/* Tab bar */}
      <div className="mb-6 flex gap-1 overflow-x-auto rounded-xl border border-gray-200 bg-gray-100/60 p-1 dark:border-gray-800 dark:bg-gray-900/60">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap ${
              tab === key
                ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-800 dark:text-gray-100'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
          >
            <Icon className="h-4 w-4" /> {label}
          </button>
        ))}
      </div>

      {/* Overview tab */}
      {tab === 'overview' && (
        !expenses || !summary ? <Loader /> : (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="month"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="rounded-lg border border-gray-300 bg-transparent px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
              />
              <button
                onClick={() => { budgetForm.reset({ monthlyAmount: summary.budget || '' }); setBudgetModal(true); }}
                className="flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
              >
                <Pencil className="h-4 w-4" /> {summary.budget ? 'Edit budget' : 'Set budget'}
              </button>
              <button
                onClick={() => setEntryModal('income')}
                className="flex items-center gap-1 rounded-lg bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700"
              >
                <TrendingUp className="h-4 w-4" /> Add income
              </button>
              <button
                onClick={() => setEntryModal('expense')}
                className="flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700"
              >
                <Plus className="h-4 w-4" /> Add expense
              </button>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
              <h2 className="mb-3 font-semibold">This month</h2>
              <div className="mb-4 grid grid-cols-3 gap-3 text-center">
                <div>
                  <p className="flex items-center justify-center gap-1 text-xs text-gray-400">
                    <TrendingUp className="h-3.5 w-3.5 text-green-600" /> Income
                  </p>
                  <p className="mt-0.5 text-xl font-bold text-green-700 dark:text-green-400">{formatINR(summary.income)}</p>
                </div>
                <div>
                  <p className="flex items-center justify-center gap-1 text-xs text-gray-400">
                    <TrendingDown className="h-3.5 w-3.5 text-red-500" /> Spent
                  </p>
                  <p className="mt-0.5 text-xl font-bold">{formatINR(summary.total)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Balance</p>
                  <p className={`mt-0.5 text-xl font-bold ${summary.balance < 0 ? 'text-red-600 dark:text-red-400' : 'text-green-700 dark:text-green-400'}`}>
                    {formatINR(summary.balance)}
                  </p>
                </div>
              </div>
              <BudgetBar spent={summary.total} budget={summary.budget} />
              {!summary.budget && (
                <p className="text-sm text-gray-400">Set a monthly budget to track overspending.</p>
              )}
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
              <h2 className="mb-4 font-semibold">Spending by category</h2>
              <CategoryChart data={summary.byCategory} />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setTab('tracker')}
                className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800"
              >
                <List className="h-4 w-4" /> View all transactions <ArrowRight className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => exportCSV(expenses, month)}
                disabled={!expenses?.length}
                className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium hover:bg-gray-50 disabled:opacity-40 dark:border-gray-800 dark:hover:bg-gray-800"
              >
                <Download className="h-4 w-4" /> Export CSV
              </button>
            </div>
          </div>
        )
      )}

      {/* Tracker tab */}
      {tab === 'tracker' && (
        !expenses || !summary ? <Loader /> : (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="month"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="rounded-lg border border-gray-300 bg-transparent px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
              />
              <div className="ml-auto flex gap-2">
                <button
                  onClick={() => setEntryModal('income')}
                  className="flex items-center gap-1 rounded-lg bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700"
                >
                  <TrendingUp className="h-4 w-4" /> Add income
                </button>
                <button
                  onClick={() => setEntryModal('expense')}
                  className="flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                >
                  <Plus className="h-4 w-4" /> Add expense
                </button>
                <button
                  onClick={() => exportCSV(expenses, month)}
                  disabled={!expenses?.length}
                  className="flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium hover:bg-gray-50 disabled:opacity-40 dark:border-gray-700 dark:hover:bg-gray-800"
                >
                  <Download className="h-4 w-4" /> Export
                </button>
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
              <h2 className="mb-3 font-semibold">Transactions</h2>
              {expenses.length === 0 ? (
                <EmptyState icon={Wallet} title="Nothing this month" subtitle="Add income or an expense to start tracking" />
              ) : (
                <ul className="divide-y divide-gray-100 dark:divide-gray-800">
                  {expenses.map((exp) => (
                    <li key={exp._id} className="flex items-center gap-3 py-2.5">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {exp.note || (exp.kind === 'income' ? exp.source : exp.category)}
                        </p>
                        <p className="text-xs text-gray-400">
                          {exp.kind === 'income' ? `Income · ${exp.source}` : exp.category} · {formatDate(exp.date)}
                        </p>
                      </div>
                      <span className={`text-sm font-semibold tabular-nums ${exp.kind === 'income' ? 'text-green-700 dark:text-green-400' : ''}`}>
                        {exp.kind === 'income' ? '+' : '−'}{formatINR(exp.amount)}
                      </span>
                      <button
                        onClick={() => setConfirmDeleteId(exp._id)}
                        className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/30"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )
      )}

      {/* Calculator tab */}
      {tab === 'calculator' && (
        <div className="space-y-5">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Quick calculators for common student finance decisions.
          </p>
          <SIPCalculator />
          <EMICalculator />
          <GoalCalculator />
        </div>
      )}

      {/* Learn tab */}
      {tab === 'learn' && <LearnTab />}

      {/* Modals */}
      <ConfirmModal
        open={!!confirmDeleteId}
        onClose={() => setConfirmDeleteId(null)}
        onConfirm={() => onDelete(confirmDeleteId)}
        title="Delete entry"
        message="This transaction will be permanently deleted."
        danger
        confirmLabel="Delete"
      />

      <Modal open={Boolean(entryModal)} onClose={() => setEntryModal(null)} title={entryModal === 'income' ? 'Add income' : 'Add expense'}>
        <form onSubmit={expenseForm.handleSubmit(onAddEntry)} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="exp-amount" className="mb-1 block text-sm font-medium">Amount (₹)</label>
              <input id="exp-amount" type="number" step="0.01" min="0" {...expenseForm.register('amount', { required: true, min: 0.01 })} className="input" />
            </div>
            {entryModal === 'income' ? (
              <div>
                <label htmlFor="exp-source" className="mb-1 block text-sm font-medium">Source</label>
                <select id="exp-source" {...expenseForm.register('source')} className="input">
                  {SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            ) : (
              <div>
                <label htmlFor="exp-category" className="mb-1 block text-sm font-medium">Category</label>
                <select id="exp-category" {...expenseForm.register('category')} className="input">
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            )}
          </div>
          <div>
            <label htmlFor="exp-note" className="mb-1 block text-sm font-medium">Note <span className="text-gray-400">(optional)</span></label>
            <input id="exp-note" {...expenseForm.register('note')} placeholder={entryModal === 'income' ? 'e.g. Monthly allowance' : 'e.g. Mess bill'} className="input" />
          </div>
          <div>
            <label htmlFor="exp-date" className="mb-1 block text-sm font-medium">Date</label>
            <DateInput id="exp-date" defaultValue={new Date().toISOString().slice(0, 10)} {...expenseForm.register('date')} />
          </div>
          <button type="submit" disabled={expenseForm.formState.isSubmitting} className={`w-full rounded-lg py-2 text-sm font-medium text-white disabled:opacity-50 ${entryModal === 'income' ? 'bg-green-600 hover:bg-green-700' : 'bg-indigo-600 hover:bg-indigo-700'}`}>
            {entryModal === 'income' ? 'Add income' : 'Add expense'}
          </button>
        </form>
      </Modal>

      <Modal open={budgetModal} onClose={() => setBudgetModal(false)} title="Monthly budget">
        <form onSubmit={budgetForm.handleSubmit(onSetBudget)} className="space-y-4">
          <div>
            <label htmlFor="budget-amount" className="mb-1 block text-sm font-medium">Budget amount (₹ per month)</label>
            <input id="budget-amount" type="number" min="0" {...budgetForm.register('monthlyAmount', { required: true, min: 0 })} className="input" />
          </div>
          <button type="submit" disabled={budgetForm.formState.isSubmitting} className="w-full rounded-lg bg-indigo-600 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50">
            Save budget
          </button>
        </form>
      </Modal>
    </div>
  );
}
