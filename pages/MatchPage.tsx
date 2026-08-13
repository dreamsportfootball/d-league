import React, { useMemo } from 'react';
import {
  Activity,
  ArrowLeft,
  CalendarDays,
  ChevronRight,
  MapPin,
  Newspaper,
  Video,
} from 'lucide-react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import EmptyState from '../components/EmptyState';
import { isSeasonId } from '../config/seasons';
import {
  getMatchRecord,
  getPlayerIdentity,
  getTeamIdentity,
  resolveMatchEventPlayer,
} from '../services/entityData';
import { MatchStatus } from '../types';
import type { MatchEvent } from '../types/matchEvent';
import { formatTaipeiDateWithWeekday, formatTaipeiTime } from '../utils/dateFormat';

const eventLabel = (event: MatchEvent): string => {
  if (event.type === 'GOAL') {
    if (event.isOwnGoal) return '烏龍球';
    if (event.isPK) return '十二碼進球';
    return '進球';
  }
  if (event.type === 'YELLOW_CARD') return '黃牌';
  if (event.type === 'SECOND_YELLOW') return '雙黃退場';
  return '紅牌';
};

const eventMarker = (event: MatchEvent): string => {
  if (event.type === 'GOAL') return '⚽';
  if (event.type === 'YELLOW_CARD') return '🟨';
  if (event.type === 'SECOND_YELLOW') return '🟨🟥';
  return '🟥';
};

