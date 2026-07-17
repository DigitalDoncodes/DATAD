import { useEffect, useState } from 'react';
import { Plus, CheckCircle2, Circle, Clock, ArrowRight, Save, X } from 'lucide-react';
import toast from 'react-hot-toast';
import PageHeader from '../../components/common/PageHeader';
import SmartSelect from '../../components/common/SmartSelect';
import { Page } from '../../components/common/motion';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import { getPivot, upsertPivot, updateGap } from '../../api/pivot';

const DOMAINS = ['IT / Software', 'Banking / Finance', 'Consulting', 'Manufacturing / Ops', 'Healthcare', 'FMCG / Retail', 'Govt / PSU', 'Media / Content', 'Startup'];

const GAP_STATUS = {
  'not-started': { icon: Circle,       label: 'Not started', color: 'text-gray-400' },
  'in-progress':  { icon: Clock,        label: 'In progress', color: 'text-amber-500' },
  'done':         { icon: CheckCircle2, label: 'Done',        color: 'text-emerald-500' },
};

const NEXT_STATUS = { 'not-started': 'in-progress', 'in-progress': 'done', 'done': 'not-started' };

function GapItem({ gap, onToggle, onDelete }) {
  const { icon: Icon, label, color } = GAP_STATUS[gap.status] || GAP_STATUS['not-started'];
  return (
    <div className="flex items-center gap-3 rounded-lg border border-gray-100 px-3 py-2.5 dark:border-gray-800">
      <button onClick={() => onToggle(gap._id, NEXT_STATUS[gap.status])} className={`shrink-0 ${color} hover:opacity-70`} title={label}>
        <Icon className="h-4 w-4" />
      </button>
      <span className={`flex-1 text-sm ${gap.status === 'done' ? 'line-through text-gray-400' : 'text-gray-800 dark:text-gray-200'}`}>{gap.skill}</span>
      <button onClick={() => onDelete(gap._id)} className="shrink-0 text-gray-300 hover:text-red-400 dark:text-gray-700">
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

export default function PivotPage() {
  useDocumentTitle('Career Pivot Tracker');
  const [plan, setPlan] = useState(null);
  const [form, setForm] = useState({});
  const [newGap, setNewGap] = useState('');
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);

  const load = () => getPivot().then((r) => {
    setPlan(r.data);
    setForm({
      fromDomain: r.data.fromDomain || '',
      fromRole: r.data.fromRole || '',
      fromYears: r.data.fromYears ?? '',
      toDomain: r.data.toDomain || '',
      toRole: r.data.toRole || '',
      motivation: r.data.motivation || '',
      targetCompanies: r.data.targetCompanies?.join(', ') || '',
    });
  }).catch(() => {});

  useEffect(() => { load(); }, []);

  const save = async () => {
    setSaving(true);
    try {
      const payload = {
        ...form,
        fromYears: form.fromYears ? Number(form.fromYears) : undefined,
        targetCompanies: form.targetCompanies ? form.targetCompanies.split(',').map((s) => s.trim()).filter(Boolean) : [],
        skillGaps: plan?.skillGaps || [],
      };
      const r = await upsertPivot(payload);
      setPlan(r.data);
      setEditing(false);
      toast.success('Pivot plan saved');
    } catch { toast.error('Failed to save'); }
    finally { setSaving(false); }
  };

  const addGap = async () => {
    if (!newGap.trim()) return;
    const gaps = [...(plan?.skillGaps || []), { skill: newGap.trim(), status: 'not-started' }];
    const r = await upsertPivot({ skillGaps: gaps });
    setPlan(r.data);
    setNewGap('');
  };

  const toggleGap = async (gapId, status) => {
    const r = await updateGap(gapId, status);
    setPlan(r.data);
  };

  const deleteGap = async (gapId) => {
    const gaps = plan.skillGaps.filter((g) => g._id !== gapId);
    const r = await upsertPivot({ skillGaps: gaps });
    setPlan(r.data);
  };

  const inp = 'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100';
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const done  = plan?.skillGaps?.filter((g) => g.status === 'done').length || 0;
  const total = plan?.skillGaps?.length || 0;

  return (
    <Page bare>
      <div className="mx-auto w-full max-w-2xl px-4 py-6 space-y-6">
        <PageHeader
          title="Career Pivot Tracker"
          subtitle="From your pre-MBA domain to your target role — map the gap, track the journey."
        />

        {/* Overview card */}
        <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-sm">Your pivot</h2>
            <button onClick={() => setEditing((v) => !v)} className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline">
              {editing ? 'Cancel' : 'Edit'}
            </button>
          </div>

          {editing ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <SmartSelect
                    options={DOMAINS}
                    value={form.fromDomain}
                    onChange={(val) => setForm((f) => ({ ...f, fromDomain: val }))}
                    label="Pre-MBA domain"
                    placeholder="Select…"
                    allowOther={true}
                    variant="dropdown"
                    name="fromDomain"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Pre-MBA role / title</label>
                  <input value={form.fromRole} onChange={set('fromRole')} placeholder="e.g. Software Engineer" className={inp} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Years of experience</label>
                <input type="number" min="0" max="20" value={form.fromYears} onChange={set('fromYears')} placeholder="e.g. 2.5" className={inp} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <SmartSelect
                    options={DOMAINS}
                    value={form.toDomain}
                    onChange={(val) => setForm((f) => ({ ...f, toDomain: val }))}
                    label="Target domain"
                    placeholder="Select…"
                    allowOther={true}
                    variant="dropdown"
                    name="toDomain"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Target role</label>
                  <input value={form.toRole} onChange={set('toRole')} placeholder="e.g. Product Manager" className={inp} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Why this move? (your pivot narrative)</label>
                <textarea rows={3} value={form.motivation} onChange={set('motivation')} placeholder="3–4 sentences you'd say in an interview…" className={inp} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Target companies (comma-separated)</label>
                <input value={form.targetCompanies} onChange={set('targetCompanies')} placeholder="McKinsey, BCG, Amazon…" className={inp} />
              </div>
              <button onClick={save} disabled={saving}
                className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
              >
                <Save className="h-4 w-4" /> {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          ) : plan?.fromDomain || plan?.toDomain ? (
            <div className="flex items-center gap-4">
              <div className="text-center">
                <p className="text-xs text-gray-400 mb-0.5">From</p>
                <p className="font-semibold text-sm">{plan.fromDomain || '—'}</p>
                {plan.fromRole && <p className="text-xs text-gray-500">{plan.fromRole}</p>}
                {plan.fromYears ? <p className="text-xs text-gray-400">{plan.fromYears} yrs</p> : null}
              </div>
              <ArrowRight className="h-5 w-5 text-indigo-400 shrink-0" />
              <div className="text-center">
                <p className="text-xs text-gray-400 mb-0.5">To</p>
                <p className="font-semibold text-sm">{plan.toDomain || '—'}</p>
                {plan.toRole && <p className="text-xs text-gray-500">{plan.toRole}</p>}
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-400">Click Edit to set up your pivot.</p>
          )}

          {!editing && plan?.motivation && (
            <div className="rounded-lg bg-gray-50 dark:bg-gray-800/50 p-3">
              <p className="text-xs font-semibold text-gray-400 mb-1">Your pivot narrative</p>
              <p className="text-sm text-gray-700 dark:text-gray-300">{plan.motivation}</p>
            </div>
          )}

          {!editing && plan?.targetCompanies?.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {plan.targetCompanies.map((c) => (
                <span key={c} className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">{c}</span>
              ))}
            </div>
          )}
        </div>

        {/* Skill gaps */}
        <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-sm">Skill gaps</h2>
            {total > 0 && (
              <span className="text-xs text-gray-400">{done}/{total} done</span>
            )}
          </div>
          {total > 0 && (
            <div className="h-1.5 rounded-full bg-gray-100 dark:bg-gray-800">
              <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${(done / total) * 100}%` }} />
            </div>
          )}
          <div className="space-y-2">
            {plan?.skillGaps?.map((g) => (
              <GapItem key={g._id} gap={g} onToggle={toggleGap} onDelete={deleteGap} />
            ))}
          </div>
          <div className="flex gap-2">
            <input
              value={newGap}
              onChange={(e) => setNewGap(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addGap()}
              placeholder="Add a skill gap (e.g. Excel modelling, case frameworks…)"
              className="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
            />
            <button onClick={addGap} className="rounded-lg bg-gray-100 px-3 py-2 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300">
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </Page>
  );
}
