import React, { useEffect, useMemo, useRef, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useSeason } from '../hooks/useSeason';
import { MatchStatus, type Match } from '../types';
import type { SeasonTeam } from '../types/team';
import { formatTaipeiDateKey, formatTaipeiMonthDayWeekday, formatTaipeiTime } from '../utils/dateFormat';
import AutoFitText from './AutoFitText';
import MatchDialog from './MatchDialog';

type MatchCenterFilter = 'Upcoming' | 'Results';

interface MatchCardProps {
  match: Match;
  teamMap: Record<string, SeasonTeam>;
  onOpenMatch: (matchId: string) => void;
}

const MatchCard: React.FC<MatchCardProps> = ({ match, teamMap, onOpenMatch }) => {
  const homeTeam = teamMap[match.homeTeamId];
  const awayTeam = teamMap[match.awayTeamId];
  if (!homeTeam || !awayTeam) return null;

  const timeString = formatTaipeiTime(match.timestamp);
  const dateString = formatTaipeiMonthDayWeekday(match.timestamp);
  const isFinished = match.status === MatchStatus.FINISHED;

  return (
    <button
      type="button"
      onClick={() => onOpenMatch(match.id)}
      data-analytics-event="match_open"
      data-analytics-label={match.id}
      className="group mr-3 flex w-[84vw] shrink-0 snap-center select-none flex-col border border-neutral-200 bg-white text-left transition-colors last:mr-0 hover:border-brand-blue active:bg-neutral-50 md:mr-4 md:w-80"
    >
      <div className="flex shrink-0 items-center justify-between border-b border-neutral-200 bg-neutral-50 px-4 py-2.5">
        <div className="flex min-w-0 items-center">
          <span className="whitespace-nowrap text-[11px] font-black uppercase tracking-[0.12em] text-brand-black">
            {match.league} · 第{match.round}輪
          </span>
          <span className="ml-2 truncate border-l border-neutral-300 pl-2 text-[11px] font-bold text-neutral-400">
            {dateString}
          </span>
        </div>
        <span className="ml-2 shrink-0 text-[11px] font-black text-brand-blue">
          {isFinished ? '完賽' : timeString}
        </span>
      </div>

      <div className="flex flex-grow flex-col justify-center p-5">
        <div className="space-y-4">
          {[
            { team: homeTeam, score: match.homeScore },
            { team: awayTeam, score: match.awayScore },
          ].map(({ team, score }) => (
            <div key={team.id} className="flex items-center justify-between">
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center">
                  <img src={team.logo} alt={team.name} className="h-9 w-9 object-contain" />
                </div>
                <div className="min-w-0 flex-1">
                  <AutoFitText
                    text={team.name}
                    maxFontSize={18}
                    minFontSize={8}
                    className="font-bold tracking-tight text-brand-black"
                  />
                </div>
              </div>
              <div
                className={`ml-3 shrink-0 font-display text-2xl font-black tabular-nums ${
                  isFinished ? 'text-brand-black' : 'text-neutral-300'
                }`}
              >
                {isFinished ? score ?? '-' : '-'}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-5 flex min-h-7 shrink-0 items-center border-t border-neutral-200 pt-3 text-xs">
          {!isFinished ? (
            <div className="flex min-w-0 items-center truncate font-bold text-neutral-400">
              <MapPin className="mr-1 h-3 w-3 shrink-0" />
              <span className="truncate">{match.venue}</span>
            </div>
          ) : (
            <div className="flex w-full items-center justify-end font-black text-brand-blue">
              查看比賽 <ChevronRight className="ml-1 h-3 w-3" />
            </div>
          )}
        </div>
      </div>

      <div className="flex h-1 w-full shrink-0">
        <div className="w-1/2" style={{ backgroundColor: homeTeam.primaryColor }} />
        <div className="w-1/2" style={{ backgroundColor: awayTeam.primaryColor }} />
      </div>
    </button>
  );
};

const MatchCenter: React.FC = () => {
  const { activeSeason, seasonData } = useSeason();
  const [filter, setFilter] = useState<MatchCenterFilter>('Results');
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const todayKey = formatTaipeiDateKey(new Date());

  const scheduledMatches = useMemo(
    () =>
      seasonData.matches
        .filter((match) => match.status === MatchStatus.SCHEDULED)
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()),
    [seasonData.matches],
  );

  const finishedMatches = useMemo(
    () =>
      seasonData.matches
        .filter((match) => match.status === MatchStatus.FINISHED)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),
    [seasonData.matches],
  );

  useEffect(() => {
    const hasFinishedToday = finishedMatches.some(
      (match) => formatTaipeiDateKey(match.timestamp) === todayKey,
    );
    const hasScheduledToday = scheduledMatches.some(
      (match) => formatTaipeiDateKey(match.timestamp) === todayKey,
    );

    if (hasFinishedToday) setFilter('Results');
    else if (hasScheduledToday || scheduledMatches.length > 0) setFilter('Upcoming');
    else setFilter('Results');
  }, [activeSeason.id, finishedMatches, scheduledMatches, todayKey]);

  const filteredMatches = useMemo(() => {
    const source = filter === 'Results' ? finishedMatches : scheduledMatches;
    if (source.length === 0) return [];

    const targetDate = formatTaipeiDateKey(source[0].timestamp);
    return source
      .filter((match) => formatTaipeiDateKey(match.timestamp) === targetDate)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }, [filter, finishedMatches, scheduledMatches]);

  const hasAnyMatches = seasonData.matches.length > 0;
  const upcomingLabel =
    filteredMatches.length > 0 &&
    filter === 'Upcoming' &&
    formatTaipeiDateKey(filteredMatches[0].timestamp) === todayKey
      ? '今日賽程'
      : '即將開賽';

  const scroll = (direction: 'left' | 'right') =>
    scrollContainerRef.current?.scrollBy({
      left: direction === 'left' ? -340 : 340,
      behavior: 'smooth',
    });

  return (
    <>
      <div className="bg-white py-6 md:py-8">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex flex-col gap-5 border-b border-neutral-200 pb-5 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="mb-1 text-[10px] font-black uppercase tracking-[0.24em] text-brand-blue">
                Match Centre · {activeSeason.shortName}
              </p>
              <h2 className="font-display text-3xl font-black uppercase tracking-tight text-brand-black md:text-4xl">
                賽事中心
              </h2>
            </div>

            <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
              {hasAnyMatches && (
                <div className="flex min-h-11 items-center gap-5" role="tablist" aria-label="切換賽事中心內容">
                  {(['Results', 'Upcoming'] as const).map((value) => {
                    const active = filter === value;
                    return (
                      <button
                        key={value}
                        type="button"
                        role="tab"
                        aria-selected={active}
                        onClick={() => {
                          setFilter(value);
                          scrollContainerRef.current?.scrollTo({ left: 0, behavior: 'smooth' });
                        }}
                        className={`relative min-h-11 py-3 text-xs font-black tracking-wider transition-colors ${
                          active ? 'text-brand-black' : 'text-neutral-400 hover:text-brand-black'
                        }`}
                      >
                        {value === 'Results' ? '最新賽果' : upcomingLabel}
                        <span
                          className={`absolute inset-x-0 bottom-0 h-0.5 transition-opacity ${
                            active ? 'bg-brand-blue opacity-100' : 'opacity-0'
                          }`}
                        />
                      </button>
                    );
                  })}
                </div>
              )}

              <Link
                to={`/schedule?season=${activeSeason.id}`}
                className="inline-flex min-h-11 items-center py-3 text-xs font-black tracking-wider text-brand-blue transition-colors hover:text-brand-black"
              >
                完整賽程
                <ChevronRight className="ml-1 h-4 w-4" />
              </Link>

              {hasAnyMatches && (
                <div className="hidden items-center gap-2 md:flex" aria-label="賽事橫向捲動控制">
                  <button
                    type="button"
                    onClick={() => scroll('left')}
                    className="flex h-10 w-10 items-center justify-center border border-neutral-200 text-neutral-500 transition-colors hover:border-brand-black hover:text-brand-black"
                    aria-label="向左捲動"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => scroll('right')}
                    className="flex h-10 w-10 items-center justify-center border border-neutral-200 text-neutral-500 transition-colors hover:border-brand-black hover:text-brand-black"
                    aria-label="向右捲動"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {hasAnyMatches ? (
            <div className="group relative pt-6">
              <div
                ref={scrollContainerRef}
                className="no-scrollbar -mx-4 flex snap-x snap-proximity items-stretch overflow-x-auto px-4 pb-2 scroll-smooth md:mx-0 md:px-0"
              >
                {filteredMatches.length > 0 ? (
                  filteredMatches.map((match) => (
                    <MatchCard
                      key={match.id}
                      match={match}
                      teamMap={seasonData.teamMap}
                      onOpenMatch={setSelectedMatchId}
                    />
                  ))
                ) : (
                  <div className="flex w-full items-center gap-4 border-y border-neutral-200 bg-neutral-50 px-5 py-7 md:px-7">
                    <CalendarDays className="h-7 w-7 shrink-0 text-neutral-300" />
                    <p className="text-sm font-bold text-neutral-500">
                      {filter === 'Results' ? '目前尚無完賽紀錄' : '目前沒有即將進行的賽事'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="grid gap-5 py-7 md:grid-cols-[auto_minmax(0,1fr)_auto] md:items-center md:gap-6 md:py-9">
              <div className="flex h-12 w-12 items-center justify-center border border-neutral-200 bg-neutral-50">
                <CalendarDays className="h-6 w-6 text-brand-blue" aria-hidden="true" />
              </div>
              <div>
                <h3 className="font-display text-xl font-black text-brand-black md:text-2xl">
                  {activeSeason.shortName} 賽程尚未公布
                </h3>
                <p className="mt-1 max-w-2xl text-sm font-medium leading-6 text-neutral-500">
                  完整賽程完成編排並由主辦單位正式公告後，將在此顯示比賽日期、對戰組合與最新賽果。
                </p>
              </div>
              <Link
                to="/news"
                className="inline-flex min-h-11 items-center justify-center border border-brand-black px-5 py-3 text-xs font-black tracking-wider text-brand-black transition-colors hover:bg-brand-black hover:text-white md:justify-self-end"
              >
                查看最新公告
                <ChevronRight className="ml-1 h-4 w-4" />
              </Link>
            </div>
          )}
        </div>
      </div>

      {selectedMatchId && (
        <MatchDialog
          matchId={selectedMatchId}
          onClose={() => setSelectedMatchId(null)}
          onSelectMatch={setSelectedMatchId}
          navigationMatchIds={filteredMatches.map((match) => match.id)}
        />
      )}
    </>
  );
};

export default MatchCenter;
