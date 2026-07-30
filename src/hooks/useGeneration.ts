/**
 * useGeneration.ts
 * 
 * Custom hook for handling AI content generation (images and videos).
 * Manages generation state, API calls, and error handling.
 */

import { useEffect, useRef } from 'react';
import { NodeData, NodeType, NodeStatus } from '../types';
import { generateImage, generateVideo } from '../services/generationService';
import { generateLocalImage } from '../services/localModelService';
import { extractVideoLastFrame } from '../utils/videoHelpers';
import { createId } from '../utils/id';
import { composePromptWithCreativeStyle } from '../constants/creativeStyles';
import { composePromptWithCharacter } from '../constants/characterLibrary';
import { composePromptWithCameraMove } from '../constants/cameraMoves';

interface UseGenerationProps {
    nodes: NodeData[];
    updateNode: (id: string, updates: Partial<NodeData>) => void;
}

interface ActiveGeneration {
    controller: AbortController;
    timeoutId: ReturnType<typeof window.setTimeout>;
    token: string;
    abortReason?: 'manual' | 'timeout' | 'replaced';
}

const IMAGE_GENERATION_TIMEOUT_MS = 8 * 60 * 1000;
const VIDEO_GENERATION_TIMEOUT_MS = 25 * 60 * 1000;

