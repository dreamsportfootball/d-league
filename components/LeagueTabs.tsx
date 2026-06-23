import React from 'react';
import { Trophy } from 'lucide-react';

interface LeagueTabsProps<T extends string> {
  options: readonly T[];
  active: T;
  onChange: (value: T) => void;
  getLabel: (value: T) => string;
}

function LeagueTabs<T extends string>({
  options,
  active,
  onChange,
  getLabel,
}: LeagueTabsProps<T>) {
  return (
    <div className="sticky top-16 z-30 -mx-4 mb-8 flex items-center justify-between gap-4 border-y border-neutral-100 bg-white/95 px-4 py-3 backdrop-blur md:static md:mx-0 md:border-x-0 md:border-t-0 md:px-0 md:pb-4 md:pt-0">
      <h2 className="flex shrink-0 items-center font-display text-sm font-bold uppercase tracking-wider text-neutral-900 md:text-base">
        <Trophy className="mr-2 h-5 w-5 text-brand-blue" aria-hidden="true" />
        選擇聯賽
      </h2>

      <div className="no-scrollbar flex min-w-0 items-center gap-4 overflow-x-auto text-xs font-bold">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            aria-pressed={active === option}
            className={`shrink-0 whitespace-nowrap border-b-2 px-1 pb-1 transition-colors ${
              active === option
                ? 'border-brand-blue text-brand-black'
                : 'border-transparent font-medium text-neutral-400 hover:text-neutral-600'
            }`}
          >
            {getLabel(option)}
          </button>
        ))}
      </div>
    </div>
  );
}

export default LeagueTabs;
