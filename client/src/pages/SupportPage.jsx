import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import toast from 'react-hot-toast';
import { Copy, Heart, Server, Globe, Wrench } from 'lucide-react';

// Donations go directly to this UPI ID — no gateway, no fees.
const UPI_ID = 'dhatchinamoorthikclas@okhdfcbank';
const PAYEE_NAME = 'MBA Batch Hub';
const PRESETS = [50, 100, 250];

const upiLink = (amount) =>
  `upi://pay?pa=${encodeURIComponent(UPI_ID)}&pn=${encodeURIComponent(PAYEE_NAME)}&cu=INR` +
  (amount ? `&am=${amount}` : '');

export default function SupportPage() {
  const [amount, setAmount] = useState(100);

  const copyId = () => {
    navigator.clipboard.writeText(UPI_ID);
    toast.success('UPI ID copied');
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <div className="mb-6 text-center">
        <Heart className="mx-auto mb-2 h-8 w-8 text-rose-500" />
        <h1 className="text-2xl font-bold">Support the Hub</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          MBA Batch Hub is free for everyone in the batch. If it's useful to you, a small
          contribution helps keep it running.
        </p>
      </div>

      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        {[
          { icon: Globe, label: 'Domain', desc: '~₹800 / year' },
          { icon: Server, label: 'Hosting & database', desc: 'monthly costs' },
          { icon: Wrench, label: 'Maintenance', desc: 'time & updates' },
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

      <div className="rounded-xl border border-gray-200 bg-white p-6 text-center dark:border-gray-800 dark:bg-gray-900">
        <p className="mb-3 text-sm font-medium">Scan with any UPI app</p>
        <div className="mx-auto mb-4 w-fit rounded-lg bg-white p-3 shadow-sm ring-1 ring-gray-200">
          <QRCodeSVG value={upiLink(amount)} size={180} />
        </div>

        <div className="mb-4 flex justify-center gap-2">
          {PRESETS.map((amt) => (
            <button
              key={amt}
              onClick={() => setAmount(amt)}
              className={`rounded-lg px-4 py-2 text-sm font-medium ${
                amount === amt
                  ? 'bg-indigo-600 text-white'
                  : 'border border-gray-300 text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800'
              }`}
            >
              ₹{amt}
            </button>
          ))}
          <button
            onClick={() => setAmount(null)}
            className={`rounded-lg px-4 py-2 text-sm font-medium ${
              amount === null
                ? 'bg-indigo-600 text-white'
                : 'border border-gray-300 text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800'
            }`}
          >
            Any amount
          </button>
        </div>

        <a
          href={upiLink(amount)}
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

      <p className="mt-4 text-center text-xs text-gray-400">
        Every contribution goes directly toward keeping the Hub online. Thank you! 💜
      </p>
    </div>
  );
}