export const useGeneration = ({ nodes, updateNode }: UseGenerationProps) => {
    const activeGenerationsRef = useRef<Map<string, ActiveGeneration>>(new Map());

    useEffect(() => {
        return () => {
            activeGenerationsRef.current.forEach(active => {
                window.clearTimeout(active.timeoutId);
                active.abortReason = 'manual';
                active.controller.abort();
            });
            activeGenerationsRef.current.clear();
        };
    }, []);

    // ============================================================================
    // HELPERS
    // ============================================================================

    /**
     * Convert pixel dimensions to closest standard aspect ratio
     */
    const getClosestAspectRatio = (width: number, height: number): string => {
        const ratio = width / height;
        const standardRatios = [
            { label: '1:1', value: 1 },
            { label: '16:9', value: 16 / 9 },
            { label: '9:16', value: 9 / 16 },
            { label: '4:3', value: 4 / 3 },
            { label: '3:4', value: 3 / 4 },
            { label: '3:2', value: 3 / 2 },
            { label: '2:3', value: 2 / 3 },
            { label: '5:4', value: 5 / 4 },
            { label: '4:5', value: 4 / 5 },
            { label: '21:9', value: 21 / 9 }
        ];

        let closest = standardRatios[0];
        let minDiff = Math.abs(ratio - closest.value);

        for (const r of standardRatios) {
            const diff = Math.abs(ratio - r.value);
            if (diff < minDiff) {
                minDiff = diff;
                closest = r;
            }
        }

        return closest.label;
    };

    /**
     * Detect the actual aspect ratio of an image
     * @param imageUrl - URL or base64 of the image
     * @returns Promise with resultAspectRatio (exact) and aspectRatio (closest standard)
     */
    const getImageAspectRatio = (imageUrl: string): Promise<{ resultAspectRatio: string; aspectRatio: string }> => {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                const resultAspectRatio = `${img.naturalWidth}/${img.naturalHeight}`;
                const aspectRatio = getClosestAspectRatio(img.naturalWidth, img.naturalHeight);
                resolve({ resultAspectRatio, aspectRatio });
            };
            img.onerror = () => {
                resolve({ resultAspectRatio: '16/9', aspectRatio: '16:9' });
            };
            img.src = imageUrl;
        });
    };

    const getGenerationTimeoutMs = (node: NodeData) => {
        return node.type === NodeType.VIDEO || node.type === NodeType.LOCAL_VIDEO_MODEL
            ? VIDEO_GENERATION_TIMEOUT_MS
            : IMAGE_GENERATION_TIMEOUT_MS;
    };

    const getTimeoutLabel = (timeoutMs: number) => `${Math.round(timeoutMs / 60000)} minutes`;

    const cleanupActiveGeneration = (id: string, token: string) => {
        const active = activeGenerationsRef.current.get(id);
        if (!active || active.token !== token) return;
        window.clearTimeout(active.timeoutId);
        activeGenerationsRef.current.delete(id);
    };

    const isCurrentGeneration = (id: string, token: string) => {
        return activeGenerationsRef.current.get(id)?.token === token;
    };

    const handleCancelGeneration = (id: string) => {
        const active = activeGenerationsRef.current.get(id);

        if (active) {
            active.abortReason = 'manual';
            active.controller.abort();
            window.clearTimeout(active.timeoutId);
            activeGenerationsRef.current.delete(id);
        }

        updateNode(id, {
            status: NodeStatus.ERROR,
            errorMessage: 'Generation stopped. Click retry to generate again.',
            generationStartTime: undefined
        });
    };

    // ============================================================================
    // GENERATION HANDLER    // ============================================================================

    /**
     * Handles content generation for a node
     * Supports image and video generation with parent node chaining
     * 
     * @param id - ID of the node to generate content for
     */
    const handleGenerate = async (id: string) => {
        const node = nodes.find(n => n.id === id);
        if (!node) return;

        // Get prompts from connected TEXT nodes (if any)
        const getTextNodePrompts = (): string[] => {
            if (!node.parentIds) return [];
            return node.parentIds
                .map(pid => nodes.find(n => n.id === pid))
                .filter(n => n?.type === NodeType.TEXT && n.prompt)
                .map(n => n!.prompt);
        };

        // Combine prompts: TEXT node prompts + node's own prompt, then apply selected presets only for the API call.
        const textNodePrompts = getTextNodePrompts();
        const basePrompt = [...textNodePrompts, node.prompt].filter(Boolean).join('\n\n');
        const characterPrompt = composePromptWithCharacter(basePrompt, node.characterPreset);
        const stylePrompt = composePromptWithCreativeStyle(characterPrompt, node.stylePreset);
        const combinedPrompt = (node.type === NodeType.VIDEO || node.type === NodeType.LOCAL_VIDEO_MODEL)
            ? composePromptWithCameraMove(stylePrompt, node.cameraMovePreset)
            : stylePrompt;

        // Check if prompt is required
        // For Kling frame-to-frame with both start and end frames, prompt is optional
        const isKlingFrameToFrame =
            node.type === NodeType.VIDEO &&
            node.videoModel?.startsWith('kling-') &&
            (node.parentIds && node.parentIds.length >= 2);

        if (!combinedPrompt && !isKlingFrameToFrame) return;

        const existingActive = activeGenerationsRef.current.get(id);
        if (existingActive) {
            existingActive.abortReason = 'replaced';
            existingActive.controller.abort();
            window.clearTimeout(existingActive.timeoutId);
            activeGenerationsRef.current.delete(id);
        }

        const controller = new AbortController();
        const token = createId();
        const generationStartTime = Date.now();
        const timeoutMs = getGenerationTimeoutMs(node);
        const timeoutId = window.setTimeout(() => {
            const active = activeGenerationsRef.current.get(id);
            if (!active || active.token !== token) return;

            active.abortReason = 'timeout';
            active.controller.abort();
            activeGenerationsRef.current.delete(id);
            updateNode(id, {
                status: NodeStatus.ERROR,
                errorMessage: `Generation timed out after ${getTimeoutLabel(timeoutMs)}. Click retry to generate again.`,
                generationStartTime: undefined
            });
        }, timeoutMs);

        activeGenerationsRef.current.set(id, { controller, timeoutId, token });
        updateNode(id, { status: NodeStatus.LOADING, generationStartTime, errorMessage: undefined });

        try {
            if (node.type === NodeType.IMAGE || node.type === NodeType.IMAGE_EDITOR) {
                // Collect ALL parent images for multi-input generation
                const imageBase64s: string[] = [];

                // Get images from all direct parents (excluding TEXT nodes)
                if (node.parentIds && node.parentIds.length > 0) {
                    for (const parentId of node.parentIds) {
                        let currentId: string | undefined = parentId;

                        // Traverse up the chain to find an image source (skip TEXT nodes)
                        while (currentId && imageBase64s.length < 14) { // Gemini 3 Pro limit
                            const parent = nodes.find(n => n.id === currentId);
                            // Skip TEXT nodes - they provide prompts, not images
                            if (parent?.type === NodeType.TEXT) {
                                break;
                            }
                            if (parent?.resultUrl) {
                                imageBase64s.push(parent.resultUrl);
                                break; // Found image for this parent chain
                            } else {
                                // Continue up this chain
                                currentId = parent?.parentIds?.[0];
                            }
                        }
                    }
                }

                // Add character reference URLs from storyboard nodes (for maintaining character consistency)
                if (node.characterReferenceUrls && node.characterReferenceUrls.length > 0) {
                    for (const charUrl of node.characterReferenceUrls) {
                        if (imageBase64s.length < 14) { // Respect Gemini's limit
                            imageBase64s.push(charUrl);
                        }
                    }
                }

                // Generate image with all parent images and character references
                const rawResultUrl = await generateImage({
                    prompt: combinedPrompt,
                    aspectRatio: node.aspectRatio,
                    resolution: node.resolution,
                    imageBase64: imageBase64s.length > 0 ? imageBase64s : undefined,
                    imageModel: node.imageModel || 'gpt-image-2',
                    nodeId: id,
                    signal: controller.signal,
                    // Kling V1.5 reference settings
                    klingReferenceMode: node.klingReferenceMode,
                    klingFaceIntensity: node.klingFaceIntensity,
                    klingSubjectIntensity: node.klingSubjectIntensity
                });

                if (!isCurrentGeneration(id, token)) return;

                // Add cache-busting parameter to force browser to fetch new image
                // (Backend uses nodeId as filename, so URL is the same for regenerated images)
                const resultUrl = `${rawResultUrl}?t=${Date.now()}`;

                // Detect actual image dimensions (for display purposes only)
                const { resultAspectRatio } = await getImageAspectRatio(resultUrl);

                if (!isCurrentGeneration(id, token)) return;

                // Keep user's selected aspectRatio - don't overwrite it with detected ratio
                updateNode(id, {
                    status: NodeStatus.SUCCESS,
                    resultUrl,
                    resultAspectRatio,
                    // Note: aspectRatio is intentionally NOT updated to preserve user's selection
                    errorMessage: undefined
                });


            } else if (node.type === NodeType.LOCAL_IMAGE_MODEL) {
                // --- LOCAL MODEL GENERATION ---
                // Check if model is selected
                if (!node.localModelId && !node.localModelPath) {
                    if (isCurrentGeneration(id, token)) {
                        updateNode(id, {
                            status: NodeStatus.ERROR,
                            errorMessage: 'No local model selected. Please select a model first.',
                            generationStartTime: undefined
                        });
                    }
                    return;
                }

                // Get parent images if any
                const imageBase64s: string[] = [];
                if (node.parentIds && node.parentIds.length > 0) {
                    for (const parentId of node.parentIds) {
                        const parent = nodes.find(n => n.id === parentId);
                        if (parent?.type !== NodeType.TEXT && parent?.resultUrl) {
                            imageBase64s.push(parent.resultUrl);
                        }
                    }
                }

                // Call local generation API
                const result = await generateLocalImage({
                    modelId: node.localModelId,
                    modelPath: node.localModelPath,
                    prompt: combinedPrompt,
                    aspectRatio: node.aspectRatio,
                    resolution: node.resolution || '512'
                });

                if (!isCurrentGeneration(id, token)) return;

                if (result.success && result.resultUrl) {
                    // Add cache-busting parameter
                    const resultUrl = `${result.resultUrl}?t=${Date.now()}`;

                    // Detect actual image dimensions
                    const { resultAspectRatio } = await getImageAspectRatio(resultUrl);

                    if (!isCurrentGeneration(id, token)) return;

                    updateNode(id, {
                        status: NodeStatus.SUCCESS,
                        resultUrl,
                        resultAspectRatio,
                        errorMessage: undefined
                    });
                } else {
                    throw new Error(result.error || 'Local generation failed');
                }

            } else if (node.type === NodeType.VIDEO) {
                // Get first parent image for video generation (start frame)
                let imageBase64: string | undefined;
                let lastFrameBase64: string | undefined;
                let referenceImageBase64s: string[] | undefined;

                // Separate visual parent nodes by media type so reference videos don't get treated as start frames.
                const visualParentIds = node.parentIds?.filter(pid => {
                    const parent = nodes.find(n => n.id === pid);
                    return parent?.type !== NodeType.TEXT;
                }) || [];
                const imageParentIds = visualParentIds.filter(pid => {
                    const parent = nodes.find(n => n.id === pid);
                    return parent?.type !== NodeType.VIDEO;
                });

                // Check for frame-to-frame mode (explicit or auto-detected from 2+ image parents)
                const hasMultipleInputs = imageParentIds.length >= 2;
                const hasExplicitFrameInputs = node.frameInputs && node.frameInputs.length >= 2;
                const isMultiReference = node.videoMode === 'multi-reference';

                // Video reference logic. Kling uses it for motion control; Seedance sends it as reference_video_urls.
                let motionReferenceUrl: string | undefined;
                let isMotionControl = false;
                if (node.videoModel === 'kling-v2-6' || node.videoModel === 'seedance-2-0-mini') {
                    // Find a parent video node that has a result
                    const videoParent = visualParentIds
                        ?.map(pid => nodes.find(n => n.id === pid))
                        .find(n => n?.type === NodeType.VIDEO && n.resultUrl);

                    if (videoParent) {
                        motionReferenceUrl = videoParent.resultUrl;
                        isMotionControl = node.videoModel === 'kling-v2-6';
                    }
                }

                // Only evaluate as frame-to-frame if NOT in motion control mode
                const isFrameToFrame = !isMotionControl && !isMultiReference && (node.videoMode === 'frame-to-frame' || hasMultipleInputs || hasExplicitFrameInputs);

                if (isMultiReference && imageParentIds.length > 0) {
                    referenceImageBase64s = imageParentIds
                        .map(parentId => nodes.find(n => n.id === parentId)?.resultUrl)
                        .filter((url): url is string => Boolean(url))
                        .slice(0, 9);

                    if (referenceImageBase64s.length === 0) {
                        referenceImageBase64s = undefined;
                    }
                } else if (isFrameToFrame && imageParentIds.length >= 2) {
                    // Get start and end frames from frameInputs (if user reordered) or default order
                    const parent1 = nodes.find(n => n.id === imageParentIds[0]);
                    const parent2 = nodes.find(n => n.id === imageParentIds[1]);

                    // Check if user has explicitly set frame order
                    if (node.frameInputs && node.frameInputs.length >= 2) {
                        const startFrameInput = node.frameInputs.find(f => f.order === 'start');
                        const endFrameInput = node.frameInputs.find(f => f.order === 'end');

                        if (startFrameInput) {
                            const startNode = nodes.find(n => n.id === startFrameInput.nodeId);
                            if (startNode?.resultUrl) {
                                imageBase64 = startNode.resultUrl;
                            }
                        }

                        if (endFrameInput) {
                            const endNode = nodes.find(n => n.id === endFrameInput.nodeId);
                            if (endNode?.resultUrl) {
                                lastFrameBase64 = endNode.resultUrl;
                            }
                        }
                    } else {
                        // Default: first parent = start, second parent = end
                        if (parent1?.resultUrl) imageBase64 = parent1.resultUrl;
                        if (parent2?.resultUrl) lastFrameBase64 = parent2.resultUrl;
                    }
                } else if (imageParentIds.length > 0) {
                    // Standard mode or Motion Control: get character reference or first parent image
                    if (isMotionControl) {
                        // For Motion Control, look specifically for an IMAGE parent as character reference
                        const characterParent = visualParentIds
                            ?.map(pid => nodes.find(n => n.id === pid))
                            .find(n => n?.type === NodeType.IMAGE && n.resultUrl);

                        if (characterParent?.resultUrl) {
                            imageBase64 = characterParent.resultUrl;
                        }
                    } else {
                        // Standard mode: get first parent image.
                        const parent = nodes.find(n => n.id === imageParentIds[0]);

                        if (parent?.resultUrl) {
                            imageBase64 = parent.resultUrl;
                        }
                    }
                }

                // Generate video
                const rawResultUrl = await generateVideo({
                    prompt: combinedPrompt,
                    imageBase64,
                    lastFrameBase64,
                    referenceImageBase64s,
                    aspectRatio: node.aspectRatio,
                    resolution: node.resolution,
                    duration: node.videoDuration,
                    videoModel: node.videoModel || 'seedance-2-0-mini',
                    motionReferenceUrl,
                    generateAudio: node.generateAudio, // For Kling 2.6 and Veo 3.1 native audio
                    nodeId: id,
                    signal: controller.signal
                });

                if (!isCurrentGeneration(id, token)) return;

                // Add cache-busting parameter to force browser to fetch new video
                // (Backend uses nodeId as filename, so URL is the same for regenerated videos)
                const resultUrl = `${rawResultUrl}?t=${Date.now()}`;

                // Extract last frame for chaining
                const lastFrame = await extractVideoLastFrame(resultUrl);

                if (!isCurrentGeneration(id, token)) return;

                // Detect video aspect ratio
                let resultAspectRatio: string | undefined;
                let aspectRatio: string | undefined;
                try {
                    const video = document.createElement('video');
                    await new Promise<void>((resolve) => {
                        video.onloadedmetadata = () => {
                            resultAspectRatio = `${video.videoWidth}/${video.videoHeight}`;
                            aspectRatio = getClosestAspectRatio(video.videoWidth, video.videoHeight);
                            resolve();
                        };
                        video.onerror = () => resolve();
                        video.src = resultUrl;
                    });
                } catch (e) {
                    // Ignore errors, use undefined aspect ratio
                }

                if (!isCurrentGeneration(id, token)) return;

                updateNode(id, {
                    status: NodeStatus.SUCCESS,
                    resultUrl,
                    resultAspectRatio,
                    aspectRatio,
                    lastFrame,
                    errorMessage: undefined // Clear any previous error
                });


            }
        } catch (error: any) {
            if (!isCurrentGeneration(id, token)) return;

            const abortReason = activeGenerationsRef.current.get(id)?.abortReason;
            if (error?.name === 'AbortError' || abortReason) {
                return;
            }

            // Handle errors
            const msg = error.toString().toLowerCase();
            let errorMessage = error.message || 'Generation failed';

            if (msg.includes('permission_denied') || msg.includes('403')) {
                errorMessage = 'Permission denied. Check API Key configuration.';
            } else if (msg.includes('unable to process input image') || msg.includes('invalid_argument')) {
                errorMessage = 'Input image incompatible. Veo requires: JPEG format, 16:9 or 9:16 aspect ratio. Try a different image or generate without input.';
            }

            updateNode(id, { status: NodeStatus.ERROR, errorMessage, generationStartTime: undefined });
            console.error('Generation failed:', error);
        } finally {
            cleanupActiveGeneration(id, token);
        }
    };

    // ============================================================================
    // RETURN
    // ============================================================================

    return {
        handleGenerate,
        handleCancelGeneration
    };
};
