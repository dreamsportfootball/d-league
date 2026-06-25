import React, { useMemo } from 'react';
import { UsersRound } from 'lucide-react';
import { useSeason } from '../hooks/useSeason';

type RegistrationProgressVariant = 'compact' | 'full';

interface RegistrationProgressProps {
  variant?: RegistrationProgressVariant;
  className?: string;
}

const formatDate = (value: string): string => value.replaceAll('-', '/');

const RegistrationProgress: React.FC<RegistrationProgressProps> = ({
  variant = 'full',
  className = '',
}) => {
  const { activeSeason } = useSeason();
  const progress = activeSeason.registrationProgress;

  const expectedTeamCount = useMemo(() => {
    const counts = activeSeason.enabledLeagues
      .map((leagueId) => activeSeason.leagues[leagueId]?.expectedTeamCount)
      .filter((count): count is number => typeof count === 'number');

    return counts.length > 0 && counts.every((count) => count === counts[0])
      ? counts[0]
      : null;
  }, [activeSeason.enabledLeagues, activeSeason.leagues]);

  if (!progress) return null;

  const compact = variant === 'compact';
  const leagueLabel = activeSeason.enabledLeagues.join('、');

  return (
    <section
      className={`${compact ? 'mt-8 border-y border-neutral-200 py-5' : 'border-y border-neutral-200 bg-neutral-50 px-5 py-6 md:px-8 md:py-8'} ${className}`}
      aria-label="賽季報名動態"
    >
      <div className={`flex gap-5 ${compact ? 'flex-col' : 'flex-col md:flex-row md:items-end md:justify-between'}`}>
        <div>
          <div className="flex items-center gap-2 text-brand-blue">
            <UsersRound className="h-4 w-4" aria-hidden="true" />
            <p className="text-[10px] font-black uppercase tracking-[0.22em]">報名動態</p>
          </div>
          <p className={`mt-2 font-black leading-tight text-brand-black ${compact ? 'text-lg' : 'text-xl md:text-2xl'}`}>
            已有 {progress.receivedTeams} 支球隊完成正式報名
          </p>
          <p className="mt-2 text-sm font-bold text-brand-blue">
            {activeSeason.shortName} 賽季持續接受報名中
          </p>
        </div>

        {!compact && (
          <div className="md:text-right">
            <p className="font-display text-6xl font-black leading-none tracking-tight text-brand-black md:text-7xl">
              {progress.receivedTeams}
              <span className="ml-2 font-sans text-sm font-black tracking-widest text-neutral-400">支球隊</span>
            </p>
            <p className="mt-2 text-xs font-medium text-neutral-400">
              更新至 {formatDate(progress.updatedAt)}
            </p>
          </div>
        )}
      </div>

      {compact && (
        <p className="mt-2 text-xs font-medium text-neutral-400">
          更新至 {formatDate(progress.updatedAt)}
        </p>
      )}

      <div className="mt-5 border-l-2 border-brand-blue pl-4">
        <p className="text-xs font-bold leading-6 text-neutral-600">
          {leagueLabel}
          {expectedTeamCount !== null
            ? ` 各級別預計錄取 ${expectedTeamCount} 支球隊`
            : ' 各級別錄取規模依主辦單位公告為準'}
        </p>
        <p className="mt-1 text-[11px] font-medium leading-5 text-neutral-500">
          {progress.note}
        </p>
      </div>
    </section>
  );
};

export default RegistrationProgress;
