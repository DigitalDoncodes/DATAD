const SETTINGS_ITEMS = [
  { id: 'settings-profile',     title: 'Profile Settings',      subtitle: 'Name, email, avatar',              url: '/me/settings', icon: 'User',         tags: ['profile', 'name', 'email', 'avatar', 'photo'] },
  { id: 'settings-theme',       title: 'Theme',                 subtitle: 'Light, dark, system',              url: '/me/settings', icon: 'Palette',      tags: ['theme', 'dark', 'light', 'appearance', 'mode'] },
  { id: 'settings-notifications', title: 'Notifications',       subtitle: 'Push, email, preferences',         url: '/me/settings', icon: 'Bell',         tags: ['notification', 'push', 'email', 'alert', 'reminder'] },
  { id: 'settings-privacy',     title: 'Privacy',               subtitle: 'Visibility, data',                 url: '/me/settings', icon: 'Shield',       tags: ['privacy', 'visibility', 'data', 'security'] },
  { id: 'settings-password',    title: 'Change Password',       subtitle: 'Security',                         url: '/me/settings', icon: 'Key',          tags: ['password', 'security', 'login', 'auth'] },
  { id: 'settings-subscription', title: 'Subscription & Billing',subtitle: 'Plan, payment',                   url: '/subscribe',   icon: 'CreditCard',  tags: ['subscription', 'billing', 'plan', 'payment', 'upgrade'] },
  { id: 'settings-goals',       title: 'Learning Goals',        subtitle: 'Academic targets',                 url: '/me/settings', icon: 'Target',       tags: ['goal', 'academic', 'target', 'learning'] },
  { id: 'settings-interests',   title: 'Interests',             subtitle: 'Topics you follow',                url: '/briefing',    icon: 'Heart',       tags: ['interest', 'topic', 'follow'] },
  { id: 'settings-memory',      title: 'Dax Memory',            subtitle: 'What Dax knows about you',         url: null,           icon: 'Brain',       tags: ['memory', 'dax', 'ai', 'context'], action: 'open-memory' },
  { id: 'settings-chat',        title: 'Clear Chat History',    subtitle: 'Delete all conversations',         url: null,           icon: 'Trash2',      tags: ['chat', 'history', 'clear', 'delete'], action: 'clear-chat' },
  { id: 'settings-export',      title: 'Export My Data',        subtitle: 'Download your information',        url: null,           icon: 'Download',    tags: ['export', 'data', 'download', 'gdpr'] },
  { id: 'settings-delete',      title: 'Delete Account',        subtitle: 'Permanently remove everything',    url: null,           icon: 'AlertTriangle', tags: ['delete', 'account', 'remove'], action: 'delete-account' },
];

module.exports = {
  id: 'settings',
  label: 'Settings',
  priority: 45,

  async search(query) {
    const q = query.toLowerCase();

    return SETTINGS_ITEMS
      .map((item) => {
        const title = item.title.toLowerCase();
        const tags = (item.tags || []).join(' ').toLowerCase();

        let matchType = null;
        let score = 0;
        if (title === q) { matchType = 'exact'; score = 100; }
        else if (title.startsWith(q)) { matchType = 'prefix'; score = 60; }
        else if (title.includes(q)) { matchType = 'title'; score = 30; }
        else if (tags.includes(q)) { matchType = 'tag'; score = 15; }

        return { ...item, matchType, _score: score };
      })
      .filter((r) => r._score > 0)
      .sort((a, b) => b._score - a._score)
      .map(({ _score, ...rest }) => rest)
      .slice(0, 6);
  },
};
