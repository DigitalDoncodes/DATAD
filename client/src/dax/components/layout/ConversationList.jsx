import ConversationListItem from './ConversationListItem';

function Section({ title, conversations, activeId, onSelect, onPin, onDelete, onRename }) {
  if (!conversations.length) return null;
  return (
    <div className="px-2">
      <p className="px-2.5 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-wide text-[var(--dax-text-faint)]">
        {title}
      </p>
      <div className="space-y-0.5">
        {conversations.map((c) => (
          <ConversationListItem
            key={c.id}
            conversation={c}
            active={c.id === activeId}
            onSelect={onSelect}
            onPin={onPin}
            onDelete={onDelete}
            onRename={onRename}
          />
        ))}
      </div>
    </div>
  );
}

export default function ConversationList({ conversations, activeId, onSelect, onPin, onDelete, onRename }) {
  const pinned = conversations.filter((c) => c.pinned);
  const recent = conversations.filter((c) => !c.pinned);

  if (!conversations.length) {
    return (
      <p className="px-4 py-6 text-center text-xs text-[var(--dax-text-faint)]">
        No conversations yet
      </p>
    );
  }

  const handlers = { onSelect, onPin, onDelete, onRename };
  return (
    <div className="dax-scrollbar flex-1 overflow-y-auto pb-2">
      <Section title="Pinned" conversations={pinned} activeId={activeId} {...handlers} />
      <Section title="Recent" conversations={recent} activeId={activeId} {...handlers} />
    </div>
  );
}
