import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, Users } from 'lucide-react';
import {
  CHARACTER_CATEGORIES,
  CHARACTER_PRESETS,
  CharacterCategoryId,
  NO_CHARACTER_PRESET_ID,
  getCharacterPreset
} from '../../constants/characterLibrary';

interface CharacterLibrarySelectProps {
  value?: string;
  onChange: (characterPresetId: string) => void;
  isDark?: boolean;
  className?: string;
  buttonClassName?: string;
  align?: 'left' | 'right';
  placement?: 'top' | 'bottom';
  labelWhenNone?: string;
  maxLabelWidthClass?: string;
}

const DEFAULT_NONE_LABEL = '\u89d2\u8272';
const MENU_TITLE = '\u89d2\u8272\u5e93';
const MENU_SUBTITLE = '\u9009\u62e9\u89d2\u8272\u540e\uff0c\u751f\u6210\u65f6\u4f1a\u81ea\u52a8\u5e26\u4e0a\u89d2\u8272\u4e00\u81f4\u6027\u63d0\u793a\u8bcd';

export const CharacterLibrarySelect: React.FC<CharacterLibrarySelectProps> = ({
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
  const [activeCategory, setActiveCategory] = useState<CharacterCategoryId>('fruit-characters');
  const containerRef = useRef<HTMLDivElement>(null);
  const currentPreset = getCharacterPreset(value);
  const activePresets = useMemo(
    () => CHARACTER_PRESETS.filter(preset => preset.categoryId === activeCategory),
    [activeCategory]
  );

  useEffect(() => {
    const selectedPreset = getCharacterPreset(value);
    if (selectedPreset) {
      setActiveCategory(selectedPreset.categoryId);
    }
  }, [value]);

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
  const buttonTitle = currentPreset
    ? `${currentPreset.name}\n${currentPreset.prompt || currentPreset.description}`
    : MENU_TITLE;

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(open => !open)}
        className={buttonClassName || `flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors ${defaultButtonClass}`}
        title={buttonTitle}
      >
        <Users size={13} className="text-cyan-300" />
        <span className={`truncate ${maxLabelWidthClass}`}>
          {currentPreset ? currentPreset.name : labelWhenNone}
        </span>
        <ChevronDown size={12} className="opacity-60" />
      </button>

      {isOpen && (
        <div
          className={`absolute ${menuPositionClass} ${menuAlignClass} z-50 w-[430px] overflow-hidden rounded-2xl border shadow-2xl ${isDark ? 'border-neutral-700 bg-[#252525] text-neutral-200' : 'border-neutral-200 bg-white text-neutral-800'}`}
          onWheel={(event) => event.stopPropagation()}
        >
          <div className={`border-b px-4 py-3 ${isDark ? 'border-neutral-700 bg-[#1f1f1f]' : 'border-neutral-200 bg-neutral-100'}`}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-semibold">{MENU_TITLE}</div>
                <div className={`mt-0.5 text-xs ${isDark ? 'text-neutral-500' : 'text-neutral-500'}`}>{MENU_SUBTITLE}</div>
              </div>
              <button
                type="button"
                onClick={() => {
                  onChange(NO_CHARACTER_PRESET_ID);
                  setIsOpen(false);
                }}
                className={`shrink-0 rounded-lg px-2 py-1 text-xs transition-colors ${!currentPreset ? 'text-blue-400' : isDark ? 'text-neutral-400 hover:bg-neutral-700 hover:text-white' : 'text-neutral-500 hover:bg-neutral-200 hover:text-neutral-900'}`}
              >
                \u4e0d\u9009
              </button>
            </div>
            <div className={`mt-3 flex rounded-xl border p-1 ${isDark ? 'border-neutral-700 bg-[#181818]' : 'border-neutral-200 bg-white'}`}>
              {CHARACTER_CATEGORIES.map(category => (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => setActiveCategory(category.id)}
                  className={`flex-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${activeCategory === category.id
                    ? isDark ? 'bg-neutral-100 text-neutral-950' : 'bg-neutral-900 text-white'
                    : isDark ? 'text-neutral-500 hover:text-neutral-200' : 'text-neutral-500 hover:text-neutral-900'
                    }`}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>
          <div className="grid max-h-[430px] grid-cols-2 gap-2 overflow-y-auto p-3">
            {activePresets.map(preset => (
              <button
                key={preset.id}
                type="button"
                onClick={() => {
                  onChange(preset.id);
                  setIsOpen(false);
                }}
                className={`rounded-xl border p-3 text-left transition-colors ${isDark ? 'border-neutral-700 bg-[#2b2b2b] hover:border-neutral-500 hover:bg-[#333]' : 'border-neutral-200 bg-white hover:border-neutral-300 hover:bg-neutral-50'} ${currentPreset?.id === preset.id ? 'ring-1 ring-blue-400/80' : ''}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold">{preset.name}</span>
                  {currentPreset?.id === preset.id && <Check size={13} className="shrink-0 text-blue-400" />}
                </div>
                <div className={`mt-1 text-xs leading-5 ${isDark ? 'text-neutral-500' : 'text-neutral-500'}`}>{preset.description}</div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
