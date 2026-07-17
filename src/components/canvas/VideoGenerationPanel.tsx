/**
 * VideoGenerationPanel.tsx
 *
 * Prompt and generation controls dedicated to video nodes.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, Clock, Expand, ImagePlus, Languages, Loader2, Monitor, Send, Sparkles, Video as VideoIcon, Zap } from 'lucide-react';
import { NodeData, NodeType } from '../../types';
import { GoogleIcon, HailuoIcon, KlingIcon } from '../icons/BrandIcons';

interface VideoGenerationPanelProps {
  data: NodeData;
  inputUrl?: string;
  isLoading: boolean;
  connectedImageNodes?: { id: string; url: string; type?: NodeType }[];
  onUpdate: (id: string, updates: Partial<NodeData>) => void;
  onGenerate: (id: string) => void;
  onSelect: (id: string) => void;
  onStartReferencePick?: (id: string) => void;
  isPickingReference?: boolean;
  zoom: number;
  canvasTheme?: 'dark' | 'light';
}

type VideoModel = {
  id: string;
  name: string;
  provider: 'bytedance' | 'google' | 'kling' | 'hailuo';
  supportsTextToVideo: boolean;
  supportsImageToVideo: boolean;
  supportsMultiImage: boolean;
  recommended?: boolean;
  durations: number[];
  resolutions: string[];
  aspectRatios: string[];
};

const VIDEO_MODELS: VideoModel[] = [
  { id: 'seedance-2-0-mini', name: 'Seedance 2.0 Mini', provider: 'bytedance', supportsTextToVideo: true, supportsImageToVideo: true, supportsMultiImage: true, recommended: true, durations: [5, 10], resolutions: ['Auto', '720p', '1080p'], aspectRatios: ['16:9', '9:16'] },
  { id: 'veo-3.1', name: 'Veo 3.1', provider: 'google', supportsTextToVideo: true, supportsImageToVideo: true, supportsMultiImage: true, durations: [4, 6, 8], resolutions: ['Auto', '720p', '1080p'], aspectRatios: ['16:9', '9:16'] },
  { id: 'kling-v2-1', name: 'Kling V2.1', provider: 'kling', supportsTextToVideo: true, supportsImageToVideo: true, supportsMultiImage: true, durations: [5, 10], resolutions: ['Auto', '720p', '1080p'], aspectRatios: ['16:9', '9:16'] },
  { id: 'kling-v2-1-master', name: 'Kling V2.1 Master', provider: 'kling', supportsTextToVideo: true, supportsImageToVideo: true, supportsMultiImage: true, durations: [5, 10], resolutions: ['Auto', '720p', '1080p'], aspectRatios: ['16:9', '9:16'] },
  { id: 'kling-v2-5-turbo', name: 'Kling V2.5 Turbo', provider: 'kling', supportsTextToVideo: true, supportsImageToVideo: true, supportsMultiImage: true, durations: [5, 10], resolutions: ['Auto', '720p', '1080p'], aspectRatios: ['16:9', '9:16'] },
  { id: 'kling-v2-6', name: 'Kling 2.6 Motion', provider: 'kling', supportsTextToVideo: true, supportsImageToVideo: true, supportsMultiImage: true, durations: [5, 10], resolutions: ['Auto', '720p', '1080p'], aspectRatios: ['16:9', '9:16'] },
  { id: 'hailuo-2.3', name: 'Hailuo 2.3', provider: 'hailuo', supportsTextToVideo: true, supportsImageToVideo: true, supportsMultiImage: true, durations: [5], resolutions: ['768p', '1080p'], aspectRatios: ['16:9', '9:16'] },
  { id: 'hailuo-2.3-fast', name: 'Hailuo 2.3 Fast', provider: 'hailuo', supportsTextToVideo: false, supportsImageToVideo: true, supportsMultiImage: false, durations: [5], resolutions: ['768p', '1080p'], aspectRatios: ['16:9', '9:16'] },
  { id: 'hailuo-02', name: 'Hailuo 02', provider: 'hailuo', supportsTextToVideo: true, supportsImageToVideo: true, supportsMultiImage: true, durations: [5], resolutions: ['768p', '1080p'], aspectRatios: ['16:9', '9:16'] },
];

const MODE_LABELS = {
  text: '文生视频',
  image: '图生视频'
};

type CameraMovePreset = {
  id: string;
  name: string;
  intent: string;
  prompt: string;
};

const CAMERA_MOVE_PRESETS: CameraMovePreset[] = [
  {
    id: 'locked-off',
    name: '固定镜头',
    intent: '稳定、克制，突出表演与场面调度',
    prompt: 'Camera movement: locked-off tripod shot, perfectly stable framing, no camera shake, cinematic composition, let the subject movement carry the scene.'
  },
  {
    id: 'tracking-follow',
    name: '跟随拍摄',
    intent: '跟随角色行动，增强临场感',
    prompt: 'Camera movement: smooth tracking follow shot, the camera follows behind and slightly beside the subject at walking speed, natural parallax, immersive cinematic motion.'
  },
  {
    id: 'slow-push-in',
    name: '缓慢推进',
    intent: '压近人物情绪，制造专注和张力',
    prompt: 'Camera movement: slow dolly push-in toward the subject, gradually tightening the frame, subtle cinematic tension, shallow depth of field, emotionally focused.'
  },
  {
    id: 'slow-pull-back',
    name: '缓慢拉远',
    intent: '揭示环境，表现孤独、宏大或转折',
    prompt: 'Camera movement: slow dolly pull-back, gradually revealing the surrounding environment around the subject, cinematic scale, controlled and elegant movement.'
  },
  {
    id: 'orbit-left',
    name: '左环绕',
    intent: '展示人物体积与空间关系',
    prompt: 'Camera movement: smooth leftward orbit around the subject, 30 to 60 degree arc, stable gimbal motion, strong parallax between foreground and background.'
  },
  {
    id: 'orbit-right',
    name: '右环绕',
    intent: '制造动势，适合人物展示和产品感镜头',
    prompt: 'Camera movement: smooth rightward orbit around the subject, cinematic gimbal arc, keep the subject centered while the background shifts with rich parallax.'
  },
  {
    id: 'crane-up',
    name: '升镜头',
    intent: '从人物升到场景，制造开阔和史诗感',
    prompt: 'Camera movement: crane up shot, camera rises vertically while keeping the subject in frame, slowly revealing the scale of the location, epic cinematic reveal.'
  },
  {
    id: 'crane-down',
    name: '降镜头',
    intent: '从环境落到角色，建立地点后聚焦人物',
    prompt: 'Camera movement: crane down shot, camera descends from a high establishing angle toward the subject, elegant cinematic reveal, controlled vertical motion.'
  },
  {
    id: 'tilt-up',
    name: '镜头上摇',
    intent: '从低处扫到高处，强调高度、敬畏或登场',
    prompt: 'Camera movement: slow tilt up, starting from the lower body or foreground and tilting upward to reveal the subject and towering environment, dramatic cinematic emphasis.'
  },
  {
    id: 'tilt-down',
    name: '镜头下摇',
    intent: '从天空或建筑落到主体，建立空间压迫感',
    prompt: 'Camera movement: slow tilt down, starting high above the scene and tilting downward to reveal the subject, atmospheric cinematic composition.'
  },
  {
    id: 'pan-left',
    name: '镜头左摇',
    intent: '横向揭示信息，适合空间扫描',
    prompt: 'Camera movement: slow pan left, scanning across the scene with controlled cinematic pacing, revealing new visual information while maintaining stable composition.'
  },
  {
    id: 'pan-right',
    name: '镜头右摇',
    intent: '横向跟随或揭示，适合街景与群像',
    prompt: 'Camera movement: slow pan right, smooth lateral camera rotation, reveal the environment step by step, cinematic pacing and stable horizon.'
  },
  {
    id: 'handheld',
    name: '手持纪实',
    intent: '紧张、真实、新闻感或追逐感',
    prompt: 'Camera movement: subtle handheld camera motion, realistic micro-shake, documentary immediacy, keep the subject readable, cinematic but grounded.'
  },
  {
    id: 'whip-pan',
    name: '快速甩镜',
    intent: '动作转场、突然发现或节奏加速',
    prompt: 'Camera movement: fast whip pan transition, rapid horizontal camera sweep with motion blur, energetic cinematic timing, landing cleanly on the next subject.'
  },
  {
    id: 'dutch-roll',
    name: '倾斜旋转',
    intent: '不安、眩晕、梦境或心理失衡',
    prompt: 'Camera movement: subtle dutch angle roll, slight rotating camera tilt, unsettling cinematic mood, controlled motion without losing subject clarity.'
  },
  {
    id: 'fpv-flythrough',
    name: '穿越飞行',
    intent: '空间穿梭、速度感、沉浸式探索',
    prompt: 'Camera movement: FPV fly-through shot, camera glides forward through the environment with dynamic depth, passing foreground elements, immersive cinematic speed.'
  }
];

const getModelIcon = (model: VideoModel) => {
  if (model.provider === 'bytedance') return <VideoIcon size={14} className="text-pink-300" />;
  if (model.provider === 'google') return <GoogleIcon size={13} className="text-white" />;
  if (model.provider === 'kling') return <KlingIcon size={15} />;
  return <HailuoIcon size={15} />;
};

export const VideoGenerationPanel: React.FC<VideoGenerationPanelProps> = ({
  data,
  inputUrl,
  isLoading,
  connectedImageNodes = [],
  onUpdate,
  onGenerate,
  onSelect,
  onStartReferencePick,
  isPickingReference = false,
  zoom,
  canvasTheme = 'dark'
}) => {
  const isDark = canvasTheme === 'dark';
  const [localPrompt, setLocalPrompt] = useState(data.prompt || '');
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [showResolutionDropdown, setShowResolutionDropdown] = useState(false);
  const [showAspectDropdown, setShowAspectDropdown] = useState(false);
  const [showDurationDropdown, setShowDurationDropdown] = useState(false);
  const [showCameraMoveDropdown, setShowCameraMoveDropdown] = useState(false);
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSentPromptRef = useRef<string | undefined>(data.prompt);
  const modelDropdownRef = useRef<HTMLDivElement>(null);
  const resolutionDropdownRef = useRef<HTMLDivElement>(null);
  const aspectDropdownRef = useRef<HTMLDivElement>(null);
  const durationDropdownRef = useRef<HTMLDivElement>(null);
  const cameraMoveDropdownRef = useRef<HTMLDivElement>(null);

  const minEffectiveScale = 0.8;
  const effectiveScale = Math.max(zoom, minEffectiveScale);
  const localScale = effectiveScale / zoom;

  const connectedVisualInputs = connectedImageNodes.filter(node => node.type !== NodeType.TEXT);
  const hasImageInput = Boolean(inputUrl) || connectedVisualInputs.some(node => node.type !== NodeType.VIDEO);
  const hasVideoInput = connectedVisualInputs.some(node => node.type === NodeType.VIDEO);
  const activeMode = hasImageInput || data.videoMode === 'frame-to-frame' || data.inputUrl ? 'image' : 'text';

  const availableModels = useMemo(() => {
    return VIDEO_MODELS.filter(model => {
      if (activeMode === 'text') return model.supportsTextToVideo;
      if (hasVideoInput && model.id === 'kling-v2-6') return true;
      return model.supportsImageToVideo;
    });
  }, [activeMode, hasVideoInput]);

  const currentModel = availableModels.find(model => model.id === data.videoModel) || availableModels[0] || VIDEO_MODELS[0];
  const currentResolution = data.resolution || currentModel.resolutions[0] || 'Auto';
  const currentAspectRatio = data.aspectRatio || currentModel.aspectRatios[0] || '16:9';
  const currentDuration = data.videoDuration || currentModel.durations[0] || 5;

  useEffect(() => {
    if (data.prompt !== lastSentPromptRef.current) {
      setLocalPrompt(data.prompt || '');
      lastSentPromptRef.current = data.prompt;
    }
  }, [data.prompt]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (modelDropdownRef.current && !modelDropdownRef.current.contains(target)) setShowModelDropdown(false);
      if (resolutionDropdownRef.current && !resolutionDropdownRef.current.contains(target)) setShowResolutionDropdown(false);
      if (aspectDropdownRef.current && !aspectDropdownRef.current.contains(target)) setShowAspectDropdown(false);
      if (durationDropdownRef.current && !durationDropdownRef.current.contains(target)) setShowDurationDropdown(false);
      if (cameraMoveDropdownRef.current && !cameraMoveDropdownRef.current.contains(target)) setShowCameraMoveDropdown(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!availableModels.some(model => model.id === data.videoModel)) {
      onUpdate(data.id, { videoModel: availableModels[0]?.id || VIDEO_MODELS[0].id });
    }
  }, [availableModels, data.id, data.videoModel, onUpdate]);

  useEffect(() => {
    return () => {
      if (updateTimeoutRef.current) clearTimeout(updateTimeoutRef.current);
    };
  }, []);

  const handlePromptChange = (value: string) => {
    setLocalPrompt(value);
    lastSentPromptRef.current = value;

    if (updateTimeoutRef.current) clearTimeout(updateTimeoutRef.current);
    updateTimeoutRef.current = setTimeout(() => {
      onUpdate(data.id, { prompt: value });
    }, 150);
  };

  const flushPrompt = () => {
    if (updateTimeoutRef.current) clearTimeout(updateTimeoutRef.current);
    if (localPrompt !== data.prompt) {
      onUpdate(data.id, { prompt: localPrompt });
    }
  };

  const handleModeChange = (mode: 'text' | 'image') => {
    onUpdate(data.id, {
      videoMode: mode === 'image' ? 'standard' : undefined,
      inputUrl: mode === 'text' ? undefined : data.inputUrl
    });
  };

  const handleModelChange = (model: VideoModel) => {
    const updates: Partial<NodeData> = { videoModel: model.id };
    if (!model.resolutions.includes(currentResolution)) updates.resolution = model.resolutions[0];
    if (!model.aspectRatios.includes(currentAspectRatio)) updates.aspectRatio = model.aspectRatios[0];
    if (!model.durations.includes(currentDuration)) updates.videoDuration = model.durations[0];
    onUpdate(data.id, updates);
    setShowModelDropdown(false);
  };

  const handleGenerate = (e: React.MouseEvent) => {
    e.stopPropagation();
    flushPrompt();
    onGenerate(data.id);
  };

  const applyCameraMovePreset = (preset: CameraMovePreset) => {
    const cameraPrompt = `\n\n[运镜: ${preset.name}]\n${preset.prompt}`;
    const strippedPrompt = localPrompt.replace(/\n\n\[运镜: .*?\]\n.*$/s, '').trimEnd();
    const nextPrompt = `${strippedPrompt}${cameraPrompt}`;

    setLocalPrompt(nextPrompt);
    lastSentPromptRef.current = nextPrompt;
    onUpdate(data.id, { prompt: nextPrompt });
    setShowCameraMoveDropdown(false);
  };

  const panelClassName = isDark
    ? 'border-neutral-800 bg-[#242424] text-white shadow-2xl'
    : 'border-neutral-200 bg-white text-neutral-900 shadow-xl';

  const mutedTextClass = isDark ? 'text-neutral-500' : 'text-neutral-400';
  const buttonClass = isDark
    ? 'border-neutral-700 bg-[#2f2f2f] text-neutral-100 hover:bg-[#3a3a3a]'
    : 'border-neutral-300 bg-white text-neutral-900 hover:bg-neutral-100';
  const dropdownClass = isDark
    ? 'border-neutral-700 bg-[#252525] text-neutral-200'
    : 'border-neutral-200 bg-white text-neutral-800';

  return (
    <div
      className={`w-full rounded-2xl border p-3 transition-colors duration-300 ${panelClassName}`}
      style={{
        transform: `scale(${localScale})`,
        transformOrigin: 'top center',
        transition: 'transform 0.1s ease-out'
      }}
      onPointerDown={(e) => e.stopPropagation()}
      onClick={() => onSelect(data.id)}
    >
      <div className="mb-3 flex items-center justify-between">
        <div className={`flex rounded-xl border p-1 ${isDark ? 'border-neutral-700 bg-[#1d1d1d]' : 'border-neutral-200 bg-neutral-100'}`}>
          {(['text', 'image'] as const).map(mode => (
            <button
              key={mode}
              onClick={() => handleModeChange(mode)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${activeMode === mode
                ? isDark ? 'bg-neutral-100 text-neutral-950' : 'bg-neutral-900 text-white'
                : isDark ? 'text-neutral-500 hover:text-neutral-200' : 'text-neutral-500 hover:text-neutral-900'
                }`}
            >
              {MODE_LABELS[mode]}
            </button>
          ))}
        </div>
        <button
          className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${isDark ? 'text-neutral-500 hover:bg-neutral-700 hover:text-white' : 'text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900'}`}
          title="展开面板"
          onClick={() => onUpdate(data.id, { isPromptExpanded: !data.isPromptExpanded })}
        >
          <Expand size={16} />
        </button>
      </div>

      <textarea
        className={`mb-3 w-full resize-none bg-transparent text-sm leading-6 outline-none ${isDark ? 'text-neutral-100 placeholder-neutral-500' : 'text-neutral-900 placeholder-neutral-400'}`}
        placeholder={activeMode === 'image' ? '描述你想生成的画面内容，可引用画布素材' : '描述你想生成的视频内容，可引用画布素材'}
        rows={data.isPromptExpanded ? 9 : 4}
        value={localPrompt}
        onChange={(e) => handlePromptChange(e.target.value)}
        onBlur={flushPrompt}
        onWheel={(e) => e.stopPropagation()}
      />

      <div className="mb-5 flex min-h-[64px] items-center gap-2">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onStartReferencePick?.(data.id);
          }}
          className={`flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl border border-dashed text-[11px] font-medium transition-colors ${isPickingReference
            ? 'border-blue-400 bg-blue-500/15 text-blue-300'
            : isDark ? 'border-neutral-700 bg-[#1d1d1d] text-neutral-400 hover:border-neutral-500 hover:text-neutral-200' : 'border-neutral-300 bg-neutral-50 text-neutral-500 hover:border-neutral-400 hover:text-neutral-900'
            }`}
          title="从画布选择参考资源"
        >
          <ImagePlus size={18} />
          <span className="mt-1">参考</span>
        </button>

        {connectedVisualInputs.length > 0 ? (
          <div className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto pb-1">
            {connectedVisualInputs.map((node, index) => (
              <div
                key={`${node.id}-${index}`}
                className={`relative h-14 w-20 shrink-0 overflow-hidden rounded-xl border ${isDark ? 'border-neutral-700 bg-neutral-900' : 'border-neutral-200 bg-neutral-100'}`}
                title={node.type === NodeType.VIDEO ? '视频参考' : '图片参考'}
              >
                {node.type === NodeType.VIDEO ? (
                  <video src={node.url} className="h-full w-full object-cover" muted />
                ) : (
                  <img src={node.url} alt="参考素材" className="h-full w-full object-cover" />
                )}
                <span className="absolute bottom-1 left-1 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-medium text-white">
                  {node.type === NodeType.VIDEO ? '视频' : '图片'}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className={`text-xs ${mutedTextClass}`}>
            点击“参考”，再在画布上选择图片或视频资源
          </div>
        )}
      </div>

      {data.errorMessage && (
        <div className="mb-3 rounded-lg border border-red-900/50 bg-red-950/30 px-3 py-2 text-xs text-red-300">
          {data.errorMessage}
        </div>
      )}

      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <div className="relative" ref={modelDropdownRef}>
            <button
              onClick={() => setShowModelDropdown(!showModelDropdown)}
              className={`flex max-w-[220px] items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-colors ${buttonClass}`}
            >
              {getModelIcon(currentModel)}
              <span className="truncate">{currentModel.name}</span>
              {currentModel.recommended && <Sparkles size={12} className="text-amber-300" />}
              <ChevronDown size={12} className="opacity-60" />
            </button>

            {showModelDropdown && (
              <div className={`absolute bottom-full left-0 z-50 mb-2 max-h-72 w-60 overflow-y-auto rounded-xl border py-1 shadow-2xl ${dropdownClass}`}>
                {availableModels.map(model => (
                  <button
                    key={model.id}
                    onClick={() => handleModelChange(model)}
                    className={`flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-xs transition-colors ${isDark ? 'hover:bg-neutral-700' : 'hover:bg-neutral-100'} ${currentModel.id === model.id ? 'text-blue-400' : ''}`}
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      {getModelIcon(model)}
                      <span className="truncate">{model.name}</span>
                      {model.recommended && <span className="rounded bg-amber-500/20 px-1 text-[9px] text-amber-300">REC</span>}
                    </span>
                    {currentModel.id === model.id && <Check size={12} />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative" ref={resolutionDropdownRef}>
            <button
              onClick={() => setShowResolutionDropdown(!showResolutionDropdown)}
              className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors ${buttonClass}`}
            >
              <Monitor size={13} className="text-emerald-400" />
              {currentResolution}
            </button>
            {showResolutionDropdown && (
              <OptionMenu
                options={currentModel.resolutions}
                current={currentResolution}
                label="清晰度"
                onSelect={(value) => {
                  onUpdate(data.id, { resolution: value });
                  setShowResolutionDropdown(false);
                }}
                isDark={isDark}
              />
            )}
          </div>

          <div className="relative" ref={aspectDropdownRef}>
            <button
              onClick={() => setShowAspectDropdown(!showAspectDropdown)}
              className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors ${buttonClass}`}
            >
              <span className="h-3 w-5 rounded-sm border border-current opacity-80" />
              {currentAspectRatio}
            </button>
            {showAspectDropdown && (
              <OptionMenu
                options={currentModel.aspectRatios}
                current={currentAspectRatio}
                label="比例"
                onSelect={(value) => {
                  onUpdate(data.id, { aspectRatio: value });
                  setShowAspectDropdown(false);
                }}
                isDark={isDark}
              />
            )}
          </div>

          <div className="relative" ref={durationDropdownRef}>
            <button
              onClick={() => setShowDurationDropdown(!showDurationDropdown)}
              className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors ${buttonClass}`}
            >
              <Clock size={13} className="text-cyan-400" />
              {currentDuration}s
            </button>
            {showDurationDropdown && (
              <OptionMenu
                options={currentModel.durations.map(String)}
                current={String(currentDuration)}
                label="时长"
                onSelect={(value) => {
                  onUpdate(data.id, { videoDuration: Number(value) });
                  setShowDurationDropdown(false);
                }}
                suffix="s"
                isDark={isDark}
              />
            )}
          </div>

          <div className="relative" ref={cameraMoveDropdownRef}>
            <button
              onClick={() => setShowCameraMoveDropdown(!showCameraMoveDropdown)}
              className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors ${buttonClass}`}
              title="运镜"
            >
              <VideoIcon size={13} className="text-violet-300" />
              运镜
              <ChevronDown size={12} className="opacity-60" />
            </button>

            {showCameraMoveDropdown && (
              <div className={`absolute bottom-full right-0 z-50 mb-2 w-[420px] overflow-hidden rounded-2xl border shadow-2xl ${dropdownClass}`}>
                <div className={`flex items-center justify-between border-b px-4 py-3 ${isDark ? 'border-neutral-700 bg-[#1f1f1f]' : 'border-neutral-200 bg-neutral-100'}`}>
                  <div>
                    <div className="text-sm font-semibold">运镜广场</div>
                    <div className={`mt-0.5 text-xs ${mutedTextClass}`}>选择常见电影镜头运动，自动追加导演提示词</div>
                  </div>
                  <button
                    onClick={() => setShowCameraMoveDropdown(false)}
                    className={`rounded-lg px-2 py-1 text-xs transition-colors ${isDark ? 'text-neutral-400 hover:bg-neutral-700 hover:text-white' : 'text-neutral-500 hover:bg-neutral-200 hover:text-neutral-900'}`}
                  >
                    关闭
                  </button>
                </div>
                <div className="grid max-h-[420px] grid-cols-2 gap-2 overflow-y-auto p-3">
                  {CAMERA_MOVE_PRESETS.map(preset => (
                    <button
                      key={preset.id}
                      onClick={() => applyCameraMovePreset(preset)}
                      className={`rounded-xl border p-3 text-left transition-colors ${isDark ? 'border-neutral-700 bg-[#2b2b2b] hover:border-neutral-500 hover:bg-[#333]' : 'border-neutral-200 bg-white hover:border-neutral-300 hover:bg-neutral-50'}`}
                    >
                      <div className="text-sm font-semibold">{preset.name}</div>
                      <div className={`mt-1 text-xs leading-5 ${mutedTextClass}`}>{preset.intent}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <button
            className={`flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium transition-colors ${isDark ? 'text-neutral-300 hover:bg-neutral-700' : 'text-neutral-600 hover:bg-neutral-100'}`}
            title="翻译提示词"
          >
            <Languages size={15} />
          </button>

          <button
            className={`flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium transition-colors ${isDark ? 'text-neutral-300 hover:bg-neutral-700' : 'text-neutral-600 hover:bg-neutral-100'}`}
            title="生成数量"
          >
            1个
            <ChevronDown size={12} />
          </button>

          <div className={`flex items-center gap-1 text-xs ${mutedTextClass}`} title="预计点数">
            <Zap size={13} />
            75
          </div>

          <button
            onClick={handleGenerate}
            disabled={isLoading}
            className={`flex h-10 w-10 items-center justify-center rounded-full transition-all ${isLoading
              ? 'cursor-not-allowed bg-neutral-700 text-neutral-400'
              : isDark ? 'bg-white text-neutral-950 hover:bg-neutral-200 active:scale-95' : 'bg-neutral-950 text-white hover:bg-neutral-800 active:scale-95'
              }`}
            title="生成"
          >
            {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
          </button>
        </div>
      </div>
    </div>
  );
};

interface OptionMenuProps {
  options: string[];
  current: string;
  label: string;
  suffix?: string;
  isDark: boolean;
  onSelect: (value: string) => void;
}

const OptionMenu: React.FC<OptionMenuProps> = ({ options, current, label, suffix, isDark, onSelect }) => (
  <div className={`absolute bottom-full right-0 z-50 mb-2 w-28 overflow-hidden rounded-xl border shadow-2xl ${isDark ? 'border-neutral-700 bg-[#252525] text-neutral-200' : 'border-neutral-200 bg-white text-neutral-800'}`}>
    <div className={`px-3 py-2 text-[10px] font-bold uppercase tracking-wider ${isDark ? 'bg-[#1f1f1f] text-neutral-500' : 'bg-neutral-100 text-neutral-500'}`}>
      {label}
    </div>
    {options.map(option => (
      <button
        key={option}
        onClick={() => onSelect(option)}
        className={`flex w-full items-center justify-between px-3 py-2 text-left text-xs transition-colors ${isDark ? 'hover:bg-neutral-700' : 'hover:bg-neutral-100'} ${current === option ? 'text-blue-400' : ''}`}
      >
        <span>{option}{suffix && !option.endsWith(suffix) ? suffix : ''}</span>
        {current === option && <Check size={12} />}
      </button>
    ))}
  </div>
);
