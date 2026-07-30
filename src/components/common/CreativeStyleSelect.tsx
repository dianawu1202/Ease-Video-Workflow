import React, { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown, Palette } from 'lucide-react';
import {
  CREATIVE_STYLE_PRESETS,
  NO_STYLE_PRESET_ID,
  getCreativeStylePreset
} from '../../constants/creativeStyles';

interface CreativeStyleSelectProps {
  value?: string;
  onChange: (stylePresetId: string) => void;
  isDark?: boolean;
  className?: string;
  buttonClassName?: string;
  align?: 'left' | 'right';
  placement?: 'top' | 'bottom';
  labelWhenNone?: string;
  maxLabelWidthClass?: string;
}

const DEFAULT_NONE_LABEL = '\u98ce\u683c';
const MENU_TITLE = '\u521b\u4f5c\u98ce\u683c';
const MENU_SUBTITLE = '\u5185\u7f6e\u5e38\u7528\u89c6\u89c9\u98ce\u683c\uff0c\u751f\u6210\u65f6\u4f1a\u81ea\u52a8\u5e26\u4e0a\u5bf9\u5e94\u63d0\u793a\u8bcd';

export const CreativeStyleSelect: React.FC<CreativeStyleSelectProps> = ({
  value,
  onChange,
  isDark = true,
  className = '',
  buttonClassName,
  align = 'right',
  placement = 'top',
  labelWhenNone = DEFAULT_NONE_LABEL,
  maxLabelWidthClass = 'max-w-[76px]'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const currentPreset = getCreativeStylePreset(value);
  const isDefaultStyle = currentPreset.id === NO_STYLE_PRESET_ID;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const defaultButtonClass = isDark
    ? 'border-neutral-700 bg-[#252525] text-white hover:bg-[#333]'
    : 'border-neutral-300 bg-white text-neutral-900 hover:bg-neutral-100';

  const menuPositionClass = placement === 'top' ? 'bottom-full mb-2' : 'top-full mt-2';
  const menuAlignClass = align === 'right' ? 'right-0' : 'left-0';
  const buttonTitle = isDefaultStyle
    ? MENU_TITLE
    : `${currentPreset.name}\n${currentPreset.prompt || currentPreset.description}`;

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(open => !open)}
        className={buttonClassName || `flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors ${defaultButtonClass}`}
        title={buttonTitle}
      >
        <Palette size={13} className="text-amber-300" />
        <span className={`truncate ${maxLabelWidthClass}`}>
          {isDefaultStyle ? labelWhenNone : currentPreset.name}
        </span>
        <ChevronDown size={12} className="opacity-60" />
      </button>

      {isOpen && (
        <div
          className={`absolute ${menuPositionClass} ${menuAlignClass} z-50 w-[360px] overflow-hidden rounded-2xl border shadow-2xl ${isDark ? 'border-neutral-700 bg-[#252525] text-neutral-200' : 'border-neutral-200 bg-white text-neutral-800'}`}
          onWheel={(event) => event.stopPropagation()}
        >
          <div className={`border-b px-4 py-3 ${isDark ? 'border-neutral-700 bg-[#1f1f1f]' : 'border-neutral-200 bg-neutral-100'}`}>
            <div className="text-sm font-semibold">{MENU_TITLE}</div>
            <div className={`mt-0.5 text-xs ${isDark ? 'text-neutral-500' : 'text-neutral-500'}`}>{MENU_SUBTITLE}</div>
          </div>
          <div className="grid max-h-[420px] grid-cols-2 gap-2 overflow-y-auto p-3">
            {CREATIVE_STYLE_PRESETS.map(preset => (
              <button
                key={preset.id}
                type="button"
                title={preset.prompt || preset.description}
                onClick={() => {
                  onChange(preset.id);
                  setIsOpen(false);
                }}
                className={`group rounded-xl border p-3 text-left transition-colors ${isDark ? 'border-neutral-700 bg-[#2b2b2b] hover:border-neutral-500 hover:bg-[#333]' : 'border-neutral-200 bg-white hover:border-neutral-300 hover:bg-neutral-50'} ${currentPreset.id === preset.id ? 'ring-1 ring-blue-400/80' : ''}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold">{preset.name}</span>
                  {currentPreset.id === preset.id && <Check size={13} className="shrink-0 text-blue-400" />}
                </div>
                <div className={`mt-1 text-xs leading-5 ${isDark ? 'text-neutral-500' : 'text-neutral-500'}`}>{preset.description}</div>
                {preset.prompt && (
                  <div className={`mt-2 hidden rounded-lg border p-2 text-[10px] leading-4 group-hover:block ${isDark ? 'border-amber-400/20 bg-black/25 text-amber-100/80' : 'border-amber-200 bg-amber-50 text-amber-900'}`}>
                    {preset.prompt}
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
