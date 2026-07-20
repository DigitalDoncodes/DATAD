import { Sparkles } from 'lucide-react';

/**
 * Animated typing indicator — three bouncing dots.
 * Used in both AICoach (dashboard) and ChatBot (global).
 */
export default function TypingIndicator() {
  return (
    <div className="flex gap-2">
      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900/50">
        <Sparkles className="h-3 w-3 text-primary-600 dark:text-primary-400" />
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
