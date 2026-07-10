import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import toast from 'react-hot-toast';
import { Copy, Heart, Server, Globe, Wrench, CheckCircle2, Circle, CircleDot } from 'lucide-react';

// Contributions go directly to this UPI ID — no gateway, no fees.
const UPI_ID = 'dhatchinamoorthikclas@okhdfcbank';
const PAYEE_NAME = 'DATAD';
const PRESETS = [99, 199, 499];

const ROADMAP = [
  { label: 'Notes, Photos & Planner', status: 'done' },
  { label: 'Finance Tracker & Calculators', status: 'done' },
  { label: 'ATS Resume Builder', status: 'done' },
  { label: 'Hosting & custom domain', status: 'active' },
  { label: 'Placement Hub & Internship Board', status: 'next' },
  { label: 'Community Feed & Student Directory', status: 'next' },
  { label: 'AI Study Tools', status: 'next' },
];

const statusIcon = {
  done: <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600" />,
  active: <CircleDot className="h-4 w-4 shrink-0 text-indigo-500" />,
  next: <Circle className="h-4 w-4 shrink-0 text-gray-300 dark:text-gray-600" />,
};

const upiLink = (amount) =>
  `upi://pay?pa=${encodeURIComponent(UPI_ID)}&pn=${encodeURIComponent(PAYEE_NAME)}&cu=INR` +
  (amount ? `&am=${amount}` : '');

export default function SupportPage() {
  const [amount, setAmount] = useState(199);
  const [custom, setCustom] = useState('');

  const activeAmount = custom ? Number(custom) || null : amount;

  const copyId = () => {
    navigator.clipboard.writeText(UPI_ID);
    toast.success('UPI ID copied');
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <div className="mb-6 text-center">
        <Heart className="mx-auto mb-2 h-8 w-8 text-rose-500" />
        <h1 className="text-2xl font-bold">Support DATAD</h1>
        <p className="mx-auto mt-2 max-w-md text-sm text-gray-500 dark:text-gray-400">
          This platform is independently developed and maintained by a student. Contributions
          help cover hosting, storage, domain renewal, and future feature development.
        </p>
      </div>

      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        {[
          { icon: Globe, label: 'Domain', desc: '~₹2800 / year' },
          { icon: Server, label: 'Hosting & database', desc: 'monthly costs' },
          { icon: Wrench, label: 'Development', desc: 'new features' },
        ].map(({ icon: Icon, label, desc }) => (
          <div
            key={label}
            className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900"
          >
            <Icon className="h-5 w-5 shrink-0 text-indigo-500" />
            <div>
              <p className="text-sm font-medium">{label}</p>
              <p className="text-xs text-gray-400">{desc}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mb-4 rounded-xl border border-gray-200 bg-white p-6 text-center dark:border-gray-800 dark:bg-gray-900">
        <p className="mb-3 text-sm font-medium">Scan with any UPI app</p>
        <div className="mx-auto mb-4 w-fit rounded-lg bg-white p-3 shadow-sm ring-1 ring-gray-200">
          <QRCodeSVG value={upiLink(activeAmount)} size={180} />
        </div>

        <div className="mb-3 flex flex-wrap justify-center gap-2">
          {PRESETS.map((amt) => (
            <button
              key={amt}
              onClick={() => {
                setAmount(amt);
                setCustom('');
              }}
              className={`rounded-lg px-4 py-2 text-sm font-medium ${
                !custom && amount === amt
                  ? 'bg-indigo-600 text-white'
                  : 'border border-gray-300 text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800'
              }`}
            >
              Support ₹{amt}
            </button>
          ))}
        </div>
        <div className="mx-auto mb-4 flex max-w-[220px] items-center gap-2">
          <span className="text-sm text-gray-400">₹</span>
          <input
            type="number"
            min="1"
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            placeholder="Custom amount"
            aria-label="Custom amount"
            className="w-full rounded-lg border border-gray-300 bg-transparent px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:border-gray-700"
          />
        </div>

        <a
          href={upiLink(activeAmount)}
          className="mb-3 inline-block w-full rounded-lg bg-indigo-600 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 sm:hidden"
        >
          Pay with UPI app
        </a>

        <button
          onClick={copyId}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <Copy className="h-4 w-4" /> {UPI_ID}
        </button>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
        <h2 className="mb-3 font-semibold">Where the platform is headed</h2>
        <ul className="space-y-2">
          {ROADMAP.map((item) => (
            <li key={item.label} className="flex items-center gap-2 text-sm">
              {statusIcon[item.status]}
              <span
                className={
                  item.status === 'done'
                    ? 'text-gray-400 line-through'
                    : item.status === 'active'
                      ? 'font-medium'
                      : 'text-gray-500 dark:text-gray-400'
                }
              >
                {item.label}
              </span>
              {item.status === 'active' && (
                <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-medium text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300">
                  in progress
                </span>
              )}
            </li>
          ))}
        </ul>
      </div>

      <p className="mt-4 text-center text-xs text-gray-400">
        Every contribution goes directly toward keeping the platform online. Thank you! 💜
      </p>
    </div>
  );
}
