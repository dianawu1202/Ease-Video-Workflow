/**
 * VideoCanvasNode.tsx
 *
 * Dedicated canvas rendering for video generation nodes.
 */

import React from 'react';
import { Film, GripVertical, Loader2, Maximize2, Play, Video } from 'lucide-react';
import { NodeData, NodeStatus, NodeType } from '../../types';
import { NodeConnectors } from './NodeConnectors';
import { VideoGenerationPanel } from './VideoGenerationPanel';

interface VideoCanvasNodeProps {
  data: NodeData;
  inputUrl?: string;
  connectedImageNodes?: { id: string; url: string; type?: NodeType }[];
  selected: boolean;
  showControls?: boolean;
  onUpdate: (id: string, updates: Partial<NodeData>) => void;
  onGenerate: (id: string) => void;
  onSelect: (id: string) => void;
  onStartReferencePick?: (id: string) => void;
  isPickingReference?: boolean;
  onNodePointerDown: (e: React.PointerEvent, id: string) => void;
  onContextMenu: (e: React.MouseEvent, id: string) => void;
  onConnectorDown: (e: React.PointerEvent, id: string, side: 'left' | 'right') => void;
  onExpand?: (imageUrl: string) => void;
  onDragStart?: (nodeId: string, hasContent: boolean) => void;
  onDragEnd?: () => void;
  onChangeAngleGenerate?: (nodeId: string) => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  onPostToX?: (nodeId: string, mediaUrl: string, mediaType: 'image' | 'video') => void;
  onPostToTikTok?: (nodeId: string, mediaUrl: string) => void;
  zoom: number;
  canvasTheme?: 'dark' | 'light';
}

