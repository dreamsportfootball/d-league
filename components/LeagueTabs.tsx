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
    <div className="mb-6 flex min-w-0 flex-wrap items-center justify-start gap-x-3 gap-y-2 border-b border-neutral-200 pb-3 md:mb-8 md:gap-x-4 md:pb-4">
      <h2 className="flex shrink-0 items-center font-display text-xs font-bold uppercase tracking-wider text-neutral-900 md:text-sm">
        <Trophy className="mr-1.5 h-4 w-4 text-brand-blue md:mr-2 md:h-5 md:w-5" aria-hidden="true" />
        選擇聯賽
      </h2>

      <div
        role="tablist"
        aria-label="選擇聯賽"
        className="flex min-w-0 max-w-full flex-wrap items-center justify-start gap-1.5 md:gap-2"
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
              className={`inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center whitespace-nowrap rounded-full border bg-white px-2.5 text-xs font-bold transition-[border-color,color,background-color] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue md:min-h-11 md:px-4 md:font-display md:text-[13px] md:tracking-wider ${
                isActive
                  ? 'border-brand-blue text-brand-blue'
                  : 'border-neutral-300 text-neutral-700 hover:border-brand-blue hover:text-brand-blue'
              }`}
            >
              <span className="md:hidden">{mobileLabel(option)}</span>
              <span className="hidden md:inline">{desktopLabel(option)}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default LeagueTabs;
