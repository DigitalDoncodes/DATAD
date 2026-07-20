#!/usr/bin/env node
/**
 * Conversation-model migration.
 *
 * Two jobs, both idempotent — safe to run repeatedly, and safe to run against
 * a database that has already been migrated:
 *
 *   1. Adopt orphaned messages. Every ChatMessage written before conversations
 *      existed has conversation: null. Those are gathered per user into one
 *      "Earlier chats" conversation so no history is stranded — a null-scoped
 *      message is invisible to every query in the new model.
 *
 *   2. Drop the 30-day TTL index on ChatMessage.createdAt. Removing the
 *      declaration from the schema does not drop an index that already exists
 *      in Mongo; it has to be dropped explicitly. Until it is, the reaper keeps
 *      deleting history behind conversations that now claim to own it.
 *
 * Dry run (default) reports what would change without writing:
 *   node server/scripts/migrateConversations.js
 * Apply:
 *   node server/scripts/migrateConversations.js --apply
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');

const APPLY = process.argv.includes('--apply');
const LEGACY_TITLE = 'Earlier chats';

async function dropTtlIndex(ChatMessage) {
  const indexes = await ChatMessage.collection.indexes();
  // The TTL index is the one carrying expireAfterSeconds, whatever its name.
  const ttl = indexes.find((i) => typeof i.expireAfterSeconds === 'number');
  if (!ttl) return { dropped: false, reason: 'no TTL index present' };
  if (!APPLY) return { dropped: false, reason: `would drop "${ttl.name}"` };
  await ChatMessage.collection.dropIndex(ttl.name);
  return { dropped: true, reason: `dropped "${ttl.name}"` };
}

async function adoptOrphans(ChatMessage, Conversation) {
  // Users holding at least one unscoped message.
  const userIds = await ChatMessage.distinct('user', { conversation: null });
  if (!userIds.length) return { users: 0, messages: 0 };

  let messagesAdopted = 0;

  for (const userId of userIds) {
    const count = await ChatMessage.countDocuments({ user: userId, conversation: null });
    if (!count) continue;
    messagesAdopted += count;
    if (!APPLY) continue;

    const newest = await ChatMessage.findOne({ user: userId, conversation: null })
      .sort({ createdAt: -1 })
      .lean();

    // Reuse the legacy bucket if a previous run already made one, so a repeat
    // run adopts into the same conversation instead of creating another.
    let bucket = await Conversation.findOne({ user: userId, clientId: '__legacy__' });
    if (!bucket) {
      bucket = await Conversation.create({
        user: userId,
        clientId: '__legacy__',
        title: LEGACY_TITLE,
        lastMessageAt: newest?.createdAt || new Date(),
        preview: (newest?.content || '').slice(0, 200),
        messageCount: count,
      });
    } else {
      await Conversation.updateOne(
        { _id: bucket._id },
        { $inc: { messageCount: count }, $set: { lastMessageAt: newest?.createdAt || new Date() } }
      );
    }

    await ChatMessage.updateMany(
      { user: userId, conversation: null },
      { $set: { conversation: bucket._id } }
    );
  }

  return { users: userIds.length, messages: messagesAdopted };
}

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI is not set.');
    process.exit(2);
  }

  await mongoose.connect(uri);
  const ChatMessage = require('../models/ChatMessage');
  const Conversation = require('../models/Conversation');

  console.log(APPLY ? '\nAPPLYING migration\n' : '\nDRY RUN — no writes. Re-run with --apply to commit.\n');

  const orphans = await adoptOrphans(ChatMessage, Conversation);
  console.log(`Orphaned messages : ${orphans.messages} across ${orphans.users} user(s)`);
  if (orphans.messages && !APPLY) {
    console.log(`                    would be adopted into a "${LEGACY_TITLE}" conversation per user`);
  }

  const ttl = await dropTtlIndex(ChatMessage);
  console.log(`30-day TTL index  : ${ttl.reason}`);

  const totals = {
    conversations: await Conversation.countDocuments(),
    messages: await ChatMessage.countDocuments(),
    stillOrphaned: await ChatMessage.countDocuments({ conversation: null }),
  };
  console.log(`\nConversations     : ${totals.conversations}`);
  console.log(`Messages          : ${totals.messages}`);
  console.log(`Still unscoped    : ${totals.stillOrphaned}`);

  if (APPLY && totals.stillOrphaned > 0) {
    console.warn('\nSome messages remain unscoped — re-run to adopt them.');
  }

  console.log('');
  await mongoose.disconnect();
}

main().catch(async (err) => {
  console.error(err);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
