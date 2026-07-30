/**
 * kie.js
 *
 * Kie Market API adapter.
 * Keeps KIE_API_KEY server-side only and supports GPT Image 2, Gemini text, and video models.
 */

const KIE_API_BASE_URL = process.env.KIE_API_BASE_URL || 'https://api.kie.ai';
const KIE_UPLOAD_URL = process.env.KIE_UPLOAD_URL || 'https://kieai.redpandaai.co/api/file-stream-upload';

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

function assertApiKey(apiKey) {
    if (!apiKey) {
        throw new Error('KIE_API_KEY not configured. Add KIE_API_KEY to .env');
    }
}

function parseDataUrl(dataUrl) {
    if (!dataUrl || typeof dataUrl !== 'string' || !dataUrl.startsWith('data:')) {
        throw new Error('Kie reference upload requires a base64 data URL');
    }

    const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
    if (!match) {
        throw new Error('Invalid base64 data URL for Kie upload');
    }

    const mimeType = match[1];
    const buffer = Buffer.from(match[2], 'base64');
    const extensionMap = {
        'image/png': 'png',
        'image/jpeg': 'jpg',
        'image/jpg': 'jpg',
        'image/webp': 'webp',
        'video/mp4': 'mp4',
        'video/webm': 'webm'
    };

    return {
        buffer,
        mimeType,
        extension: extensionMap[mimeType] || 'bin'
    };
}

function extractUrlFromUploadResponse(json) {
    const candidates = [
        typeof json?.data === 'string' ? json.data : null,
        json?.data?.downloadUrl,
        json?.data?.url,
        json?.data?.fileUrl,
        json?.downloadUrl,
        json?.url,
        json?.fileUrl
    ].filter(Boolean);

    if (!candidates.length) {
        throw new Error(`Kie file upload did not return a URL: ${JSON.stringify(json).slice(0, 500)}`);
    }

    return candidates[0];
}

async function kieFetch(pathOrUrl, options, apiKey) {
    assertApiKey(apiKey);

    const url = pathOrUrl.startsWith('http') ? pathOrUrl : `${KIE_API_BASE_URL}${pathOrUrl}`;
    const response = await fetch(url, {
        ...options,
        headers: {
            Authorization: `Bearer ${apiKey}`,
            ...(options.headers || {})
        }
    });

    const text = await response.text();
    let json = null;
    try {
        json = text ? JSON.parse(text) : null;
    } catch {
        // Preserve raw body for useful errors.
    }

    if (!response.ok) {
        const message = json?.msg || json?.message || text || response.statusText;
        throw new Error(`Kie API error (${response.status}): ${message}`);
    }

    return json;
}

async function kieFetchRaw(pathOrUrl, options, apiKey) {
    assertApiKey(apiKey);

    const url = pathOrUrl.startsWith('http') ? pathOrUrl : `${KIE_API_BASE_URL}${pathOrUrl}`;
    const response = await fetch(url, {
        ...options,
        headers: {
            Authorization: `Bearer ${apiKey}`,
            ...(options.headers || {})
        }
    });

    const text = await response.text();
    let json = null;
    try {
        json = text ? JSON.parse(text) : null;
    } catch {
        // Some Gemini endpoints return text/event-stream. Parse that later.
    }

    if (!response.ok) {
        const message = json?.msg || json?.message || json?.error?.message || text || response.statusText;
        throw new Error(`Kie API error (${response.status}): ${message}`);
    }

    return { text, json };
}

async function uploadDataUrlToKie(dataUrl, apiKey, filenamePrefix = 'reference') {
    const { buffer, mimeType, extension } = parseDataUrl(dataUrl);
    const form = new FormData();
    const blob = new Blob([buffer], { type: mimeType });
    const fileName = `${filenamePrefix}_${Date.now()}.${extension}`;
    const uploadPath = mimeType.startsWith('video/') ? 'videos/user-uploads' : 'images/user-uploads';
    form.append('file', blob, fileName);
    form.append('uploadPath', uploadPath);
    form.append('fileName', fileName);

    const json = await kieFetch(KIE_UPLOAD_URL, {
        method: 'POST',
        body: form
    }, apiKey);

    return extractUrlFromUploadResponse(json);
}

