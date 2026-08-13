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
    const timestamp = new Date(match.timestamp).getTime();
    if (lineup.homePlayerIds.includes(record.player.id)) addTeam(match.homeTeamId, timestamp);
    if (lineup.awayPlayerIds.includes(record.player.id)) addTeam(match.awayTeamId, timestamp);
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
  const [eventSeason, setEventSeason] = useState<EventSeasonFilter>('ALL');
  const [selectedMatch, setSelectedMatch] = useState<SelectedMatchState | null>(null);

  useEffect(() => {
    setEventSeason('ALL');
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

  const dialogNavigationMatchIds = useMemo(
    () =>
      selectedMatch
        ? filteredMatchRecords
            .filter((record) => record.seasonId === selectedMatch.seasonId)
            .map((record) => record.match.id)
        : undefined,
    [filteredMatchRecords, selectedMatch],
  );

  if (history.length === 0) {
    return (
      <div className="min-h-[75vh] bg-white px-4 py-16 md:py-28">
        <div className="mx-auto max-w-5xl">
          <EmptyState title="找不到此球員" description="此球員不存在、尚未登錄，或網址已失效" />
          <div className="mt-8 text-center">
            <Link to="/stats" className="text-sm font-bold text-brand-blue md:font-black">
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
  const totals = history.reduce(
    (acc, record) => {
      const stats = getPlayerSeasonStats(record);
      acc.goals += stats.goals;
      acc.yellowCards += stats.yellowCards;
      acc.redCards += stats.directRedCards + stats.secondYellowDismissals;
      return acc;
    },
    { goals: 0, yellowCards: 0, redCards: 0 },
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
      <section className="border-b border-neutral-200 bg-neutral-50 px-4 py-10 md:px-12 md:py-16">
        <div className="mx-auto max-w-6xl">
          <Link
            to={`/stats?season=${preferredRecord.seasonId}`}
            className="inline-flex min-h-11 items-center text-xs font-bold text-neutral-500 hover:text-brand-black md:font-black"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            返回數據中心
          </Link>

          <div className="mt-7 flex items-center gap-5 md:gap-8">
            <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white ring-1 ring-neutral-200 md:h-32 md:w-32">
              {image ? (
                <img src={image} alt={player.name} className="h-full w-full object-cover" />
              ) : (
                <UserRound className="h-12 w-12 text-neutral-300" />
              )}
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-neutral-400 md:font-black md:tracking-[0.18em]">
                D LEAGUE PLAYER
              </p>
              <h1 className="mt-2 break-words font-display text-4xl font-extrabold tracking-tight text-brand-black md:text-6xl md:font-black">
                {player.name}
              </h1>
              {player.englishName && (
                <p className="mt-2 break-words text-xs font-semibold uppercase tracking-wider text-neutral-400 md:font-bold">
                  {player.englishName}
                </p>
              )}
              <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs font-semibold text-neutral-500 md:font-bold">
                <span>#{player.number}</span>
                <span>{player.nationality}</span>
                {preferredRecord.team && (
                  <Link
                    to={`/teams/${getTeamIdentity(preferredRecord.team)}?season=${preferredRecord.seasonId}`}
                    className="font-bold text-brand-blue md:font-black"
                  >
                    {preferredRecord.team.name}
                  </Link>
                )}
              </div>
            </div>
          </div>

          <p className="mt-9 text-[10px] font-bold uppercase tracking-[0.14em] text-neutral-400 md:font-black md:tracking-[0.18em]">
            D LEAGUE 生涯數據
          </p>
          <dl className="mt-3 grid grid-cols-3 divide-x divide-neutral-300 border-t border-neutral-300 pt-5">
            {[
              ['進球', totals.goals],
              ['黃牌', totals.yellowCards],
              ['紅牌', totals.redCards],
            ].map(([label, value]) => (
              <div key={label} className="px-2 text-center md:px-6">
                <dt className="text-[9px] font-semibold tracking-wider text-neutral-400 md:text-[10px] md:font-black">
                  {label}
                </dt>
                <dd className="mt-1 font-display text-2xl font-black tabular-nums text-brand-black md:text-3xl">
                  {value}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <main className="mx-auto max-w-6xl space-y-14 px-4 py-10 md:px-12 md:py-14">
        <section>
          <div className="flex items-center border-b border-neutral-200 pb-3">
            <Target className="mr-2 h-5 w-5 text-brand-blue" />
            <h2 className="font-display text-2xl font-extrabold text-brand-black md:font-black">賽季紀錄</h2>
          </div>

          <div className="md:hidden">
            <div className="grid grid-cols-[58px_minmax(0,1fr)_32px_32px_32px] items-center gap-1 border-b border-neutral-100 py-2.5 text-[9px] font-semibold tracking-wide text-neutral-400">
              <span>賽季</span>
              <span>球隊</span>
              <span className="text-center">進</span>
              <span className="text-center">黃</span>
              <span className="text-center">紅</span>
            </div>
            <div className="divide-y divide-neutral-100">
              {seasonRows.map(({ record, team, goals, yellowCards, redCards }) => (
                <div
                  key={`${record.seasonId}-${team?.id ?? 'unknown'}`}
                  className="grid min-h-12 grid-cols-[58px_minmax(0,1fr)_32px_32px_32px] items-center gap-1 py-2.5"
                >
                  <span className="text-[11px] font-semibold tabular-nums text-neutral-500">
                    {record.season.shortName}
                  </span>
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
            <table className="w-full min-w-[600px] border-collapse">
              <thead className="border-b border-neutral-100 text-[10px] font-black tracking-wider text-neutral-400">
                <tr>
                  <th className="py-3 text-left">賽季</th>
                  <th className="py-3 text-left">球隊</th>
                  <th className="py-3 text-center">進球</th>
                  <th className="py-3 text-center">黃牌</th>
                  <th className="py-3 text-center">紅牌</th>
                  <th className="py-3 text-right">官方數據</th>
                </tr>
              </thead>
              <tbody>
                {seasonRows.map(({ record, team, goals, yellowCards, redCards }) => (
                  <tr key={`${record.seasonId}-${team?.id ?? 'unknown'}`} className="border-b border-neutral-100">
                    <td className="py-4 text-sm font-black text-brand-black">{record.season.shortName}</td>
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
                    <td className="py-4 text-right">
                      <Link
                        to={`/stats?season=${record.seasonId}`}
                        className="text-xs font-black text-brand-blue"
                      >
                        查看該季
                      </Link>
                    </td>
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
              <h2 className="font-display text-2xl font-extrabold text-brand-black md:font-black">轉會紀錄</h2>
            </div>
            <div className="divide-y divide-neutral-100">
              {transferRecords.map((transfer) => (
                <div
                  key={`${transfer.seasonId}-${transfer.fromTeam.id}-${transfer.toTeam.id}`}
                  className="grid gap-2 py-4 sm:grid-cols-[90px_minmax(0,1fr)] sm:items-center"
                >
                  <span className="text-xs font-bold text-neutral-400 md:font-black">{transfer.seasonName}</span>
                  <div className="flex min-w-0 flex-wrap items-center gap-2 text-sm font-bold md:font-black">
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
              <h2 className="font-display text-2xl font-extrabold text-brand-black md:font-black">個人比賽事件</h2>
            </div>
            <label className="flex items-center gap-2 text-xs font-semibold text-neutral-500 md:font-bold">
              <span>賽季</span>
              <select
                value={eventSeason}
                onChange={(event) => setEventSeason(event.target.value as EventSeasonFilter)}
                className="min-h-9 rounded-lg border border-neutral-200 bg-white px-3 text-xs font-semibold text-brand-black outline-none transition-colors focus:border-brand-blue md:font-bold"
                aria-label="篩選個人比賽事件賽季"
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
                  <div className="grid grid-cols-[120px_minmax(250px,1fr)_72px_72px_72px] border-b border-neutral-100 py-3 text-[10px] font-black tracking-wider text-neutral-400">
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
                        className="grid w-full grid-cols-[120px_minmax(250px,1fr)_72px_72px_72px] items-center border-b border-neutral-100 py-4 text-left transition-colors hover:bg-neutral-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-blue"
                      >
                        <span className="text-xs font-bold tabular-nums text-neutral-400">
                          {formatPlayerMatchDate(record.match.timestamp)}
                        </span>
                        <span className="text-sm font-black text-brand-black">
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
              {eventSeason === 'ALL' ? '目前沒有可連結的個人比賽事件' : '此賽季沒有個人比賽事件'}
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
