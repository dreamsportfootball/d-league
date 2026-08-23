import React, { useMemo } from 'react';
import { Trophy } from 'lucide-react';
import { getPlayerHonours } from '../services/playerHonours';

interface PlayerHonoursProps {
  playerId: string;
  className?: string;
}

const PlayerHonours: React.FC<PlayerHonoursProps> = ({ playerId, className = '' }) => {
  const honours = useMemo(() => getPlayerHonours(playerId), [playerId]);

  if (honours.length === 0) return null;

  return (
    <section className={className}>
      <div className="flex items-center border-b border-neutral-200 pb-3">
        <Trophy className="mr-2 h-5 w-5 text-brand-blue" aria-hidden="true" />
        <h2 className="font-display text-2xl font-extrabold text-brand-black">榮譽</h2>
      </div>

      <div className="divide-y divide-neutral-100">
        {honours.map((honour) => (
          <div
            key={honour.id}
            className="grid gap-1 py-4 sm:grid-cols-[92px_minmax(0,1fr)] sm:items-center sm:gap-4"
          >
            <span className="text-xs font-bold tabular-nums text-neutral-400">
              {honour.seasonName}
            </span>
            <div className="min-w-0">
              <div className="flex min-w-0 items-baseline gap-2">
                <span className="shrink-0 text-xs font-black text-brand-blue">
                  {honour.leagueId}
                </span>
                <span className="truncate text-sm font-black text-brand-black sm:text-base">
                  {honour.title}
                </span>
              </div>
              <p className="mt-1 truncate text-xs font-medium text-neutral-400">
                {honour.kind === 'GOLDEN_BOOT' ? '個人榮譽' : honour.teamName}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default PlayerHonours;