async function getDownloadUrl(fileUrl, apiKey) {
    try {
        const json = await kieFetch('/api/v1/common/download-url', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json'
            },
            body: JSON.stringify({ url: fileUrl })
        }, apiKey);

        return (typeof json?.data === 'string' ? json.data : null) ||
            json?.data?.downloadUrl ||
            json?.data?.url ||
            json?.downloadUrl ||
            json?.url ||
            fileUrl;
    } catch (error) {
        console.warn(`[Kie] Failed to convert download URL, using original URL: ${error.message}`);
        return fileUrl;
    }
}

function extractTaskId(json) {
    const taskId = json?.data?.taskId || json?.taskId;
    if (!taskId) {
        throw new Error(`Kie createTask did not return taskId: ${JSON.stringify(json).slice(0, 500)}`);
    }
    return taskId;
}

function parseResultJson(resultJson) {
    if (!resultJson) return null;
    if (typeof resultJson === 'object') return resultJson;
    try {
        return JSON.parse(resultJson);
    } catch {
        return null;
    }
}

function normalizeGeminiPart(part) {
    if (!part) return null;
    if (typeof part === 'string') return { text: part };
    if (part.text) return { text: part.text };
    if (part.inlineData?.data) return {
        inlineData: {
            mimeType: part.inlineData.mimeType,
            data: part.inlineData.data
        }
    };
    if (part.inline_data?.data) return {
        inline_data: {
            mime_type: part.inline_data.mime_type,
            data: part.inline_data.data
        }
    };
    return part;
}

function extractGeminiText(payload) {
    if (!payload) return '';
    if (typeof payload === 'string') return payload;
    if (Array.isArray(payload)) return payload.map(extractGeminiText).join('');

    const candidates = payload.candidates || payload.response?.candidates || [];
    const fromCandidates = candidates
        .flatMap(candidate => candidate?.content?.parts || [])
        .map(part => part?.text || '')
        .join('');

    return fromCandidates ||
        payload.text ||
        payload.outputText ||
        payload.choices?.[0]?.message?.content ||
        '';
}

function extractGeminiTextFromRawResponse({ text, json }) {
    const directText = extractGeminiText(json);
    if (directText) return directText;

    const streamedText = text
        .split(/\r?\n/)
        .map(line => line.trim())
        .filter(line => line.startsWith('data:'))
        .map(line => line.replace(/^data:\s*/, '').trim())
        .filter(line => line && line !== '[DONE]')
        .map(payload => {
            try {
                return extractGeminiText(JSON.parse(payload));
            } catch {
                return '';
            }
        })
        .join('');

    return streamedText || text;
}

function extractGpt55Text(payload) {
    if (!payload) return '';
    if (typeof payload === 'string') return payload;
    if (Array.isArray(payload)) {
        return payload.map(extractGpt55Text).join('');
    }

    if (payload.type === 'response.output_text.delta' && typeof payload.delta === 'string') {
        return payload.delta;
    }

    if (payload.type === 'response.output_text.done' && typeof payload.text === 'string') {
        return payload.text;
    }

    if (payload.response) {
        const nested = extractGpt55Text(payload.response);
        if (nested.trim()) return nested;
    }

    const directCandidates = [
        payload.output_text,
        payload.outputText,
        payload.text,
        payload.message?.content,
        payload.data?.output_text,
        payload.data?.outputText,
        payload.data?.text,
        payload.response?.output_text,
        payload.response?.outputText,
        payload.response?.text,
        payload.choices?.[0]?.message?.content
    ].filter(Boolean);

    for (const candidate of directCandidates) {
        if (typeof candidate === 'string' && candidate.trim()) return candidate;
        if (Array.isArray(candidate)) {
            const nested = candidate.map(extractGpt55Text).join('');
            if (nested.trim()) return nested;
        }
    }

    const output = payload.output || payload.data?.output || payload.response?.output;
    if (Array.isArray(output)) {
        const text = output.map(item => {
            if (typeof item === 'string') return item;
            if (item?.content) return extractGpt55Text(item.content);
            if (item?.text) return item.text;
            return '';
        }).join('');
        if (text.trim()) return text;
    }

    if (Array.isArray(payload.content)) {
        const text = payload.content.map(item => {
            if (typeof item === 'string') return item;
            return item?.text || item?.output_text || item?.input_text || '';
        }).join('');
        if (text.trim()) return text;
    }

    return '';
}

