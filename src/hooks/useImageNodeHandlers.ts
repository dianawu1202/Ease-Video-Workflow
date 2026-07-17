/**
 * useImageNodeHandlers.ts
 * 
 * Handles Image node menu actions.
 * Creates connected nodes when users select these options from the placeholder.
 */

import React from 'react';
import { NodeData, NodeType, NodeStatus } from '../types';

// ============================================================================
// TYPES
// ============================================================================

interface UseImageNodeHandlersOptions {
    nodes: NodeData[];
    setNodes: React.Dispatch<React.SetStateAction<NodeData[]>>;
    setSelectedNodeIds: React.Dispatch<React.SetStateAction<string[]>>;
    onGenerateNode?: (nodeId: string) => void; // Callback to trigger generation on a node
}

// ============================================================================
// HOOK
// ============================================================================

export const useImageNodeHandlers = ({
    nodes,
    setNodes,
    setSelectedNodeIds,
    onGenerateNode
}: UseImageNodeHandlersOptions) => {
    /**
     * Handle "Image to Image" - creates a new Image node connected to this Image node
     * The current node becomes the input (parent) for the new Image node
     */
    const handleImageToImage = (nodeId: string) => {
        const imageNode = nodes.find(n => n.id === nodeId);
        if (!imageNode) return;

        // Create Image node to the right
        const newNodeId = crypto.randomUUID();
        const GAP = 100;
        const NODE_WIDTH = 340;

        const newImageNode: NodeData = {
            id: newNodeId,
            type: NodeType.IMAGE,
            x: imageNode.x + NODE_WIDTH + GAP,
            y: imageNode.y,
            prompt: '',
            status: NodeStatus.IDLE,
            model: 'Banana Pro',
            imageModel: 'gpt-image-2',
            aspectRatio: '9:16',
            resolution: '1K',
            parentIds: [nodeId] // Connect to the source image node
        };

        // Add new image node
        setNodes(prev => [...prev, newImageNode]);
        setSelectedNodeIds([newNodeId]);
    };

    /**
     * Handle "Image to Video" - creates a new Video node connected to this Image node
     * The current node becomes the input frame for the new Video node
     */
    const handleImageToVideo = (nodeId: string) => {
        const imageNode = nodes.find(n => n.id === nodeId);
        if (!imageNode) return;

        // Create Video node to the right
        const newNodeId = crypto.randomUUID();
        const GAP = 100;
        const NODE_WIDTH = 340;

        const newVideoNode: NodeData = {
            id: newNodeId,
            type: NodeType.VIDEO,
            x: imageNode.x + NODE_WIDTH + GAP,
            y: imageNode.y,
            prompt: '',
            status: NodeStatus.IDLE,
            model: 'Banana Pro',
            videoModel: 'seedance-2-0-mini',
            aspectRatio: 'Auto',
            resolution: 'Auto',
            parentIds: [nodeId] // Connect to the source image node
        };

        // Add new video node
        setNodes(prev => [...prev, newVideoNode]);
        setSelectedNodeIds([newNodeId]);
    };

    /**
     * Create a character turnaround sheet from the current image.
     * Uses the source image as a visual reference and auto-starts generation.
     */
    const handleMakeCharacterTurnaround = (nodeId: string) => {
        const imageNode = nodes.find(n => n.id === nodeId);
        if (!imageNode?.resultUrl) return;

        const newNodeId = crypto.randomUUID();
        const GAP = 100;
        const NODE_WIDTH = 365;

        const prompt = [
            'Using the connected image as the exact character reference, create a professional character turnaround sheet.',
            'Show the same character in three views: front view, side view, and back view, aligned in one clean layout.',
            'Keep the character identity, outfit, colors, proportions, facial features, and style consistent.',
            'Use a neutral studio background, full body if visible, no extra characters, no labels, no text.'
        ].join(' ');

        const turnaroundNode: NodeData = {
            id: newNodeId,
            type: NodeType.IMAGE,
            x: imageNode.x + NODE_WIDTH + GAP,
            y: imageNode.y,
            prompt,
            status: NodeStatus.IDLE,
            model: 'gpt-image-2',
            imageModel: 'gpt-image-2',
            aspectRatio: '16:9',
            resolution: '1K',
            title: '角色三视图',
            parentIds: [nodeId]
        };

        setNodes(prev => [...prev, turnaroundNode]);
        setSelectedNodeIds([newNodeId]);
        window.setTimeout(() => onGenerateNode?.(newNodeId), 150);
    };

    return {
        handleImageToImage,
        handleImageToVideo,
        handleMakeCharacterTurnaround
    };
};
