import { useEffect, useRef, useState } from 'react';
import Message from './Message';
import ThinkingIndicator from './ThinkingIndicator';
import { visibleMessages, branchAt } from '../../lib/branches';

export default function MessageList({
  messages, userName, phase,
  onCopy, onRegenerate, onContinue, onShare, onExport, onEditMessage, onSwitchBranch,
}) {
  const bottomRef = useRef(null);
  const containerRef = useRef(null);
  const [autoFollow, setAutoFollow] = useState(true);

  const rows = visibleMessages(messages);

  useEffect(() => {
    if (autoFollow) bottomRef.current?.scrollIntoView({ block: 'end' });
  }, [messages, autoFollow]);

  function handleScroll() {
    const el = containerRef.current;
    if (!el) return;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    setAutoFollow(nearBottom);
  }

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      role="log"
      aria-live="polite"
      aria-relevant="additions text"
      className="mx-auto w-full max-w-3xl px-4 py-4 sm:px-6"
    >
      {rows
        .filter(({ message }) => message.status !== 'pending')
        .filter(({ message }) => !(message.role === 'assistant' && message.status === 'done' && !message.content))
        .map(({ message, branchIndex, branchCount }) => (
        <Message
          key={message.id}
          message={message}
          userName={userName}
          onCopy={onCopy}
          onRegenerate={() => onRegenerate?.(message.id)}
          onContinue={() => onContinue?.(message.id)}
          onShare={() => onShare?.(message.id)}
          onExport={() => onExport?.(message.id)}
          onEdit={message.role === 'user' ? (text) => onEditMessage?.(message.id, text) : undefined}
          branchIndex={branchIndex}
          branchCount={branchCount}
          onBranchPrev={() => onSwitchBranch?.(branchAt(messages, message, branchIndex - 1).id)}
          onBranchNext={() => onSwitchBranch?.(branchAt(messages, message, branchIndex + 1).id)}
        />
      ))}
      {phase === 'awaiting-reply' && <ThinkingIndicator />}
      <div ref={bottomRef} className="h-px" />
    </div>
  );
}
