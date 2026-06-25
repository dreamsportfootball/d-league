import React, { useMemo } from 'react';
import { TrendingUp } from 'lucide-react';
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

  const targetTeams = useMemo(
    () =>
      activeSeason.enabledLeagues.reduce(
        (total, leagueId) => total + (activeSeason.leagues[leagueId]?.expectedTeamCount ?? 0),
        0,
      ),
    [activeSeason.enabledLeagues, activeSeason.leagues],
  );

  if (!progress || targetTeams <= 0) return null;

  const percentage = Math.min(100, Math.max(0, (progress.receivedTeams / targetTeams) * 100));
  const overTarget = progress.receivedTeams > targetTeams;
  const compact = variant === 'compact';

  return (
    <section
      className={`${compact ? 'mt-8 border-y border-neutral-200 py-5' : 'border-y border-neutral-200 bg-neutral-50 px-5 py-6 md:px-8 md:py-8'} ${className}`}
      aria-label="賽季報名進度"
    >
      <div className={`flex gap-5 ${compact ? 'flex-col' : 'flex-col md:flex-row md:items-end md:justify-between'}`}>
        <div>
          <div className="flex items-center gap-2 text-brand-blue">
            <TrendingUp className="h-4 w-4" aria-hidden="true" />
            <p className="text-[10px] font-black uppercase tracking-[0.22em]">報名進度</p>
          </div>
          <p className={`mt-2 font-black text-brand-black ${compact ? 'text-base' : 'text-lg md:text-xl'}`}>
            目前已收到 {progress.receivedTeams} 隊正式報名
          </p>
          <p className="mt-1 text-xs font-medium text-neutral-400">
            更新至 {formatDate(progress.updatedAt)}
          </p>
        </div>

        <div className={compact ? '' : 'md:text-right'}>
          <p className="font-display text-4xl font-black tracking-tight text-brand-black md:text-5xl">
            {progress.receivedTeams}
            <span className="mx-1 text-xl text-neutral-300 md:text-2xl">／</span>
            <span className="text-2xl text-neutral-500 md:text-3xl">{targetTeams}</span>
            <span className="ml-2 font-sans text-xs font-black tracking-widest text-neutral-400">隊</span>
          </p>
          {overTarget && (
            <p className="mt-1 text-xs font-black text-brand-blue">報名隊數已超過原定賽事規模</p>
          )}
        </div>
      </div>

      <div
        className="mt-5 h-2 overflow-hidden bg-neutral-200"
        role="progressbar"
        aria-label={`已收到 ${progress.receivedTeams} 隊正式報名，預計規模 ${targetTeams} 隊`}
        aria-valuemin={0}
        aria-valuemax={targetTeams}
        aria-valuenow={Math.min(progress.receivedTeams, targetTeams)}
      >
        <div
          className="h-full bg-brand-blue transition-[width] duration-700"
          style={{ width: `${percentage}%` }}
        />
      </div>

      <p className="mt-3 text-[11px] font-medium leading-5 text-neutral-500">
        {progress.note}
      </p>
    </section>
  );
};

export default RegistrationProgress;
