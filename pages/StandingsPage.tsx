import React, { useEffect, useMemo, useState } from 'react';
import { AlertCircle, BookOpen, ChevronRight } from 'lucide-react';
import EmptyState from '../components/EmptyState';
import ResponsiveFilterDrawer, { type FilterDrawerField } from '../components/ResponsiveFilterDrawer';
import SeasonPageHeader from '../components/SeasonPageHeader';
import Standings from '../components/Standings';
import { CURRENT_SEASON_ID } from '../config/siteConfig';
import { useSeason } from '../hooks/useSeason';
import { MatchStatus } from '../types';
import type { LeagueId, SeasonId } from '../types/season';

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
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [draftSeasonId, setDraftSeasonId] = useState<SeasonId>(activeSeasonId);
  const [draftLeague, setDraftLeague] = useState<LeagueId>(activeLeague);

  const sortedSeasons = useMemo(
    () => [...availableSeasons].sort((a, b) => b.id.localeCompare(a.id)),
    [availableSeasons],
  );
  const draftSeason = availableSeasons.find((season) => season.id === draftSeasonId) ?? activeSeason;
  const currentSeason = availableSeasons.find((season) => season.id === CURRENT_SEASON_ID) ?? activeSeason;
  const defaultLeague = currentSeason.enabledLeagues[0];

  useEffect(() => {
    if (!activeSeason.enabledLeagues.includes(activeLeague)) {
      const fallbackLeague = activeSeason.enabledLeagues[0];
      setActiveLeague(fallbackLeague);
      try {
        window.sessionStorage.setItem('standingsActiveLeague', fallbackLeague);
      } catch {
        // Session storage may be unavailable.
      }
    }
  }, [activeLeague, activeSeason.enabledLeagues, activeSeason.id]);

  const updateLeague = (league: LeagueId) => {
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
  const seasonButtonLabel =
    activeSeasonId === CURRENT_SEASON_ID ? '過往賽季' : `${activeSeason.shortName} 賽季`;
  const filterFields: FilterDrawerField[] = [
    {
      id: 'season',
      label: '賽季',
      value: draftSeasonId,
      displayValue: draftSeason.shortName,
      options: sortedSeasons.map((season) => ({ value: season.id, label: season.shortName })),
      onChange: (value) => {
        const nextSeasonId = value as SeasonId;
        const nextSeason = availableSeasons.find((season) => season.id === nextSeasonId);
        setDraftSeasonId(nextSeasonId);
        if (nextSeason && !nextSeason.enabledLeagues.includes(draftLeague)) {
          setDraftLeague(nextSeason.enabledLeagues[0]);
        }
      },
    },
    {
      id: 'league',
      label: '級別',
      value: draftLeague,
      displayValue: draftLeague,
      options: draftSeason.enabledLeagues.map((league) => ({ value: league, label: league })),
      onChange: (value) => setDraftLeague(value as LeagueId),
    },
  ];

  const openFilters = () => {
    setDraftSeasonId(activeSeasonId);
    setDraftLeague(activeLeague);
    setFiltersOpen(true);
  };

  const clearFilters = () => {
    setDraftSeasonId(CURRENT_SEASON_ID);
    setDraftLeague(defaultLeague);
  };

  const applyFilters = () => {
    const nextSeason = availableSeasons.find((season) => season.id === draftSeasonId);
    if (!nextSeason) return;

    const nextLeague = nextSeason.enabledLeagues.includes(draftLeague)
      ? draftLeague
      : nextSeason.enabledLeagues[0];

    if (nextLeague !== activeLeague) updateLeague(nextLeague);
    if (draftSeasonId !== activeSeasonId) setActiveSeason(draftSeasonId);
    setFiltersOpen(false);
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

        <div className="mb-8 flex min-h-14 items-center border-b border-neutral-100">
          <div className="hidden shrink-0 items-center md:flex">
            <span className="text-sm font-bold tracking-[0.02em] text-brand-black">
              {activeSeason.shortName} 賽季
            </span>
            <span className="mx-4 h-4 w-px bg-neutral-200" aria-hidden="true" />
          </div>

          <div
            role="tablist"
            aria-label="切換積分榜聯賽級別"
            className="hidden min-w-0 items-center gap-1 md:flex"
          >
            {activeSeason.enabledLeagues.map((league) => {
              const selected = activeLeague === league;
              return (
                <button
                  key={league}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  onClick={() => updateLeague(league)}
                  className={`relative min-h-11 min-w-11 px-2 text-sm font-bold tracking-[0.02em] transition-colors after:absolute after:bottom-0 after:left-1/2 after:h-0.5 after:-translate-x-1/2 after:transition-[width,background-color] after:duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-inset ${
                    selected
                      ? 'text-brand-blue after:w-5 after:bg-brand-blue'
                      : 'text-neutral-500 after:w-0 after:bg-transparent hover:text-brand-black'
                  }`}
                >
                  {league}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={openFilters}
            aria-label="篩選積分榜"
            className="ml-auto inline-flex min-h-11 shrink-0 items-center pl-3 text-[11px] font-semibold text-brand-black transition-colors hover:text-brand-blue focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-2 md:text-sm md:font-bold"
          >
            {seasonButtonLabel}
            <ChevronRight className="ml-1.5 h-3.5 w-3.5 md:h-4 md:w-4" aria-hidden="true" />
          </button>
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
                  {activeSeason.standingsDisplay.showPointsSummary && (
                    <p className="mb-2 text-neutral-500">
                      勝 {activeSeason.rules.winPoints} 分、和 {activeSeason.rules.drawPoints} 分、負 {activeSeason.rules.lossPoints} 分
                    </p>
                  )}
                  <p className="mb-2 text-neutral-500">積分相同時，依序比較：</p>
                  <ol className="ml-1 list-inside list-decimal space-y-1">
                    {activeSeason.standingsDisplay.rankingRules.map((rule) => (
                      <li key={rule}>{rule}</li>
                    ))}
                  </ol>
                  {activeSeason.standingsDisplay.footerNote && (
                    <p className="mt-3 text-neutral-500">{activeSeason.standingsDisplay.footerNote}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <ResponsiveFilterDrawer
        open={filtersOpen}
        fields={filterFields}
        onClose={() => setFiltersOpen(false)}
        onClear={clearFilters}
        clearDisabled={draftSeasonId === CURRENT_SEASON_ID && draftLeague === defaultLeague}
        onApply={applyFilters}
        applyLabel="查看積分榜"
        title="篩選積分榜"
        subtitle="選擇賽季與聯賽級別"
      />
    </div>
  );
};

export default StandingsPage;
