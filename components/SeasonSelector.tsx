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
    <div ref={rootRef} className={`relative ml-auto ${compact ? 'inline-flex' : 'w-[148px]'}`}>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`group flex w-full items-center justify-between border border-neutral-200 bg-white font-bold text-brand-black shadow-sm outline-none transition-all hover:border-brand-blue hover:shadow-md focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20 ${
          compact ? 'h-9 rounded-full px-3' : 'h-9 rounded-lg px-3'
        }`}
      >
        <span className="flex min-w-0 items-baseline gap-1.5 whitespace-nowrap">
          <span className="font-display text-[13px] font-black tracking-wide">
            {activeSeason.shortName}
          </span>
          <span className="text-[10px] font-bold text-neutral-400">賽季</span>
        </span>

        <ChevronDown
          className={`ml-2 h-3.5 w-3.5 shrink-0 text-neutral-400 transition-transform duration-200 group-hover:text-brand-blue ${
            open ? 'rotate-180' : ''
          }`}
          aria-hidden="true"
        />
      </button>

      {open && (
        <div
          role="listbox"
          aria-label="選擇賽季"
          className="absolute right-0 z-[1200] mt-2 w-44 overflow-hidden rounded-xl border border-neutral-200 bg-white p-1.5 shadow-xl ring-1 ring-black/5"
        >
          <div className="flex items-center justify-between px-2.5 pb-1.5 pt-1.5">
            <span className="text-[9px] font-black tracking-[0.18em] text-neutral-400">
              選擇賽季
            </span>
            <span className="text-[9px] font-bold text-neutral-300">
              共 {availableSeasons.length} 季
            </span>
          </div>

          <div className="space-y-1">
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
                  className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left transition-all ${
                    isActive
                      ? 'bg-brand-blue text-white shadow-sm'
                      : 'text-brand-black hover:bg-neutral-100'
                  }`}
                >
                  <span className="min-w-0">
                    <span className="block font-display text-sm font-black tracking-wide">
                      {season.shortName}
                    </span>
                    <span
                      className={`mt-0.5 block text-[9px] font-bold tracking-[0.12em] ${
                        isActive ? 'text-white/70' : 'text-neutral-400'
                      }`}
                    >
                      {isCurrent ? '目前賽季' : '過往賽季'}
                    </span>
                  </span>

                  <span className="ml-2 flex h-6 w-6 shrink-0 items-center justify-center rounded-full">
                    {isActive ? (
                      <Check className="h-3.5 w-3.5" aria-hidden="true" />
                    ) : (
                      <ChevronDown className="h-3 w-3 -rotate-90 text-neutral-300" aria-hidden="true" />
                    )}
                  </span>
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
