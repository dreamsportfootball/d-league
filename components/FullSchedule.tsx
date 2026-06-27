import React, { useMemo } from 'react';
import type { Match } from '../types';
import { MatchStatus } from '../types';
import type { LeagueId } from '../types/season';
import type { SeasonTeam } from '../types/team';
import { formatTaipeiDate, formatTaipeiDateWithWeekday, formatTaipeiTime } from '../utils/dateFormat';
import AutoFitText from './AutoFitText';

type LeagueFilter = LeagueId | 'ALL';
type FullScheduleVariant = 'default' | 'team';

interface FullScheduleProps {
  matches: Match[];
  teamMap: Record<string, SeasonTeam>;
  onMatchClick: (matchId: string) => void;
  leagueFilter: LeagueFilter;
  variant?: FullScheduleVariant;
}

const renderScore = (match: Match) => {
  if (
    match.status === MatchStatus.FINISHED &&
    match.homeScore !== null &&
    match.awayScore !== null
  ) {
    return (
      <span className="font-display text-xl font-black tracking-tight text-brand-black tabular-nums md:text-2xl">
        {match.homeScore} - {match.awayScore}
      </span>
    );
  }

  return (
    <span className="font-display text-xs font-medium uppercase tracking-widest text-neutral-300">
      VS
    </span>
  );
};

const getMatchStatusLabel = (match: Match): string => {
  if (match.administrativeNote?.trim()) return match.administrativeNote.trim();
  return match.status === MatchStatus.FINISHED ? '比賽結束' : '尚未開賽';
};

