/**
 * Shared shape definitions for the Dax library. Plain JS + JSDoc — no TS
 * toolchain in this repo — but every hook/component in dax/ conforms to
 * these shapes.
 *
 * @typedef {Object} Attachment
 * @property {string} id
 * @property {string} name
 * @property {'image'|'pdf'|'doc'|'code'|'sheet'|'other'} type
 * @property {string} mime
 * @property {number} size
 * @property {string} [previewUrl]
 * @property {string} [extractedText]
 * @property {'ready'|'reading'|'error'} status
 *
 * @typedef {Object} Citation
 * @property {string} id
 * @property {string} label
 * @property {string} [url]
 * @property {string} [snippet]
 *
 * @typedef {Object} Message
 * @property {string} id
 * @property {'user'|'assistant'|'system'} role
 * @property {string} content
 * @property {Attachment[]} attachments
 * @property {Citation[]} citations
 * @property {'pending'|'streaming'|'done'|'error'} status
 * @property {string|null} error
 * @property {number} createdAt
 * @property {number|null} editedAt
 * @property {string|null} parentId
 * @property {string|null} branchOf
 *
 * @typedef {Object} Conversation
 * @property {string} id
 * @property {string} title
 * @property {number} createdAt
 * @property {number} updatedAt
 * @property {boolean} pinned
 * @property {string|null} folderId
 * @property {Message[]} messages
 *
 * @typedef {Object} SendMessageArgs
 * @property {Conversation} conversation
 * @property {string} text
 * @property {Attachment[]} attachments
 * @property {AbortSignal} signal
 *
 * @callback SendMessageAdapter
 * @param {SendMessageArgs} args
 * @returns {Promise<string | AsyncIterable<string>>}
 *
 * @typedef {Object} DaxAdapter
 * @property {SendMessageAdapter} sendMessage
 * @property {() => Promise<Message[]>} [loadInitialMessages]
 * @property {() => Promise<void>} [clearRemoteHistory]
 */

export {};
