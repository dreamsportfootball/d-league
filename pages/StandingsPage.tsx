import React, { useEffect, useMemo, useState } from 'react';
import { AlertCircle, BookOpen } from 'lucide-react';
import EmptyState from '../components/EmptyState';
import LeagueTabs from '../components/LeagueTabs';
import SeasonPageHeader from '../components/SeasonPageHeader';
import Standings from '../components/Standings';
import { useSeason } from '../hooks/useSeason';
import { MatchStatus } from '../types';
import type { LeagueId, RankingCriterion } from '../types/season';

const rankingCriterionLabels: Record<RankingCriterion, string> = {
  GOAL_DIFFERENCE: '總得失球差',
  GOALS_FOR: '總進球數',
  HEAD_TO_HEAD_POINTS: '相關球隊間對戰積分',
  HEAD_TO_HEAD_GOAL_DIFFERENCE: '相關球隊間對戰得失球差',
  HEAD_TO_HEAD_GOALS_FOR: '相關球隊間對戰進球數',
  FEWEST_DIRECT_RED: '直接紅牌較少',
  FEWEST_SECOND_YELLOW: '雙黃退場較少',
  FEWEST_YELLOW: '黃牌較少',
};

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
    () =>
      seasonData.teams.filter(
        (team) => team.leagueId === activeLeague && team.competitionStatus !== 'WITHDRAWN',
      ),
    [activeLeague, seasonData.teams],
  );
  const hasFinishedMatches = useMemo(
    () =>
      seasonData.matches.some(
        (match) =>
          match.league === activeLeague &&
          match.resultType !== 'VOID' &&
          match.countsForStandings !== false &&
          (match.status === MatchStatus.FINISHED ||
            (match.homeScore !== null && match.awayScore !== null)),
      ),
    [activeLeague, seasonData.matches],
  );

  const shouldShowEmptyState = leagueTeams.length === 0 || !hasFinishedMatches;

  return (
    <div className="min-h-[85vh] bg-white pb-24 pt-6 md:pt-24">
      <div className="container mx-auto max-w-7xl px-4 md:px-12">
        <SeasonPageHeader
          title="積分"
          accent="榜"
          description={`${activeSeason.displayName} ${activeLeague} 即時排名與數據`}
        />

        <LeagueTabs
          options={activeSeason.enabledLeagues}
          active={activeLeague}
          onChange={handleLeagueChange}
          getLabel={(league) => activeSeason.leagues[league]?.displayName ?? league}
        />

        {shouldShowEmptyState ? (
          <EmptyState
            title="新賽季尚未開始"
            description="積分榜將於首輪比賽完成後更新"
            showRegistrationLink={activeSeason.status === 'registration'}
          />
        ) : (
          <div className="grid grid-cols-1 items-start gap-12 xl:grid-cols-12">
            <div className="xl:col-span-8">
              <Standings league={activeLeague} variant="page" />
              <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-[10px] font-bold uppercase tracking-widest text-neutral-400">
                <span className="flex items-center">
                  <span className="mr-2 h-1.5 w-1.5 rounded-full bg-brand-blue" />
                  冠軍
                </span>
                {leagueConfig && leagueConfig.promotionPlaces > 0 && (
                  <span className="flex items-center">
                    <span className="mr-2 h-1.5 w-1.5 rounded-full bg-green-500" />
                    升級區
                  </span>
                )}
                {leagueConfig && leagueConfig.relegationPlaces > 0 && (
                  <span className="flex items-center">
                    <span className="mr-2 h-1.5 w-1.5 rounded-full bg-red-500" />
                    降級區
                  </span>
                )}
                <span className="flex items-center">
                  <span className="mr-2 h-1.5 w-1.5 rounded-full bg-amber-400" />
                  待公開抽籤
                </span>
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
                  <p className="mb-2 text-neutral-500">
                    勝 {activeSeason.rules.winPoints} 分、和 {activeSeason.rules.drawPoints} 分、負 {activeSeason.rules.lossPoints} 分
                  </p>
                  <p className="mb-2 text-neutral-500">積分相同時，依序比較：</p>
                  <ol className="ml-1 list-inside list-decimal space-y-1">
                    {activeSeason.rules.rankingCriteria.map((criterion) => (
                      <li key={criterion}>{rankingCriterionLabels[criterion]}</li>
                    ))}
                  </ol>
                  {activeSeason.id === '2026-27' && (
                    <p className="mt-3 text-neutral-500">
                      全部相同且影響冠軍、升降級或遞補順位時，以公開抽籤決定；其他情況得並列
                    </p>
                  )}
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
