import { Sparkles } from 'lucide-react';

/**
 * Unified chat bubble — used by both AICoach (dashboard) and ChatBot (global).
 *
 * Props:
 *   role    'user' | 'assistant'
 *   content string — message text (supports \n line breaks)
 */
export default function ChatBubble({ role, content }) {
  const isUser = role === 'user';

  return (
    <div className={`flex gap-2 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {!isUser && (
        <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900/50">
          <Sparkles className="h-3 w-3 text-primary-600 dark:text-primary-400" />
        </span>
      )}
      <div
        className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
          isUser
            ? 'rounded-tr-sm bg-primary-600 text-white'
            : 'rounded-tl-sm bg-gray-50 text-gray-800 dark:bg-gray-700 dark:text-gray-100'
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
