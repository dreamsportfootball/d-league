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
    setActiveSeason(seasonId);
    setOpen(false);
  };

  return (
    <div ref={rootRef} className={`relative ${compact ? 'inline-flex' : 'w-full'}`}>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`group flex items-center justify-between border border-neutral-200 bg-white font-bold text-brand-black shadow-sm outline-none transition-all hover:border-brand-blue hover:shadow-md focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20 ${
          compact
            ? 'h-9 min-w-[112px] rounded-full px-3 text-xs'
            : 'h-11 w-full rounded-lg px-4 text-sm'
        }`}
      >
        <span className="flex min-w-0 items-center">
          <span className="mr-2 h-2 w-2 shrink-0 rounded-full bg-brand-blue shadow-[0_0_0_3px_rgba(0,71,171,0.12)]" />
          <span className="truncate font-display tracking-wide">{activeSeason.shortName}</span>
        </span>
        <ChevronDown
          className={`ml-2 h-4 w-4 shrink-0 text-neutral-400 transition-transform duration-200 group-hover:text-brand-blue ${
            open ? 'rotate-180' : ''
          }`}
          aria-hidden="true"
        />
      </button>

      {open && (
        <div
          role="listbox"
          aria-label="選擇賽季"
          className={`absolute right-0 z-[1200] mt-2 overflow-hidden rounded-xl border border-neutral-200 bg-white p-1.5 shadow-2xl ring-1 ring-black/5 ${
            compact ? 'w-52' : 'left-0 w-full'
          }`}
        >
          <div className="px-3 pb-2 pt-2 text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400">
            選擇賽季
          </div>

          {availableSeasons.map((season) => {
            const isActive = season.id === activeSeasonId;
            const isCurrent = season.isDefault;

            return (
              <button
                key={season.id}
                type="button"
                role="option"
                aria-selected={isActive}
                onClick={() => selectSeason(season.id)}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-3 text-left transition-colors ${
                  isActive
                    ? 'bg-brand-blue text-white'
                    : 'text-brand-black hover:bg-neutral-100'
                }`}
              >
                <span className="min-w-0">
                  <span className="block font-display text-sm font-bold tracking-wide">
                    {season.shortName}
                  </span>
                  <span
                    className={`mt-0.5 block text-[10px] font-bold uppercase tracking-wider ${
                      isActive ? 'text-white/70' : 'text-neutral-400'
                    }`}
                  >
                    {isCurrent ? '目前賽季' : '過往賽季'}
                  </span>
                </span>

                <span className="ml-3 flex h-6 w-6 shrink-0 items-center justify-center">
                  {isActive ? (
                    <Check className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <span className="h-2 w-2 rounded-full bg-neutral-300" />
                  )}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SeasonSelector;
