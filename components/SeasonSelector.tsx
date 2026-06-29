import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { useSeason } from '../hooks/useSeason';
import type { SeasonId } from '../types/season';

interface SeasonSelectorProps {
  compact?: boolean;
}

const SeasonSelector: React.FC<SeasonSelectorProps> = ({ compact = false }) => {
  const { activeSeasonId, activeSeason, availableSeasons, setActiveSeason } = useSeason();
  const [open, setOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const listboxId = useId();
  const sortedSeasons = useMemo(
    () => [...availableSeasons].sort((a, b) => b.id.localeCompare(a.id)),
    [availableSeasons],
  );
  const activeIndex = Math.max(0, sortedSeasons.findIndex((season) => season.id === activeSeasonId));

  const focusOption = (index: number) => {
    const normalizedIndex = (index + sortedSeasons.length) % sortedSeasons.length;
    setFocusedIndex(normalizedIndex);
    window.requestAnimationFrame(() => optionRefs.current[normalizedIndex]?.focus());
  };

  const openMenu = (index = activeIndex) => {
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

  const selectSeason = (seasonId: SeasonId) => {
    if (seasonId !== activeSeasonId) {
      setActiveSeason(seasonId);
      const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      window.scrollTo({ top: 0, behavior: reducedMotion ? 'auto' : 'smooth' });
    }
    closeMenu(true);
  };

  const handleTriggerKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      openMenu(open ? focusedIndex + 1 : activeIndex);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      openMenu(open ? focusedIndex - 1 : activeIndex);
    } else if (event.key === 'Home') {
      event.preventDefault();
      openMenu(0);
    } else if (event.key === 'End') {
      event.preventDefault();
      openMenu(sortedSeasons.length - 1);
    }
  };

  const handleOptionKeyDown = (
    event: React.KeyboardEvent<HTMLButtonElement>,
    seasonId: SeasonId,
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
      focusOption(sortedSeasons.length - 1);
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      selectSeason(seasonId);
    } else if (event.key === 'Tab') {
      setOpen(false);
    }
  };

  return (
    <div ref={rootRef} className={`relative ml-auto ${compact ? 'w-[124px] md:w-[148px]' : 'w-[148px]'}`}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => (open ? closeMenu(false) : openMenu())}
        onKeyDown={handleTriggerKeyDown}
        aria-haspopup="listbox"
        aria-controls={listboxId}
        aria-expanded={open}
        className={`group flex w-full items-center justify-between border border-neutral-200 bg-white font-bold text-brand-black shadow-sm outline-none transition-all hover:border-brand-blue hover:shadow-md focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20 ${
          compact ? 'h-11 rounded-lg px-2.5 md:h-9 md:px-3' : 'h-9 rounded-lg px-3'
        }`}
      >
        <span className="flex min-w-0 items-baseline gap-1 whitespace-nowrap">
          <span className={`font-display font-black tracking-wide ${compact ? 'text-xs md:text-[13px]' : 'text-[13px]'}`}>
            {activeSeason.shortName}
          </span>
          <span className="text-[9px] font-bold text-neutral-400">賽季</span>
        </span>

        <ChevronDown
          className={`ml-1.5 h-3.5 w-3.5 shrink-0 text-neutral-400 transition-transform duration-200 group-hover:text-brand-blue ${
            open ? 'rotate-180' : ''
          }`}
          aria-hidden="true"
        />
      </button>

      {open && (
        <div
          id={listboxId}
          role="listbox"
          aria-label="選擇賽季"
          className="absolute right-0 z-[1200] mt-2 w-full overflow-hidden rounded-xl border border-neutral-200 bg-white p-1.5 shadow-xl ring-1 ring-black/5"
        >
          <div className="space-y-1">
            {sortedSeasons.map((season, index) => {
              const isActive = season.id === activeSeasonId;

              return (
                <button
                  ref={(element) => {
                    optionRefs.current[index] = element;
                  }}
                  key={season.id}
                  type="button"
                  role="option"
                  tabIndex={focusedIndex === index ? 0 : -1}
                  aria-selected={isActive}
                  onFocus={() => setFocusedIndex(index)}
                  onKeyDown={(event) => handleOptionKeyDown(event, season.id, index)}
                  onClick={() => selectSeason(season.id)}
                  className={`flex min-h-11 w-full items-center justify-between rounded-lg px-2.5 text-left transition-all ${
                    isActive
                      ? 'bg-brand-blue text-white shadow-sm'
                      : 'text-brand-black hover:bg-neutral-100'
                  }`}
                >
                  <span className="font-display text-sm font-black tracking-wide">
                    {season.shortName}
                  </span>

                  {isActive && <Check className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default SeasonSelector;
