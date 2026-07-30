/**
 * useNodeManagement.ts
 * 
 * Custom hook for managing node state and operations.
 * Handles node creation, updates, selection, and deletion.
 */

import { useState } from 'react';
import { NodeData, NodeType, NodeStatus, Viewport } from '../types';
import { createId } from '../utils/id';
import { canCreateConnectorNode, isCreatableNodeType } from '../utils/nodeActionRules';

export const useNodeManagement = () => {
    // ============================================================================
    // STATE
    // ============================================================================

    const [nodes, setNodes] = useState<NodeData[]>([]);
    const [selectedNodeIds, setSelectedNodeIds] = useState<string[]>([]);

    // ============================================================================
    // NODE OPERATIONS
    // ============================================================================

    const getDefaultsForType = (type: NodeType): Partial<NodeData> => {
        if (type === NodeType.IMAGE) {
            return {
                imageModel: 'gpt-image-2',
                aspectRatio: '9:16',
                resolution: '1K'
            };
        }

        if (type === NodeType.VIDEO) {
            return {
                videoModel: 'seedance-2-0-mini',
                videoMode: 'standard',
                aspectRatio: '16:9',
                resolution: '720p',
                videoDuration: 5
            };
        }

        return {
            aspectRatio: 'Auto',
            resolution: 'Auto'
        };
    };

    /**
     * Adds a new node to the canvas
     * @param type - Type of node to create
     * @param x - Screen X coordinate
     * @param y - Screen Y coordinate
     * @param parentId - Optional parent node ID for connections
     * @param viewport - Current viewport for coordinate conversion
     */
    const addNode = (
        type: NodeType,
        x: number,
        y: number,
        parentId: string | undefined,
        viewport: Viewport
    ) => {
        if (!isCreatableNodeType(type)) return null;

        const canvasX = (x - viewport.x) / viewport.zoom;
        const canvasY = (y - viewport.y) / viewport.zoom;

        const newNode: NodeData = {
            id: createId(),
            type,
            x: parentId ? canvasX : canvasX - 170,
            y: parentId ? canvasY : canvasY - 100,
            prompt: '',
            status: NodeStatus.IDLE,
            model: 'Banana Pro',
            parentIds: parentId ? [parentId] : [],
            ...getDefaultsForType(type)
        };

        setNodes(prev => [...prev, newNode]);
        setSelectedNodeIds([newNode.id]);

        return newNode.id;
    };

    /**
     * Updates a node with partial data
     * @param id - Node ID to update
     * @param updates - Partial node data to merge
     */
    const updateNode = (id: string, updates: Partial<NodeData>) => {
        setNodes(prev => prev.map(n => n.id === id ? { ...n, ...updates } : n));
    };

    /**
     * Deletes a node by ID
     * @param id - Node ID to delete
     */
    const deleteNode = (id: string) => {
        setNodes(prev => prev.filter(n => n.id !== id));
        setSelectedNodeIds(prev => prev.filter(nodeId => nodeId !== id));
    };

    /**
     * Deletes multiple nodes by IDs
     * @param ids - Array of node IDs to delete
     */
    const deleteNodes = (ids: string[]) => {
        setNodes(prev => prev.filter(n => !ids.includes(n.id)));
        setSelectedNodeIds([]);
    };

    /**
     * Clears all node selections
     */
    const clearSelection = () => {
        setSelectedNodeIds([]);
    };

    /**
     * Handles node type selection from context menu
     * Creates new node or deletes existing node
     */
    const handleSelectTypeFromMenu = (
        type: NodeType | 'DELETE',
        contextMenu: any,
        viewport: Viewport,
        onCloseMenu: () => void
    ) => {
        // Handle Delete Action
        if (type === 'DELETE') {
            if (contextMenu.sourceNodeId) {
                deleteNode(contextMenu.sourceNodeId);
            }
            onCloseMenu();
            return;
        }

        if (!isCreatableNodeType(type)) {
            onCloseMenu();
            return;
        }

        if (contextMenu.type === 'node-connector' && contextMenu.sourceNodeId) {
            const sourceNode = nodes.find(n => n.id === contextMenu.sourceNodeId);
            if (sourceNode) {
                const direction = contextMenu.connectorSide || 'right';
                if (!canCreateConnectorNode(sourceNode.type, type, direction)) {
                    onCloseMenu();
                    return;
                }

                const newNodeId = createId();
                const GAP = 100;
                const NODE_WIDTH = 340;

                let newNode: NodeData;

                if (direction === 'right') {
                    // Append: Source -> New
                    newNode = {
                        id: newNodeId,
                        type,
                        x: sourceNode.x + NODE_WIDTH + GAP,
                        y: sourceNode.y,
                        prompt: '',
                        status: NodeStatus.IDLE,
                        model: 'Banana Pro',
                        parentIds: contextMenu.sourceNodeId ? [contextMenu.sourceNodeId] : [],
                        ...getDefaultsForType(type)
                    };
                } else {
                    // Prepend: New -> Source
                    newNode = {
                        id: newNodeId,
                        type,
                        x: sourceNode.x - NODE_WIDTH - GAP,
                        y: sourceNode.y,
                        prompt: '',
                        status: NodeStatus.IDLE,
                        model: 'Banana Pro',
                        parentIds: [],
                        ...getDefaultsForType(type)
                    };
                    // Update source to add new node as parent
                    const existingParentIds = sourceNode.parentIds || [];
                    updateNode(contextMenu.sourceNodeId, { parentIds: [...existingParentIds, newNodeId] });
                }

                setNodes(prev => [...prev, newNode]);
                setSelectedNodeIds([newNodeId]);
            }
        } else {
            // Global menu - add at click position
            addNode(type, contextMenu.x, contextMenu.y, undefined, viewport);
        }

        onCloseMenu();
    };

    // ============================================================================
    // RETURN
    // ============================================================================

    return {
        nodes,
        setNodes,
        selectedNodeIds,
        setSelectedNodeIds,
        addNode,
        updateNode,
        deleteNode,
        deleteNodes,
        clearSelection,
        handleSelectTypeFromMenu
    };
};
