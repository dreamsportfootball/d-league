import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, ShieldAlert, User } from 'lucide-react';
import DataFilterToolbar from '../components/DataFilterToolbar';
import EmptyState from '../components/EmptyState';
import ResponsiveFilterDrawer, { type FilterDrawerField } from '../components/ResponsiveFilterDrawer';
import SeasonPageHeader from '../components/SeasonPageHeader';
import Tabs from '../components/Tabs';
import { useSeason } from '../hooks/useSeason';
import { calculatePlayerCompetitionStats } from '../services/competitionEngine';
import { calculateDiscipline } from '../services/disciplineEngine';
import type { SuspensionReason } from '../types/discipline';
import type { LeagueId, SeasonId } from '../types/season';
import { formatTaipeiDate } from '../utils/dateFormat';

interface RankedPlayerRow {
  subjectId: string;
  name: string;
  teamId: string;
  goals: number;
  yellowCards: number;
  secondYellowDismissals: number;
  directRedCards: number;
  rank: number;
}

interface AggregatedPlayerRow extends Omit<RankedPlayerRow, 'rank'> {
  lastEventTimestamp: string;
}

type StatsTab = 'SCORERS' | 'CARDS' | 'SUSPENSIONS';

const tabLabels: Record<StatsTab, string> = {
  SCORERS: '射手榜',
  CARDS: '紅黃牌',
  SUSPENSIONS: '停賽與紀律',
};

const suspensionReasonLabel: Record<SuspensionReason, string> = {
  ACCUMULATED_YELLOW: '累積黃牌',
  SECOND_YELLOW: '單場雙黃',
  DIRECT_RED: '直接紅牌',
  MANUAL_DECISION: '紀律處分',
};

const formatMatchLabel = (timestamp: string) => formatTaipeiDate(timestamp);

