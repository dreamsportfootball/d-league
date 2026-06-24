import React, { useEffect, useMemo, useRef, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useMatchQuery } from '../hooks/useMatchQuery';
import { useSeason } from '../hooks/useSeason';
import { MatchStatus, type Match } from '../types';
import type { SeasonTeam } from '../types/team';
import AutoFitText from './AutoFitText';
import MatchDialog from './MatchDialog';
import Tabs from './Tabs';

type MatchCenterFilter = 'Upcoming' | 'Results';

const localDateKey = (timestamp: string | Date) => {
  const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

interface MatchCardProps {
  match: Match;
  teamMap: Record<string, SeasonTeam>;
  onClick: (matchId: string) => void;
}

const MatchCard: React.FC<MatchCardProps> = ({ match, teamMap, onClick }) => {
  const homeTeam = teamMap[match.homeTeamId];
  const awayTeam = teamMap[match.awayTeamId];
  if (!homeTeam || !awayTeam) return null;

  const date = new Date(match.timestamp);
  const timeString = date.toLocaleTimeString('zh-TW', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  const dateString = `${date.getMonth() + 1}/${date.getDate()} ${date.toLocaleDateString('zh-TW', {
    weekday: 'short',
  })}`;
  const isFinished = match.status === MatchStatus.FINISHED;

  return (
    <button
      type="button"
      onClick={() => onClick(match.id)}
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
          <div className="flex items-center justify-between">
            <div className="flex min-w-0 flex-1 items-center space-x-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center">
                <img src={homeTeam.logo} alt={homeTeam.name} className="h-8 w-8 object-contain drop-shadow-sm" />
              </div>
              <div className="min-w-0 flex-1">
                <AutoFitText
                  text={homeTeam.name}
                  maxFontSize={18}
                  minFontSize={8}
                  className="font-bold tracking-tight text-brand-black"
                />
              </div>
            </div>
            <div className={`ml-2 shrink-0 font-display text-xl font-bold tabular-nums md:text-2xl ${isFinished ? 'text-brand-black' : 'text-neutral-300'}`}>
              {isFinished ? match.homeScore ?? '-' : '-'}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex min-w-0 flex-1 items-center space-x-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center">
                <img src={awayTeam.logo} alt={awayTeam.name} loading="lazy" className="h-8 w-8 object-contain drop-shadow-sm" />
              </div>
              <div className="min-w-0 flex-1">
                <AutoFitText
                  text={awayTeam.name}
                  maxFontSize={18}
                  minFontSize={8}
                  className="font-bold tracking-tight text-brand-black"
                />
              </div>
            </div>
            <div className={`ml-2 shrink-0 font-display text-xl font-bold tabular-nums md:text-2xl ${isFinished ? 'text-brand-black' : 'text-neutral-300'}`}>
              {isFinished ? match.awayScore ?? '-' : '-'}
            </div>
          </div>
        </div>

        <div className="mt-5 flex shrink-0 items-center justify-between border-t border-neutral-100 pt-3 text-xs">
          {!isFinished ? (
            <div className="flex min-w-0 items-center truncate font-medium text-neutral-400">
              <MapPin className="mr-1 h-3 w-3 shrink-0" aria-hidden="true" />
              <span className="truncate">{match.venue}</span>
            </div>
          ) : (
            <div className="flex w-full items-center justify-center font-bold text-brand-blue group-hover:underline">
              查看比賽詳情 <ChevronRight className="ml-1 h-3 w-3" aria-hidden="true" />
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
  const { selectedMatchId, openMatch, closeMatch } = useMatchQuery();
  const [filter, setFilter] = useState<MatchCenterFilter>('Results');
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const todayKey = localDateKey(new Date());
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
    const hasFinishedToday = finishedMatches.some((match) => localDateKey(match.timestamp) === todayKey);
    const hasScheduledToday = scheduledMatches.some((match) => localDateKey(match.timestamp) === todayKey);
    if (hasFinishedToday) setFilter('Results');
    else if (hasScheduledToday || scheduledMatches.length > 0) setFilter('Upcoming');
    else setFilter('Results');
  }, [activeSeason.id, finishedMatches, scheduledMatches, todayKey]);

  const filteredMatches = useMemo(() => {
    const source = filter === 'Results' ? finishedMatches : scheduledMatches;
    if (source.length === 0) return [];
    const targetDate = localDateKey(source[0].timestamp);
    return source
      .filter((match) => localDateKey(match.timestamp) === targetDate)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }, [filter, finishedMatches, scheduledMatches]);

  const upcomingLabel =
    filteredMatches.length > 0 && filter === 'Upcoming' && localDateKey(filteredMatches[0].timestamp) === todayKey
      ? '今日賽程'
      : '即將開賽';

  const scroll = (direction: 'left' | 'right') => {
    scrollContainerRef.current?.scrollBy({
      left: direction === 'left' ? -340 : 340,
      behavior: 'smooth',
    });
  };

  const handleFilterChange = (nextFilter: MatchCenterFilter) => {
    setFilter(nextFilter);
    scrollContainerRef.current?.scrollTo({ left: 0, behavior: 'smooth' });
  };

  return (
    <>
      <div className="bg-white py-8">
        <div className="container mx-auto px-4 md:px-6">
          <div className="mb-6 flex flex-col items-end justify-between md:flex-row">
            <div className="w-full md:w-auto">
              <div className="mb-2 flex items-baseline space-x-3">
                <h2 className="font-display text-3xl font-black uppercase tracking-tighter text-brand-black [-webkit-text-stroke:.5px_currentColor] md:[-webkit-text-stroke:0px]">
                  賽事 <span className="text-brand-blue">中心</span>
                </h2>
              </div>
              <div className="w-full rounded-full bg-neutral-100 p-1 md:w-auto">
                <Tabs
                  options={['Results', 'Upcoming'] as const}
                  active={filter}
                  onChange={handleFilterChange}
                  getLabel={(value) => (value === 'Results' ? '最新賽果' : upcomingLabel)}
                  variant="compact"
                  ariaLabel="切換賽事中心內容"
                />
              </div>
            </div>

            <div className="mt-4 hidden items-center space-x-2 md:flex">
              <button type="button" onClick={() => scroll('left')} className="rounded-full border border-neutral-200 p-2 text-neutral-500 transition-colors hover:bg-neutral-50 hover:text-brand-black" aria-label="向左捲動">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button type="button" onClick={() => scroll('right')} className="rounded-full border border-neutral-200 p-2 text-neutral-500 transition-colors hover:bg-neutral-50 hover:text-brand-black" aria-label="向右捲動">
                <ChevronRight className="h-4 w-4" />
              </button>
              <Link to="/schedule" className="ml-4 flex items-center text-sm font-bold text-neutral-500 transition-colors hover:text-brand-black">
                完整賽程 <ChevronRight className="ml-1 h-4 w-4" />
              </Link>
            </div>
          </div>

          <div className="group relative">
            <div
              ref={scrollContainerRef}
              className="no-scrollbar -mx-4 flex snap-x snap-proximity items-stretch overflow-x-auto px-4 pb-6 pt-1 scroll-smooth overscroll-x-contain touch-pan-x md:mx-0 md:px-0"
            >
              {filteredMatches.length > 0 ? (
                filteredMatches.map((match) => (
                  <MatchCard
                    key={match.id}
                    match={match}
                    teamMap={seasonData.teamMap}
                    onClick={openMatch}
                  />
                ))
              ) : (
                <div className="flex w-full flex-col items-center justify-center rounded-lg border border-dashed border-neutral-200 bg-neutral-50 py-12">
                  <CalendarDays className="mb-2 h-8 w-8 text-neutral-300" aria-hidden="true" />
                  <p className="text-sm font-medium text-neutral-400">
                    {seasonData.matches.length === 0
                      ? `${activeSeason.shortName} 賽程尚未公布`
                      : filter === 'Results'
                        ? '目前尚無完賽紀錄'
                        : '目前沒有即將進行的賽事'}
                  </p>
                </div>
              )}

              {filteredMatches.length > 0 && (
                <Link
                  to="/schedule"
                  className="group/more ml-4 mr-4 flex w-32 shrink-0 snap-center cursor-pointer flex-col items-center justify-center rounded-lg border border-neutral-100 bg-white shadow-sm transition-all hover:border-brand-blue hover:shadow-md active:scale-95"
                >
                  <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-neutral-50 transition-colors group-hover/more:bg-brand-blue group-hover/more:text-white">
                    <ChevronRight className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-bold uppercase text-neutral-500 group-hover/more:text-brand-black">查看全部</span>
                </Link>
              )}
            </div>
            <div className="pointer-events-none absolute bottom-6 right-0 top-0 w-8 bg-gradient-to-l from-white to-transparent md:hidden" />
          </div>
        </div>
      </div>

      <MatchDialog matchId={selectedMatchId} onClose={closeMatch} onSelectMatch={openMatch} />
    </>
  );
};

export default MatchCenter;
