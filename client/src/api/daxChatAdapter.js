import api from './axios';
import { getChatHistory, clearChat } from './dax';
import { DAX_CONTINUE_INTENT } from '../dax/constants';

function composePrompt(text, attachments = []) {
  const parts = [];
  if (text && text !== DAX_CONTINUE_INTENT) parts.push(text);
  if (text === DAX_CONTINUE_INTENT) parts.push('Please continue your previous answer from where you left off.');

  for (const att of attachments) {
    if (att.extractedText) {
      parts.push(`\n\n[Attached file: "${att.name}"]\n\`\`\`\n${att.extractedText}\n\`\`\``);
    } else {
      parts.push(`\n\n[Attached file: "${att.name}" — Dax cannot read this file's contents yet, only the file name.]`);
    }
  }
  return parts.join('');
}

function mapBackendMessage(raw) {
  return {
    id: raw._id || raw.id,
    role: raw.role,
    content: raw.content,
    attachments: [],
    citations: [],
    status: 'done',
    error: null,
    createdAt: raw.createdAt ? new Date(raw.createdAt).getTime() : Date.now(),
    editedAt: null,
    parentId: null,
    branchOf: null,
  };
}

// Real NVIDIA token-by-token streaming over SSE, consumed via axios's fetch
// adapter (same request-shape convention as the existing, previously-unused
// searchStream() in api/search.js) so the axios auth interceptor still
// attaches the bearer token. Returns an AsyncIterable — lib/streaming.js's
// toChunks() passes real iterables through with zero artificial delay, so
// this is a drop-in swap for the previous single-shot sendMessage with no
// changes needed anywhere else in the Dax library.
async function* streamDaxChat(prompt, signal, modelId, conversationId, clientConversationId, onConversationId, onProposal) {
  const res = await api.post(
    '/dax/chat/stream',
    { message: prompt, modelId, conversationId, clientConversationId },
    { responseType: 'stream', adapter: 'fetch', signal }
  );

  // A quota-exceeded (or otherwise pre-stream) error comes back as plain
  // JSON, not SSE — the fetch adapter still resolves res.data as a stream in
  // that case, so detect it via content-type rather than assuming SSE.
  // axios's fetch adapter exposes a native Headers instance (only readable
  // via .get()), not a plain object — bracket access silently returns
  // undefined instead of throwing, so both shapes must be handled.
  const contentType =
    (typeof res.headers?.get === 'function' ? res.headers.get('content-type') : res.headers?.['content-type']) || '';
  if (!contentType.includes('text/event-stream')) {
    const text = await new Response(res.data).text();
    const data = text ? JSON.parse(text) : {};
    if (data._error) throw Object.assign(new Error(data.message), { response: { status: data._error, data } });
    return;
  }

  const reader = res.data.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const frames = buffer.split('\n\n');
    buffer = frames.pop();

    for (const frame of frames) {
      if (!frame.trim()) continue;
      const lines = frame.split('\n');
      const eventLine = lines.find((l) => l.startsWith('event: '));
      const dataLine = lines.find((l) => l.startsWith('data: '));
      if (!eventLine || !dataLine) continue;
      const type = eventLine.slice('event: '.length);
      const data = JSON.parse(dataLine.slice('data: '.length));

      if (type === 'token') yield data.text;
      if (type === 'error') throw new Error(data.message);
      if (type === 'done' && data._error) {
        throw Object.assign(new Error(data.message), { response: { status: data._error, data } });
      }
      // A turn sent without a conversationId (a brand-new local chat) makes
      // the server create the conversation and report its id here. Recording
      // it against the local conversation is what binds the two together, so
      // every following turn in this thread resolves to the same server-side
      // history instead of spawning a new conversation each time.
      // Emitted just before 'done', so a confirmation card attaches to the
      // finished reply rather than appearing mid-sentence.
      if (type === 'proposal' && data.proposal) onProposal?.(data.proposal);
      if (type === 'done' && data.conversationId) {
        onConversationId?.(data.conversationId);
      }
    }
  }
}

export function createDaxChatAdapter() {
  return {
    /**
     * @param {object}   args
     * @param {Function} [args.onConversationLinked] Called as
     *   (localConversationId, serverConversationId) the first time the server
     *   reports the id it assigned to this conversation. The caller is expected
     *   to persist serverId onto its local record — without that, every turn
     *   would start a fresh server-side conversation and history would never
     *   accumulate. Passed per call rather than at construction because the
     *   adapter is built in DaxPage while the conversation store lives in DaxApp.
     */
    sendMessage({ conversation, text, attachments, signal, modelId, onConversationLinked, onProposal }) {
      const prompt = composePrompt(text, attachments);
      return streamDaxChat(
        prompt,
        signal,
        modelId,
        conversation?.serverId,
        // Local id, so a conversation that has never been persisted still starts
        // its own server-side thread instead of appending to the last one.
        conversation?.id,
        (serverId) => {
          if (conversation?.id && serverId !== conversation.serverId) {
            onConversationLinked?.(conversation.id, serverId);
          }
        },
        onProposal
      );
    },
    async loadInitialMessages(conversationId) {
      const { data } = await getChatHistory(conversationId);
      return (data.messages || []).map(mapBackendMessage);
    },
    async clearRemoteHistory() {
      await clearChat();
    },
  };
}