const StatsPage: React.FC = () => {
  const {
    activeSeasonId,
    activeSeason,
    seasonData,
    availableSeasons,
    setActiveSeason,
  } = useSeason();
  const [activeLeague, setActiveLeague] = useState<LeagueId>(() => {
    try {
      const saved = window.sessionStorage.getItem('statsActiveLeague');
      return saved === 'L1' || saved === 'L2' || saved === 'L3' ? saved : 'L1';
    } catch {
      return 'L1';
    }
  });
  const [activeTab, setActiveTab] = useState<StatsTab>('SCORERS');
  const [filtersOpen, setFiltersOpen] = useState(false);
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

  const playerTeamStats = useMemo(
    () =>
      calculatePlayerCompetitionStats(
        activeLeague,
        seasonData.teams,
        seasonData.players,
        seasonData.matches,
        seasonData.matchEvents,
      ),
    [activeLeague, seasonData.matchEvents, seasonData.matches, seasonData.players, seasonData.teams],
  );

  const playerStats = useMemo<AggregatedPlayerRow[]>(() => {
    const grouped = new Map<string, AggregatedPlayerRow>();

    playerTeamStats.forEach((row) => {
      const existing = grouped.get(row.subjectId);
      if (!existing) {
        grouped.set(row.subjectId, { ...row });
        return;
      }

      existing.goals += row.goals;
      existing.yellowCards += row.yellowCards;
      existing.secondYellowDismissals += row.secondYellowDismissals;
      existing.directRedCards += row.directRedCards;
      if (new Date(row.lastEventTimestamp).getTime() >= new Date(existing.lastEventTimestamp).getTime()) {
        existing.teamId = row.teamId;
        existing.lastEventTimestamp = row.lastEventTimestamp;
      }
    });

    grouped.forEach((row) => {
      const player = seasonData.players.find((item) => item.id === row.subjectId);
      const currentTeam = player ? seasonData.teamMap[player.teamId] : undefined;
      if (
        currentTeam?.leagueId === activeLeague &&
        currentTeam.competitionStatus !== 'WITHDRAWN'
      ) {
        row.teamId = currentTeam.id;
      }
    });

    return [...grouped.values()];
  }, [activeLeague, playerTeamStats, seasonData.players, seasonData.teamMap]);

  const discipline = useMemo(
    () =>
      calculateDiscipline({
        matches: seasonData.matches,
        matchEvents: seasonData.matchEvents,
        players: seasonData.players,
        lineups: seasonData.lineups,
        decisions: seasonData.disciplineDecisions,
        rules: activeSeason.rules,
      }),
    [
      activeSeason.rules,
      seasonData.disciplineDecisions,
      seasonData.lineups,
      seasonData.matchEvents,
      seasonData.matches,
      seasonData.players,
    ],
  );

  const rankedList = useMemo<RankedPlayerRow[]>(() => {
    const filtered = playerStats
      .filter((player) => {
        const team = seasonData.teamMap[player.teamId];
        if (!team || team.leagueId !== activeLeague) return false;
        return activeTab === 'SCORERS'
          ? player.goals > 0
          : player.yellowCards > 0 || player.secondYellowDismissals > 0 || player.directRedCards > 0;
      })
      .sort((a, b) => {
        if (activeTab === 'SCORERS') {
          return b.goals - a.goals || a.name.localeCompare(b.name, 'zh-TW');
        }
        if (b.directRedCards !== a.directRedCards) return b.directRedCards - a.directRedCards;
        if (b.secondYellowDismissals !== a.secondYellowDismissals) {
          return b.secondYellowDismissals - a.secondYellowDismissals;
        }
        if (b.yellowCards !== a.yellowCards) return b.yellowCards - a.yellowCards;
        return a.name.localeCompare(b.name, 'zh-TW');
      });

    let currentRank = 1;
    return filtered.map((player, index) => {
      if (activeTab === 'SCORERS' && index > 0 && player.goals !== filtered[index - 1].goals) {
        currentRank = index + 1;
      } else if (activeTab !== 'SCORERS') {
        currentRank = index + 1;
      }
      return { ...player, rank: currentRank };
    });
  }, [activeLeague, activeTab, playerStats, seasonData.teamMap]);

  const activeSuspensions = useMemo(
    () =>
      discipline.suspensions
        .filter((suspension) => {
          if (suspension.remainingMatches <= 0) return false;
          const summary = discipline.summaries.find((item) => item.subjectId === suspension.subjectId);
          const team = seasonData.teamMap[summary?.currentTeamId ?? suspension.teamIdAtIssue];
          return team?.leagueId === activeLeague;
        })
        .sort((a, b) => b.remainingMatches - a.remainingMatches || a.subjectName.localeCompare(b.subjectName, 'zh-TW')),
    [activeLeague, discipline.summaries, discipline.suspensions, seasonData.teamMap],
  );

  const publicDecisions = useMemo(
    () =>
      seasonData.disciplineDecisions
        .filter((decision) => decision.status !== 'OVERTURNED' && decision.publicSummary)
        .filter((decision) => seasonData.teamMap[decision.teamId]?.leagueId === activeLeague)
        .sort((a, b) => new Date(b.issuedAt).getTime() - new Date(a.issuedAt).getTime()),
    [activeLeague, seasonData.disciplineDecisions, seasonData.teamMap],
  );

  const hasData =
    activeTab === 'SUSPENSIONS'
      ? activeSuspensions.length > 0 || publicDecisions.length > 0
      : rankedList.length > 0;

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

  const openFilters = () => {
    setDraftSeasonId(activeSeasonId);
    setDraftLeague(activeLeague);
    setFiltersOpen(true);
  };

  const applyFilters = () => {
    if (draftSeasonId !== activeSeasonId) setActiveSeason(draftSeasonId);
    setActiveLeague(draftLeague);
    try {
      window.sessionStorage.setItem('statsActiveLeague', draftLeague);
    } catch {
      // Session storage may be unavailable.
    }
    setFiltersOpen(false);
  };

  return (
    <div className="min-h-[85vh] bg-white pb-24 pt-6 md:pt-24">
      <div className="container mx-auto max-w-7xl px-4 md:px-12">
        <SeasonPageHeader
          title="數據"
          accent="中心"
          description={`${activeSeason.displayName} ${activeLeague} 球員與紀律數據`}
          showMobileSeasonSelector={false}
          showDesktopSeasonSelector={false}
        />

        <DataFilterToolbar
          primaryText={`${activeSeason.shortName} · ${activeLeague}`}
          onOpen={openFilters}
          activeFilterCount={activeFilterCount}
          ariaLabel="開啟數據中心篩選"
        />

        <div className="mb-8 border-b border-neutral-100">
          <Tabs
            options={['SCORERS', 'CARDS', 'SUSPENSIONS'] as const}
            active={activeTab}
            onChange={setActiveTab}
            getLabel={(tab) => tabLabels[tab]}
            ariaLabel="切換數據類別"
          />
        </div>

        {!hasData ? (
          <EmptyState
            title={activeTab === 'SUSPENSIONS' ? '目前沒有執行中的停賽' : '新賽季尚未開始'}
            description={
              activeTab === 'SUSPENSIONS'
                ? '停賽名單及紀律公告將依正式賽事紀錄更新'
                : '射手榜及紅黃牌紀錄將於首輪比賽後更新'
            }
            showRegistrationLink={activeSeason.status === 'registration'}
          />
        ) : activeTab === 'SUSPENSIONS' ? (
          <div className="space-y-10">
            {activeSuspensions.length > 0 && (
              <section>
                <div className="mb-4 flex items-center">
                  <ShieldAlert className="mr-2 h-5 w-5 text-brand-blue" aria-hidden="true" />
                  <h2 className="font-display text-xl font-black uppercase tracking-wide text-brand-black">執行中停賽</h2>
                </div>
                <div className="divide-y divide-neutral-100 border-y border-neutral-200">
                  {activeSuspensions.map((suspension) => {
                    const summary = discipline.summaries.find((item) => item.subjectId === suspension.subjectId);
                    const team = seasonData.teamMap[summary?.currentTeamId ?? suspension.teamIdAtIssue];
                    const nextMatch = suspension.nextMatchId
                      ? seasonData.matches.find((match) => match.id === suspension.nextMatchId)
                      : undefined;
                    return (
                      <div key={suspension.id} className="grid gap-4 py-5 md:grid-cols-[1fr_auto] md:items-center">
                        <div className="flex min-w-0 items-center gap-3">
                          {team && <img src={team.logo} alt="" className="h-8 w-8 shrink-0 object-contain" />}
                          <div className="min-w-0">
                            <p className="truncate text-base font-black text-brand-black">{suspension.subjectName}</p>
                            <p className="mt-1 text-xs font-bold text-neutral-400">
                              {team?.shortName ?? suspension.teamIdAtIssue} · {suspensionReasonLabel[suspension.reason]}
                            </p>
                          </div>
                        </div>
                        <div className="text-left md:text-right">
                          <p className="font-display text-2xl font-black text-brand-blue">
                            剩餘 {suspension.remainingMatches} 場
                          </p>
                          <p className="mt-1 text-xs font-medium text-neutral-400">
                            {nextMatch ? `預計於 ${formatMatchLabel(nextMatch.timestamp)} 執行` : '下一場正式比賽執行'}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {publicDecisions.length > 0 && (
              <section className="rounded-xl border border-neutral-200 bg-neutral-50 p-5 md:p-6">
                <div className="mb-4 flex items-center">
                  <AlertTriangle className="mr-2 h-4 w-4 text-neutral-500" aria-hidden="true" />
                  <h2 className="text-sm font-black uppercase tracking-widest text-brand-black">紀律公告</h2>
                </div>
                <div className="space-y-4">
                  {publicDecisions.map((decision) => (
                    <div key={decision.id} className="border-b border-neutral-200 pb-4 last:border-0 last:pb-0">
                      <p className="text-xs font-bold text-neutral-400">{formatMatchLabel(decision.issuedAt)}</p>
                      <p className="mt-1 text-sm font-bold text-brand-black">{decision.subjectName}</p>
                      <p className="mt-1 text-sm leading-6 text-neutral-600">{decision.publicSummary}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        ) : (
          <div className="flex w-full flex-col">
            {rankedList.map((player, index) => {
              const team = seasonData.teamMap[player.teamId];
              if (!team) return null;
              const playerImage = seasonData.playerImages[player.name];
              const isTopScorer = activeTab === 'SCORERS' && index === 0;

              return (
                <div
                  key={`${player.subjectId}-${activeLeague}`}
                  className={`group relative flex items-center border-b border-neutral-100 transition-colors ${
                    isTopScorer ? 'bg-white py-6' : 'py-3.5 hover:bg-neutral-50'
                  }`}
                >
                  <div className="mr-3 flex w-12 shrink-0 justify-center md:mr-4 md:w-16">
                    <span className={`font-display font-black tracking-tighter ${isTopScorer ? 'text-4xl italic text-brand-blue' : 'text-xl text-brand-black'}`}>
                      {player.rank}
                    </span>
                  </div>

                  <div className="flex min-w-0 flex-1 items-center">
                    {activeTab === 'SCORERS' && (
                      <div className={`relative shrink-0 overflow-hidden rounded-full border border-neutral-100 bg-neutral-100 ${isTopScorer ? 'h-20 w-20 shadow-xl md:h-24 md:w-24' : 'h-10 w-10 md:h-11 md:w-11'}`}>
                        {playerImage ? (
                          <img src={playerImage} alt={player.name} className="h-full w-full object-cover object-top" />
                        ) : (
                          <User className="h-full w-full p-2 text-neutral-300" aria-hidden="true" />
                        )}
                      </div>
                    )}

                    <div className={`${activeTab === 'SCORERS' ? (isTopScorer ? 'ml-6 md:ml-8' : 'ml-4') : ''} min-w-0`}>
                      <span className={`block break-words tracking-tight text-brand-black ${isTopScorer ? 'font-display text-2xl font-black italic text-brand-blue md:text-3xl' : 'text-sm font-bold md:text-base'}`}>
                        {player.name}
                      </span>
                      <div className="mt-1 flex items-center">
                        <img src={team.logo} alt="" className="mr-2 h-4 w-4 object-contain" />
                        <span className="truncate text-[10px] font-bold uppercase tracking-wide text-neutral-400">
                          {team.shortName}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="min-w-[90px] shrink-0 pl-4 pr-2 text-right md:pr-4">
                    {activeTab === 'SCORERS' ? (
                      <span className={`font-display font-black tabular-nums tracking-tighter ${isTopScorer ? 'text-5xl text-brand-blue md:text-6xl' : 'text-2xl text-brand-black md:text-3xl'}`}>
                        {player.goals}
                      </span>
                    ) : (
                      <div className="flex items-center justify-end space-x-3">
                        {player.directRedCards > 0 && (
                          <div className="flex h-8 w-6 -skew-x-12 items-center justify-center rounded-sm bg-red-600 font-display text-sm font-black text-white shadow-sm">
                            <span className="skew-x-12">{player.directRedCards}</span>
                          </div>
                        )}
                        {player.secondYellowDismissals > 0 && (
                          <div className="relative flex h-8 w-8 items-center justify-center" title="雙黃退場">
                            <div className="absolute left-1 top-1 h-7 w-5 -rotate-6 rounded-sm bg-yellow-400 shadow-sm" />
                            <div className="absolute right-1 top-0.5 flex h-7 w-5 rotate-3 items-center justify-center rounded-sm bg-red-600 font-display text-xs font-black text-white shadow-sm">
                              {player.secondYellowDismissals}
                            </div>
                          </div>
                        )}
                        {player.yellowCards > 0 && (
                          <div className="flex h-8 w-6 -skew-x-12 items-center justify-center rounded-sm bg-yellow-400 font-display text-sm font-black text-black shadow-sm">
                            <span className="skew-x-12">{player.yellowCards}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <ResponsiveFilterDrawer
        open={filtersOpen}
        fields={filterFields}
        onClose={() => setFiltersOpen(false)}
        onClear={() => {
          setDraftSeasonId(activeSeasonId);
          setDraftLeague(activeSeason.enabledLeagues[0]);
        }}
        clearDisabled={draftSeasonId === activeSeasonId && draftLeague === activeSeason.enabledLeagues[0]}
        onApply={applyFilters}
        applyLabel="查看數據"
        title="篩選數據中心"
        subtitle="選擇賽季與聯賽級別"
      />
    </div>
  );
};

export default StatsPage;
