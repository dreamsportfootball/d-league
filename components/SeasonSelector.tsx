import React, { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { useSeason } from '../hooks/useSeason';
import type { SeasonId } from '../types/season';

interface SeasonSelectorProps {
  compact?: boolean;
}

const SeasonSelector: React.FC<SeasonSelectorProps> = ({ compact = false }) => {
  const { activeSeasonId, activeSeason, availableSeasons, setActiveSeason } = useSeason();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const sortedSeasons = [...availableSeasons].sort((a, b) => b.id.localeCompare(a.id));

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const selectSeason = (seasonId: SeasonId) => {
    if (seasonId !== activeSeasonId) {
      setActiveSeason(seasonId);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    setOpen(false);
  };

  return (
    <div ref={rootRef} className={`relative ml-auto ${compact ? 'w-[124px]' : 'w-[148px]'}`}>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`group flex w-full items-center justify-between border border-neutral-200 bg-white font-bold text-brand-black shadow-sm outline-none transition-all hover:border-brand-blue hover:shadow-md focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20 ${
          compact ? 'h-11 rounded-lg px-2.5' : 'h-9 rounded-lg px-3'
        }`}
      >
        <span className="flex min-w-0 items-baseline gap-1 whitespace-nowrap">
          <span className={`font-display font-black tracking-wide ${compact ? 'text-xs' : 'text-[13px]'}`}>
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
          role="listbox"
          aria-label="選擇賽季"
          className="absolute right-0 z-[1200] mt-2 w-full overflow-hidden rounded-xl border border-neutral-200 bg-white p-1.5 shadow-xl ring-1 ring-black/5"
        >
          <div className="space-y-1">
            {sortedSeasons.map((season) => {
              const isActive = season.id === activeSeasonId;

              return (
                <button
                  key={season.id}
                  type="button"
                  role="option"
                  aria-selected={isActive}
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
