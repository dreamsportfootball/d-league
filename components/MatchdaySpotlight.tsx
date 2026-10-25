import React, { useEffect, useMemo, useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useSeason } from '../hooks/useSeason';
import { MatchStatus } from '../types';
import { formatTaipeiDateKey, formatTaipeiDateWithWeekday, formatTaipeiTime } from '../utils/dateFormat';

const MatchdaySpotlight: React.FC = () => {
  const { activeSeason, seasonData } = useSeason();
  const [today, setToday] = useState(() => formatTaipeiDateKey(new Date()));

  useEffect(() => {
    const refresh = () => setToday(formatTaipeiDateKey(new Date()));
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', refresh);
    const interval = window.setInterval(refresh, 60_000);
    return () => {
      window.removeEventListener('focus', refresh);
      document.removeEventListener('visibilitychange', refresh);
      window.clearInterval(interval);
    };
  }, []);

  const { dayMatches, isMatchday } = useMemo(() => {
    const dates = seasonData.matches
      .filter((match) => activeSeason.enabledLeagues.some((league) => league === match.league))
      .map((match) => formatTaipeiDateKey(match.timestamp))
      .filter((key) => Boolean(key) && key >= today);
    const closestDate = dates.sort()[0];
    const matches = closestDate
      ? seasonData.matches
        .filter((match) => formatTaipeiDateKey(match.timestamp) === closestDate)
        .filter((match) => activeSeason.enabledLeagues.some((league) => league === match.league))
        .sort((a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp))
      : [];
    return { dayMatches: matches, isMatchday: closestDate === today };
  }, [activeSeason.enabledLeagues, seasonData.matches, today]);

  if (dayMatches.length === 0) return null;

  const matchDate = formatTaipeiDateWithWeekday(dayMatches[0].timestamp);
  const finishedCount = dayMatches.filter((match) =>
    match.status === MatchStatus.FINISHED &&
    match.homeScore !== null && match.awayScore !== null).length;

  return (
    <section aria-label={isMatchday ? '今日比賽日資訊' : '下一個比賽日'} className="bg-brand-black text-white">
      <div className="container mx-auto px-4 py-5 md:px-6 md:py-6">
        <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
          <div className="min-w-0">
            <p className="text-[11px] font-extrabold uppercase tracking-[0.19em] text-brand-accent">
              {isMatchday ? 'MATCHDAY · TODAY' : 'NEXT MATCHDAY'}
            </p>
            <h2 className="mt-1 font-display text-2xl font-bold uppercase leading-tight tracking-wide md:text-3xl">
              {isMatchday ? '今日賽事' : '下一比賽日'}
            </h2>
            <p className="mt-2 text-sm font-medium text-white/80">
              {matchDate} · {dayMatches.length} 場比賽
              {isMatchday ? ` · ${finishedCount} 場已登錄賽果` : ''}
            </p>
          </div>
          <Link
            to={`/schedule?season=${activeSeason.id}`}
            className="inline-flex min-h-11 shrink-0 items-center gap-1 text-sm font-bold text-brand-accent hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent"
          >
            完整賽程 <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>

        {isMatchday && (
          <div className="mt-5 grid gap-x-7 md:grid-cols-2">
            {dayMatches.map((match) => {
              const home = seasonData.teamMap[match.homeTeamId];
              const away = seasonData.teamMap[match.awayTeamId];
              const hasScore = match.status === MatchStatus.FINISHED &&
                match.homeScore !== null && match.awayScore !== null;
              const videoUrl = hasScore
                ? (match.videoUrl ?? match.videoUrls?.firstHalf ?? match.videoUrls?.secondHalf)
                : undefined;
              return (
                <div key={match.id} className="border-t border-white/20 py-3">
                  <div className="flex items-center justify-between gap-3 text-xs font-medium text-white/60">
                    <span>{match.league} · 第{match.round}輪</span>
                    <span>{formatTaipeiTime(match.timestamp)} · {hasScore ? '完賽' : '賽果未登錄'}</span>
                  </div>
                  <div className="mt-2 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3">
                    <span className="min-w-0 break-words text-right text-sm font-bold leading-5">
                      {home?.shortName ?? home?.name ?? '球隊待確認'}
                    </span>
                    <span className="font-display text-xl font-bold tabular-nums text-brand-accent">
                      {hasScore ? `${match.homeScore}–${match.awayScore}` : 'VS'}
                    </span>
                    <span className="min-w-0 break-words text-left text-sm font-bold leading-5">
                      {away?.shortName ?? away?.name ?? '球隊待確認'}
                    </span>
                  </div>
                  {videoUrl && (
                    <a
                      href={videoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex min-h-11 items-center text-xs font-bold text-brand-accent hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent"
                    >
                      觀看已上架賽事影片
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        )}
        {isMatchday && (
          <p className="mt-3 text-xs leading-5 text-white/55">
            本區只顯示已發布的正式賽事資料，不提供即時比分；賽果由主辦單位確認後更新。
          </p>
        )}
      </div>
    </section>
  );
};

export default MatchdaySpotlight;
