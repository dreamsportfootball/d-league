import React from 'react';
import { BarChart3, ChevronRight } from 'lucide-react';
import type { SeasonId } from '../types/season';

export interface PlayerSeasonTrendPoint {
  seasonId: SeasonId;
  label: string;
  goals: number;
  yellowCards: number;
  redCards: number;
}

interface PlayerSeasonTrendProps {
  points: readonly PlayerSeasonTrendPoint[];
  selectedSeason: SeasonId | 'ALL';
  onSeasonSelect: (seasonId: SeasonId) => void;
}

const PlayerSeasonTrend: React.FC<PlayerSeasonTrendProps> = ({ points, selectedSeason, onSeasonSelect }) => {
  if (points.length === 0) return null;
  const maxGoals = Math.max(1, ...points.map((point) => point.goals));
  const totalGoals = points.reduce((sum, point) => sum + point.goals, 0);
  const totalYellow = points.reduce((sum, point) => sum + point.yellowCards, 0);
  const totalRed = points.reduce((sum, point) => sum + point.redCards, 0);

  return (
    <section data-player-season-trend aria-labelledby="player-season-trend-title" className="order-1 overflow-hidden rounded-2xl border border-[#203951] bg-[#101d2e] text-white shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-white/10 px-4 py-5 sm:px-6">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#84bfff]">PLAYER ARCHIVE</p>
          <h2 id="player-season-trend-title" className="mt-1 flex items-center gap-2 font-display text-xl font-black sm:text-2xl">
            <BarChart3 size={19} className="text-[#84bfff]" aria-hidden="true" />
            生涯數據軌跡
          </h2>
          <p className="mt-1 text-[11px] leading-relaxed text-slate-300">僅依官方已登錄比賽事件統計，選擇賽季可查看相關事件。</p>
        </div>
        <span className="rounded-full border border-white/15 px-3 py-2 text-[11px] font-semibold text-slate-200">{points.length} 個賽季</span>
      </div>

      <div className="grid grid-cols-3 divide-x divide-white/10 bg-white/[0.04] py-4 text-center">
        {[
          { label: '生涯進球', value: totalGoals },
          { label: '累計黃牌', value: totalYellow },
          { label: '紅牌／兩黃離場', value: totalRed },
        ].map(({ label, value }) => (
          <div key={label} className="min-w-0 px-2">
            <span className="block text-[10px] font-semibold text-slate-300">{label}</span>
            <strong className="mt-1 block font-display text-[26px] font-black leading-none tabular-nums text-white">{value}</strong>
          </div>
        ))}
      </div>

      <div className="space-y-1 px-3 pb-4 pt-3 sm:px-5 sm:pb-5">
        <p className="mb-2 px-1 text-[11px] font-bold tracking-wide text-slate-300">每季進球比較</p>
        {points.map((point) => {
          const selected = selectedSeason === point.seasonId;
          return (
            <button
              type="button"
              key={point.seasonId}
              aria-pressed={selected}
              data-player-season-goals={point.seasonId}
              onClick={() => onSeasonSelect(point.seasonId)}
              className={`group grid min-h-12 w-full grid-cols-[62px_minmax(0,1fr)_25px_14px] items-center gap-3 rounded-lg px-2 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#84bfff] sm:grid-cols-[82px_minmax(0,1fr)_34px_14px] ${selected ? 'bg-white/15' : 'hover:bg-white/10'}`}
              aria-label={`${point.label} 賽季 ${point.goals} 球，查看該季比賽事件`}
            >
              <span className={`text-[12px] font-semibold tabular-nums ${selected ? 'text-white' : 'text-slate-300'}`}>{point.label}</span>
              <span className="h-2 overflow-hidden rounded-full bg-white/10" aria-hidden="true">
                <span className="block h-full rounded-full bg-[#84bfff] transition-[width] duration-300 motion-reduce:transition-none" style={{ width: `${point.goals / maxGoals * 100}%` }} />
              </span>
              <strong className="text-right text-[15px] font-black tabular-nums">{point.goals}</strong>
              <ChevronRight size={14} className="text-slate-400 transition-transform motion-safe:group-hover:translate-x-0.5" aria-hidden="true" />
            </button>
          );
        })}
      </div>
    </section>
  );
};

export default PlayerSeasonTrend;
