// Regenerate/edit never mutate a message — they append a new one with
// `branchOf` pointing at the message it supersedes. This derives the
// "visible" flat list (latest branch only) plus branch position metadata,
// so MessageList never needs to know about the underlying chain structure.

export function visibleMessages(messages) {
  const byId = new Map(messages.map((m) => [m.id, m]));
  const hiddenIds = new Set(messages.filter((m) => m.branchOf).map((m) => m.branchOf));

  // An edited user message hides its own superseded predecessor, which in
  // turn should hide any assistant reply that answered that predecessor —
  // propagate to a fixpoint since chains can be more than one level deep.
  let grew = true;
  while (grew) {
    grew = false;
    for (const m of messages) {
      if (!hiddenIds.has(m.id) && m.parentId && hiddenIds.has(m.parentId)) {
        hiddenIds.add(m.id);
        grew = true;
      }
    }
  }

  return messages
    .filter((m) => !hiddenIds.has(m.id))
    .map((m) => {
      let count = 1;
      let cursor = m;
      while (cursor.branchOf && byId.has(cursor.branchOf)) {
        count += 1;
        cursor = byId.get(cursor.branchOf);
      }
      return { message: m, branchIndex: count, branchCount: count };
    })
    .sort((a, b) => a.message.createdAt - b.message.createdAt);
}

// Walk to a specific branch index within a message's chain (1 = oldest).
export function branchAt(messages, headMessage, targetIndex) {
  const byId = new Map(messages.map((m) => [m.id, m]));
  const chain = [];
  let cursor = headMessage;
  while (cursor) {
    chain.unshift(cursor);
    cursor = cursor.branchOf ? byId.get(cursor.branchOf) : null;
  }
  return chain[targetIndex - 1] || headMessage;
}
