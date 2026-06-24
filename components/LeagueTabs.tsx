import React from 'react';
import { Trophy } from 'lucide-react';
import Tabs from './Tabs';

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
  return (
    <div className="mb-6 flex items-end justify-between gap-3 border-b border-neutral-100 md:mb-8 md:items-center md:gap-4 md:pb-2">
      <h2 className="flex shrink-0 items-center pb-2 font-display text-xs font-bold uppercase tracking-wider text-neutral-900 md:pb-0 md:text-base">
        <Trophy className="mr-1.5 h-4 w-4 text-brand-blue md:mr-2 md:h-5 md:w-5" aria-hidden="true" />
        選擇聯賽
      </h2>

      <div className="flex min-w-0 flex-1 items-end justify-end md:hidden" role="tablist" aria-label="選擇聯賽">
        {options.map((option) => {
          const isActive = active === option;
          return (
            <button
              key={option}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onChange(option)}
              className={`relative min-h-11 min-w-[42px] shrink-0 px-2 pb-2 text-xs font-bold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-inset ${
                isActive ? 'text-brand-black' : 'font-medium text-neutral-400'
              }`}
            >
              {getMobileLabel ? getMobileLabel(option) : getLabel(option)}
              <span
                className={`absolute inset-x-2 bottom-0 h-0.5 transition-colors ${
                  isActive ? 'bg-brand-blue' : 'bg-transparent'
                }`}
                aria-hidden="true"
              />
            </button>
          );
        })}
      </div>

      <div className="hidden min-w-0 md:block">
        <Tabs
          options={options}
          active={active}
          onChange={onChange}
          getLabel={getLabel}
          ariaLabel="選擇聯賽"
        />
      </div>
    </div>
  );
}

export default LeagueTabs;
