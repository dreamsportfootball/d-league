import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, CalendarDays, Target, UserRound } from 'lucide-react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import EmptyState from '../components/EmptyState';
import MatchDialog from '../components/MatchDialog';
import { getSeasonConfig, isSeasonId } from '../config/seasons';
import { SeasonContext } from '../contexts/SeasonContext';
import { useSeason } from '../hooks/useSeason';
import {
  getPlayerHistory,
  getPlayerMatchRecords,
  getPlayerSeasonStats,
  getTeamIdentity,
  resolveMatchEventPlayer,
  type PlayerSeasonRecord,
} from '../services/entityData';
import { getSeasonData } from '../services/seasonDataJson';
import type { SeasonId } from '../types/season';
import type { SeasonTeam } from '../types/team';

type PlayerLineupSide = 'HOME' | 'AWAY';

const getPlayerLineupSide = (lineup: unknown, playerId: string): PlayerLineupSide | null => {
  if (!lineup || typeof lineup !== 'object') return null;

  const candidate = lineup as {
    homePlayerIds?: unknown;
    awayPlayerIds?: unknown;
  };
  const homePlayerIds = Array.isArray(candidate.homePlayerIds)
    ? candidate.homePlayerIds
    : [];
  const awayPlayerIds = Array.isArray(candidate.awayPlayerIds)
    ? candidate.awayPlayerIds
    : [];

  if (homePlayerIds.includes(playerId)) return 'HOME';
  if (awayPlayerIds.includes(playerId)) return 'AWAY';
  return null;
};

const getPlayerSeasonTeams = (record: PlayerSeasonRecord): SeasonTeam[] => {
  const timeline: { teamId: string; timestamp: number }[] = [];
  const addTeam = (teamId: string | undefined, timestamp: number) => {
    if (!teamId || !record.data.teamMap[teamId]) return;
    timeline.push({ teamId, timestamp });
  };

  if (record.player.registrations?.length) {
    record.player.registrations.forEach((registration) => {
      addTeam(registration.teamId, new Date(registration.effectiveFrom).getTime());
    });
  }

  const playerImage = record.data.playerImages[record.player.name];
  if (playerImage) {
    const pathParts = playerImage.split('/').filter(Boolean);
    const imageTeamName = pathParts[pathParts.length - 2];
    const imageTeam = imageTeamName
      ? record.data.teams.find(
          (team) => team.name === imageTeamName || team.shortName === imageTeamName,
        )
      : undefined;
    if (imageTeam) addTeam(imageTeam.id, Number.NEGATIVE_INFINITY);
  }

  Object.entries(record.data.lineups).forEach(([matchId, lineup]) => {
    const match = record.data.matches.find((candidate) => candidate.id === matchId);
    if (!match) return;
    const side = getPlayerLineupSide(lineup, record.player.id);
    if (!side) return;
    const timestamp = new Date(match.timestamp).getTime();
    addTeam(side === 'HOME' ? match.homeTeamId : match.awayTeamId, timestamp);
  });

  Object.entries(record.data.matchEvents).forEach(([matchId, events]) => {
    const match = record.data.matches.find((candidate) => candidate.id === matchId);
    if (!match) return;
    const timestamp = new Date(match.timestamp).getTime();
    events.forEach((event) => {
      if (resolveMatchEventPlayer(record.data, match, event)?.id !== record.player.id) return;
      addTeam(event.team === 'HOME' ? match.homeTeamId : match.awayTeamId, timestamp);
    });
  });

  addTeam(record.player.teamId, Number.POSITIVE_INFINITY);
  timeline.sort((a, b) => a.timestamp - b.timestamp);

  const seen = new Set<string>();
  return timeline.flatMap(({ teamId }) => {
    if (seen.has(teamId)) return [];
    seen.add(teamId);
    const team = record.data.teamMap[teamId];
    return team ? [team] : [];
  });
};

