const Expense = require('../../models/Expense');

module.exports = {
  id: 'finance',
  label: 'Finance',
  priority: 75,

  async search(query, userId) {
    const q = query.toLowerCase();
    const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    const expenses = await Expense.find({ user: userId })
      .select('kind category source amount note date month')
      .sort({ date: -1 })
      .limit(100)
      .lean();

    const results = [];
    const seenCategories = new Set();

    for (const e of expenses) {
      const note = (e.note || '').toLowerCase();
      const category = (e.category || '').toLowerCase();
      const source = (e.source || '').toLowerCase();
      const kind = (e.kind || '').toLowerCase();

      let matchType = null;
      if (note.includes(q)) matchType = 'content';
      else if (category.includes(q)) matchType = 'category';
      else if (source.includes(q)) matchType = 'source';

      if (matchType) {
        results.push({
          id: `expense-${e._id}`,
          title: e.note || `${e.category || e.source || 'Transaction'}`,
          subtitle: `${e.kind === 'income' ? '+' : '-'}₹${Math.abs(e.amount).toLocaleString('en-IN')} · ${e.date?.slice(0, 10) || ''}`,
          url: '/finance',
          icon: e.kind === 'income' ? 'TrendingUp' : 'TrendingDown',
          tags: [e.category, e.source, e.kind, e.month].filter(Boolean),
          matchType,
        });
      }

      if (category && !seenCategories.has(category)) {
        seenCategories.add(category);
        if (category.includes(q)) {
          const total = expenses
            .filter((ex) => (ex.category || '').toLowerCase() === category)
            .reduce((s, ex) => s + ex.amount, 0);
          results.push({
            id: `cat-${category}`,
            title: category.charAt(0).toUpperCase() + category.slice(1),
            subtitle: `₹${total.toLocaleString('en-IN')} total spent`,
            url: '/finance',
            icon: 'Tags',
            tags: [category, 'category'],
            matchType: 'tag',
          });
        }
      }
    }

    return results.slice(0, 8);
  },
};
