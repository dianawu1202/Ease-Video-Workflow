/**
 * VideoGenerationPanel.tsx
 *
 * Prompt and generation controls dedicated to video nodes.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, Clock, Expand, ImagePlus, Languages, Loader2, Monitor, Send, Sparkles, Video as VideoIcon, Zap } from 'lucide-react';
import { NodeData, NodeType } from '../../types';
import { GoogleIcon, HailuoIcon, KlingIcon } from '../icons/BrandIcons';
import { CreativeStyleSelect } from '../common/CreativeStyleSelect';
import { CharacterLibrarySelect } from '../common/CharacterLibrarySelect';
import { removeCreativeStyleFromPrompt } from '../../constants/creativeStyles';
import {
  CAMERA_MOVE_PRESETS,
  NO_CAMERA_MOVE_PRESET_ID,
  type CameraMovePreset,
  getCameraMovePreset,
  removeCameraMoveFromPrompt
} from '../../constants/cameraMoves';

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
  text: '\u6587\u751f\u89c6\u9891',
  image: '\u56fe\u751f\u89c6\u9891'
};

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
  const currentCameraMovePreset = getCameraMovePreset(data.cameraMovePreset);

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

  const handleStylePresetChange = (stylePreset: string) => {
    const nextPrompt = removeCreativeStyleFromPrompt(localPrompt);

    if (updateTimeoutRef.current) clearTimeout(updateTimeoutRef.current);

    setLocalPrompt(nextPrompt);
    lastSentPromptRef.current = nextPrompt;
    onUpdate(data.id, { stylePreset, prompt: nextPrompt });
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
    const nextPrompt = removeCameraMoveFromPrompt(localPrompt);

    setLocalPrompt(nextPrompt);
    lastSentPromptRef.current = nextPrompt;
    onUpdate(data.id, { cameraMovePreset: preset.id, prompt: nextPrompt });
    setShowCameraMoveDropdown(false);
  };

  const clearCameraMovePreset = () => {
    const nextPrompt = removeCameraMoveFromPrompt(localPrompt);

    setLocalPrompt(nextPrompt);
    lastSentPromptRef.current = nextPrompt;
    onUpdate(data.id, { cameraMovePreset: NO_CAMERA_MOVE_PRESET_ID, prompt: nextPrompt });
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
          title={'\u5c55\u5f00\u9762\u677f'}
          onClick={() => onUpdate(data.id, { isPromptExpanded: !data.isPromptExpanded })}
        >
          <Expand size={16} />
        </button>
      </div>

      <textarea
        className={`mb-3 w-full resize-none bg-transparent text-sm leading-6 outline-none ${isDark ? 'text-neutral-100 placeholder-neutral-500' : 'text-neutral-900 placeholder-neutral-400'}`}
        placeholder={activeMode === 'image' ? '\u63cf\u8ff0\u4f60\u60f3\u751f\u6210\u7684\u753b\u9762\u5185\u5bb9\uff0c\u53ef\u5f15\u7528\u753b\u5e03\u7d20\u6750' : '\u63cf\u8ff0\u4f60\u60f3\u751f\u6210\u7684\u89c6\u9891\u5185\u5bb9\uff0c\u53ef\u5f15\u7528\u753b\u5e03\u7d20\u6750'}
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
          title={'\u4ece\u753b\u5e03\u9009\u62e9\u53c2\u8003\u8d44\u6e90'}
        >
          <ImagePlus size={18} />
          <span className="mt-1">{'\u53c2\u8003'}</span>
        </button>

        {connectedVisualInputs.length > 0 ? (
          <div className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto pb-1">
            {connectedVisualInputs.map((node, index) => (
              <div
                key={`${node.id}-${index}`}
                className={`relative h-14 w-20 shrink-0 overflow-hidden rounded-xl border ${isDark ? 'border-neutral-700 bg-neutral-900' : 'border-neutral-200 bg-neutral-100'}`}
                title={node.type === NodeType.VIDEO ? '\u89c6\u9891\u53c2\u8003' : '\u56fe\u7247\u53c2\u8003'}
              >
                {node.type === NodeType.VIDEO ? (
                  <video src={node.url} className="h-full w-full object-cover" muted />
                ) : (
                  <img src={node.url} alt="Reference asset" className="h-full w-full object-cover" />
                )}
                <span className="absolute bottom-1 left-1 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-medium text-white">
                  {node.type === NodeType.VIDEO ? '\u89c6\u9891' : '\u56fe\u7247'}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className={`text-xs ${mutedTextClass}`}>
            {'\u70b9\u51fb\u201c\u53c2\u8003\u201d\uff0c\u518d\u5728\u753b\u5e03\u4e0a\u9009\u62e9\u56fe\u7247\u6216\u89c6\u9891\u8d44\u6e90'}
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

        <div className="flex flex-wrap items-center justify-end gap-2">
          <CreativeStyleSelect
            value={data.stylePreset}
            onChange={handleStylePresetChange}
            isDark={isDark}
            placement="top"
            align="right"
            buttonClassName={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors ${buttonClass}`}
            maxLabelWidthClass="max-w-[58px]"
          />

          <CharacterLibrarySelect
            value={data.characterPreset}
            onChange={(characterPreset) => onUpdate(data.id, { characterPreset })}
            isDark={isDark}
            placement="top"
            align="right"
            buttonClassName={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors ${buttonClass}`}
            maxLabelWidthClass="max-w-[58px]"
          />

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
                label={'\u6e05\u6670\u5ea6'}
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
                label={'\u6bd4\u4f8b'}
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
                label={'\u65f6\u957f'}
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
              title={currentCameraMovePreset ? `${currentCameraMovePreset.name}\n${currentCameraMovePreset.prompt}` : '\u8fd0\u955c'}
            >
              <VideoIcon size={13} className="text-violet-300" />
              <span className="max-w-[68px] truncate">{currentCameraMovePreset ? currentCameraMovePreset.name : '\u8fd0\u955c'}</span>
              <ChevronDown size={12} className="opacity-60" />
            </button>

            {showCameraMoveDropdown && (
              <div className={`absolute bottom-full right-0 z-50 mb-2 w-[420px] overflow-hidden rounded-2xl border shadow-2xl ${dropdownClass}`}>
                <div className={`flex items-center justify-between border-b px-4 py-3 ${isDark ? 'border-neutral-700 bg-[#1f1f1f]' : 'border-neutral-200 bg-neutral-100'}`}>
                  <div>
                    <div className="text-sm font-semibold">{'\u8fd0\u955c\u5e7f\u573a'}</div>
                    <div className={`mt-0.5 text-xs ${mutedTextClass}`}>{'\u9009\u62e9\u5e38\u89c1\u7535\u5f71\u955c\u5934\u8fd0\u52a8\uff0c\u751f\u6210\u65f6\u81ea\u52a8\u5e26\u4e0a\u5bfc\u6f14\u63d0\u793a\u8bcd'}</div>
                  </div>
                  <button
                    onClick={clearCameraMovePreset}
                    className={`rounded-lg px-2 py-1 text-xs transition-colors ${!currentCameraMovePreset ? 'text-blue-400' : isDark ? 'text-neutral-400 hover:bg-neutral-700 hover:text-white' : 'text-neutral-500 hover:bg-neutral-200 hover:text-neutral-900'}`}
                  >
                    {'\u4e0d\u9009'}
                  </button>
                </div>
                <div className="grid max-h-[420px] grid-cols-2 gap-2 overflow-y-auto p-3">
                  {CAMERA_MOVE_PRESETS.map(preset => (
                    <button
                      key={preset.id}
                      onClick={() => applyCameraMovePreset(preset)}
                      title={preset.prompt}
                      className={`group rounded-xl border p-3 text-left transition-colors ${isDark ? 'border-neutral-700 bg-[#2b2b2b] hover:border-neutral-500 hover:bg-[#333]' : 'border-neutral-200 bg-white hover:border-neutral-300 hover:bg-neutral-50'} ${currentCameraMovePreset?.id === preset.id ? 'ring-1 ring-blue-400/80' : ''}`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-semibold">{preset.name}</span>
                        {currentCameraMovePreset?.id === preset.id && <Check size={13} className="shrink-0 text-blue-400" />}
                      </div>
                      <div className={`mt-1 text-xs leading-5 ${mutedTextClass}`}>{preset.intent}</div>
                      <div className={`mt-2 hidden rounded-lg border p-2 text-[10px] leading-4 group-hover:block ${isDark ? 'border-violet-400/20 bg-black/25 text-violet-100/80' : 'border-violet-200 bg-violet-50 text-violet-900'}`}>
                        {preset.prompt}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <button
            className={`flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium transition-colors ${isDark ? 'text-neutral-300 hover:bg-neutral-700' : 'text-neutral-600 hover:bg-neutral-100'}`}
            title={'\u7ffb\u8bd1\u63d0\u793a\u8bcd'}
          >
            <Languages size={15} />
          </button>

          <button
            className={`flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium transition-colors ${isDark ? 'text-neutral-300 hover:bg-neutral-700' : 'text-neutral-600 hover:bg-neutral-100'}`}
            title={'\u751f\u6210\u6570\u91cf'}
          >
            1
          </button>

          <div className={`flex items-center gap-1 text-xs ${mutedTextClass}`} title={'\u9884\u8ba1\u70b9\u6570'}>
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
            title={'\u751f\u6210'}
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