const FullSchedule: React.FC<FullScheduleProps> = ({
  matches,
  teamMap,
  onMatchClick,
  leagueFilter,
  variant = 'default',
}) => {
  const filteredMatches = useMemo(() => {
    const filtered =
      leagueFilter === 'ALL'
        ? matches.slice()
        : matches.filter((match) => match.league === leagueFilter);

    return filtered.sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
    );
  }, [leagueFilter, matches]);

  let lastDateHeader = '';

  return (
    <div className="relative w-full">
      {filteredMatches.map((match) => {
        const homeTeam = teamMap[match.homeTeamId];
        const awayTeam = teamMap[match.awayTeamId];
        if (!homeTeam || !awayTeam) return null;

        const fullDateHeader = formatTaipeiDate(match.timestamp);
        const mobileDateHeader = formatTaipeiDateWithWeekday(match.timestamp);
        const timeStr = formatTaipeiTime(match.timestamp);
        const isNewDate = fullDateHeader !== lastDateHeader;
        if (isNewDate) lastDateHeader = fullDateHeader;
        const isFinished = match.status === MatchStatus.FINISHED;
        const hasScore = isFinished && match.homeScore !== null && match.awayScore !== null;
        const statusLabel = getMatchStatusLabel(match);

        return (
          <React.Fragment key={match.id}>
            {isNewDate && (
              <>
                <div className="mt-4 flex items-center border-b border-neutral-100 pb-2 pt-1 md:hidden">
                  <span className="mr-2 h-3.5 w-[3px] bg-brand-accent" aria-hidden="true" />
                  <span className="font-display text-[12px] font-black tracking-[0.08em] text-brand-black">
                    {mobileDateHeader}
                  </span>
                </div>
                <div
                  className={variant === 'team'
                    ? 'mb-2 mt-8 hidden border-b border-neutral-100 bg-white py-3 md:block'
                    : 'sticky top-16 z-30 mb-2 mt-8 hidden border-b border-neutral-100 bg-white/95 py-3 backdrop-blur-md md:block'}
                >
                  <div className="flex items-center">
                    <div className="mr-3 h-4 w-1 bg-brand-accent" />
                    <span className="font-display text-sm font-black uppercase tracking-[0.15em] text-brand-black">
                      {fullDateHeader}
                    </span>
                  </div>
                </div>
              </>
            )}

            <button
              type="button"
              onClick={() => onMatchClick(match.id)}
              data-analytics-event="match_open"
              data-analytics-label={match.id}
              aria-label={`${homeTeam.name} 對 ${awayTeam.name}，${statusLabel}`}
              className="w-full border-b border-neutral-100 px-1 py-4 text-left transition-colors active:bg-neutral-50 md:hidden"
            >
              <div className="mb-2 flex min-w-0 items-center justify-between gap-3">
                <div className="flex shrink-0 items-center gap-2.5">
                  <span className="font-display text-[12px] font-bold tabular-nums text-neutral-500">
                    {timeStr}
                  </span>
                  <span className="text-[9px] font-bold tracking-[0.08em] text-neutral-400">
                    {match.league} 第{match.round}輪
                  </span>
                </div>
                {variant === 'team' && (
                  <span
                    className="min-w-0 truncate text-right text-[9px] font-bold tracking-wide text-neutral-400"
                    title={statusLabel}
                  >
                    {statusLabel}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-[minmax(0,1fr)_52px_minmax(0,1fr)] items-center gap-2">
                <div className="flex min-w-0 items-center justify-end gap-1.5">
                  <div className="min-w-0 flex-1 text-right">
                    <AutoFitText
                      text={homeTeam.name}
                      maxFontSize={14}
                      minFontSize={8}
                      fitPadding={2}
                      className="font-bold text-brand-black"
                    />
                  </div>
                  <img
                    src={homeTeam.logo}
                    alt={homeTeam.name}
                    loading="lazy"
                    decoding="async"
                    className="h-[30px] w-[30px] shrink-0 object-contain"
                  />
                </div>

                <div className="flex min-w-[52px] items-center justify-center text-center">
                  {hasScore ? (
                    <span className="font-display text-[19px] font-black tracking-tight text-brand-black tabular-nums">
                      {match.homeScore} - {match.awayScore}
                    </span>
                  ) : (
                    <span className="font-display text-[10px] font-medium uppercase tracking-[0.16em] text-neutral-300">
                      VS
                    </span>
                  )}
                </div>

                <div className="flex min-w-0 items-center justify-start gap-1.5">
                  <img
                    src={awayTeam.logo}
                    alt={awayTeam.name}
                    loading="lazy"
                    decoding="async"
                    className="h-[30px] w-[30px] shrink-0 object-contain"
                  />
                  <div className="min-w-0 flex-1 text-left">
                    <AutoFitText
                      text={awayTeam.name}
                      maxFontSize={14}
                      minFontSize={8}
                      fitPadding={2}
                      className="font-bold text-brand-black"
                    />
                  </div>
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => onMatchClick(match.id)}
              data-analytics-event="match_open"
              data-analytics-label={match.id}
              aria-label={`${homeTeam.name} 對 ${awayTeam.name}，${statusLabel}`}
              className="group relative hidden w-full cursor-pointer flex-col items-center overflow-hidden border-b border-neutral-50 py-5 text-left transition-all duration-300 md:flex md:flex-row md:hover:bg-neutral-50"
            >
              <div className="absolute bottom-0 left-0 top-0 w-1 -translate-x-full bg-brand-blue transition-transform duration-300 md:group-hover:translate-x-0" />

              <div className="flex w-full flex-col items-center transition-transform duration-300 md:flex-row md:group-hover:translate-x-1">
                <div className="mb-3 flex w-full shrink-0 items-center justify-between px-2 md:mb-0 md:w-32 md:flex-col md:items-start md:px-4">
                  <span className="font-display text-sm font-bold text-neutral-400 transition-colors group-hover:text-brand-black">
                    {timeStr}
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                    {match.league} 第{match.round}輪
                  </span>
                </div>

                <div className="grid w-full flex-1 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 px-2 md:gap-6">
                  <div className="flex min-w-0 items-center justify-end space-x-2 md:space-x-4">
                    <div className="min-w-0 flex-1 text-right">
                      <AutoFitText
                        text={homeTeam.name}
                        maxFontSize={17}
                        minFontSize={9}
                        className="font-bold text-brand-black"
                      />
                    </div>
                    <img
                      src={homeTeam.logo}
                      alt={homeTeam.name}
                      loading="lazy"
                      decoding="async"
                      className="h-8 w-8 shrink-0 object-contain md:h-10 md:w-10"
                    />
                  </div>

                  <div className="flex min-w-[50px] justify-center md:min-w-[80px]">
                    {renderScore(match)}
                  </div>

                  <div className="flex min-w-0 items-center justify-start space-x-2 md:space-x-4">
                    <img
                      src={awayTeam.logo}
                      alt={awayTeam.name}
                      loading="lazy"
                      decoding="async"
                      className="h-8 w-8 shrink-0 object-contain md:h-10 md:w-10"
                    />
                    <div className="min-w-0 flex-1 text-left">
                      <AutoFitText
                        text={awayTeam.name}
                        maxFontSize={17}
                        minFontSize={9}
                        className="font-bold text-brand-black"
                      />
                    </div>
                  </div>
                </div>

                <div className="hidden w-32 shrink-0 flex-col items-end pr-4 text-right md:flex">
                  {variant === 'team' ? (
                    <>
                      <span className="max-w-full truncate text-[10px] font-bold tracking-wide text-neutral-500" title={statusLabel}>
                        {statusLabel}
                      </span>
                      <span className="mt-1 text-[9px] font-bold uppercase tracking-widest text-brand-blue">
                        查看詳情 →
                      </span>
                    </>
                  ) : (
                    <span className={`text-[10px] font-bold uppercase tracking-widest ${isFinished ? 'text-brand-blue' : 'text-neutral-400'}`}>
                      {isFinished ? '查看比賽 →' : '查看賽程 →'}
                    </span>
                  )}
                </div>
              </div>
            </button>
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default FullSchedule;
