import React, { useEffect, useMemo, useRef, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useSeason } from '../hooks/useSeason';
import { MatchStatus, type Match } from '../types';
import type { SeasonTeam } from '../types/team';
import { formatTaipeiDateKey, formatTaipeiMonthDayWeekday, formatTaipeiTime } from '../utils/dateFormat';
import AutoFitText from './AutoFitText';
import MatchDialog from './MatchDialog';
import Tabs from './Tabs';

type MatchCenterFilter = 'Upcoming' | 'Results';

const HOME_MATCH_CENTER_FILTER_STORAGE_KEY = 'dleague:home-match-center-filter';

const readStoredFilter = (): MatchCenterFilter | null => {
  try {
    const saved = window.sessionStorage.getItem(HOME_MATCH_CENTER_FILTER_STORAGE_KEY);
    return saved === 'Upcoming' || saved === 'Results' ? saved : null;
  } catch {
    return null;
  }
};

const writeStoredFilter = (filter: MatchCenterFilter): void => {
  try {
    window.sessionStorage.setItem(HOME_MATCH_CENTER_FILTER_STORAGE_KEY, filter);
  } catch {
    // Session storage may be unavailable.
  }
};

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
      className="group relative mr-3 flex w-[85vw] shrink-0 snap-center select-none flex-col overflow-hidden rounded-lg border border-neutral-200 bg-white text-left shadow-sm transition-all duration-200 last:mr-0 hover:-translate-y-1 hover:shadow-lg active:scale-95 md:mr-4 md:w-80"
    >
      <div className="flex shrink-0 items-center justify-between border-b border-neutral-100 bg-neutral-50 px-4 py-2">
        <div className="flex min-w-0 items-center">
          <span className="whitespace-nowrap text-xs font-bold uppercase tracking-wider text-neutral-500">
            {match.league} · 第{match.round}輪
          </span>
          <span className="ml-2 truncate border-l border-neutral-200 pl-2 text-xs font-medium text-neutral-400">
            {dateString}
          </span>
        </div>
        <span className="ml-2 shrink-0 text-xs font-bold text-neutral-400">
          {isFinished ? '完賽' : timeString}
        </span>
      </div>
      <div className="flex flex-grow flex-col justify-center p-5">
        <div className="space-y-3">
          {[
            { team: homeTeam, score: match.homeScore },
            { team: awayTeam, score: match.awayScore },
          ].map(({ team, score }) => (
            <div key={team.id} className="flex items-center justify-between">
              <div className="flex min-w-0 flex-1 items-center space-x-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center">
                  <img src={team.logo} alt={team.name} className="h-8 w-8 object-contain drop-shadow-sm" />
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
                className={`ml-2 shrink-0 font-display text-xl font-bold tabular-nums md:text-2xl ${
                  isFinished ? 'text-brand-black' : 'text-neutral-300'
                }`}
              >
                {isFinished ? score ?? '-' : '-'}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-5 flex shrink-0 items-center justify-between border-t border-neutral-100 pt-3 text-xs">
          {!isFinished ? (
            <div className="flex min-w-0 items-center truncate font-medium text-neutral-400">
              <MapPin className="mr-1 h-3 w-3 shrink-0" />
              <span className="truncate">{match.venue}</span>
            </div>
          ) : (
            <div className="flex w-full items-center justify-center font-bold text-brand-blue group-hover:underline">
              查看比賽 <ChevronRight className="ml-1 h-3 w-3" />
            </div>
          )}
        </div>
      </div>
      <div className="flex h-1.5 w-full shrink-0">
        <div className="w-1/2" style={{ backgroundColor: homeTeam.primaryColor }} />
        <div className="w-1/2" style={{ backgroundColor: awayTeam.primaryColor }} />
      </div>
    </button>
  );
};

const MatchCenter: React.FC = () => {
  const { activeSeason, seasonData } = useSeason();
  const [filter, setFilter] = useState<MatchCenterFilter>(() => readStoredFilter() ?? 'Results');
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
    const savedFilter = readStoredFilter();
    const savedFilterHasData = savedFilter === 'Results'
      ? finishedMatches.length > 0
      : savedFilter === 'Upcoming'
        ? scheduledMatches.length > 0
        : false;

    if (savedFilter && savedFilterHasData) {
      setFilter(savedFilter);
      return;
    }

    const hasFinishedToday = finishedMatches.some(
      (match) => formatTaipeiDateKey(match.timestamp) === todayKey,
    );
    const hasScheduledToday = scheduledMatches.some(
      (match) => formatTaipeiDateKey(match.timestamp) === todayKey,
    );
    const nextFilter: MatchCenterFilter = hasFinishedToday
      ? 'Results'
      : hasScheduledToday || scheduledMatches.length > 0
        ? 'Upcoming'
        : 'Results';

    setFilter(nextFilter);
    writeStoredFilter(nextFilter);
  }, [activeSeason.id, finishedMatches, scheduledMatches, todayKey]);

  const filteredMatches = useMemo(() => {
    const source = filter === 'Results' ? finishedMatches : scheduledMatches;
    if (source.length === 0) return [];
    const targetDate = formatTaipeiDateKey(source[0].timestamp);
    return source
      .filter((match) => formatTaipeiDateKey(match.timestamp) === targetDate)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }, [filter, finishedMatches, scheduledMatches]);

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
  const hasNoSeasonMatches = seasonData.matches.length === 0;
  const emptyStateTitle = hasNoSeasonMatches
    ? `${activeSeason.shortName} 賽程尚未公布`
    : filter === 'Results'
      ? '目前尚無完賽紀錄'
      : '目前沒有即將進行的賽事';

  return (
    <>
      <div className="bg-white py-6 md:py-8">
        <div className="container mx-auto px-4 md:px-6">
          <div className="mb-4 flex flex-col items-end justify-between md:mb-6 md:flex-row">
            <div className="w-full md:w-auto">
              <h2 className="mb-2 font-display text-3xl font-black uppercase tracking-tighter text-brand-black">
                賽事 <span className="text-brand-blue">中心</span>
              </h2>
              <div className="w-full border-b border-neutral-200 md:w-auto md:rounded-full md:border-0 md:bg-neutral-100 md:p-1 [&_[role=tablist]]:w-full [&_[role=tablist]]:gap-0 md:[&_[role=tablist]]:gap-2 [&_[role=tab]]:min-h-11 [&_[role=tab]]:flex-1 [&_[role=tab]]:rounded-none [&_[role=tab]]:border-b-2 [&_[role=tab]]:border-transparent [&_[role=tab]]:px-2 [&_[role=tab]]:py-2.5 [&_[role=tab]]:text-sm [&_[aria-selected=true]]:border-brand-blue [&_[aria-selected=true]]:bg-transparent [&_[aria-selected=true]]:shadow-none md:[&_[role=tab]]:min-h-0 md:[&_[role=tab]]:flex-none md:[&_[role=tab]]:rounded-full md:[&_[role=tab]]:border-b-0 md:[&_[role=tab]]:px-4 md:[&_[role=tab]]:py-1.5 md:[&_[role=tab]]:text-xs md:[&_[aria-selected=true]]:bg-white md:[&_[aria-selected=true]]:shadow-sm">
                <Tabs
                  options={['Results', 'Upcoming'] as const}
                  active={filter}
                  onChange={(nextFilter) => {
                    setFilter(nextFilter);
                    writeStoredFilter(nextFilter);
                    scrollContainerRef.current?.scrollTo({ left: 0, behavior: 'smooth' });
                  }}
                  getLabel={(value) => (value === 'Results' ? '最新賽果' : upcomingLabel)}
                  variant="compact"
                  ariaLabel="切換賽事中心內容"
                />
              </div>
            </div>
            <div className="mt-4 hidden items-center space-x-2 md:flex">
              <button
                type="button"
                onClick={() => scroll('left')}
                className="rounded-full border border-neutral-200 p-2 text-neutral-500"
                aria-label="向左捲動"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => scroll('right')}
                className="rounded-full border border-neutral-200 p-2 text-neutral-500"
                aria-label="向右捲動"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
              <Link
                to={`/schedule?season=${activeSeason.id}`}
                className="ml-4 flex items-center text-sm font-bold text-neutral-500 hover:text-brand-black"
              >
                完整賽程 <ChevronRight className="ml-1 h-4 w-4" />
              </Link>
            </div>
          </div>
          <div className="group relative">
            <div
              ref={scrollContainerRef}
              className={`no-scrollbar -mx-4 flex snap-x snap-proximity items-stretch overflow-x-auto px-4 pt-1 scroll-smooth md:mx-0 md:px-0 md:pb-6 ${
                filteredMatches.length > 0 ? 'pb-6' : 'pb-0'
              }`}
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
                <div className="flex w-full items-center gap-3 rounded-md border border-neutral-200 bg-neutral-50 px-4 py-5 md:flex-col md:justify-center md:gap-0 md:rounded-lg md:border-dashed md:px-0 md:py-12">
                  <CalendarDays className="h-6 w-6 shrink-0 text-neutral-300 md:mb-2 md:h-8 md:w-8" />
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-neutral-600 md:text-center md:font-medium md:text-neutral-400">
                      {emptyStateTitle}
                    </p>
                    {hasNoSeasonMatches && (
                      <p className="mt-1 text-xs leading-5 text-neutral-400 md:hidden">
                        公布後會在這裡顯示最新賽果與即將開賽
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
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
