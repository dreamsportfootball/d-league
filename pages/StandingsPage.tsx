import React, { useEffect, useMemo, useState } from 'react';
import { AlertCircle, BookOpen } from 'lucide-react';
import DataFilterToolbar from '../components/DataFilterToolbar';
import DesktopFilterPopover from '../components/DesktopFilterPopover';
import EmptyState from '../components/EmptyState';
import ResponsiveFilterDrawer, { type FilterDrawerField } from '../components/ResponsiveFilterDrawer';
import SeasonPageHeader from '../components/SeasonPageHeader';
import Standings from '../components/Standings';
import { useSeason } from '../hooks/useSeason';
import { MatchStatus } from '../types';
import type { LeagueId, RankingCriterion, SeasonId } from '../types/season';

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
  const {
    activeSeasonId,
    activeSeason,
    seasonData,
    availableSeasons,
    setActiveSeason,
  } = useSeason();
  const [activeLeague, setActiveLeague] = useState<LeagueId>(() => {
    try {
      const saved = window.sessionStorage.getItem('standingsActiveLeague');
      return saved === 'L1' || saved === 'L2' || saved === 'L3' ? saved : 'L1';
    } catch {
      return 'L1';
    }
  });
  const [desktopFiltersOpen, setDesktopFiltersOpen] = useState(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [draftSeasonId, setDraftSeasonId] = useState<SeasonId>(activeSeasonId);
  const [draftLeague, setDraftLeague] = useState<LeagueId>(activeLeague);

  const sortedSeasons = useMemo(
    () => [...availableSeasons].sort((a, b) => b.id.localeCompare(a.id)),
    [availableSeasons],
  );
  const draftSeason = availableSeasons.find((season) => season.id === draftSeasonId) ?? activeSeason;

  useEffect(() => {
    if (!activeSeason.enabledLeagues.includes(activeLeague)) {
      setActiveLeague(activeSeason.enabledLeagues[0]);
    }
  }, [activeLeague, activeSeason.enabledLeagues, activeSeason.id]);

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
  const defaultDraftLeague = draftSeason.enabledLeagues[0];
  const activeFilterCount = activeLeague === activeSeason.enabledLeagues[0] ? 0 : 1;
  const filterFields: FilterDrawerField[] = [
    {
      id: 'season',
      label: '賽季',
      value: draftSeasonId,
      displayValue: draftSeason.shortName,
      options: sortedSeasons.map((season) => ({ value: season.id, label: season.shortName })),
      onChange: (value) => {
        const seasonId = value as SeasonId;
        const nextSeason = availableSeasons.find((season) => season.id === seasonId);
        if (!nextSeason) return;
        setDraftSeasonId(seasonId);
        setDraftLeague(nextSeason.enabledLeagues[0]);
      },
    },
    {
      id: 'league',
      label: '聯賽級別',
      value: draftLeague,
      displayValue: draftLeague,
      options: draftSeason.enabledLeagues.map((league) => ({
        value: league,
        label: draftSeason.leagues[league]?.displayName ?? league,
      })),
      onChange: (value) => setDraftLeague(value as LeagueId),
    },
  ];

  const prepareDraft = () => {
    setDraftSeasonId(activeSeasonId);
    setDraftLeague(activeLeague);
  };

  const openDesktopFilters = () => {
    prepareDraft();
    setDesktopFiltersOpen(true);
  };

  const openMobileFilters = () => {
    prepareDraft();
    setMobileFiltersOpen(true);
  };

  const applyFilters = () => {
    if (draftSeasonId !== activeSeasonId) setActiveSeason(draftSeasonId);
    setActiveLeague(draftLeague);
    try {
      window.sessionStorage.setItem('standingsActiveLeague', draftLeague);
    } catch {
      // Session storage may be unavailable.
    }
    setDesktopFiltersOpen(false);
    setMobileFiltersOpen(false);
  };

  return (
    <div className="min-h-[85vh] bg-white pb-24 pt-6 md:pt-24">
      <div className="container mx-auto max-w-7xl px-4 md:px-12">
        <SeasonPageHeader
          title="積分"
          accent="榜"
          description={`${activeSeason.displayName} ${activeLeague} 即時排名與數據`}
          showMobileSeasonSelector={false}
          showDesktopSeasonSelector={false}
        />

        <div className="relative">
          <DataFilterToolbar
            primaryText={`${leagueTeams.length} 支球隊`}
            secondaryText={`${activeSeason.shortName} · ${activeLeague}`}
            onOpenDesktop={() => {
              if (desktopFiltersOpen) {
                setDesktopFiltersOpen(false);
              } else {
                openDesktopFilters();
              }
            }}
            onOpenMobile={openMobileFilters}
            activeFilterCount={activeFilterCount}
            ariaLabel="開啟積分榜篩選"
          />

          <DesktopFilterPopover
            open={desktopFiltersOpen}
            fields={filterFields}
            onClose={() => setDesktopFiltersOpen(false)}
            onClear={() => setDraftLeague(defaultDraftLeague)}
            clearDisabled={draftLeague === defaultDraftLeague}
            onApply={applyFilters}
            applyLabel="查看積分榜"
            title="篩選積分榜"
            subtitle="選擇賽季與聯賽級別"
          />
        </div>

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

      <ResponsiveFilterDrawer
        open={mobileFiltersOpen}
        fields={filterFields}
        onClose={() => setMobileFiltersOpen(false)}
        onClear={() => setDraftLeague(defaultDraftLeague)}
        clearDisabled={draftLeague === defaultDraftLeague}
        onApply={applyFilters}
        applyLabel="查看積分榜"
        title="篩選積分榜"
        subtitle="選擇賽季與聯賽級別"
      />
    </div>
  );
};

export default StandingsPage;
