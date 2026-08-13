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
            <table className="w-full min-w-[660px] border-collapse">
              <thead className="border-b border-neutral-100 text-[10px] font-black tracking-wider text-neutral-400">
                <tr>
                  <th className="py-3 text-left">賽季</th>
                  <th className="py-3 text-left">球隊</th>
                  <th className="py-3 text-center">進球</th>
                  <th className="py-3 text-center">黃牌</th>
                  <th className="py-3 text-center">雙黃</th>
                  <th className="py-3 text-center">紅牌</th>
                  <th className="py-3 text-right">官方數據</th>
                </tr>
              </thead>
              <tbody>
                {history.map((record) => {
                  const stats = getPlayerSeasonStats(record);
                  const seasonTeams = getPlayerSeasonTeams(record);
                  return (
                    <tr key={record.seasonId} className="border-b border-neutral-100">
                      <td className="py-4 text-sm font-black text-brand-black">{record.season.shortName}</td>
                      <td className="py-4 text-sm text-brand-black">
                        {seasonTeams.length > 0 ? (
                          <div className="flex flex-wrap items-center gap-1.5">
                            {seasonTeams.map((team, index) => (
                              <React.Fragment key={team.id}>
                                {index > 0 && <span className="text-neutral-300">→</span>}
                                <Link
                                  to={`/teams/${getTeamIdentity(team)}?season=${record.seasonId}`}
                                  className="font-medium hover:text-brand-blue"
                                >
                                  {team.name}
                                </Link>
                              </React.Fragment>
                            ))}
                          </div>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="py-4 text-center font-display text-lg font-black tabular-nums">{stats.goals}</td>
                      <td className="py-4 text-center tabular-nums">{stats.yellowCards}</td>
                      <td className="py-4 text-center tabular-nums">{stats.secondYellowDismissals}</td>
                      <td className="py-4 text-center tabular-nums">{stats.directRedCards}</td>
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
            <div className="divide-y divide-neutral-100">
              {matchRecords.map((record) => {
                const home = record.homeTeam;
                const away = record.awayTeam;
                if (!home || !away) return null;
                const playerRecord = history.find((item) => item.seasonId === record.seasonId);
                const playerId = playerRecord?.player.id;
                const events = record.events.filter(
                  (event) => (event.playerId ?? event.subjectId) === playerId,
                );
                return (
                  <Link
                    key={`${record.seasonId}-${record.match.id}`}
                    to={`/matches/${record.match.id}?season=${record.seasonId}`}
                    className="grid gap-2 py-4 transition-colors hover:bg-neutral-50 sm:grid-cols-[120px_minmax(0,1fr)_auto]"
                  >
                    <div className="text-xs font-bold text-neutral-400">
                      <p>{formatTaipeiDate(record.match.timestamp)}</p>
                      <p className="mt-1">{record.season.shortName} · {record.match.league}</p>
                    </div>
                    <div>
                      <p className="text-sm font-black text-brand-black">
                        {home.shortName} vs {away.shortName}
                      </p>
                      <p className="mt-1 text-xs font-bold text-neutral-500">
                        {events.map((event) => `${event.minute}' ${event.type === 'GOAL' ? '進球' : event.type === 'YELLOW_CARD' ? '黃牌' : event.type === 'SECOND_YELLOW' ? '雙黃' : '紅牌'}`).join(' · ')}
                      </p>
                    </div>
                    <div className="text-xs font-black text-brand-blue">比賽詳情 →</div>
                  </Link>
                );
              })}
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