function parseSseJsonEvents(text) {
    if (!text || typeof text !== 'string') return [];

    return text
        .split(/\r?\n\r?\n/)
        .map(block => {
            const data = block
                .split(/\r?\n/)
                .map(line => line.trim())
                .filter(line => line.startsWith('data:'))
                .map(line => line.replace(/^data:\s*/, ''))
                .join('\n')
                .trim();

            if (!data || data === '[DONE]') return null;

            try {
                return JSON.parse(data);
            } catch {
                return null;
            }
        })
        .filter(Boolean);
}

function extractGpt55TextFromRawResponse(raw) {
    const directText = extractGpt55Text(raw?.json).trim();
    if (directText) return directText;

    const events = parseSseJsonEvents(raw?.text);
    let deltaText = '';
    let finalText = '';

    for (const event of events) {
        if (event.type === 'response.output_text.delta' && typeof event.delta === 'string') {
            deltaText += event.delta;
            continue;
        }

        const eventText = extractGpt55Text(event).trim();
        if (!eventText) continue;

        if (
            event.type === 'response.completed' ||
            event.type === 'response.output_text.done' ||
            event.response?.status === 'completed' ||
            event.status === 'completed'
        ) {
            finalText = eventText;
        } else if (!finalText && eventText) {
            finalText = eventText;
        }
    }

    return (finalText || deltaText).trim();
}

async function normalizeGpt55Media(media, apiKey) {
    const normalized = [];
    const mediaItems = Array.isArray(media) ? media : [];

    for (const item of mediaItems) {
        if (!item) continue;

        if (item.type === 'image') {
            let imageUrl = item.base64 || item.url;
            if (!imageUrl) continue;

            if (typeof imageUrl === 'string' && imageUrl.startsWith('data:')) {
                imageUrl = await uploadDataUrlToKie(imageUrl, apiKey, 'gpt_5_5_chat_image');
            } else if (
                typeof imageUrl === 'string' &&
                !imageUrl.startsWith('http') &&
                !imageUrl.startsWith('/library/')
            ) {
                imageUrl = await uploadDataUrlToKie(`data:image/png;base64,${imageUrl}`, apiKey, 'gpt_5_5_chat_image');
            }

            if (typeof imageUrl === 'string' && imageUrl.startsWith('http')) {
                normalized.push({
                    type: 'input_image',
                    image_url: imageUrl
                });
            } else if (item.url) {
                normalized.push({
                    type: 'input_text',
                    text: `[Image reference available on the local canvas: ${item.url}]`
                });
            }
        } else if (item.type === 'video') {
            const videoUrl = item.url || item.base64;
            if (videoUrl) {
                normalized.push({
                    type: 'input_text',
                    text: `[Video reference on the local canvas: ${videoUrl}]`
                });
            }
        }
    }

    return normalized;
}

function formatGpt55Conversation(conversation) {
    const messages = Array.isArray(conversation) ? conversation.slice(-16) : [];
    if (!messages.length) return '';

    return messages
        .map(message => {
            const role = message.role === 'assistant' ? 'Director Assistant' : 'Creator';
            const content = String(message.content || '').trim();
            return content ? `${role}: ${content}` : '';
        })
        .filter(Boolean)
        .join('\n\n');
}

function extractResultUrl(record) {
    const data = record?.data || record;
    const resultJson = parseResultJson(data?.resultJson);
    const response = data?.response || resultJson || {};

    const candidates = [
        response?.resultUrls?.[0],
        response?.resultImageUrl,
        response?.resultVideoUrl,
        resultJson?.resultUrls?.[0],
        data?.resultUrls?.[0],
        data?.resultUrl,
        data?.url
    ].filter(Boolean);

    return candidates[0] || null;
}

async function createTask({ model, input, apiKey }) {
    const json = await kieFetch('/api/v1/jobs/createTask', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json'
        },
        body: JSON.stringify({ model, input })
    }, apiKey);

    return extractTaskId(json);
}

