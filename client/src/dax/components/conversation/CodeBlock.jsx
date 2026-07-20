import { useState } from 'react';
import { Check, Copy } from 'lucide-react';

export default function CodeBlock({ language, code, isStreaming, children }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard?.writeText(code || '').then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  return (
    <div className="my-1 overflow-hidden rounded-xl border border-[var(--dax-border)]">
      <div className="flex items-center justify-between bg-[var(--dax-surface)] px-3 py-1.5">
        <span className="font-mono text-[11px] text-[var(--dax-text-muted)]">{language || 'text'}</span>
        {!isStreaming && (
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] text-[var(--dax-text-muted)] hover:bg-[var(--dax-surface-hover)]"
          >
            {copied ? <Check size={11} /> : <Copy size={11} />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        )}
      </div>
      <pre className="dax-scrollbar overflow-x-auto bg-[var(--dax-bg)] px-3.5 py-3 font-mono text-[13px] leading-relaxed">
        <code>{children}</code>
      </pre>
    </div>
  );
}
