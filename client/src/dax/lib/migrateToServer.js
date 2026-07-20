import { storage } from './storage';
import { importConversations } from '../../api/dax';

// Marks that this browser has already handed its local conversations to the
// server. Per-user, because two accounts can share a browser and each has its
// own local store to migrate.
const flagKey = (uid) => `dax:${uid}:migratedToServer`;

/**
 * Uploads conversations that predate server-side conversation storage.
 *
 * Before the server owned conversations, the sidebar lived entirely in
 * localStorage — so a student's whole history was per-browser and invisible to
 * every other device. This lifts that history to the server once.
 *
 * Deliberately non-destructive: the local copy is never deleted. The server
 * import is idempotent on (user, clientId), so a stale local store re-uploading
 * later is a no-op rather than a duplicate, and keeping the local data means a
 * failed or half-finished migration can simply be retried. The flag is only
 * written after the server confirms, so an interrupted run retries next load.
 *
 * @returns {Promise<{migrated: boolean, created?: number, skipped?: number, reason?: string}>}
 */
export async function migrateLocalConversationsToServer(userId) {
  if (!userId) return { migrated: false, reason: 'no user' };

  try {
    if (localStorage.getItem(flagKey(userId))) {
      return { migrated: false, reason: 'already migrated' };
    }
  } catch {
    // localStorage unavailable (private mode, blocked storage) — nothing local
    // to migrate, so treat it as done rather than retrying on every load.
    return { migrated: false, reason: 'storage unavailable' };
  }

  const index = storage.readIndex(userId);
  if (!index.length) {
    // Nothing to move, but still flag it so this doesn't re-check forever.
    try { localStorage.setItem(flagKey(userId), '1'); } catch { /* ignore */ }
    return { migrated: false, reason: 'nothing to migrate' };
  }

  const payload = [];
  for (const entry of index) {
    const conv = storage.readConversation(userId, entry.id);
    if (!conv) continue;
    payload.push({
      id: conv.id,
      title: conv.title || '',
      pinned: Boolean(conv.pinned),
      folderId: conv.folderId || null,
      updatedAt: conv.updatedAt || Date.now(),
      messages: (conv.messages || [])
        // Only completed turns are worth preserving; a message still streaming
        // or left in an error state was never a real exchange.
        .filter((m) => m.status !== 'error' && typeof m.content === 'string' && m.content.trim())
        .map((m) => ({ role: m.role, content: m.content, createdAt: m.createdAt })),
    });
  }

  if (!payload.length) {
    try { localStorage.setItem(flagKey(userId), '1'); } catch { /* ignore */ }
    return { migrated: false, reason: 'nothing to migrate' };
  }

  const { data } = await importConversations(payload);

  // Only now — a throw above leaves the flag unset so the next load retries.
  try { localStorage.setItem(flagKey(userId), '1'); } catch { /* ignore */ }

  return { migrated: true, created: data?.created ?? 0, skipped: data?.skipped ?? 0 };
}