async function waitForTaskResult(taskId, apiKey, options = {}) {
    const timeoutMs = options.timeoutMs || 15 * 60 * 1000;
    const pollMs = options.pollMs || 3500;
    const startedAt = Date.now();

    while (Date.now() - startedAt < timeoutMs) {
        const record = await kieFetch(`/api/v1/jobs/recordInfo?taskId=${encodeURIComponent(taskId)}`, {
            method: 'GET',
            headers: { Accept: 'application/json' }
        }, apiKey);

        const data = record?.data || record;
        const state = String(data?.state || data?.status || '').toLowerCase();
        const successFlag = data?.successFlag;
        const failed = state === 'fail' ||
            state === 'failed' ||
            state === 'generate_failed' ||
            state === 'create_task_failed' ||
            successFlag === 2 ||
            successFlag === 3;

        if (failed) {
            throw new Error(data?.failMsg || data?.errorMessage || data?.msg || 'Kie task failed');
        }

        const resultUrl = extractResultUrl(record);
        if (state === 'success' || state === 'succeeded' || successFlag === 1 || resultUrl) {
            if (resultUrl) return resultUrl;
        }

        await sleep(pollMs);
    }

    throw new Error(`Kie task timed out: ${taskId}`);
}

function mapImageAspectRatio(aspectRatio) {
    const value = aspectRatio || 'auto';
    if (value === 'Auto') return 'auto';
    if (value === '1024x1024') return '1:1';
    if (value === '1536x1024') return '3:2';
    if (value === '1024x1536') return '2:3';
    return value;
}

function mapImageResolution(resolution) {
    if (!resolution || resolution === 'Auto') return null;
    return resolution;
}

function mapVideoAspectRatio(aspectRatio) {
    const value = aspectRatio || '16:9';
    if (value === 'Auto') return '16:9';
    return value;
}

export async function generateKieGeminiText({ parts, apiKey, model = 'gemini-3-5-flash' }) {
    assertApiKey(apiKey);

    const normalizedParts = (Array.isArray(parts) ? parts : [parts])
        .map(normalizeGeminiPart)
        .filter(Boolean);

    const body = {
        stream: true,
        contents: [
            {
                role: 'user',
                parts: normalizedParts
            }
        ],
        generationConfig: {
            thinkingConfig: {
                includeThoughts: false,
                thinkingLevel: 'low'
            }
        }
    };

    console.log(`[Kie] Calling Gemini text model: ${model}`);
    const raw = await kieFetchRaw(`/gemini/v1/models/${model}:streamGenerateContent`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Accept: 'text/event-stream, application/json'
        },
        body: JSON.stringify(body)
    }, apiKey);

    const text = extractGeminiTextFromRawResponse(raw).trim();
    if (!text) {
        throw new Error('Kie Gemini returned an empty response');
    }

    return text;
}

export async function generateKieGpt55Chat({
    conversation,
    media,
    canvasContext,
    systemPrompt,
    apiKey,
    model = 'gpt-5-5',
    reasoningEffort = 'medium'
}) {
    assertApiKey(apiKey);

    const conversationText = formatGpt55Conversation(conversation);
    const promptSections = [
        canvasContext ? `Current canvas context:\n${canvasContext}` : '',
        conversationText ? `Conversation so far:\n${conversationText}` : '',
        'Reply to the creator now. Use Chinese by default unless the creator asks otherwise. Keep the answer practical and directly usable for story, character, storyboard, shot design, image prompts, or video prompts.'
    ].filter(Boolean);

    const content = [
        {
            type: 'input_text',
            text: promptSections.join('\n\n')
        },
        ...await normalizeGpt55Media(media, apiKey)
    ];

    const body = {
        model,
        stream: false,
        instructions: systemPrompt,
        input: [
            {
                role: 'user',
                content
            }
        ],
        reasoning: {
            effort: reasoningEffort
        }
    };

    console.log(`[Kie] Calling GPT-5.5 chat model: ${model}`);
    const raw = await kieFetchRaw('/codex/v1/responses', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Accept: 'text/event-stream, application/json'
        },
        body: JSON.stringify(body)
    }, apiKey);

    const text = extractGpt55TextFromRawResponse(raw);
    if (!text) {
        const rawPreview = raw?.json
            ? Object.keys(raw.json).slice(0, 12).join(', ')
            : String(raw?.text || '').slice(0, 180).replace(/\s+/g, ' ');
        console.warn(`[Kie] GPT-5.5 empty response. Preview: ${rawPreview}`);
        throw new Error('Kie GPT-5.5 did not return usable text. Please retry.');
    }

    return text;
}

