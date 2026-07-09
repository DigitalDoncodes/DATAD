import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Plus, Trash2 } from 'lucide-react';
import Modal from '../common/Modal';
import { setMarket } from '../../api/intelligence';

const DEFAULTS = [
  { label: 'Nifty 50', value: '', change: '' },
  { label: 'Sensex', value: '', change: '' },
  { label: 'Gold (10g)', value: '', change: '' },
  { label: 'USD / INR', value: '', change: '' },
  { label: 'Crude Oil', value: '', change: '' },
];

const inputClass =
  'w-full rounded-lg border border-gray-300 bg-transparent px-2 py-1.5 text-sm focus:border-indigo-500 focus:outline-none dark:border-gray-700';

export default function MarketEditor({ open, onClose, current, onSaved }) {
  const [rows, setRows] = useState(DEFAULTS);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setRows(current?.length ? current.map((c) => ({ ...c })) : DEFAULTS);
  }, [open, current]);

  const update = (i, key, val) => setRows((r) => r.map((row, idx) => (idx === i ? { ...row, [key]: val } : row)));
  const addRow = () => setRows((r) => [...r, { label: '', value: '', change: '' }]);
  const removeRow = (i) => setRows((r) => r.filter((_, idx) => idx !== i));

  const save = async () => {
    setSaving(true);
    try {
      const indicators = rows
        .map((r) => ({ label: r.label.trim(), value: r.value.trim(), change: (r.change || '').trim() }))
        .filter((r) => r.label && r.value);
      await setMarket(indicators);
      toast.success('Market snapshot updated');
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Update market snapshot">
      <div className="space-y-2">
        <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 text-xs font-medium text-gray-400">
          <span>Label</span>
          <span>Value</span>
          <span>Change</span>
          <span />
        </div>
        {rows.map((row, i) => (
          <div key={i} className="grid grid-cols-[1fr_1fr_1fr_auto] items-center gap-2">
            <input value={row.label} onChange={(e) => update(i, 'label', e.target.value)} placeholder="Nifty 50" aria-label="Label" className={inputClass} />
            <input value={row.value} onChange={(e) => update(i, 'value', e.target.value)} placeholder="24,010" aria-label="Value" className={inputClass} />
            <input value={row.change || ''} onChange={(e) => update(i, 'change', e.target.value)} placeholder="+0.8%" aria-label="Change" className={inputClass} />
            <button onClick={() => removeRow(i)} aria-label="Remove row" className="rounded p-1 text-gray-400 hover:text-red-500">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
        <button onClick={addRow} className="flex items-center gap-1 text-sm font-medium text-indigo-600 hover:underline dark:text-indigo-400">
          <Plus className="h-4 w-4" /> Add indicator
        </button>
        <p className="text-xs text-gray-400">Tip: a change starting with “-” shows red, otherwise green.</p>
        <button
          onClick={save}
          disabled={saving}
          className="mt-2 w-full rounded-lg bg-indigo-600 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save snapshot'}
        </button>
      </div>
    </Modal>
  );
}
