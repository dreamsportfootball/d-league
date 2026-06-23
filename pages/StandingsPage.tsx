import React, { useEffect, useMemo, useState } from 'react';
import { AlertCircle, BookOpen, Trophy } from 'lucide-react';
import EmptyState from '../components/EmptyState';
import SeasonSelector from '../components/SeasonSelector';
import Standings from '../components/Standings';
import { useSeason } from '../hooks/useSeason';
import { MatchStatus } from '../types';
import type { LeagueId } from '../types/season';

const StandingsPage: React.FC = () => {
  const { activeSeason, seasonData } = useSeason();
  const [activeLeague, setActiveLeague] = useState<LeagueId>(() => {
    try {
      const saved = window.sessionStorage.getItem('standingsActiveLeague');
      return saved === 'L1' || saved === 'L2' || saved === 'L3' ? saved : 'L1';
    } catch {
      return 'L1';
    }
  });

  useEffect(() => {
    if (!activeSeason.enabledLeagues.includes(activeLeague)) {
      setActiveLeague(activeSeason.enabledLeagues[0]);
    }
  }, [activeLeague, activeSeason.enabledLeagues, activeSeason.id]);

  const handleLeagueChange = (league: LeagueId) => {
    setActiveLeague(league);
    try {
      window.sessionStorage.setItem('standingsActiveLeague', league);
    } catch {
      // Session storage may be unavailable.
    }
  };

  const leagueConfig = activeSeason.leagues[activeLeague];
  const leagueTeams = useMemo(
    () => seasonData.teams.filter((team) => team.leagueId === activeLeague),
    [activeLeague, seasonData.teams],
  );
  const hasFinishedMatches = useMemo(
    () =>
      seasonData.matches.some(
        (match) =>
          match.league === activeLeague &&
          (match.status === MatchStatus.FINISHED ||
            (match.homeScore !== null && match.awayScore !== null)),
      ),
    [activeLeague, seasonData.matches],
  );

  const shouldShowEmptyState = leagueTeams.length === 0 || !hasFinishedMatches;

  return (
    <div className="min-h-[85vh] bg-white pb-24 pt-6 md:pt-24">
      <div className="container mx-auto max-w-7xl px-4 md:px-12">
        <div className="mb-6 flex flex-col justify-between gap-4 md:mb-12 md:flex-row md:items-end">
          <div>
            <h1 className="mb-2 font-display text-4xl font-black uppercase tracking-tight text-brand-black [-webkit-text-stroke:.25px_currentColor] md:mb-4 md:text-6xl md:font-extrabold md:[-webkit-text-stroke:0px]">
              積分 <span className="text-brand-blue">榜</span>
            </h1>
            <p className="text-sm font-medium tracking-wide text-neutral-400 md:text-base">
              {activeSeason.displayName} {activeLeague} 即時排名與數據
            </p>
          </div>

          <div className="flex w-full justify-end md:w-auto">
            <SeasonSelector />
          </div>
        </div>

        <div className="mb-8 flex items-center justify-between">
          <h3 className="flex items-center font-display text-base font-bold uppercase tracking-wider text-neutral-900">
            <Trophy className="mr-2 h-5 w-5 text-brand-blue" aria-hidden="true" />
            選擇聯賽
          </h3>
          <div className="flex space-x-4 text-xs font-bold">
            {activeSeason.enabledLeagues.map((league) => (
              <button
                key={league}
                type="button"
                onClick={() => handleLeagueChange(league)}
                className={`whitespace-nowrap border-b-2 px-1 pb-1 transition-all ${
                  activeLeague === league
                    ? 'border-brand-blue font-bold text-brand-black'
                    : 'border-transparent font-medium text-neutral-400 hover:text-neutral-600'
                }`}
              >
                <span className="font-display md:hidden">{league}</span>
                <span className="hidden md:inline">{activeSeason.leagues[league]?.displayName ?? league}</span>
              </button>
            ))}
          </div>
        </div>

        {shouldShowEmptyState ? (
          <EmptyState
            title="新賽季尚未開始"
            description="新賽季尚未開始，積分榜將於首輪比賽後更新"
            showRegistrationLink={activeSeason.status === 'registration'}
          />
        ) : (
          <div className="grid grid-cols-1 items-start gap-12 xl:grid-cols-12">
            <div className="xl:col-span-8">
              <Standings league={activeLeague} variant="page" />
              <div className="mt-6 flex items-center text-[10px] font-bold uppercase tracking-widest text-neutral-400">
                <div className="mr-2 h-1.5 w-1.5 rounded-full bg-brand-blue" />
                League Champion
              </div>
            </div>

            <div className="sticky top-24 hidden flex-col space-y-8 pl-8 xl:col-span-4 xl:flex">
              <div>
                <div className="mb-4 flex items-center text-brand-black">
                  <BookOpen className="mr-2 h-4 w-4" aria-hidden="true" />
                  <h3 className="text-xs font-bold uppercase tracking-widest">賽制說明</h3>
                </div>
                <ul className="space-y-6">
                  <li>
                    <span className="mb-1 block text-sm font-bold text-brand-black">冠軍獎項</span>
                    <p className="text-xs leading-relaxed text-neutral-500">各組冠軍頒發獎盃乙座與獎牌 20 面</p>
                  </li>
                  <li>
                    <span className="mb-1 block text-sm font-bold text-brand-black">賽制循環</span>
                    <p className="text-xs leading-relaxed text-neutral-500">
                      {leagueConfig?.description ?? '賽制資訊將由主辦單位公布'}
                    </p>
                  </li>
                </ul>
              </div>

              <div className="mt-8">
                <div className="mb-4 flex items-center text-brand-black">
                  <AlertCircle className="mr-2 h-4 w-4" aria-hidden="true" />
                  <h3 className="text-xs font-bold uppercase tracking-widest">排名規則</h3>
                </div>
                <div className="text-xs leading-relaxed text-neutral-700">
                  <p className="mb-2 text-neutral-500">積分相同時，依序比較：</p>
                  <ol className="ml-1 list-inside list-decimal space-y-1">
                    <li>得失球差</li>
                    <li>進球數</li>
                    <li>相關隊伍間對戰成績</li>
                    <li>黃紅牌</li>
                    <li>並列</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StandingsPage;
