/**
 * useImageNodeHandlers.ts
 * 
 * Handles Image node menu actions.
 * Creates connected nodes when users select these options from the placeholder.
 */

import React from 'react';
import { NodeData, NodeType, NodeStatus } from '../types';
import { createId } from '../utils/id';

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
        const newNodeId = createId();
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
        const newNodeId = createId();
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
     * Handle multiple image references - creates or updates one Video node that
     * uses every selected image as a Seedance reference image.
     */
    const handleImagesToImage = (nodeIds: string[]) => {
        const orderedSelectedNodes = nodeIds
            .map(id => nodes.find(n => n.id === id))
            .filter((node): node is NodeData => Boolean(node));

        const selectedImageNodes = orderedSelectedNodes.filter(
            node => node.type === NodeType.IMAGE && Boolean(node.resultUrl)
        );

        if (selectedImageNodes.length < 2) return;

        const selectedTargetImageNode = orderedSelectedNodes.find(
            node => node.type === NodeType.IMAGE && !node.resultUrl
        );

        if (selectedTargetImageNode) {
            setNodes(prev => prev.map(node => {
                if (node.id !== selectedTargetImageNode.id) return node;

                const existingParentIds = node.parentIds || [];
                const nextParentIds = [
                    ...existingParentIds,
                    ...selectedImageNodes
                        .map(imageNode => imageNode.id)
                        .filter(imageId => imageId !== node.id && !existingParentIds.includes(imageId))
                ];

                return {
                    ...node,
                    parentIds: nextParentIds,
                    imageModel: node.imageModel || 'gpt-image-2',
                    aspectRatio: node.aspectRatio || '9:16',
                    resolution: node.resolution || '1K'
                };
            }));
            setSelectedNodeIds([selectedTargetImageNode.id]);
            return;
        }

        const newNodeId = createId();
        const GAP = 120;
        const NODE_WIDTH = 365;
        const minY = Math.min(...selectedImageNodes.map(node => node.y));
        const maxX = Math.max(...selectedImageNodes.map(node => node.x + NODE_WIDTH));

        const newImageNode: NodeData = {
            id: newNodeId,
            type: NodeType.IMAGE,
            x: maxX + GAP,
            y: minY,
            prompt: '',
            status: NodeStatus.IDLE,
            model: 'Banana Pro',
            imageModel: 'gpt-image-2',
            aspectRatio: '9:16',
            resolution: '1K',
            parentIds: selectedImageNodes.map(node => node.id)
        };

        setNodes(prev => [...prev, newImageNode]);
        setSelectedNodeIds([newNodeId]);
    };

    /**
     * Handle multiple image references - creates or updates one Video node that
     * uses every selected image as a Seedance reference image.
     */
    const handleImagesToVideo = (nodeIds: string[]) => {
        const orderedSelectedNodes = nodeIds
            .map(id => nodes.find(n => n.id === id))
            .filter((node): node is NodeData => Boolean(node));

        const selectedImageNodes = orderedSelectedNodes.filter(
            node => node.type === NodeType.IMAGE && Boolean(node.resultUrl)
        );

        if (selectedImageNodes.length < 2) return;

        const selectedVideoNode = orderedSelectedNodes.find(node => node.type === NodeType.VIDEO);

        if (selectedVideoNode) {
            setNodes(prev => prev.map(node => {
                if (node.id !== selectedVideoNode.id) return node;

                const existingParentIds = node.parentIds || [];
                const nextParentIds = [
                    ...existingParentIds,
                    ...selectedImageNodes
                        .map(imageNode => imageNode.id)
                        .filter(imageId => !existingParentIds.includes(imageId))
                ];

                return {
                    ...node,
                    parentIds: nextParentIds,
                    videoMode: 'multi-reference',
                    frameInputs: undefined
                };
            }));
            setSelectedNodeIds([selectedVideoNode.id]);
            return;
        }

        const newNodeId = createId();
        const GAP = 120;
        const NODE_WIDTH = 365;
        const minY = Math.min(...selectedImageNodes.map(node => node.y));
        const maxX = Math.max(...selectedImageNodes.map(node => node.x + NODE_WIDTH));

        const newVideoNode: NodeData = {
            id: newNodeId,
            type: NodeType.VIDEO,
            x: maxX + GAP,
            y: minY,
            prompt: '',
            status: NodeStatus.IDLE,
            model: 'Banana Pro',
            videoModel: 'seedance-2-0-mini',
            videoMode: 'multi-reference',
            aspectRatio: 'Auto',
            resolution: 'Auto',
            parentIds: selectedImageNodes.map(node => node.id)
        };

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

        const newNodeId = createId();
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
            title: '\u89d2\u8272\u4e09\u89c6\u56fe',
            parentIds: [nodeId]
        };

        setNodes(prev => [...prev, turnaroundNode]);
        setSelectedNodeIds([newNodeId]);
        window.setTimeout(() => onGenerateNode?.(newNodeId), 150);
    };

    return {
        handleImageToImage,
        handleImageToVideo,
        handleImagesToImage,
        handleImagesToVideo,
        handleMakeCharacterTurnaround
    };
};

