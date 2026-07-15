import { useEffect, useRef, useState } from 'react';
import { MessageCircle, X, Send, Trash2, Loader2, Sparkles, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';
import { sendMessage, getChatHistory, clearChat } from '../../api/chat';
import { useAuth } from '../../context/AuthContext';
import ConfirmModal from '../common/ConfirmModal';

const WELCOME = `Hi! I'm DATAD AI — your academic companion.\n\nAsk me anything: study strategies, career advice, resume tips, or just "what should I focus on today?"`;

const PROMPT_CHIPS = [
  'What should I focus on today?',
  'Give me a quick study framework',
  'How do I answer "Tell me about yourself?"',
];

function Bubble({ role, content }) {
  const isUser = role === 'user';
  return (
    <div className={`flex gap-2 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {!isUser && (
        <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900/50">
          <Sparkles className="h-3 w-3 text-indigo-600 dark:text-indigo-400" />
        </span>
      )}
      <div
        className={`max-w-[82%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
          isUser
            ? 'rounded-tr-sm bg-indigo-600 text-white'
            : 'rounded-tl-sm bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100'
        }`}
      >
        {content.split('\n').map((line, i) => (
          <span key={i}>
            {line}
            {i < content.split('\n').length - 1 && <br />}
          </span>
        ))}
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex gap-2">
      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900/50">
        <Sparkles className="h-3 w-3 text-indigo-600 dark:text-indigo-400" />
      </span>
      <div className="flex items-center gap-1 rounded-2xl rounded-tl-sm bg-gray-100 px-4 py-3 dark:bg-gray-800">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="h-1.5 w-1.5 rounded-full bg-gray-400 dark:bg-gray-500"
            style={{ animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite` }}
          />
        ))}
      </div>
    </div>
  );
}

export default function ChatBot() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([{ role: 'assistant', content: WELCOME }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [remaining, setRemaining] = useState(null);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  // Load history on first open. The API also returns the remaining daily quota.
  useEffect(() => {
    if (!open || historyLoaded) return;
    getChatHistory()
      .then((res) => {
        const { messages: msgs, remaining: rem } = res.data;
        if (msgs && msgs.length > 0) setMessages(msgs);
        if (rem !== undefined) setRemaining(rem);
        setHistoryLoaded(true);
      })
      .catch(() => setHistoryLoaded(true));
  }, [open, historyLoaded]);

  // Scroll to bottom whenever messages change or panel opens.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading, open]);

  // Focus input when panel opens.
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 150);
  }, [open]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: text }]);
    setLoading(true);
    try {
      const res = await sendMessage(text);
      setMessages((prev) => [...prev, { role: 'assistant', content: res.data.reply }]);
      setRemaining(res.data.remaining);
    } catch (err) {
      const msg = err.response?.data?.message || 'Something went wrong';
      toast.error(msg);
      setMessages((prev) => [...prev, { role: 'assistant', content: `Sorry, I ran into an issue: ${msg}` }]);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = async () => {
    await clearChat().catch(() => {});
    setMessages([{ role: 'assistant', content: WELCOME }]);
    setRemaining(null);
  };

  const onKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Open DATAD AI chat"
        className="fixed bottom-24 right-4 z-50 flex h-13 w-13 items-center justify-center rounded-full bg-indigo-600 shadow-lg shadow-indigo-500/30 transform hover:scale-105 hover:bg-indigo-700 active:scale-95 lg:bottom-6 print:hidden"
        style={{ height: 52, width: 52 }}
      >
        {open
          ? <ChevronDown className="h-5 w-5 text-white" />
          : <MessageCircle className="h-5 w-5 text-white" />}
      </button>

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-44 right-4 z-50 flex w-[22rem] flex-col overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-2xl shadow-black/10 dark:border-gray-800/80 dark:bg-gray-950 lg:bottom-24 print:hidden"
          style={{ maxHeight: '70vh', minHeight: 400 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-100 bg-indigo-600 px-4 py-3 dark:border-gray-800">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-white/90" />
              <span className="text-sm font-semibold text-white">DATAD AI</span>
              {remaining !== null && (
                <span className="rounded-full bg-white/20 px-1.5 py-0.5 text-[10px] text-white/80">
                  {remaining} left today
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setConfirmClear(true)}
                aria-label="Clear chat"
                className="rounded-lg p-1.5 text-white/70 hover:bg-white/10 hover:text-white"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close chat"
                className="rounded-lg p-1.5 text-white/70 hover:bg-white/10 hover:text-white"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
            {messages.map((m, i) => (
              <Bubble key={i} role={m.role} content={m.content} />
            ))}
            {/* Prompt chips — shown only before first user message */}
            {!messages.some((m) => m.role === 'user') && !loading && (
              <div className="flex flex-wrap gap-2 pt-1">
                {PROMPT_CHIPS.map((chip) => (
                  <button
                    key={chip}
                    onClick={() => { setInput(chip); setTimeout(() => inputRef.current?.focus(), 50); }}
                    className="rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-700 hover:bg-indigo-100 dark:border-indigo-800/60 dark:bg-indigo-900/30 dark:text-indigo-300 dark:hover:bg-indigo-900/50"
                  >
                    {chip}
                  </button>
                ))}
              </div>
            )}
            {loading && <TypingIndicator />}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="border-t border-gray-100 p-3 dark:border-gray-800">
            <div className="flex items-end gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 focus-within:border-indigo-400 dark:border-gray-700 dark:bg-gray-900">
              <textarea
                ref={inputRef}
                rows={1}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKey}
                placeholder="Ask anything…"
                maxLength={2000}
                disabled={loading}
                className="flex-1 resize-none bg-transparent text-sm leading-relaxed text-gray-800 placeholder-gray-400 focus:outline-none dark:text-gray-100"
                style={{ maxHeight: 120 }}
                onInput={(e) => {
                  e.target.style.height = 'auto';
                  e.target.style.height = e.target.scrollHeight + 'px';
                }}
              />
              <button
                onClick={handleSend}
                disabled={loading || !input.trim()}
                aria-label="Send message"
                className="shrink-0 rounded-lg bg-indigo-600 p-1.5 text-white hover:bg-indigo-700 disabled:opacity-40"
              >
                {loading
                  ? <Loader2 className="h-4 w-4 animate-spin" />
                  : <Send className="h-4 w-4" />}
              </button>
            </div>
            <p className="mt-1.5 text-center text-[10px] text-gray-400">
              Shift+Enter for new line · {user?.name?.split(' ')[0]}'s personal AI
            </p>
          </div>
        </div>
      )}

      <ConfirmModal
        open={confirmClear}
        onClose={() => setConfirmClear(false)}
        onConfirm={handleClear}
        title="Clear chat history"
        message="All messages will be permanently deleted."
        danger
        confirmLabel="Clear"
      />

      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
          40% { transform: translateY(-5px); opacity: 1; }
        }
      `}</style>
    </>
  );
}