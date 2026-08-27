import React, { useMemo } from 'react';
import { Swords } from 'lucide-react';
import { calculateHeadToHead } from '../services/headToHead';
import type { SeasonTeam } from '../types/team';
import { formatTaipeiDateWithWeekday } from '../utils/dateFormat';

interface HeadToHeadProps {
  homeTeam: SeasonTeam;
  awayTeam: SeasonTeam;
}

const HeadToHead: React.FC<HeadToHeadProps> = ({ homeTeam, awayTeam }) => {
  const summary = useMemo(
    () => calculateHeadToHead(homeTeam, awayTeam),
    [homeTeam, awayTeam],
  );

  if (!summary) return null;

  const homeLabel = homeTeam.shortName || homeTeam.name;
  const awayLabel = awayTeam.shortName || awayTeam.name;

  return (
    <section className="border-b border-neutral-100 px-5 py-7 sm:px-12 sm:py-9" aria-labelledby="head-to-head-title">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center">
          <Swords className="mr-2 h-4 w-4 shrink-0 text-brand-blue" aria-hidden="true" />
          <h3 id="head-to-head-title" className="text-xs font-black tracking-[0.12em] text-neutral-500">
            對戰紀錄
          </h3>
        </div>
        <span className="shrink-0 text-[10px] font-bold tracking-wide text-neutral-400">
          正式聯賽 · {summary.totalMeetings} 場
        </span>
      </div>

      <div className="grid grid-cols-3 divide-x divide-neutral-100 border-y border-neutral-100 py-4 text-center">
        <div className="min-w-0 px-2">
          <p className="truncate text-[10px] font-bold text-neutral-500" title={homeTeam.name}>{homeLabel}</p>
          <p className="mt-1 font-display text-3xl font-black tabular-nums text-brand-black">{summary.leftWins}</p>
          <p className="mt-1 text-[10px] font-bold text-neutral-400">勝</p>
        </div>
        <div className="min-w-0 px-2">
          <p className="text-[10px] font-bold text-neutral-500">和局</p>
          <p className="mt-1 font-display text-3xl font-black tabular-nums text-brand-black">{summary.draws}</p>
          <p className="mt-1 text-[10px] font-bold text-neutral-400">場</p>
        </div>
        <div className="min-w-0 px-2">
          <p className="truncate text-[10px] font-bold text-neutral-500" title={awayTeam.name}>{awayLabel}</p>
          <p className="mt-1 font-display text-3xl font-black tabular-nums text-brand-black">{summary.rightWins}</p>
          <p className="mt-1 text-[10px] font-bold text-neutral-400">勝</p>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-center gap-3 text-[10px] font-bold text-neutral-400">
        <span>總進球</span>
        <span className="font-display text-sm font-black tabular-nums text-brand-black">
          {summary.leftGoals} - {summary.rightGoals}
        </span>
      </div>

      <div className="mt-6">
        <p className="mb-2 text-[10px] font-black tracking-[0.12em] text-neutral-400">最近交手</p>
        <div className="divide-y divide-neutral-100 border-y border-neutral-100">
          {summary.recentMeetings.map((meeting) => (
            <div key={`${meeting.seasonId}-${meeting.matchId}`} className="grid min-h-11 grid-cols-[minmax(0,1fr)_auto] items-center gap-4 py-2.5">
              <div className="min-w-0">
                <p className="text-[11px] font-bold text-neutral-600">
                  {meeting.seasonId.replace('-', '/')} · {meeting.league} 第 {meeting.round} 輪
                </p>
                <p className="mt-0.5 text-[10px] font-medium text-neutral-400">
                  {formatTaipeiDateWithWeekday(meeting.timestamp).replaceAll('.', '/')}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2 text-right">
                <span className="hidden max-w-28 truncate text-[10px] font-bold text-neutral-500 sm:inline" title={homeTeam.name}>{homeLabel}</span>
                <span className="font-display text-lg font-black tabular-nums text-brand-black">
                  {meeting.leftScore} - {meeting.rightScore}
                </span>
                <span className="hidden max-w-28 truncate text-[10px] font-bold text-neutral-500 sm:inline" title={awayTeam.name}>{awayLabel}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HeadToHead;
