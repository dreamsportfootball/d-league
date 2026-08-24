import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import type { SeasonId } from '../types/season';

export type PlayerEventSeasonValue = SeasonId | 'ALL';

interface PlayerEventSeasonOption {
  id: SeasonId;
  label: string;
}

interface PlayerEventSeasonFilterProps {
  value: PlayerEventSeasonValue;
  options: PlayerEventSeasonOption[];
  onChange: (value: PlayerEventSeasonValue) => void;
}

const PlayerEventSeasonFilter: React.FC<PlayerEventSeasonFilterProps> = ({
  value,
  options,
  onChange,
}) => {
  const [open, setOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const listboxId = useId();

  const items = useMemo(
    () => [
      { id: 'ALL' as const, label: '全部賽季' },
      ...options,
    ],
    [options],
  );

  const selectedIndex = Math.max(0, items.findIndex((item) => item.id === value));
  const selectedLabel = items[selectedIndex]?.label ?? '全部賽季';

  const focusOption = (index: number) => {
    const normalizedIndex = (index + items.length) % items.length;
    setFocusedIndex(normalizedIndex);
    window.requestAnimationFrame(() => optionRefs.current[normalizedIndex]?.focus());
  };

  const openMenu = (index = selectedIndex) => {
    setOpen(true);
    focusOption(index);
  };

  const closeMenu = (returnFocus = false) => {
    setOpen(false);
    if (returnFocus) window.requestAnimationFrame(() => triggerRef.current?.focus());
  };

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) closeMenu(false);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && open) {
        event.preventDefault();
        closeMenu(true);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  const selectValue = (nextValue: PlayerEventSeasonValue) => {
    if (nextValue !== value) onChange(nextValue);
    closeMenu(true);
  };

  const handleTriggerKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      openMenu(open ? focusedIndex + 1 : selectedIndex);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      openMenu(open ? focusedIndex - 1 : selectedIndex);
    } else if (event.key === 'Home') {
      event.preventDefault();
      openMenu(0);
    } else if (event.key === 'End') {
      event.preventDefault();
      openMenu(items.length - 1);
    }
  };

  const handleOptionKeyDown = (
    event: React.KeyboardEvent<HTMLButtonElement>,
    itemValue: PlayerEventSeasonValue,
    index: number,
  ) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      focusOption(index + 1);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      focusOption(index - 1);
    } else if (event.key === 'Home') {
      event.preventDefault();
      focusOption(0);
    } else if (event.key === 'End') {
      event.preventDefault();
      focusOption(items.length - 1);
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      selectValue(itemValue);
    } else if (event.key === 'Tab') {
      setOpen(false);
    }
  };

  return (
    <div className="flex items-center gap-2 text-xs font-semibold text-neutral-500">
      <span>賽季</span>
      <div ref={rootRef} className="relative w-[132px]">
        <button
          ref={triggerRef}
          type="button"
          onClick={() => (open ? closeMenu(false) : openMenu())}
          onKeyDown={handleTriggerKeyDown}
          aria-haspopup="listbox"
          aria-controls={listboxId}
          aria-expanded={open}
          className="group flex h-10 w-full items-center justify-between rounded-md border border-neutral-300 bg-white px-3 text-left text-xs font-bold text-brand-black outline-none transition-colors hover:border-neutral-400 focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/15"
        >
          <span className="truncate">{selectedLabel}</span>
          <ChevronDown
            className={`ml-2 h-3.5 w-3.5 shrink-0 text-neutral-400 transition-transform duration-150 group-hover:text-brand-black ${open ? 'rotate-180' : ''}`}
            aria-hidden="true"
          />
        </button>

        {open && (
          <div
            id={listboxId}
            role="listbox"
            aria-label="篩選比賽事件賽季"
            className="absolute right-0 z-40 mt-1.5 w-full overflow-hidden rounded-lg border border-neutral-200 bg-white py-1 shadow-lg ring-1 ring-black/5"
          >
            {items.map((item, index) => {
              const isSelected = item.id === value;
              return (
                <button
                  key={item.id}
                  ref={(element) => {
                    optionRefs.current[index] = element;
                  }}
                  type="button"
                  role="option"
                  tabIndex={focusedIndex === index ? 0 : -1}
                  aria-selected={isSelected}
                  onFocus={() => setFocusedIndex(index)}
                  onKeyDown={(event) => handleOptionKeyDown(event, item.id, index)}
                  onClick={() => selectValue(item.id)}
                  className={`flex min-h-11 w-full items-center justify-between px-3 text-left text-xs font-bold transition-colors ${
                    isSelected
                      ? 'text-brand-blue'
                      : 'text-brand-black hover:bg-neutral-50'
                  }`}
                >
                  <span>{item.label}</span>
                  {isSelected && <Check className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default PlayerEventSeasonFilter;
