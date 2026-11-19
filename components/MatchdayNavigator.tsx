import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, CalendarDays, ChevronRight, Star, Trophy } from 'lucide-react';
import { useFollowedTeam } from '../hooks/useFollowedTeam';
import { getTeamIdentity } from '../services/entityData';
import { formatTaipeiDateKey, formatTaipeiMonthDayWeekday, formatTaipeiTime } from '../utils/dateFormat';
import { MatchStatus, type Match } from '../types';
import type { SeasonTeam } from '../types/team';

interface MatchdayNavigatorProps {
  matches: Match[];
  teamMap: Record<string, SeasonTeam>;
  onMatchClick: (matchId: string) => void;
}

interface MatchdayGroup {
  date: string;
  matches: Match[];
}

/**
 * A matchday-first exploration experiment, inside the EXISTING schedule page.
 * Reads approved competition records; does not derive speculative live scores.
 */
const MatchdayNavigator: React.FC<MatchdayNavigatorProps> = ({ matches, teamMap, onMatchClick }) => {
  const { followedTeamIds } = useFollowedTeam();
  const datesRef = useRef<HTMLDivElement>(null);
  const [requestedDate, setRequestedDate] = useState<string | null>(null);
  const [followedOnly, setFollowedOnly] = useState(false);

  const groups = useMemo<MatchdayGroup[]>(() => {
    const byDay = new Map<string, Match[]>();
    matches.forEach((match) => {
      const day = formatTaipeiDateKey(match.timestamp);
      if (!day || !teamMap[match.homeTeamId] || !teamMap[match.awayTeamId]) return;
      const sameDay = byDay.get(day) ?? [];
      sameDay.push(match);
      byDay.set(day, sameDay);
    });
    return [...byDay.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, dayMatches]) => ({
        date,
        matches: dayMatches.sort((a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp)),
      }));
  }, [matches, teamMap]);

  const today = formatTaipeiDateKey(new Date());
  const futureDay = groups.find(({ date, matches: dayMatches }) =>
    date >= today && dayMatches.some((match) => match.status !== MatchStatus.FINISHED));
  const latestPastDay = [...groups].reverse().find(({ date }) => date <= today);
  const defaultDate = futureDay?.date ?? latestPastDay?.date ?? groups[0]?.date ?? null;
  const selectedDate = groups.some((group) => group.date === requestedDate)
    ? requestedDate : defaultDate;
  const selectedGroup = groups.find((group) => group.date === selectedDate);
  const followedTeams = useMemo(
    () => new Set<string>(
      Object.keys(teamMap).filter((id) => followedTeamIds.includes(getTeamIdentity(teamMap[id]))),
    ),
    [followedTeamIds, teamMap],
  );
  const isFollowed = (match: Match) => followedTeams.has(match.homeTeamId) || followedTeams.has(match.awayTeamId);
  const dayMatches = selectedGroup?.matches ?? [];
  const visibleMatches = followedOnly ? dayMatches.filter(isFollowed) : dayMatches;
  const completeCount = dayMatches.filter((match) => match.status === MatchStatus.FINISHED).length;
  const activeDateIndex = groups.findIndex((group) => group.date === selectedDate);

  // Reveal the selected upcoming matchday on mobile without scrolling the page.
  useEffect(() => {
    const strip = datesRef.current;
    const selected = strip?.querySelector<HTMLButtonElement>('[data-matchday-date][aria-pressed="true"]');
    if (!strip || !selected) return;
    const stripBounds = strip.getBoundingClientRect();
    const selectedBounds = selected.getBoundingClientRect();
    strip.scrollLeft += selectedBounds.left + selectedBounds.width / 2
      - stripBounds.left - stripBounds.width / 2;
  }, [selectedDate]);

  if (groups.length === 0) return null;

  return (
    <section data-matchday-navigator aria-label="比賽日探索" className="mb-9 overflow-hidden rounded-2xl border border-[#203951] bg-[#101d2e] text-white shadow-lg shadow-slate-950/10">
      <div className="relative overflow-hidden border-b border-white/10 px-4 pb-4 pt-5 sm:px-6 sm:pt-6">
        <div className="pointer-events-none absolute -right-16 -top-24 h-52 w-52 rounded-full bg-blue-500/15 blur-3xl" aria-hidden="true" />
        <div className="relative flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.21em] text-[#76b8fc]">MATCHDAY EXPLORER</p>
            <h2 className="font-display text-[25px] font-black tracking-tight sm:text-[30px]">比賽日<span className="ml-2 text-[#76b8fc]">探索</span></h2>
            <p className="mt-1 text-xs leading-relaxed text-slate-300">選一個比賽日，快速查看對戰與已確認的賽果。</p>
          </div>
          <div className="flex shrink-0 items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-2 text-[11px] font-bold text-slate-200">
            <CalendarDays size={14} aria-hidden="true" />
            {groups.length} 個比賽日
          </div>
        </div>
      </div>

      <div className="px-3 pt-3 sm:px-5 sm:pt-4">
        <div className="mb-2 flex items-center justify-between gap-2 px-1">
          <p className="text-[11px] font-semibold text-slate-300">選擇日期</p>
          <div className="flex items-center gap-1" aria-label="日期捲動">
            <button type="button" aria-label="向前瀏覽比賽日" onClick={() => datesRef.current?.scrollBy({ left: -230, behavior: 'smooth' })}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full text-slate-300 transition-colors hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-[#76b8fc]">
              <ArrowLeft size={16} aria-hidden="true" />
            </button>
            <button type="button" aria-label="向後瀏覽比賽日" onClick={() => datesRef.current?.scrollBy({ left: 230, behavior: 'smooth' })}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full text-slate-300 transition-colors hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-[#76b8fc]">
              <ArrowRight size={16} aria-hidden="true" />
            </button>
          </div>
        </div>
        <div ref={datesRef} className="no-scrollbar -mx-3 flex snap-x snap-mandatory gap-2 overflow-x-auto px-3 pb-4 sm:-mx-5 sm:px-5" aria-label="比賽日期">
          {groups.map((group) => {
            const selected = group.date === selectedDate;
            const firstMatch = group.matches[0];
            const allFinished = group.matches.every((match) => match.status === MatchStatus.FINISHED);
            return (
              <button key={group.date} type="button" data-matchday-date={group.date}
                aria-pressed={selected} aria-label={formatTaipeiMonthDayWeekday(firstMatch.timestamp) + '，' + group.matches.length + ' 場'}
                onClick={() => setRequestedDate(group.date)}
                className={`min-h-[70px] min-w-[106px] shrink-0 snap-start rounded-xl border px-3 py-2.5 text-left transition-[background-color,border-color,transform] active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#76b8fc] motion-reduce:transform-none ${selected ? 'border-[#76b8fc] bg-[#1e426a]' : 'border-white/10 bg-white/[0.05] hover:border-white/30 hover:bg-white/10'}`}>
                <span className={`block text-[13px] font-extrabold tabular-nums ${selected ? 'text-white' : 'text-slate-200'}`}>
                  {formatTaipeiMonthDayWeekday(firstMatch.timestamp)}
                </span>
                <span className="mt-1.5 flex items-center justify-between gap-2 text-[10px] text-slate-300">
                  <span>{group.matches.length} 場</span>
                  <span className={group.date === today ? 'font-bold text-[#76b8fc]' : ''}>
                    {group.date === today ? '今天' : allFinished ? '已完賽' : '待賽'}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="border-t border-white/10 bg-white/[0.035] px-3 pb-4 pt-4 sm:px-5 sm:pb-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-black text-white">
              {selectedGroup ? formatTaipeiMonthDayWeekday(selectedGroup.matches[0].timestamp) : ''}
              <span className="ml-2 text-[11px] font-semibold text-slate-300">已完賽 {completeCount}/{dayMatches.length}</span>
            </p>
            <p className="mt-1 text-[11px] text-slate-400">點擊對戰可查看原有比賽詳情</p>
          </div>
          {followedTeamIds.length > 0 && (
            <button type="button" aria-pressed={followedOnly} data-matchday-followed
              onClick={() => setFollowedOnly((active) => !active)}
              className={`inline-flex min-h-11 items-center gap-1.5 rounded-full border px-3 text-[11px] font-bold transition-colors focus-visible:outline-2 focus-visible:outline-[#76b8fc] ${followedOnly ? 'border-[#76b8fc] bg-[#1e426a] text-white' : 'border-white/20 bg-white/5 text-slate-200 hover:bg-white/10'}`}>
              <Star size={14} className={followedOnly ? 'fill-[#76b8fc] text-[#76b8fc]' : ''} aria-hidden="true" />
              我的球隊
            </button>
          )}
        </div>
        {visibleMatches.length > 0 ? (
          <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3" data-matchday-fixtures>
            {visibleMatches.map((match) => {
              const home = teamMap[match.homeTeamId];
              const away = teamMap[match.awayTeamId];
              const finished = match.status === MatchStatus.FINISHED;
              const hasResult = finished && match.homeScore !== null && match.awayScore !== null;
              return (
                <button key={match.id} type="button" data-matchday-match={match.id}
                  onClick={() => onMatchClick(match.id)}
                  aria-label={home.name + ' 對 ' + away.name + '，' + (hasResult ? match.homeScore + ' 比 ' + match.awayScore : formatTaipeiTime(match.timestamp)) + '，查看比賽詳情'}
                  className="group relative min-w-0 rounded-xl border border-white/10 bg-white/[0.07] px-3 py-3 text-left transition-[background-color,border-color,transform] hover:border-[#76b8fc]/60 hover:bg-white/[0.12] active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#76b8fc] motion-reduce:transform-none sm:px-4">
                  <div className="mb-3 flex items-center justify-between gap-2 text-[10px]">
                    <span className="font-bold tracking-wide text-[#8cc5ff]">{match.league} · 第{match.round}輪</span>
                    <span className="inline-flex items-center gap-1.5 text-slate-300">
                      <span>{finished ? '完賽' : formatTaipeiTime(match.timestamp)}</span>
                      <ChevronRight size={13} className="transition-transform motion-safe:group-hover:translate-x-0.5" aria-hidden="true" />
                    </span>
                  </div>
                  {[{ team: home, score: match.homeScore }, { team: away, score: match.awayScore }].map(({ team, score }) => (
                    <div key={team.id} className="mb-2 grid min-w-0 grid-cols-[24px_minmax(0,1fr)_32px] items-center gap-2 last:mb-0">
                      {team.logo ? <img src={team.logo} loading="lazy" alt="" className="h-6 w-6 object-contain" /> : <Trophy size={17} className="text-slate-500" aria-hidden="true" />}
                      <span className="min-w-0 truncate text-[12px] font-semibold text-white" title={team.name}>{team.name}</span>
                      <strong className={`text-right font-display text-lg font-black tabular-nums ${hasResult ? 'text-white' : 'text-slate-400'}`}>{hasResult ? score : '–'}</strong>
                    </div>
                  ))}
                  {match.administrativeNote?.trim() && <p className="mt-3 border-t border-white/10 pt-2 text-[10px] leading-relaxed text-amber-200">{match.administrativeNote.trim()}</p>}
                </button>
              );
            })}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-white/15 px-4 py-8 text-center text-xs text-slate-300">
            這個比賽日沒有你追蹤球隊的賽事。
            <button type="button" onClick={() => setFollowedOnly(false)} className="ml-1 min-h-11 font-bold text-[#8cc5ff] underline underline-offset-4 focus-visible:outline-2">查看全部</button>
          </div>
        )}
        {groups.length > 1 && (
          <div className="mt-4 flex items-center justify-between gap-2">
            <button type="button" disabled={activeDateIndex <= 0} onClick={() => setRequestedDate(groups[activeDateIndex - 1]?.date ?? selectedDate)}
              className="inline-flex min-h-11 items-center gap-2 text-[11px] font-bold text-slate-300 transition-colors hover:text-white disabled:cursor-not-allowed disabled:opacity-30 focus-visible:outline-2 focus-visible:outline-[#76b8fc]">
              <ArrowLeft size={15} aria-hidden="true" /> 上一比賽日
            </button>
            <button type="button" disabled={activeDateIndex < 0 || activeDateIndex >= groups.length - 1} onClick={() => setRequestedDate(groups[activeDateIndex + 1]?.date ?? selectedDate)}
              className="inline-flex min-h-11 items-center gap-2 text-[11px] font-bold text-slate-300 transition-colors hover:text-white disabled:cursor-not-allowed disabled:opacity-30 focus-visible:outline-2 focus-visible:outline-[#76b8fc]">
              下一比賽日 <ArrowRight size={15} aria-hidden="true" />
            </button>
          </div>
        )}
      </div>
    </section>
  );
};

export default MatchdayNavigator;