export const VideoCanvasNode: React.FC<VideoCanvasNodeProps> = ({
  data,
  inputUrl,
  connectedImageNodes,
  selected,
  showControls = true,
  onUpdate,
  onGenerate,
  onSelect,
  onStartReferencePick,
  isPickingReference = false,
  onNodePointerDown,
  onContextMenu,
  onConnectorDown,
  onExpand,
  onDragStart,
  onDragEnd,
  onChangeAngleGenerate,
  onMouseEnter,
  onMouseLeave,
  onPostToX,
  onPostToTikTok,
  zoom,
  canvasTheme = 'dark'
}) => {
  const [isEditingTitle, setIsEditingTitle] = React.useState(false);
  const [editedTitle, setEditedTitle] = React.useState(data.title || data.type);
  const titleInputRef = React.useRef<HTMLInputElement>(null);

  const isDark = canvasTheme === 'dark';
  const isLoading = data.status === NodeStatus.LOADING;
  const isSuccess = data.status === NodeStatus.SUCCESS;
  const hasVideo = Boolean(data.resultUrl);
  const hasInputPreview = Boolean(inputUrl && !hasVideo);
  const shouldShowControls = selected && showControls && !(data.prompt && data.prompt.startsWith('Extract panel #'));

  const minEffectiveScale = 0.8;
  const effectiveScale = Math.max(zoom, minEffectiveScale);
  const localScale = effectiveScale / zoom;

  React.useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [isEditingTitle]);

  React.useEffect(() => {
    setEditedTitle(data.title || data.type);
  }, [data.title, data.type]);

  React.useEffect(() => {
    if (!isSuccess || !data.resultUrl || data.resultAspectRatio) return;

    const video = document.createElement('video');
    video.onloadedmetadata = () => {
      if (video.videoWidth && video.videoHeight) {
        onUpdate(data.id, { resultAspectRatio: `${video.videoWidth}/${video.videoHeight}` });
      }
    };
    video.src = data.resultUrl;
  }, [isSuccess, data.resultUrl, data.resultAspectRatio, data.id, onUpdate]);

  const handleTitleSave = () => {
    setIsEditingTitle(false);
    const trimmed = editedTitle.trim();

    if (trimmed && trimmed !== data.type) {
      onUpdate(data.id, { title: trimmed });
    } else if (!trimmed) {
      setEditedTitle(data.title || data.type);
    }
  };

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!data.resultUrl) return;

    const filename = `video_${data.id}.mp4`;
    const cleanUrl = data.resultUrl.split('?')[0];

    fetch(cleanUrl, { cache: 'no-store' })
      .then(res => res.blob())
      .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      })
      .catch(() => {
        const link = document.createElement('a');
        link.href = cleanUrl;
        link.download = filename;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      });
  };

  const renderTitle = () => {
    if (isEditingTitle) {
      return (
        <input
          ref={titleInputRef}
          type="text"
          value={editedTitle}
          onChange={(e) => setEditedTitle(e.target.value)}
          onBlur={handleTitleSave}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleTitleSave();
            } else if (e.key === 'Escape') {
              setEditedTitle(data.title || data.type);
              setIsEditingTitle(false);
            }
          }}
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
          className="absolute -top-8 left-0 min-w-32 rounded-md border border-neutral-600 bg-[#1f1f1f] px-2 py-1 text-sm font-medium text-white outline-none"
        />
      );
    }

    return (
      <div
        className={`absolute -top-8 left-0 flex cursor-text items-center gap-1.5 rounded-md px-1.5 py-0.5 text-sm font-medium transition-colors ${selected ? 'text-neutral-200' : 'text-neutral-500'}`}
        onDoubleClick={(e) => {
          e.stopPropagation();
          setIsEditingTitle(true);
        }}
        title="Double-click to edit"
      >
        <Video size={15} />
        <span>{data.title || data.type}</span>
      </div>
    );
  };

  return (
    <div
      className="absolute group/node touch-none pointer-events-auto"
      style={{
        transform: `translate(${data.x}px, ${data.y}px)`,
        transition: 'box-shadow 0.2s',
        zIndex: selected ? 50 : 10,
        transformOrigin: 'top left'
      }}
      onPointerDown={(e) => onNodePointerDown(e, data.id)}
      onContextMenu={(e) => onContextMenu(e, data.id)}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <NodeConnectors nodeId={data.id} onConnectorDown={onConnectorDown} canvasTheme={canvasTheme} />

      <div className="relative group/nodecard">
        {renderTitle()}

        {isSuccess && data.resultUrl && (
          <div
            className="absolute -top-20 left-0 right-0 z-20 flex justify-center opacity-0 transition-opacity group-hover/nodecard:opacity-100"
            style={{
              transform: `scale(${localScale})`,
              transformOrigin: 'bottom center'
            }}
          >
            <div className="flex items-center gap-1 rounded-full border border-neutral-700 bg-neutral-900/95 px-2 py-1.5 shadow-xl backdrop-blur-md">
              <button
                onClick={() => onExpand?.(data.resultUrl!)}
                onPointerDown={(e) => e.stopPropagation()}
                className="rounded-full p-1.5 text-neutral-300 transition-colors hover:bg-neutral-700 hover:text-white"
                title="View full size"
              >
                <Maximize2 size={14} />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onPostToX?.(data.id, data.resultUrl!, 'video'); }}
                onPointerDown={(e) => e.stopPropagation()}
                className="rounded-full p-1.5 text-neutral-300 transition-colors hover:bg-neutral-700 hover:text-white"
                title="Post to X"
              >
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onPostToTikTok?.(data.id, data.resultUrl!); }}
                onPointerDown={(e) => e.stopPropagation()}
                className="rounded-full p-1.5 text-neutral-300 transition-colors hover:bg-neutral-700 hover:text-white"
                title="Post to TikTok"
              >
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
                </svg>
              </button>
              <button
                onClick={handleDownload}
                onPointerDown={(e) => e.stopPropagation()}
                className="rounded-full p-1.5 text-neutral-300 transition-colors hover:bg-neutral-700 hover:text-white"
                title="Download"
              >
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
              </button>
              <div
                draggable
                onPointerDown={(e) => e.stopPropagation()}
                onDragStart={(e) => {
                  e.dataTransfer.setData('application/json', JSON.stringify({
                    nodeId: data.id,
                    url: data.resultUrl,
                    type: 'video'
                  }));
                  e.dataTransfer.effectAllowed = 'copy';
                  onDragStart?.(data.id, true);
                }}
                onDragEnd={() => onDragEnd?.()}
                className="cursor-grab rounded-full bg-cyan-500/80 p-1.5 text-white hover:bg-cyan-400 active:cursor-grabbing"
                title="Drag to chat"
              >
                <GripVertical size={14} />
              </div>
            </div>
          </div>
        )}

        <div
          className={`relative w-[680px] overflow-hidden rounded-2xl border transition-all duration-300 ${isDark ? 'border-neutral-700 bg-[#242424]' : 'border-neutral-300 bg-neutral-100'} ${selected ? 'ring-2 ring-neutral-300/70' : ''}`}
        >
          <div className="relative aspect-video w-full overflow-hidden">
            {hasVideo ? (
              <video src={data.resultUrl} controls loop className="h-full w-full object-cover" />
            ) : hasInputPreview ? (
              <>
                <img src={inputUrl} alt="Input frame" className="h-full w-full object-cover opacity-35 blur-[1px]" />
                <div className="absolute inset-0 bg-black/45" />
              </>
            ) : (
              <div className="absolute inset-0 bg-[#252525]" />
            )}

            {isLoading ? (
              <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/50 backdrop-blur-sm">
                <Loader2 size={42} className="animate-spin text-neutral-200" />
                <span className="mt-3 text-sm font-medium text-neutral-200">Generating video...</span>
              </div>
            ) : !hasVideo ? (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-neutral-500">
                <Play size={64} className="fill-current stroke-none opacity-70" />
              </div>
            ) : null}

            {hasInputPreview && (
              <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-md bg-black/60 px-2 py-1 text-[11px] font-medium text-neutral-200">
                <Film size={12} />
                Input Frame
              </div>
            )}
          </div>
        </div>

        {shouldShowControls && (
          <div className="absolute top-[calc(100%+18px)] left-1/2 z-[100] flex w-[780px] -translate-x-1/2 justify-center">
            <VideoGenerationPanel
              data={data}
              inputUrl={inputUrl}
              isLoading={isLoading}
              connectedImageNodes={connectedImageNodes}
              onUpdate={onUpdate}
              onGenerate={onGenerate}
              onSelect={onSelect}
              onStartReferencePick={onStartReferencePick}
              isPickingReference={isPickingReference}
              zoom={zoom}
              canvasTheme={canvasTheme}
            />
          </div>
        )}
      </div>
    </div>
  );
};
