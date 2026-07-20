import { ArrowUp, Square } from 'lucide-react';

export default function SendStopButton({ isBusy, canSend, onSend, onStop }) {
  if (isBusy) {
    return (
      <button
        type="button"
        onClick={onStop}
        aria-label="Stop generating"
        className="
          flex h-9 w-9 items-center justify-center rounded-full
          bg-[var(--dax-text)] text-[var(--dax-bg)] transition-transform active:scale-95
        "
      >
        <Square size={13} fill="currentColor" />
      </button>
    );
  }
  return (
    <button
      type="button"
      onClick={onSend}
      disabled={!canSend}
      aria-label="Send message"
      className="
        flex h-9 w-9 items-center justify-center rounded-full transition-all active:scale-95
        bg-[var(--dax-accent)] text-[var(--dax-accent-contrast)]
        disabled:cursor-not-allowed disabled:opacity-30
      "
    >
      <ArrowUp size={16} strokeWidth={2.4} />
    </button>
  );
}
