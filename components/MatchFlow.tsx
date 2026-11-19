import React, { useMemo } from 'react';
import { Activity, Goal, ShieldAlert } from 'lucide-react';
import type { Match } from '../types';
import type { MatchEvent } from '../types/matchEvent';
import type { SeasonTeam } from '../types/team';

interface MatchFlowProps {
  match: Match;
  events: readonly MatchEvent[];
  homeTeam: SeasonTeam;
  awayTeam: SeasonTeam;
}

const MatchFlow: React.FC<MatchFlowProps> = ({ match, events, homeTeam, awayTeam }) => {
  const eventsBySide = useMemo(() => {
    const confirmed = events
      .filter((event) => Number.isFinite(event.minute) && event.minute >= 0)
      .slice()
      .sort((a, b) => a.minute - b.minute);
    return {
      goals: confirmed.filter((event) => event.type === 'GOAL'),
      yellow: confirmed.filter((event) => event.type === 'YELLOW_CARD' || event.type === 'SECOND_YELLOW'),
      dismissals: confirmed.filter((event) => event.type === 'RED_CARD' || event.type === 'SECOND_YELLOW'),
    };
  }, [events]);

  if (eventsBySide.goals.length === 0 && eventsBySide.yellow.length === 0 && eventsBySide.dismissals.length === 0) {
    return null;
  }

  const maxMinute = Math.max(40, Math.ceil(Math.max(...eventsBySide.goals.map((event) => event.minute), 0) / 10) * 10);
  const unattributed = (match.unattributedGoals?.HOME ?? 0) + (match.unattributedGoals?.AWAY ?? 0);

  return (
    <section data-match-flow className="border-b border-neutral-100 bg-[#f7faff] px-5 py-6 sm:px-12 sm:py-8" aria-labelledby="match-flow-title">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <Activity className="h-4 w-4 shrink-0 text-brand-blue" aria-hidden="true" />
          <h3 id="match-flow-title" className="text-xs font-black tracking-wider text-brand-black">進球進程</h3>
        </div>
        <span className="shrink-0 text-[10px] font-semibold text-neutral-500">官方已確認事件</span>
      </div>

      <div className="grid grid-cols-3 gap-2 rounded-xl border border-neutral-100 bg-white px-2 py-3 text-center sm:px-5">
        {[
          { label: '已確認進球事件', value: eventsBySide.goals.length, icon: <Goal className="h-3.5 w-3.5" aria-hidden="true" /> },
          { label: '黃牌事件', value: eventsBySide.yellow.length, icon: <span className="h-3.5 w-2.5 rounded-[2px] bg-amber-400" aria-hidden="true" /> },
          { label: '紅牌／兩黃離場', value: eventsBySide.dismissals.length, icon: <ShieldAlert className="h-3.5 w-3.5 text-rose-600" aria-hidden="true" /> },
        ].map((item) => (
          <div key={item.label} className="min-w-0 border-r border-neutral-100 px-1 last:border-r-0">
            <div className="flex items-center justify-center gap-1 text-neutral-500">{item.icon}<span className="text-[10px] font-semibold">{item.label}</span></div>
            <div className="mt-1 font-display text-2xl font-black tabular-nums text-brand-black">{item.value}</div>
          </div>
        ))}
      </div>

      {eventsBySide.goals.length > 0 && (
        <div className="mt-5 rounded-xl border border-neutral-100 bg-white px-3 py-4 sm:px-5" aria-label="兩隊進球時間分布">
          {[
            { side: 'HOME' as const, team: homeTeam, style: 'bg-brand-blue', ring: 'ring-blue-100' },
            { side: 'AWAY' as const, team: awayTeam, style: 'bg-[#e8a543]', ring: 'ring-amber-100' },
          ].map(({ side, team, style, ring }) => {
            const teamGoals = eventsBySide.goals.filter((event) => (event.scoringTeam ?? event.team) === side);
            return (
              <div key={side} className="mb-4 grid grid-cols-[56px_minmax(0,1fr)] items-center gap-3 last:mb-0 sm:grid-cols-[86px_minmax(0,1fr)]">
                <span title={team.name} className="min-w-0 truncate text-[11px] font-bold text-neutral-700">{team.shortName || team.name}</span>
                <div className="relative h-8">
                  <div className="absolute inset-x-0 top-[14px] h-1 rounded-full bg-neutral-100" aria-hidden="true" />
                  {teamGoals.map((event) => {
                    const left = Math.max(0, Math.min(100, (event.minute / maxMinute) * 100));
                    return (
                      <span
                        key={event.id}
                        title={`${event.minute}′ ${event.player}${event.isOwnGoal ? '（烏龍球）' : event.isPK ? '（點球）' : ''}`}
                        className={`absolute top-[7px] h-4 w-4 -translate-x-1/2 rounded-full border-2 border-white ${style} shadow-sm ring-2 ${ring}`}
                        style={{ left: `${left}%` }}
                        aria-hidden="true"
                      />
                    );
                  })}
                  <span className="sr-only">{team.name}：{teamGoals.map((event) => `${event.minute} 分鐘 ${event.player}`).join('，') || '沒有已確認進球'}</span>
                </div>
              </div>
            );
          })}
          <div className="ml-[68px] flex justify-between text-[10px] font-medium tabular-nums text-neutral-400 sm:ml-[98px]" aria-hidden="true">
            <span>0′</span><span>{Math.round(maxMinute / 2)}′</span><span>{maxMinute}′</span>
          </div>
        </div>
      )}

      {unattributed > 0 && <p className="mt-3 text-[11px] leading-relaxed text-amber-700">另有 {unattributed} 球尚未確認進球球員；以上僅列已確認事件，請以官方比分為準。</p>}
      <p className="mt-3 text-[10px] leading-relaxed text-neutral-500">進球時間由已確認賽事紀錄呈現，不代表控球率、攻勢或即時數據。</p>
    </section>
  );
};

export default MatchFlow;
