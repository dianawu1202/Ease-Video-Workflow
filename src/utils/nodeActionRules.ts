import { NodeType } from '../types';

export const CREATABLE_NODE_TYPES: NodeType[] = [
  NodeType.TEXT,
  NodeType.IMAGE,
  NodeType.VIDEO
];

export function isCreatableNodeType(type: NodeType): boolean {
  return CREATABLE_NODE_TYPES.includes(type);
}

export function getConnectorCreatableNodeTypes(
  sourceNodeType?: NodeType,
  connectorSide: 'left' | 'right' = 'right'
): NodeType[] {
  if (!sourceNodeType) return [NodeType.IMAGE, NodeType.VIDEO];

  if (connectorSide === 'left') {
    switch (sourceNodeType) {
      case NodeType.TEXT:
        return [];
      case NodeType.IMAGE:
      case NodeType.IMAGE_EDITOR:
      case NodeType.LOCAL_IMAGE_MODEL:
      case NodeType.CAMERA_ANGLE:
        return [NodeType.TEXT, NodeType.IMAGE];
      case NodeType.VIDEO:
      case NodeType.VIDEO_EDITOR:
      case NodeType.LOCAL_VIDEO_MODEL:
        return [NodeType.TEXT, NodeType.IMAGE, NodeType.VIDEO];
      default:
        return [NodeType.TEXT, NodeType.IMAGE, NodeType.VIDEO];
    }
  }

  switch (sourceNodeType) {
    case NodeType.TEXT:
      return [NodeType.IMAGE, NodeType.VIDEO];
    case NodeType.IMAGE:
    case NodeType.IMAGE_EDITOR:
    case NodeType.LOCAL_IMAGE_MODEL:
    case NodeType.CAMERA_ANGLE:
      return [NodeType.IMAGE, NodeType.VIDEO];
    case NodeType.VIDEO:
    case NodeType.VIDEO_EDITOR:
    case NodeType.LOCAL_VIDEO_MODEL:
      return [NodeType.VIDEO];
    default:
      return [NodeType.IMAGE, NodeType.VIDEO];
  }
}

export function canCreateConnectorNode(
  sourceNodeType: NodeType | undefined,
  newNodeType: NodeType,
  connectorSide: 'left' | 'right' = 'right'
): boolean {
  return getConnectorCreatableNodeTypes(sourceNodeType, connectorSide).includes(newNodeType);
}