const MatchPage: React.FC = () => {
  const { id = '' } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const requestedSeason = searchParams.get('season');
  const preferredSeason = isSeasonId(requestedSeason) ? requestedSeason : undefined;
  const record = useMemo(() => getMatchRecord(id, preferredSeason), [id, preferredSeason]);

  if (!record || !record.homeTeam || !record.awayTeam) {
    return (
      <div className="min-h-[75vh] bg-white px-4 py-16 md:py-28">
        <div className="mx-auto max-w-5xl">
          <EmptyState title="找不到此比賽" description="此比賽不存在、尚未公布，或網址已失效" />
          <div className="mt-8 text-center">
            <Link to="/schedule" className="text-sm font-semibold text-brand-blue">返回賽程</Link>
          </div>
        </div>
      </div>
    );
  }

  const { match, homeTeam, awayTeam, events, season, data } = record;
  const roundUrl = `/rounds/${record.seasonId}/${match.league}/${encodeURIComponent(String(match.round))}`;
  const finished =
    match.status === MatchStatus.FINISHED &&
    match.homeScore !== null &&
    match.awayScore !== null;
  const scoreText = finished ? `${match.homeScore} - ${match.awayScore}` : 'VS';

  const relatedMatches = data.matches
    .filter(
      (candidate) =>
        candidate.id !== match.id &&
        candidate.league === match.league &&
        (candidate.homeTeamId === homeTeam.id ||
          candidate.awayTeamId === homeTeam.id ||
          candidate.homeTeamId === awayTeam.id ||
          candidate.awayTeamId === awayTeam.id),
    )
    .sort(
      (a, b) =>
        Math.abs(new Date(a.timestamp).getTime() - new Date(match.timestamp).getTime()) -
        Math.abs(new Date(b.timestamp).getTime() - new Date(match.timestamp).getTime()),
    )
    .slice(0, 4);

  const renderEvent = (event: MatchEvent) => {
    const playerProfile = resolveMatchEventPlayer(data, match, event);
    return (
      <li
        key={event.id}
        className="grid grid-cols-[44px_26px_minmax(0,1fr)] items-start gap-3 border-b border-neutral-100 py-4 last:border-b-0"
      >
        <span className="font-display text-sm font-semibold tabular-nums text-brand-blue">{event.minute}'</span>
        <span aria-hidden="true" className="text-base">{eventMarker(event)}</span>
        <div className="min-w-0">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
            {playerProfile ? (
              <Link
                to={`/players/${getPlayerIdentity(playerProfile)}?season=${record.seasonId}`}
                className="font-semibold text-brand-black transition-colors hover:text-brand-blue"
              >
                {event.player}
              </Link>
            ) : (
              <span className="font-semibold text-brand-black">{event.player}</span>
            )}
            <span className="text-xs font-medium text-neutral-400">{eventLabel(event)}</span>
          </div>
          <p className="mt-1 text-[11px] font-medium text-neutral-400">
            {event.team === 'HOME' ? homeTeam.name : awayTeam.name}
          </p>
        </div>
      </li>
    );
  };

  return (
    <div className="min-h-screen bg-white pb-24">
      <section className="border-b border-neutral-200 bg-white px-4 py-8 md:px-12 md:py-14">
        <div className="mx-auto max-w-6xl">
          <Link
            to={`/schedule?season=${record.seasonId}`}
            className="inline-flex min-h-11 items-center text-xs font-semibold text-neutral-500 transition-colors hover:text-brand-black"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />返回賽程
          </Link>

          <div className="mt-5 flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-400">
            <span>{season.displayName}</span><span>·</span><span>{match.league}</span><span>·</span>
            <Link to={roundUrl} className="text-neutral-600 transition-colors hover:text-brand-blue">
              第 {match.round} 輪
            </Link>
          </div>

          <div className="mx-auto mt-8 max-w-4xl">
            <div className="grid grid-cols-[minmax(0,1fr)_82px_minmax(0,1fr)] items-center gap-3 md:grid-cols-[minmax(0,1fr)_150px_minmax(0,1fr)] md:gap-10">
              <Link
                to={`/teams/${getTeamIdentity(homeTeam)}?season=${record.seasonId}`}
                className="group flex min-w-0 flex-col items-center text-center"
              >
                <img
                  src={homeTeam.logo}
                  alt={`${homeTeam.name} 隊徽`}
                  className="h-16 w-16 object-contain transition-transform group-hover:scale-[1.03] md:h-24 md:w-24"
                />
                <h1 className="mt-3 break-words text-sm font-semibold leading-snug text-brand-black transition-colors group-hover:text-brand-blue md:text-lg">
                  {homeTeam.name}
                </h1>
              </Link>

              <div className="text-center">
                <p className="font-display text-3xl font-medium tracking-tight tabular-nums text-brand-black md:text-5xl">
                  {scoreText}
                </p>
                <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-400">
                  {finished ? '比賽結束' : '尚未開賽'}
                </p>
              </div>

              <Link
                to={`/teams/${getTeamIdentity(awayTeam)}?season=${record.seasonId}`}
                className="group flex min-w-0 flex-col items-center text-center"
              >
                <img
                  src={awayTeam.logo}
                  alt={`${awayTeam.name} 隊徽`}
                  className="h-16 w-16 object-contain transition-transform group-hover:scale-[1.03] md:h-24 md:w-24"
                />
                <p className="mt-3 break-words text-sm font-semibold leading-snug text-brand-black transition-colors group-hover:text-brand-blue md:text-lg">
                  {awayTeam.name}
                </p>
              </Link>
            </div>

            <div className="mt-8 grid gap-3 border-y border-neutral-200 py-4 text-xs text-neutral-500 sm:grid-cols-2">
              <span className="inline-flex items-center justify-center sm:justify-start">
                <CalendarDays className="mr-2 h-4 w-4 text-brand-blue" />
                {formatTaipeiDateWithWeekday(match.timestamp)} {formatTaipeiTime(match.timestamp)}
              </span>
              <span className="inline-flex items-center justify-center sm:justify-end">
                <MapPin className="mr-2 h-4 w-4 text-brand-blue" />
                {match.venue}
              </span>
            </div>
          </div>

          {match.administrativeNote && (
            <p className="mx-auto mt-5 max-w-4xl border-l-2 border-amber-400 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
              {match.administrativeNote}
            </p>
          )}
        </div>
      </section>

      <main className="mx-auto grid max-w-6xl gap-10 px-4 py-10 md:px-12 md:py-14 lg:grid-cols-[minmax(0,1.55fr)_minmax(270px,0.7fr)] lg:gap-14">
        <section>
          <div className="flex items-center border-b border-neutral-200 pb-3">
            <Activity className="mr-2 h-5 w-5 text-brand-blue" />
            <h2 className="font-display text-xl font-semibold text-brand-black md:text-2xl">比賽事件</h2>
          </div>
          {events.length > 0 ? (
            <ul>{events.map(renderEvent)}</ul>
          ) : (
            <p className="border-b border-neutral-100 py-10 text-sm text-neutral-400">
              {finished ? '此場沒有已登錄的進球或紅黃牌事件' : '比賽事件將於賽後更新'}
            </p>
          )}
        </section>

        <aside className="space-y-8 lg:sticky lg:top-24 lg:self-start">
          <div className="border border-neutral-200 p-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-400">比賽資訊</p>
            <dl className="mt-4 divide-y divide-neutral-100 text-sm">
              <div className="flex items-center justify-between gap-4 py-3 first:pt-0">
                <dt className="text-neutral-400">賽季</dt>
                <dd className="font-medium text-brand-black">{season.shortName}</dd>
              </div>
              <div className="flex items-center justify-between gap-4 py-3">
                <dt className="text-neutral-400">級別</dt>
                <dd className="font-medium text-brand-black">{match.league}</dd>
              </div>
              <div className="flex items-center justify-between gap-4 py-3 last:pb-0">
                <dt className="text-neutral-400">輪次</dt>
                <dd>
                  <Link to={roundUrl} className="font-medium text-brand-blue hover:underline">
                    第 {match.round} 輪
                  </Link>
                </dd>
              </div>
            </dl>
          </div>

          <div className="border border-neutral-200 p-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-400">官方資料</p>
            <div className="mt-3 divide-y divide-neutral-100">
              <Link to={roundUrl} className="flex min-h-11 items-center justify-between text-sm font-medium text-brand-black hover:text-brand-blue">
                本輪賽程與賽果 <ChevronRight className="h-4 w-4" />
              </Link>
              <Link to={`/standings?season=${record.seasonId}`} className="flex min-h-11 items-center justify-between text-sm font-medium text-brand-black hover:text-brand-blue">
                查看積分榜 <ChevronRight className="h-4 w-4" />
              </Link>
              <Link to={`/stats?season=${record.seasonId}`} className="flex min-h-11 items-center justify-between text-sm font-medium text-brand-black hover:text-brand-blue">
                射手與紀律數據 <ChevronRight className="h-4 w-4" />
              </Link>
              {match.reportArticleId && (
                <Link to={`/news/${match.reportArticleId}`} className="flex min-h-11 items-center justify-between text-sm font-medium text-brand-black hover:text-brand-blue">
                  <span className="inline-flex items-center"><Newspaper className="mr-2 h-4 w-4 text-brand-blue" />賽事戰報</span>
                  <ChevronRight className="h-4 w-4" />
                </Link>
              )}
              {match.videoUrl && (
                <a href={match.videoUrl} target="_blank" rel="noopener noreferrer" className="flex min-h-11 items-center justify-between text-sm font-medium text-brand-black hover:text-brand-blue">
                  <span className="inline-flex items-center"><Video className="mr-2 h-4 w-4 text-brand-blue" />比賽影片</span>
                  <ChevronRight className="h-4 w-4" />
                </a>
              )}
            </div>
          </div>

          {relatedMatches.length > 0 && (
            <div>
              <h2 className="border-b border-neutral-200 pb-3 font-display text-lg font-semibold text-brand-black">相關賽事</h2>
              <div className="divide-y divide-neutral-100">
                {relatedMatches.map((candidate) => {
                  const home = data.teamMap[candidate.homeTeamId];
                  const away = data.teamMap[candidate.awayTeamId];
                  if (!home || !away) return null;
                  return (
                    <Link
                      key={candidate.id}
                      to={`/matches/${candidate.id}?season=${record.seasonId}`}
                      className="block py-4"
                    >
                      <p className="text-[10px] font-semibold text-neutral-400">{candidate.league} 第 {candidate.round} 輪</p>
                      <p className="mt-1 text-sm font-medium text-brand-black transition-colors hover:text-brand-blue">
                        {home.shortName} vs {away.shortName}
                      </p>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </aside>
      </main>
    </div>
  );
};

export default MatchPage;
