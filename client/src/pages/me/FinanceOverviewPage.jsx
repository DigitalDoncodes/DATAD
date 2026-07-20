import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { TrendingUp, TrendingDown, Pencil, Plus, Download, ArrowRight, List, Calculator, BookOpen } from 'lucide-react';
import { listExpenses, createExpense, getSummary, setBudget } from '../../api/finance';
import Modal from '../../components/common/Modal';
import BudgetBar from '../../components/finance/BudgetBar';
import CategoryChart from '../../components/finance/CategoryChart';
import Loader from '../../components/common/Loader';
import DateInput from '../../components/common/DateInput';
import { Page } from '../../components/common/motion';

const CATEGORIES = ['Food', 'Travel', 'Rent', 'Books & Courses', 'Entertainment', 'Shopping', 'Other'];
const SOURCES    = ['Allowance', 'Stipend', 'Salary', 'Freelance', 'Scholarship', 'Gift', 'Other'];
const formatINR  = (n) => '₹' + Number(n || 0).toLocaleString('en-IN');
const currentMonth = () => new Date().toISOString().slice(0, 7);

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

export default function FinanceOverviewPage() {
  const [month, setMonth]             = useState(currentMonth());
  const [expenses, setExpenses]       = useState(null);
  const [summary, setSummary]         = useState(null);
  const [entryModal, setEntryModal]   = useState(null);
  const [budgetModal, setBudgetModal] = useState(false);
  const expenseForm = useForm({ defaultValues: { category: 'Food', source: 'Allowance' } });
  const budgetForm  = useForm();

  const load = useCallback(() => {
    listExpenses(month).then((r) => setExpenses(r.data));
    getSummary(month).then((r) => setSummary(r.data));
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
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  const onSetBudget = async ({ monthlyAmount }) => {
    try {
      await setBudget(Number(monthlyAmount));
      toast.success('Budget saved');
      setBudgetModal(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  return (
    <Page>
      <div className="mb-5">
        <h1 className="text-xl font-bold">Finance</h1>
        <p className="mt-0.5 text-xs text-gray-400">Private to your account — only you can see this.</p>
      </div>

      {!expenses || !summary ? <Loader /> : (
        <div className="space-y-4">
          {/* Controls */}
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="month" value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="rounded-lg border border-gray-300 bg-transparent px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
            />
            <button onClick={() => { budgetForm.reset({ monthlyAmount: summary.budget || '' }); setBudgetModal(true); }}
              className="flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800">
              <Pencil className="h-4 w-4" /> {summary.budget ? 'Edit budget' : 'Set budget'}
            </button>
            <button onClick={() => setEntryModal('income')}
              className="flex items-center gap-1 rounded-lg bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700">
              <TrendingUp className="h-4 w-4" /> Add income
            </button>
            <button onClick={() => setEntryModal('expense')}
              className="flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700">
              <Plus className="h-4 w-4" /> Add expense
            </button>
          </div>

          {/* Summary card */}
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
            {!summary.budget && <p className="text-sm text-gray-400">Set a monthly budget to track overspending.</p>}
          </div>

          {/* Category chart */}
          <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
            <h2 className="mb-4 font-semibold">Spending by category</h2>
            <CategoryChart data={summary.byCategory} />
          </div>

          {/* Quick links to other sections */}
          <div className="flex flex-wrap gap-3">
            <Link to="/finance/tracker"
              className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800">
              <List className="h-4 w-4" /> All transactions <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <Link to="/finance/calculator"
              className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800">
              <Calculator className="h-4 w-4" /> Calculators <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <button onClick={() => exportCSV(expenses, month)} disabled={!expenses?.length}
              className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium hover:bg-gray-50 disabled:opacity-40 dark:border-gray-800 dark:hover:bg-gray-800">
              <Download className="h-4 w-4" /> Export CSV
            </button>
          </div>
        </div>
      )}

      {/* Add entry modal */}
      <Modal open={Boolean(entryModal)} onClose={() => setEntryModal(null)} title={entryModal === 'income' ? 'Add income' : 'Add expense'}>
        <form onSubmit={expenseForm.handleSubmit(onAddEntry)} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium">Amount (₹)</label>
              <input type="number" step="0.01" min="0" {...expenseForm.register('amount', { required: true, min: 0.01 })} className="input" />
            </div>
            {entryModal === 'income' ? (
              <div>
                <label className="mb-1 block text-sm font-medium">Source</label>
                <select {...expenseForm.register('source')} className="input">
                  {SOURCES.map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>
            ) : (
              <div>
                <label className="mb-1 block text-sm font-medium">Category</label>
                <select {...expenseForm.register('category')} className="input">
                  {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
            )}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Note <span className="text-gray-400">(optional)</span></label>
            <input {...expenseForm.register('note')} placeholder={entryModal === 'income' ? 'e.g. Monthly allowance' : 'e.g. Mess bill'} className="input" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Date</label>
            <DateInput defaultValue={new Date().toISOString().slice(0, 10)} {...expenseForm.register('date')} />
          </div>
          <button type="submit" disabled={expenseForm.formState.isSubmitting}
            className={`w-full rounded-lg py-2 text-sm font-medium text-white disabled:opacity-50 ${entryModal === 'income' ? 'bg-green-600 hover:bg-green-700' : 'bg-indigo-600 hover:bg-indigo-700'}`}>
            {entryModal === 'income' ? 'Add income' : 'Add expense'}
          </button>
        </form>
      </Modal>

      {/* Budget modal */}
      <Modal open={budgetModal} onClose={() => setBudgetModal(false)} title="Monthly budget">
        <form onSubmit={budgetForm.handleSubmit(onSetBudget)} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Budget amount (₹ per month)</label>
            <input type="number" min="0" {...budgetForm.register('monthlyAmount', { required: true })} className="input" />
          </div>
          <button type="submit" disabled={budgetForm.formState.isSubmitting}
            className="w-full rounded-lg bg-indigo-600 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50">
            Save budget
          </button>
        </form>
      </Modal>
    </Page>
  );
}