const formatPlayerMatchDate = (timestamp: string): string => {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Taipei',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date(timestamp));
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}/${values.month}/${values.day}`;
};

type EventSeasonFilter = SeasonId | 'ALL';

interface SelectedMatchState {
  matchId: string;
  seasonId: SeasonId;
}

interface PlayerTransferRecord {
  seasonId: SeasonId;
  seasonName: string;
  effectiveFrom?: string;
  fromTeam: SeasonTeam;
  toTeam: SeasonTeam;
}

const getPlayerTransfers = (history: PlayerSeasonRecord[]): PlayerTransferRecord[] =>
  history.flatMap((record) => {
    const registrations = (record.player.registrations ?? [])
      .slice()
      .sort(
        (a, b) =>
          new Date(a.effectiveFrom).getTime() - new Date(b.effectiveFrom).getTime(),
      )
      .filter((registration) => Boolean(record.data.teamMap[registration.teamId]));

    const uniqueRegistrations = registrations.filter(
      (registration, index) =>
        index === 0 || registration.teamId !== registrations[index - 1].teamId,
    );

    if (uniqueRegistrations.length >= 2) {
      return uniqueRegistrations.slice(1).flatMap((registration, index) => {
        const previous = uniqueRegistrations[index];
        const fromTeam = record.data.teamMap[previous.teamId];
        const toTeam = record.data.teamMap[registration.teamId];
        if (!fromTeam || !toTeam) return [];

        return [{
          seasonId: record.seasonId,
          seasonName: record.season.shortName,
          effectiveFrom: registration.effectiveFrom,
          fromTeam,
          toTeam,
        }];
      });
    }

    const inferredTeams = getPlayerSeasonTeams(record);
    if (inferredTeams.length < 2) return [];

    return inferredTeams.slice(1).map((toTeam, index) => ({
      seasonId: record.seasonId,
      seasonName: record.season.shortName,
      fromTeam: inferredTeams[index],
      toTeam,
    }));
  });

const PlayerPage: React.FC = () => {
  const { id = '' } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const { availableSeasons } = useSeason();
  const requestedSeason = searchParams.get('season');
  const history = useMemo(() => getPlayerHistory(id), [id]);
  const matchRecords = useMemo(() => getPlayerMatchRecords(id), [id]);
  const transferRecords = useMemo(() => getPlayerTransfers(history), [history]);
  const latestEventSeason = history[0]?.seasonId ?? 'ALL';
  const [eventSeasonByPlayer, setEventSeasonByPlayer] = useState<{
    playerId: string;
    season: EventSeasonFilter;
  }>(() => ({ playerId: id, season: latestEventSeason }));
  const eventSeason = eventSeasonByPlayer.playerId === id
    ? eventSeasonByPlayer.season
    : latestEventSeason;
  const setEventSeason = (season: EventSeasonFilter) => {
    setEventSeasonByPlayer({ playerId: id, season });
  };
  const [selectedMatch, setSelectedMatch] = useState<SelectedMatchState | null>(null);

  useEffect(() => {
    setSelectedMatch(null);
  }, [id]);

  const filteredMatchRecords = useMemo(
    () =>
      eventSeason === 'ALL'
        ? matchRecords
        : matchRecords.filter((record) => record.seasonId === eventSeason),
    [eventSeason, matchRecords],
  );

  const dialogSeasonContext = useMemo(() => {
    if (!selectedMatch) return null;
    return {
      activeSeasonId: selectedMatch.seasonId,
      activeSeason: getSeasonConfig(selectedMatch.seasonId),
      seasonData: getSeasonData(selectedMatch.seasonId),
      availableSeasons,
      setActiveSeason: () => {},
    };
  }, [availableSeasons, selectedMatch]);

  const dialogNavigationMatchIds = useMemo(() => {
    if (!selectedMatch) return undefined;
    const record = history.find((item) => item.seasonId === selectedMatch.seasonId);
    if (!record) return undefined;

    const lineupMatchIds = Object.entries(record.data.lineups)
      .filter(([, lineup]) => Boolean(getPlayerLineupSide(lineup, record.player.id)))
      .map(([matchId]) => matchId);
    const eventMatchIds = filteredMatchRecords
      .filter((item) => item.seasonId === selectedMatch.seasonId)
      .map((item) => item.match.id);
    const matchIds = [...new Set([...lineupMatchIds, ...eventMatchIds])];

    return matchIds.sort((a, b) => {
      const matchA = record.data.matches.find((match) => match.id === a);
      const matchB = record.data.matches.find((match) => match.id === b);
      if (!matchA || !matchB) return 0;
      return new Date(matchB.timestamp).getTime() - new Date(matchA.timestamp).getTime();
    });
  }, [filteredMatchRecords, history, selectedMatch]);

  if (history.length === 0) {
    return (
      <div className="min-h-[75vh] bg-white px-4 py-16 md:py-28">
        <div className="mx-auto max-w-5xl">
          <EmptyState title="找不到此球員" description="此球員不存在、尚未登錄，或網址已失效" />
          <div className="mt-8 text-center">
            <Link to="/stats" className="text-sm font-bold text-brand-blue">
              返回數據中心
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const preferredRecord =
    (isSeasonId(requestedSeason)
      ? history.find((record) => record.seasonId === requestedSeason)
      : undefined) ?? history[0];
  const player = preferredRecord.player;
  const image = preferredRecord.data.playerImages[player.name];
  const preferredSeasonStats = getPlayerSeasonStats(preferredRecord);
  const preferredSeasonRedCards =
    preferredSeasonStats.directRedCards + preferredSeasonStats.secondYellowDismissals;
  const appearanceRecords = Object.entries(preferredRecord.data.lineups)
    .flatMap(([matchId, lineup]) => {
      const match = preferredRecord.data.matches.find((candidate) => candidate.id === matchId);
      if (!match) return [];

      const side = getPlayerLineupSide(lineup, player.id);
      if (!side) return [];

      const opponent = preferredRecord.data.teamMap[
        side === 'HOME' ? match.awayTeamId : match.homeTeamId
      ];
      const playerEvents = (preferredRecord.data.matchEvents[match.id] ?? []).filter(
        (event) => resolveMatchEventPlayer(preferredRecord.data, match, event)?.id === player.id,
      );
      const goals = playerEvents.filter(
        (event) =>
          event.type === 'GOAL' &&
          !event.isOwnGoal &&
          match.resultType !== 'VOID' &&
          match.countsForPlayerStats !== false,
      ).length;
      const yellowCards = playerEvents.filter(
        (event) => event.type === 'YELLOW_CARD' || event.type === 'SECOND_YELLOW',
      ).length;
      const redCards = playerEvents.filter(
        (event) => event.type === 'RED_CARD' || event.type === 'SECOND_YELLOW',
      ).length;

      return [{ match, opponent, goals, yellowCards, redCards }];
    })
    .sort(
      (a, b) => new Date(b.match.timestamp).getTime() - new Date(a.match.timestamp).getTime(),
    );

  const seasonRows = history.flatMap((record) => {
    const seasonTeams = getPlayerSeasonTeams(record);
    const rows: Array<SeasonTeam | undefined> = seasonTeams.length > 0
      ? seasonTeams
      : [undefined];

    return rows.map((team) => {
      const stats = getPlayerSeasonStats(record, team?.id);
      return {
        record,
        team,
        goals: stats.goals,
        yellowCards: stats.yellowCards,
        redCards: stats.directRedCards + stats.secondYellowDismissals,
      };
    });
  });

  return (
    <div className="min-h-screen bg-white pb-24">
      <section className="border-b border-neutral-200 bg-neutral-50 px-4 py-8 md:px-12 md:py-10 lg:py-12">
        <div className="mx-auto max-w-6xl">
          <Link
            to={`/stats?season=${preferredRecord.seasonId}`}
            className="inline-flex min-h-11 items-center text-xs font-bold text-neutral-500 hover:text-brand-black"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            返回數據中心
          </Link>

          <div className="mt-5 grid gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)] lg:items-center lg:gap-10">
            <div className="grid min-w-0 grid-cols-[104px_minmax(0,1fr)] items-center gap-4 sm:grid-cols-[128px_minmax(0,1fr)] sm:gap-6 lg:grid-cols-[160px_minmax(0,1fr)] lg:gap-8">
              <div className="flex h-[104px] w-[104px] items-center justify-center overflow-hidden rounded-full bg-white ring-1 ring-neutral-200 sm:h-32 sm:w-32 lg:h-40 lg:w-40">
                {image ? (
                  <img src={image} alt={player.name} className="h-full w-full object-cover" />
                ) : (
                  <UserRound className="h-12 w-12 text-neutral-300 sm:h-14 sm:w-14 lg:h-16 lg:w-16" />
                )}
              </div>

              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-brand-blue sm:tracking-[0.16em]">
                  D LEAGUE PLAYER
                  <span className="ml-2 text-neutral-400">
                    {preferredRecord.team?.leagueId ?? 'D LEAGUE'} · {preferredRecord.season.shortName}
                  </span>
                </p>

                <div className="mt-2 flex min-w-0 items-baseline gap-2 sm:mt-3 sm:gap-3">
                  <span className="shrink-0 font-display text-2xl font-black tabular-nums text-brand-blue sm:text-3xl lg:text-4xl">
                    {player.number}
                  </span>
                  <h1 className="min-w-0 break-words font-display text-3xl font-black leading-none tracking-tight text-brand-black sm:text-5xl lg:text-6xl">
                    {player.name}
                  </h1>
                </div>

                {player.englishName && (
                  <p className="mt-2 break-words text-[10px] font-semibold uppercase tracking-wider text-neutral-400 sm:text-xs lg:text-sm">
                    {player.englishName}
                  </p>
                )}

                <dl className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[10px] sm:text-[11px]">
                  {[
                    ['國籍', player.nationality],
                    ['年齡', `${player.age} 歲`],
                    ['性別', player.gender],
                  ].map(([label, value]) => (
                    <div key={label} className="flex items-baseline gap-1.5 whitespace-nowrap">
                      <dt className="font-semibold text-neutral-400">{label}</dt>
                      <dd className="font-bold text-neutral-600">{value}</dd>
                    </div>
                  ))}
                </dl>

                {preferredRecord.team && (
                  <Link
                    to={`/teams/${getTeamIdentity(preferredRecord.team)}?season=${preferredRecord.seasonId}`}
                    className="mt-3 inline-flex min-h-9 items-center text-sm font-black text-brand-blue hover:text-brand-black sm:mt-4 sm:text-base lg:text-lg"
                  >
                    {preferredRecord.team.name}
                  </Link>
                )}
              </div>
            </div>

            <div className="pt-1 lg:pl-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-neutral-400">
                SEASON STATS
              </p>
              <h2 className="mt-1 font-display text-xl font-extrabold text-brand-black md:text-2xl">
                {preferredRecord.season.shortName} 賽季數據
              </h2>
              <div className="mt-3 h-0.5 w-10 bg-brand-blue" aria-hidden="true" />

              <dl className="mt-5 grid grid-cols-4 divide-x divide-neutral-200">
                {[
                  ['出賽', appearanceRecords.length],
                  ['進球', preferredSeasonStats.goals],
                  ['黃牌', preferredSeasonStats.yellowCards],
                  ['紅牌', preferredSeasonRedCards],
                ].map(([label, value]) => (
                  <div key={label} className="min-w-0 px-2 text-center first:pl-0 sm:px-4 lg:px-5">
                    <dt className="truncate text-[9px] font-bold tracking-[0.12em] text-neutral-400 sm:text-[10px]">{label}</dt>
                    <dd className="mt-2 font-display text-3xl font-black leading-none tabular-nums text-brand-black sm:text-4xl lg:text-[42px]">
                      {value}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-6xl space-y-12 px-4 py-10 md:space-y-14 md:px-12 md:py-14">
        <section>
          <div className="flex items-center border-b border-neutral-200 pb-3">
            <Target className="mr-2 h-5 w-5 text-brand-blue" />
            <h2 className="font-display text-2xl font-extrabold text-brand-black">D LEAGUE 生涯</h2>
          </div>

          <div className="md:hidden">
            <div className="grid grid-cols-[56px_38px_minmax(0,1fr)_30px_30px_30px] items-center gap-1 border-b border-neutral-100 py-2.5 text-[9px] font-semibold tracking-wide text-neutral-400">
              <span>賽季</span>
              <span>級別</span>
              <span>球隊</span>
              <span className="text-center">進</span>
              <span className="text-center">黃</span>
              <span className="text-center">紅</span>
            </div>
            <div className="divide-y divide-neutral-100">
              {seasonRows.map(({ record, team, goals, yellowCards, redCards }) => (
                <div
                  key={`${record.seasonId}-${team?.id ?? 'unknown'}`}
                  className="grid min-h-12 grid-cols-[56px_38px_minmax(0,1fr)_30px_30px_30px] items-center gap-1 py-2.5"
                >
                  <span className="text-[11px] font-semibold tabular-nums text-neutral-500">
                    {record.season.shortName}
                  </span>
                  <span className="text-[11px] font-bold text-brand-blue">{team?.leagueId ?? '—'}</span>
                  <div className="min-w-0 pr-1 text-[12px] font-bold text-brand-black">
                    {team ? (
                      <Link
                        to={`/teams/${getTeamIdentity(team)}?season=${record.seasonId}`}
                        className="block truncate hover:text-brand-blue"
                      >
                        {team.name}
                      </Link>
                    ) : (
                      '—'
                    )}
                  </div>
                  <span className="text-center text-[12px] font-semibold tabular-nums text-brand-black">{goals}</span>
                  <span className="text-center text-[12px] font-semibold tabular-nums text-brand-black">{yellowCards}</span>
                  <span className="text-center text-[12px] font-semibold tabular-nums text-brand-black">{redCards}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[620px] border-collapse">
              <thead className="border-b border-neutral-100 text-[10px] font-bold tracking-wider text-neutral-400">
                <tr>
                  <th className="py-3 text-left">賽季</th>
                  <th className="py-3 text-left">級別</th>
                  <th className="py-3 text-left">球隊</th>
                  <th className="py-3 text-center">進球</th>
                  <th className="py-3 text-center">黃牌</th>
                  <th className="py-3 text-center">紅牌</th>
                </tr>
              </thead>
              <tbody>
                {seasonRows.map(({ record, team, goals, yellowCards, redCards }) => (
                  <tr key={`${record.seasonId}-${team?.id ?? 'unknown'}`} className="border-b border-neutral-100">
                    <td className="py-4 text-sm font-bold text-brand-black">{record.season.shortName}</td>
                    <td className="py-4 text-sm font-bold text-brand-blue">{team?.leagueId ?? '—'}</td>
                    <td className="py-4 text-sm text-brand-black">
                      {team ? (
                        <Link
                          to={`/teams/${getTeamIdentity(team)}?season=${record.seasonId}`}
                          className="font-medium hover:text-brand-blue"
                        >
                          {team.name}
                        </Link>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="py-4 text-center text-sm font-semibold tabular-nums text-brand-black">{goals}</td>
                    <td className="py-4 text-center text-sm font-semibold tabular-nums text-brand-black">{yellowCards}</td>
                    <td className="py-4 text-center text-sm font-semibold tabular-nums text-brand-black">{redCards}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {transferRecords.length > 0 && (
          <section>
            <div className="flex items-center border-b border-neutral-200 pb-3">
              <ArrowRight className="mr-2 h-5 w-5 text-brand-blue" />
              <h2 className="font-display text-2xl font-extrabold text-brand-black">轉會紀錄</h2>
            </div>
            <div className="divide-y divide-neutral-100">
              {transferRecords.map((transfer) => (
                <div
                  key={`${transfer.seasonId}-${transfer.fromTeam.id}-${transfer.toTeam.id}`}
                  className="grid gap-2 py-4 sm:grid-cols-[90px_minmax(0,1fr)] sm:items-center"
                >
                  <span className="text-xs font-bold text-neutral-400">{transfer.seasonName}</span>
                  <div className="flex min-w-0 flex-wrap items-center gap-2 text-sm font-bold">
                    <Link
                      to={`/teams/${getTeamIdentity(transfer.fromTeam)}?season=${transfer.seasonId}`}
                      className="text-brand-black hover:text-brand-blue"
                    >
                      {transfer.fromTeam.name}
                    </Link>
                    <ArrowRight className="h-4 w-4 shrink-0 text-neutral-300" />
                    <Link
                      to={`/teams/${getTeamIdentity(transfer.toTeam)}?season=${transfer.seasonId}`}
                      className="text-brand-blue"
                    >
                      {transfer.toTeam.name}
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        <section>
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-200 pb-3">
            <div className="flex items-center">
              <CalendarDays className="mr-2 h-5 w-5 text-brand-blue" />
              <h2 className="font-display text-2xl font-extrabold text-brand-black">比賽事件</h2>
            </div>
            <label className="flex items-center gap-2 text-xs font-semibold text-neutral-500">
              <span>賽季</span>
              <select
                value={eventSeason}
                onChange={(event) => setEventSeason(event.target.value as EventSeasonFilter)}
                className="min-h-9 rounded-lg border border-neutral-200 bg-white px-3 text-xs font-semibold text-brand-black outline-none transition-colors focus:border-brand-blue"
                aria-label="篩選比賽事件賽季"
              >
                <option value="ALL">全部賽季</option>
                {history.map((record) => (
                  <option key={record.seasonId} value={record.seasonId}>
                    {record.season.shortName}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {filteredMatchRecords.length > 0 ? (
            <>
              <div className="divide-y divide-neutral-100 md:hidden">
                {filteredMatchRecords.map((record) => {
                  const home = record.homeTeam;
                  const away = record.awayTeam;
                  if (!home || !away) return null;
                  const playerRecord = history.find((item) => item.seasonId === record.seasonId);
                  if (!playerRecord) return null;

                  const events = record.events.filter(
                    (event) =>
                      resolveMatchEventPlayer(record.data, record.match, event)?.id === playerRecord.player.id,
                  );
                  const goals = events.filter(
                    (event) =>
                      event.type === 'GOAL' &&
                      !event.isOwnGoal &&
                      record.match.resultType !== 'VOID' &&
                      record.match.countsForPlayerStats !== false,
                  ).length;
                  const yellowCards = events.filter(
                    (event) => event.type === 'YELLOW_CARD' || event.type === 'SECOND_YELLOW',
                  ).length;
                  const redCards = events.filter(
                    (event) => event.type === 'RED_CARD' || event.type === 'SECOND_YELLOW',
                  ).length;

                  return (
                    <button
                      key={`${record.seasonId}-${record.match.id}`}
                      type="button"
                      onClick={() => setSelectedMatch({ matchId: record.match.id, seasonId: record.seasonId })}
                      data-analytics-event="match_open"
                      data-analytics-label={record.match.id}
                      className="w-full py-4 text-left transition-colors active:bg-neutral-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-blue"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <span className="text-xs font-semibold tabular-nums text-neutral-400">
                          {formatPlayerMatchDate(record.match.timestamp)}
                        </span>
                        <span className="min-w-0 text-right text-sm font-bold text-brand-black">
                          {home.shortName} vs {away.shortName}
                        </span>
                      </div>
                      <div className="mt-3 grid grid-cols-3 divide-x divide-neutral-100 rounded-xl bg-neutral-50 py-2.5">
                        {[
                          ['進球', goals],
                          ['黃牌', yellowCards],
                          ['紅牌', redCards],
                        ].map(([label, value]) => (
                          <div key={label} className="text-center">
                            <p className="text-[9px] font-semibold text-neutral-400">{label}</p>
                            <p className="mt-0.5 text-sm font-bold tabular-nums text-brand-black">{value}</p>
                          </div>
                        ))}
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="hidden overflow-x-auto md:block">
                <div className="min-w-[620px]">
                  <div className="grid grid-cols-[120px_minmax(250px,1fr)_72px_72px_72px] border-b border-neutral-100 py-3 text-[10px] font-bold tracking-wider text-neutral-400">
                    <span>日期</span>
                    <span>比賽</span>
                    <span className="text-center">進球</span>
                    <span className="text-center">黃牌</span>
                    <span className="text-center">紅牌</span>
                  </div>
                  {filteredMatchRecords.map((record) => {
                    const home = record.homeTeam;
                    const away = record.awayTeam;
                    if (!home || !away) return null;
                    const playerRecord = history.find((item) => item.seasonId === record.seasonId);
                    if (!playerRecord) return null;

                    const events = record.events.filter(
                      (event) =>
                        resolveMatchEventPlayer(record.data, record.match, event)?.id === playerRecord.player.id,
                    );
                    const goals = events.filter(
                      (event) =>
                        event.type === 'GOAL' &&
                        !event.isOwnGoal &&
                        record.match.resultType !== 'VOID' &&
                        record.match.countsForPlayerStats !== false,
                    ).length;
                    const yellowCards = events.filter(
                      (event) => event.type === 'YELLOW_CARD' || event.type === 'SECOND_YELLOW',
                    ).length;
                    const redCards = events.filter(
                      (event) => event.type === 'RED_CARD' || event.type === 'SECOND_YELLOW',
                    ).length;

                    return (
                      <button
                        key={`${record.seasonId}-${record.match.id}`}
                        type="button"
                        onClick={() => setSelectedMatch({ matchId: record.match.id, seasonId: record.seasonId })}
                        data-analytics-event="match_open"
                        data-analytics-label={record.match.id}
                        className="grid w-full grid-cols-[120px_minmax(250px,1fr)_72px_72px_72px] items-center border-b border-neutral-100 py-4 text-left transition-colors hover:bg-neutral-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-blue"
                      >
                        <span className="text-xs font-semibold tabular-nums text-neutral-400">
                          {formatPlayerMatchDate(record.match.timestamp)}
                        </span>
                        <span className="text-sm font-bold text-brand-black">
                          {home.shortName} vs {away.shortName}
                        </span>
                        <span className="text-center text-sm font-semibold tabular-nums text-brand-black">{goals}</span>
                        <span className="text-center text-sm font-semibold tabular-nums text-brand-black">{yellowCards}</span>
                        <span className="text-center text-sm font-semibold tabular-nums text-brand-black">{redCards}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          ) : (
            <p className="py-10 text-sm text-neutral-400">
              {eventSeason === 'ALL' ? '目前沒有可連結的比賽事件' : '此賽季沒有比賽事件'}
            </p>
          )}
        </section>
      </main>

      {selectedMatch && dialogSeasonContext && (
        <SeasonContext.Provider value={dialogSeasonContext}>
          <MatchDialog
            matchId={selectedMatch.matchId}
            onClose={() => setSelectedMatch(null)}
            onSelectMatch={(matchId) =>
              setSelectedMatch((current) => (current ? { ...current, matchId } : current))
            }
            navigationMatchIds={dialogNavigationMatchIds}
          />
        </SeasonContext.Provider>
      )}
    </div>
  );
};

export default PlayerPage;
