import React from 'react';
import { ChevronDown } from 'lucide-react';
import { useSeason } from '../hooks/useSeason';
import type { SeasonId } from '../types/season';

interface SeasonSelectorProps {
  compact?: boolean;
}

const SeasonSelector: React.FC<SeasonSelectorProps> = ({ compact = false }) => {
  const { activeSeasonId, availableSeasons, setActiveSeason } = useSeason();

  return (
    <label className="relative inline-flex items-center">
      <span className="sr-only">選擇賽季</span>
      <select
        value={activeSeasonId}
        onChange={(event) => setActiveSeason(event.target.value as SeasonId)}
        className={`appearance-none border border-neutral-200 bg-white text-brand-black font-bold uppercase tracking-wider outline-none transition-colors hover:border-brand-blue focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20 ${
          compact
            ? 'h-9 rounded-md pl-3 pr-8 text-xs'
            : 'h-10 rounded-md pl-4 pr-9 text-sm'
        }`}
        aria-label="選擇賽季"
      >
        {availableSeasons.map((season) => (
          <option key={season.id} value={season.id}>
            {season.shortName}
          </option>
        ))}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-2.5 h-4 w-4 text-neutral-500"
        aria-hidden="true"
      />
    </label>
  );
};

export default SeasonSelector;
