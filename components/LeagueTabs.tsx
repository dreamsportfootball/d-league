import React from 'react';
import { Trophy } from 'lucide-react';

interface LeagueTabsProps<T extends string> {
  options: readonly T[];
  active: T;
  onChange: (value: T) => void;
  getLabel: (value: T) => string;
  getMobileLabel?: (value: T) => string;
}

function LeagueTabs<T extends string>({
  options,
  active,
  onChange,
  getLabel,
  getMobileLabel,
}: LeagueTabsProps<T>) {
  const desktopLabel = (option: T): string => {
    const leagueNumber = /^L(\d+)$/.exec(option)?.[1];
    return leagueNumber ? `LEAGUE ${leagueNumber}` : getLabel(option);
  };

  const mobileLabel = (option: T): string => {
    if (getMobileLabel) return getMobileLabel(option);
    return /^L\d+$/.test(option) ? option : getLabel(option);
  };

  return (
    <div className="mb-6 flex min-w-0 items-center justify-between gap-3 border-b border-neutral-200 pb-3 md:mb-8 md:gap-4 md:pb-4">
      <h2 className="flex shrink-0 items-center font-display text-xs font-bold uppercase tracking-wider text-neutral-900 md:text-sm">
        <Trophy className="mr-1.5 h-4 w-4 text-brand-blue md:mr-2 md:h-5 md:w-5" aria-hidden="true" />
        選擇聯賽
      </h2>

      <div
        role="tablist"
        aria-label="選擇聯賽"
        className="flex min-w-0 max-w-full items-center justify-end gap-0.5 md:gap-1 md:rounded-full md:bg-brand-black md:p-1"
      >
        {options.map((option) => {
          const isActive = active === option;
          return (
            <button
              key={option}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-label={desktopLabel(option)}
              onClick={() => onChange(option)}
              className={`relative inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center whitespace-nowrap px-2 text-xs font-bold transition-[background-color,color] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue md:min-h-10 md:min-w-0 md:rounded-full md:px-3 md:font-display md:text-[13px] md:tracking-wider lg:px-4 ${
                isActive
                  ? 'text-brand-blue md:bg-brand-blue md:text-white'
                  : 'text-neutral-500 hover:text-brand-blue md:text-neutral-200 md:hover:bg-white/10 md:hover:text-white'
              }`}
            >
              <span className="md:hidden">{mobileLabel(option)}</span>
              <span className="hidden md:inline">{desktopLabel(option)}</span>
              <span
                className={`absolute inset-x-2 bottom-0 h-0.5 md:hidden ${isActive ? 'bg-brand-blue' : 'bg-transparent'}`}
                aria-hidden="true"
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default LeagueTabs;
