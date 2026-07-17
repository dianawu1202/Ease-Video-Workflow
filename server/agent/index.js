/**
 * agent/index.js
 * 
 * Main entry point for the LangGraph chat agent.
 * Exports the compiled graph and utility functions.
 * 
 * NOTE: Currently implemented in JavaScript/LangGraph.js for simplicity.
 * If more advanced agent capabilities are needed (complex tool chains,
 * multi-agent systems, advanced memory), consider migrating to Python
 * LangGraph which has a more mature and feature-rich ecosystem.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { HumanMessage, AIMessage } from "@langchain/core/messages";
import { generateKieGpt55Chat } from "../services/kie.js";
import { CHAT_AGENT_SYSTEM_PROMPT, TOPIC_GENERATION_PROMPT } from "./prompts/system.js";

// ============================================================================
// FILE PATHS
// ============================================================================

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CHATS_DIR = path.join(__dirname, '..', '..', 'library', 'chats');
const IMAGES_DIR = path.join(__dirname, '..', '..', 'library', 'images');

// Ensure chats directory exists
if (!fs.existsSync(CHATS_DIR)) {
    fs.mkdirSync(CHATS_DIR, { recursive: true });
}

/**
 * Resolve an image URL or base64 to a base64 data URL
 * Handles both file paths (/library/images/...) and data URLs
 */
function resolveImageToBase64(imageInput) {
    if (!imageInput) return null;

    // Already a base64 data URL
    if (imageInput.startsWith('data:')) {
        return imageInput;
    }

    // Handle full URL or path
    let cleanPath = imageInput;
    try {
        if (imageInput.startsWith('http')) {
            const u = new URL(imageInput);
            cleanPath = u.pathname;
        }
    } catch (e) {
        // invalid url, treat as path
    }

    // Decode URI components (e.g., %20 -> space)
    cleanPath = decodeURIComponent(cleanPath);

    // File URL - read from disk
    if (cleanPath.startsWith('/library/images/')) {
        const filename = cleanPath.replace('/library/images/', '');
        const filePath = path.join(IMAGES_DIR, filename);
        if (fs.existsSync(filePath)) {
            const buffer = fs.readFileSync(filePath);
            const ext = path.extname(filename).toLowerCase();
            const mimeType = ext === '.png' ? 'image/png' : 'image/jpeg';
            return `data:${mimeType};base64,${buffer.toString('base64')}`;
        }
    }

    // Return as-is if unknown format
    return imageInput;
}

// ============================================================================
// SESSION MANAGEMENT (FILE-BASED)
// ============================================================================

/**
 * In-memory cache for active sessions
 * Sessions are also persisted to disk after each message
 */
const sessionCache = new Map();

/**
 * Convert multimodal content to text representation for serialization
 * This ensures context is preserved without huge base64 data
 */
function contentToText(content) {
    if (typeof content === 'string') {
        return content;
    }

    if (Array.isArray(content)) {
        const parts = [];
        let imageCount = 0;

        for (const part of content) {
            if (part.type === 'text') {
                parts.push(part.text);
            } else if (part.type === 'image_url') {
                imageCount++;
                parts.push(`[IMAGE ${imageCount} ATTACHED]`);
            }
        }

        return parts.join('\n');
    }

    return JSON.stringify(content);
}

function messageRole(message) {
    return message._getType?.() === 'human' ? 'user' : 'assistant';
}

function messagesToConversation(messages) {
    return messages.map(message => ({
        role: messageRole(message),
        content: contentToText(message.content)
    }));
}

function normalizeMediaForModel(media) {
    if (!Array.isArray(media)) return [];

    return media.map(item => {
        if (!item) return null;

        if (item.type === 'image') {
            const resolvedBase64 = resolveImageToBase64(item.base64 || item.url);
            let base64 = resolvedBase64;

            if (base64 && !base64.startsWith('data:') && !base64.startsWith('http') && !base64.startsWith('/')) {
                base64 = `data:image/png;base64,${base64}`;
            }

            return {
                type: 'image',
                url: item.url,
                base64
            };
        }

        return {
            type: item.type,
            url: item.url || item.base64,
            base64: item.base64
        };
    }).filter(Boolean);
}

