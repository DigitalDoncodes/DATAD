import { SCHEMA_VERSION, STORAGE_KEYS } from '../constants';

function safeGet(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function safeSet(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

function safeRemove(key) {
  try {
    localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

function migrate() {
  const version = safeGet(STORAGE_KEYS.schemaVersion());
  if (version === SCHEMA_VERSION) return;
  safeSet(STORAGE_KEYS.schemaVersion(), SCHEMA_VERSION);
}

migrate();

export const storage = {
  readIndex(uid) {
    return safeGet(STORAGE_KEYS.index(uid)) || [];
  },
  writeIndex(uid, list) {
    safeSet(STORAGE_KEYS.index(uid), list);
  },
  readConversation(uid, id) {
    return safeGet(STORAGE_KEYS.conversation(uid, id));
  },
  writeConversation(uid, conversation) {
    safeSet(STORAGE_KEYS.conversation(uid, conversation.id), conversation);
  },
  deleteConversation(uid, id) {
    safeRemove(STORAGE_KEYS.conversation(uid, id));
  },
  readFolders(uid) {
    return safeGet(STORAGE_KEYS.folders(uid)) || [];
  },
  writeFolders(uid, folders) {
    safeSet(STORAGE_KEYS.folders(uid), folders);
  },
  readActiveId(uid) {
    return safeGet(STORAGE_KEYS.activeId(uid));
  },
  writeActiveId(uid, id) {
    safeSet(STORAGE_KEYS.activeId(uid), id);
  },
  readUiPrefs() {
    return safeGet(STORAGE_KEYS.uiPrefs) || { sidebarCollapsed: false };
  },
  writeUiPrefs(prefs) {
    safeSet(STORAGE_KEYS.uiPrefs, prefs);
  },
  clearAll(uid) {
    const prefix = uid ? `dax:${uid}:` : 'dax:';
    const toRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(prefix)) toRemove.push(key);
    }
    toRemove.forEach((k) => localStorage.removeItem(k));
  },
  onExternalChange(callback) {
    const handler = (e) => {
      if (!e.key) return;
      if (
        e.key.startsWith('dax:')
      ) {
        callback(e);
      }
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  },
};
