export const SCHEMA_VERSION = 1;

export function userNamespace(uid) {
  return uid ? `dax:${uid}` : 'dax';
}

export const STORAGE_KEYS = {
  schemaVersion: (uid) => `${userNamespace(uid)}:schema-version`,
  index: (uid) => `${userNamespace(uid)}:conversations:index`,
  conversation: (uid, id) => `${userNamespace(uid)}:conversation:${id}`,
  folders: (uid) => `${userNamespace(uid)}:folders`,
  activeId: (uid) => `${userNamespace(uid)}:active-conversation-id`,
  uiPrefs: 'dax:ui-prefs',
};

export const MESSAGE_STATUS = {
  pending: 'pending',
  streaming: 'streaming',
  done: 'done',
  error: 'error',
};

export const DAX_CONTINUE_INTENT = '__DAX_CONTINUE__';

export const MAX_MESSAGE_LENGTH = 2000;

export const TEXT_ATTACHMENT_MAX_BYTES = 50 * 1024;

export const TEXT_LIKE_EXTENSIONS = [
  'txt', 'md', 'markdown', 'json', 'js', 'jsx', 'ts', 'tsx', 'css', 'html',
  'py', 'java', 'c', 'cpp', 'cs', 'go', 'rb', 'php', 'sh', 'yml', 'yaml', 'csv',
];

// UI-only placeholders — no backend wiring exists for any of these yet.
export const CAPABILITY_CHIPS = [
  { id: 'deep-research', label: 'Deep Research' },
  { id: 'canvas', label: 'Canvas' },
  { id: 'code', label: 'Code' },
  { id: 'reasoning', label: 'Reasoning' },
  { id: 'vision', label: 'Vision' },
  { id: 'image-gen', label: 'Image Generation' },
  { id: 'documents', label: 'Documents' },
  { id: 'web-search', label: 'Web Search' },
  { id: 'memory', label: 'Memory' },
  { id: 'voice', label: 'Voice' },
  { id: 'automation', label: 'Automation' },
  { id: 'plugins', label: 'Plugins' },
];
