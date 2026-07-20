const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },

    // Null only for messages written before conversations existed. The import
    // in scripts/migrateConversations.js adopts those into a single "Earlier
    // chats" conversation, after which every message is scoped.
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation',
      default: null,
      index: true,
    },

    role: { type: String, enum: ['user', 'assistant'], required: true },
    content: { type: String, required: true, maxlength: 8000 },
  },
  { timestamps: true }
);

// The history window query: one conversation's messages, newest first.
chatMessageSchema.index({ conversation: 1, createdAt: -1 });

// Kept for the daily-quota count, which is deliberately per-user and
// cross-conversation.
chatMessageSchema.index({ user: 1, createdAt: -1 });

// NOTE: a 30-day TTL index used to live here:
//   chatMessageSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60*60*24*30 });
// It silently deleted server-side history while the localStorage-backed UI
// still listed the conversation, so a month-old chat would open empty with no
// explanation. Now that conversations are durable, user-owned objects, message
// retention is the user's to control via delete — not a background reaper.
//
// Removing the declaration here does NOT drop the index from an existing
// database; Mongo keeps it until dropped explicitly. Run:
//   node server/scripts/migrateConversations.js
// which drops it as part of the migration.

module.exports = mongoose.model('ChatMessage', chatMessageSchema);
