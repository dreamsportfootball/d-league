import React, { useMemo } from 'react';
import { ArrowLeft, CalendarDays, Target, UserRound } from 'lucide-react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import EmptyState from '../components/EmptyState';
import { isSeasonId } from '../config/seasons';
import {
  getPlayerHistory,
  getPlayerMatchRecords,
  getPlayerSeasonStats,
  getTeamIdentity,
  resolveMatchEventPlayer,
  type PlayerSeasonRecord,
} from '../services/entityData';
import type { SeasonTeam } from '../types/team';
import { formatTaipeiDate } from '../utils/dateFormat';

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

const PlayerPage: React.FC = () => {
  const { id = '' } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const requestedSeason = searchParams.get('season');
  const history = useMemo(() => getPlayerHistory(id), [id]);
  const matchRecords = useMemo(() => getPlayerMatchRecords(id), [id]);

  if (history.length === 0) {
    return (
      <div className="min-h-[75vh] bg-white px-4 py-16 md:py-28">
        <div className="mx-auto max-w-5xl">
          <EmptyState title="找不到此球員" description="此球員不存在、尚未登錄，或網址已失效" />
          <div className="mt-8 text-center">
            <Link to="/stats" className="text-sm font-black text-brand-blue">
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
      acc.secondYellowDismissals += stats.secondYellowDismissals;
      acc.directRedCards += stats.directRedCards;
      return acc;
    },
    { goals: 0, yellowCards: 0, secondYellowDismissals: 0, directRedCards: 0 },
  );

  return (
    <div className="min-h-screen bg-white pb-24">
      <section className="border-b border-neutral-200 bg-neutral-50 px-4 py-10 md:px-12 md:py-16">
        <div className="mx-auto max-w-6xl">
          <Link
            to={`/stats?season=${preferredRecord.seasonId}`}
            className="inline-flex min-h-11 items-center text-xs font-black text-neutral-500 hover:text-brand-black"
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
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-neutral-400">
                D LEAGUE PLAYER
              </p>
              <h1 className="mt-2 break-words font-display text-4xl font-black tracking-tight text-brand-black md:text-6xl">
                {player.name}
              </h1>
              {player.englishName && (
                <p className="mt-2 break-words text-xs font-bold uppercase tracking-wider text-neutral-400">
                  {player.englishName}
                </p>
              )}
              <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs font-bold text-neutral-500">
                <span>#{player.number}</span>
                <span>{player.nationality}</span>
                {preferredRecord.team && (
                  <Link
                    to={`/teams/${getTeamIdentity(preferredRecord.team)}?season=${preferredRecord.seasonId}`}
                    className="font-black text-brand-blue"
                  >
                    {preferredRecord.team.name}
                  </Link>
                )}
              </div>
            </div>
          </div>

          <dl className="mt-9 grid grid-cols-4 divide-x divide-neutral-300 border-t border-neutral-300 pt-5">
            {[
              ['歷年進球', totals.goals],
              ['黃牌', totals.yellowCards],
              ['雙黃', totals.secondYellowDismissals],
              ['紅牌', totals.directRedCards],
            ].map(([label, value]) => (
              <div key={label} className="px-2 text-center md:px-6">
                <dt className="text-[9px] font-black tracking-wider text-neutral-400 md:text-[10px]">
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
            <h2 className="font-display text-2xl font-black text-brand-black">賽季紀錄</h2>
          </div>
          <div className="overflow-x-auto">
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
                {history.flatMap((record) => {
                  const seasonTeams = getPlayerSeasonTeams(record);
                  const rows: Array<SeasonTeam | undefined> = seasonTeams.length > 0
                    ? seasonTeams
                    : [undefined];

                  return rows.map((team) => {
                    const stats = getPlayerSeasonStats(record, team?.id);
                    const redCards = stats.directRedCards + stats.secondYellowDismissals;
                    return (
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
                        <td className="py-4 text-center text-sm font-semibold tabular-nums text-brand-black">{stats.goals}</td>
                        <td className="py-4 text-center text-sm font-semibold tabular-nums text-brand-black">{stats.yellowCards}</td>
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
                    );
                  });
                })}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <div className="flex items-center border-b border-neutral-200 pb-3">
            <CalendarDays className="mr-2 h-5 w-5 text-brand-blue" />
            <h2 className="font-display text-2xl font-black text-brand-black">個人比賽事件</h2>
          </div>
          {matchRecords.length > 0 ? (
            <div className="overflow-x-auto">
              <div className="min-w-[620px]">
                <div className="grid grid-cols-[120px_minmax(250px,1fr)_72px_72px_72px] border-b border-neutral-100 py-3 text-[10px] font-black tracking-wider text-neutral-400">
                  <span>日期</span>
                  <span>比賽</span>
                  <span className="text-center">進球</span>
                  <span className="text-center">黃牌</span>
                  <span className="text-center">紅牌</span>
                </div>
                {matchRecords.map((record) => {
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
                    <Link
                      key={`${record.seasonId}-${record.match.id}`}
                      to={`/schedule?season=${record.seasonId}&match=${record.match.id}`}
                      className="grid grid-cols-[120px_minmax(250px,1fr)_72px_72px_72px] items-center border-b border-neutral-100 py-4 transition-colors hover:bg-neutral-50"
                    >
                      <div className="text-xs font-bold text-neutral-400">
                        <p>{formatTaipeiDate(record.match.timestamp)}</p>
                        <p className="mt-1">{record.season.shortName} · {record.match.league}</p>
                      </div>
                      <p className="text-sm font-black text-brand-black">
                        {home.shortName} vs {away.shortName}
                      </p>
                      <span className="text-center text-sm font-semibold tabular-nums text-brand-black">{goals}</span>
                      <span className="text-center text-sm font-semibold tabular-nums text-brand-black">{yellowCards}</span>
                      <span className="text-center text-sm font-semibold tabular-nums text-brand-black">{redCards}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ) : (
            <p className="py-10 text-sm text-neutral-400">目前沒有可連結的個人比賽事件</p>
          )}
        </section>
      </main>
    </div>
  );
};

export default PlayerPage;