function buildCanvasContextText(canvasContext) {
    if (!canvasContext) return '';
    if (typeof canvasContext === 'string') return canvasContext;

    const sections = [];
    const totals = canvasContext.totals;
    if (totals) {
        sections.push(`Canvas totals: ${totals.totalNodes || 0} nodes; selected ${totals.selectedNodes || 0}; image ${totals.imageNodes || 0}; video ${totals.videoNodes || 0}; text ${totals.textNodes || 0}.`);
    }

    const selectedNodes = Array.isArray(canvasContext.selectedNodes) ? canvasContext.selectedNodes : [];
    const recentNodes = Array.isArray(canvasContext.recentNodes) ? canvasContext.recentNodes : [];
    const nodesToDescribe = selectedNodes.length ? selectedNodes : recentNodes;

    if (nodesToDescribe.length) {
        const label = selectedNodes.length ? 'Selected nodes' : 'Recent canvas nodes';
        sections.push(`${label}:\n${nodesToDescribe.map(node => {
            const pieces = [
                `- ${node.title || node.type || 'Node'} (${node.type || 'unknown'})`,
                node.status ? `status=${node.status}` : '',
                node.prompt ? `prompt="${String(node.prompt).slice(0, 500)}"` : '',
                node.hasResult ? 'has generated result' : '',
                node.parentIds?.length ? `connected from ${node.parentIds.length} node(s)` : ''
            ].filter(Boolean);
            return pieces.join('; ');
        }).join('\n')}`);
    }

    if (canvasContext.storyContext) {
        sections.push(`Storyboard context: ${String(canvasContext.storyContext).slice(0, 1200)}`);
    }

    return sections.join('\n\n');
}