export async function generateKieImage({ prompt, imageBase64Array, aspectRatio, resolution, apiKey }) {
    assertApiKey(apiKey);

    const input = {
        prompt,
        aspect_ratio: mapImageAspectRatio(aspectRatio)
    };
    const mappedResolution = mapImageResolution(resolution);
    if (mappedResolution) input.resolution = mappedResolution;

    let model = 'gpt-image-2-text-to-image';

    if (imageBase64Array && imageBase64Array.length > 0) {
        model = 'gpt-image-2-image-to-image';
        input.input_urls = await Promise.all(
            imageBase64Array.map((imageBase64, index) =>
                uploadDataUrlToKie(imageBase64, apiKey, `gpt_image_2_ref_${index + 1}`)
            )
        );
    }

    console.log(`[Kie] Creating GPT Image 2 task (${model})`);
    const taskId = await createTask({ model, input, apiKey });
    console.log(`[Kie] GPT Image 2 task created: ${taskId}`);
    const resultUrl = await waitForTaskResult(taskId, apiKey);
    return await getDownloadUrl(resultUrl, apiKey);
}

export async function generateKieKlingVideo({ prompt, imageBase64, aspectRatio, duration, generateAudio, apiKey }) {
    assertApiKey(apiKey);

    const hasImage = Boolean(imageBase64);
    const model = hasImage ? 'kling-2.6/image-to-video' : 'kling-2.6/text-to-video';
    const input = {
        prompt,
        sound: generateAudio === true,
        duration: String(duration || 5)
    };

    if (hasImage) {
        input.image_urls = [await uploadDataUrlToKie(imageBase64, apiKey, 'kling_2_6_start_frame')];
    } else {
        input.aspect_ratio = mapVideoAspectRatio(aspectRatio);
    }

    console.log(`[Kie] Creating Kling 2.6 task (${model})`);
    const taskId = await createTask({ model, input, apiKey });
    console.log(`[Kie] Kling 2.6 task created: ${taskId}`);
    const resultUrl = await waitForTaskResult(taskId, apiKey, { timeoutMs: 20 * 60 * 1000, pollMs: 5000 });
    return await getDownloadUrl(resultUrl, apiKey);
}

export async function generateKieSeedanceVideo({
    prompt,
    imageBase64,
    lastFrameBase64,
    referenceImageBase64s,
    motionReferenceUrl,
    aspectRatio,
    resolution,
    duration,
    generateAudio,
    apiKey
}) {
    assertApiKey(apiKey);

    const model = 'bytedance/seedance-2-mini';
    const hasFrameInput = Boolean(imageBase64 || lastFrameBase64);
    const referenceImages = Array.isArray(referenceImageBase64s)
        ? referenceImageBase64s.filter(Boolean).slice(0, 9)
        : [];
    const input = {
        prompt,
        generate_audio: generateAudio !== false,
        duration: String(duration || 5),
        aspect_ratio: mapVideoAspectRatio(aspectRatio)
    };

    if (resolution && resolution !== 'Auto') {
        input.resolution = resolution;
    }

    if (imageBase64) {
        input.first_frame_url = await uploadDataUrlToKie(imageBase64, apiKey, 'seedance_2_mini_first_frame');
    }

    if (lastFrameBase64) {
        input.last_frame_url = await uploadDataUrlToKie(lastFrameBase64, apiKey, 'seedance_2_mini_last_frame');
    }

    if (referenceImages.length > 0) {
        input.reference_image_urls = await Promise.all(
            referenceImages.map((referenceImage, index) =>
                uploadDataUrlToKie(referenceImage, apiKey, `seedance_2_mini_reference_image_${index + 1}`)
            )
        );
    }

    // Kie's Seedance reference-video mode is mutually exclusive with first/last frame inputs.
    if (!hasFrameInput && referenceImages.length === 0 && motionReferenceUrl) {
        input.reference_video_urls = [
            await uploadDataUrlToKie(motionReferenceUrl, apiKey, 'seedance_2_mini_reference_video')
        ];
    }

    console.log(`[Kie] Creating Seedance 2.0 Mini task (${model})`);
    const taskId = await createTask({ model, input, apiKey });
    console.log(`[Kie] Seedance 2.0 Mini task created: ${taskId}`);
    const resultUrl = await waitForTaskResult(taskId, apiKey, { timeoutMs: 20 * 60 * 1000, pollMs: 5000 });
    return await getDownloadUrl(resultUrl, apiKey);
}
