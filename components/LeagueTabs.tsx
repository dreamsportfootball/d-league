import React from 'react';
import { Trophy } from 'lucide-react';
import Tabs from './Tabs';

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
    <div className="mb-8 flex items-center justify-between gap-4 border-b border-neutral-100 pb-2">
      <h2 className="flex shrink-0 items-center font-display text-sm font-bold uppercase tracking-wider text-neutral-900 md:text-base">
        <Trophy className="mr-2 h-5 w-5 text-brand-blue" aria-hidden="true" />
        選擇聯賽
      </h2>

      <Tabs
        options={options}
        active={active}
        onChange={onChange}
        getLabel={getLabel}
        ariaLabel="選擇聯賽"
      />
    </div>
  );
}

export default LeagueTabs;