function sanitizeTopic(topic) {
    return String(topic || '导演助手')
        .replace(/["'`]/g, '')
        .replace(/^#+\s*/g, '')
        .split(/\r?\n/)[0]
        .trim()
        .slice(0, 40) || '导演助手';
}

function cleanDirectorResponse(text) {
    return String(text || '')
        .replace(/```(?:\w+)?\s*/g, '')
        .replace(/```/g, '')
        .replace(/^\s{0,3}#{1,6}\s+/gm, '')
        .replace(/^\s{0,3}[-*]\s+\*\*(.+?)\*\*[:：]?\s*/gm, '$1：')
        .trim();
}

async function generateKieTopicTitle(messages, apiKey) {
    const conversation = messagesToConversation(messages).slice(0, 6);
    const topic = await generateKieGpt55Chat({
        conversation,
        apiKey,
        model: 'gpt-5-5',
        reasoningEffort: 'low',
        systemPrompt: TOPIC_GENERATION_PROMPT
    });

    return sanitizeTopic(topic);
}

/**
 * Convert LangChain messages to serializable format
 * Multimodal messages are converted to text with [IMAGE ATTACHED] markers
 */
function serializeMessages(messages) {
    return messages.map(msg => ({
        role: msg._getType?.() === 'human' ? 'user' : 'assistant',
        content: contentToText(msg.content),
        media: msg.additional_kwargs?.media,
        timestamp: new Date().toISOString()
    }));
}

/**
 * Convert serialized messages back to LangChain format
 * All messages are now stored as text (images converted to markers)
 */
function deserializeMessages(messages) {
    return messages.map(msg => {
        if (msg.role === 'user') {
            const message = new HumanMessage(msg.content);
            if (msg.media) {
                message.additional_kwargs = { media: msg.media };
            }
            return message;
        } else {
            return new AIMessage(msg.content);
        }
    });
}

/**
 * Get the file path for a session
 */
function getSessionPath(sessionId) {
    return path.join(CHATS_DIR, `${sessionId}.json`);
}

/**
 * Save a session to disk
 */
function saveSession(sessionId, session) {
    const filePath = getSessionPath(sessionId);
    const data = {
        id: sessionId,
        topic: session.topic,
        createdAt: session.createdAt,
        updatedAt: new Date().toISOString(),
        messages: serializeMessages(session.messages)
    };
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

/**
 * Load a session from disk
 */
function loadSession(sessionId) {
    const filePath = getSessionPath(sessionId);
    if (!fs.existsSync(filePath)) {
        return null;
    }

    try {
        const content = fs.readFileSync(filePath, 'utf8');
        const data = JSON.parse(content);
        return {
            messages: deserializeMessages(data.messages),
            topic: data.topic,
            createdAt: new Date(data.createdAt)
        };
    } catch (err) {
        console.error(`Failed to load session ${sessionId}:`, err);
        return null;
    }
}

/**
 * Get or create a chat session
 * @param {string} sessionId - Unique session identifier
 * @returns {object} Session object
 */
export function getSession(sessionId) {
    // Check cache first
    if (sessionCache.has(sessionId)) {
        return sessionCache.get(sessionId);
    }

    // Try to load from disk
    const loaded = loadSession(sessionId);
    if (loaded) {
        sessionCache.set(sessionId, loaded);
        return loaded;
    }

    // Create new session
    const newSession = {
        messages: [],
        topic: null,
        createdAt: new Date(),
    };
    sessionCache.set(sessionId, newSession);
    return newSession;
}

/**
 * Delete a chat session
 * @param {string} sessionId - Session to delete
 * @returns {boolean} Whether session existed and was deleted
 */
export function deleteSession(sessionId) {
    sessionCache.delete(sessionId);

    const filePath = getSessionPath(sessionId);
    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        return true;
    }
    return false;
}

/**
 * List all sessions from disk (for chat history)
 * @returns {Array} Array of session summaries
 */
export function listSessions() {
    if (!fs.existsSync(CHATS_DIR)) {
        return [];
    }

    const files = fs.readdirSync(CHATS_DIR).filter(f => f.endsWith('.json'));
    const sessions = [];

    for (const file of files) {
        try {
            const filePath = path.join(CHATS_DIR, file);
            const content = fs.readFileSync(filePath, 'utf8');
            const data = JSON.parse(content);
            sessions.push({
                id: data.id,
                topic: data.topic || "New Chat",
                createdAt: data.createdAt,
                updatedAt: data.updatedAt,
                messageCount: data.messages?.length || 0
            });
        } catch (err) {
            console.error(`Failed to read session file ${file}:`, err);
        }
    }

    // Sort by most recent first
    return sessions.sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt));
}

/**
 * Get full session data (for loading a specific chat)
 * @param {string} sessionId - Session ID
 * @returns {object|null} Full session data with messages
 */
export function getSessionData(sessionId) {
    const filePath = getSessionPath(sessionId);
    if (!fs.existsSync(filePath)) {
        return null;
    }

    try {
        const content = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(content);
    } catch (err) {
        console.error(`Failed to load session data ${sessionId}:`, err);
        return null;
    }
}

// ============================================================================
// CHAT FUNCTIONS
// ============================================================================

/**
 * Send a message to the chat agent and get a response
 * @param {string} sessionId - Session identifier
 * @param {string} content - User message content
 * @param {Array} media - Optional media attachments [{ type, url, base64 }, ...]
 * @param {string} apiKey - KIE API key
 * @param {object} canvasContext - Optional compact canvas state
 * @returns {Promise<object>} { response: string, topic?: string }
 */
export async function sendMessage(sessionId, content, media, apiKey, canvasContext) {
    const session = getSession(sessionId);

    // Debug: Log session state
    console.log(`[Chat] Session ${sessionId} has ${session.messages.length} existing messages`);

    // Add user message to session
    const hasMedia = media && Array.isArray(media) && media.length > 0;
    const messageContent = content || (hasMedia ? '请结合这些参考素材给我创作建议。' : '');
    const userMessage = new HumanMessage(messageContent);

    // Attach metadata for persistence (excluding base64 to save space)
    if (hasMedia) {
        userMessage.additional_kwargs = {
            ...userMessage.additional_kwargs,
            media: media.map(m => {
                // If base64 field contains a URL, preserve it as url
                let url = m.url;
                const b64 = m.base64;
                if (!url && b64 && !b64.startsWith('data:')) {
                    url = b64;
                }
                return { ...m, url, base64: undefined };
            })
        };
    }

    session.messages.push(userMessage);

    console.log(`[Chat] Sending ${session.messages.length} messages to KIE GPT-5.5`);

    const responseText = cleanDirectorResponse(await generateKieGpt55Chat({
        conversation: messagesToConversation(session.messages),
        media: normalizeMediaForModel(media),
        canvasContext: buildCanvasContextText(canvasContext),
        systemPrompt: CHAT_AGENT_SYSTEM_PROMPT,
        apiKey,
        model: 'gpt-5-5',
        reasoningEffort: 'medium'
    }));

    const aiResponse = new AIMessage(responseText);
    session.messages.push(aiResponse);

    // Generate topic if this is the first exchange (2 messages: user + AI)
    let topic = session.topic;
    if (session.messages.length === 2 && !session.topic) {
        try {
            topic = await generateKieTopicTitle(session.messages, apiKey);
            session.topic = topic;
        } catch (err) {
            console.error("Failed to generate topic:", err);
            topic = "导演助手";
        }
    }

    // Save session to disk after each message
    saveSession(sessionId, session);

    return {
        response: responseText,
        topic: topic,
        messageCount: session.messages.length,
    };
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
    getSession,
    deleteSession,
    listSessions,
    getSessionData,
    sendMessage,
};
