import React, { useRef, useState } from 'react';
import { ArrowLeft, RotateCcw } from 'lucide-react';
import { Link } from 'react-router-dom';
import AnimatedScore from '../components/AnimatedScore';
import { useRankingMotion } from '../hooks/useRankingMotion';

const demoTeams = [
  { id: 'a', name: '示範球隊 A' },
  { id: 'b', name: '示範球隊 B' },
  { id: 'c', name: '示範球隊 C' },
  { id: 'd', name: '示範球隊 D' },
] as const;

/** Isolated illustration: never writes to season data or match results. */
const MotionDemoPage: React.FC = () => {
  const [updated, setUpdated] = useState(false);
  const [slowMotion, setSlowMotion] = useState(true);
  const standingsRef = useRef<HTMLDivElement>(null);
  const order = updated
    ? [demoTeams[1], demoTeams[0], demoTeams[2], demoTeams[3]]
    : [...demoTeams];
  const standings = order.map((team, index) => ({
    teamId: team.id,
    name: team.name,
    rank: index + 1,
    points: updated
      ? ({ a: 9, b: 12, c: 6, d: 3 } as Record<string, number>)[team.id]
      : ({ a: 10, b: 9, c: 6, d: 3 } as Record<string, number>)[team.id],
  }));
  useRankingMotion(standingsRef, 'motion-demo-only', standings, slowMotion ? 1000 : 240);

  const playbackDuration = slowMotion ? 1000 : 220;

  return (
    <section className="mx-auto min-h-[75vh] w-full max-w-5xl px-4 pb-24 pt-12 md:px-10 md:pt-20">
      <Link to="/" className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-neutral-500 hover:text-brand-blue">
        <ArrowLeft size={16} aria-hidden="true" /> 返回 D LEAGUE
      </Link>
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <span className="rounded-sm bg-brand-blue px-3 py-1.5 text-[11px] font-bold tracking-widest text-white">TEST MODE</span>
        <span className="text-xs font-semibold text-neutral-500">獨立預覽專用 · 非正式比賽結果</span>
      </div>
      <h1 className="mt-5 font-display text-4xl font-black tracking-tight md:text-6xl">
        動效實際展示
      </h1>
      <p className="mt-3 max-w-2xl text-sm leading-7 text-neutral-600">
        點擊下方按鈕，比分會更新，積分榜第一、二名會交換位置。動畫使用網站實際的比分元件與排名移動邏輯，測試數字不會寫入任何正式資料。
      </p>

      <div className="mt-8 flex flex-wrap items-center gap-3 border-b border-neutral-200 pb-8">
        <button
          type="button"
          onClick={() => setUpdated((prev) => !prev)}
          className="inline-flex min-h-12 items-center gap-2 rounded-md bg-brand-blue px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-2"
        >
          <RotateCcw size={17} aria-hidden="true" />
          {updated ? '重播：回到原本比分與排名' : '播放：更新比分與排名'}
        </button>
        <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 text-sm font-medium text-neutral-700">
          <input
            type="checkbox"
            checked={slowMotion}
            onChange={(event) => setSlowMotion(event.target.checked)}
            className="h-4 w-4 accent-brand-blue"
          />
          慢速展示（1 秒）
        </label>
        <span className="text-xs text-neutral-500">
          {slowMotion ? '慢速方便觀察；正式效果約 0.22–0.24 秒' : '正常速度，與正式效果相同'}
        </span>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-12 lg:grid-cols-2">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-brand-blue">01 / SCORE UPDATE</p>
          <h2 className="mb-6 mt-2 font-display text-2xl font-bold">比分更新</h2>
          <div className="border-y border-neutral-200 bg-white px-5 py-7">
            <div className="mb-5 flex items-center justify-between text-xs font-bold text-neutral-500">
              <span>L1 · 示範比賽</span>
              <span>{updated ? '示範完賽' : '示範開始'}</span>
            </div>
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
              <span className="text-right text-sm font-bold md:text-base">示範球隊 B</span>
              <div className="flex items-center gap-2 whitespace-nowrap font-display text-4xl font-black tabular-nums md:text-5xl">
                <AnimatedScore identity="motion-demo-team-b" value={updated ? 2 : 0} durationMs={playbackDuration} />
                <span className="text-neutral-300" aria-hidden="true">:</span>
                <AnimatedScore identity="motion-demo-team-a" value={updated ? 1 : 0} durationMs={playbackDuration} />
              </div>
              <span className="text-left text-sm font-bold md:text-base">示範球隊 A</span>
            </div>
          </div>
          <p className="mt-3 text-xs leading-6 text-neutral-500">
            比分數字改變才執行，首次進入頁面不會假裝即時更新
          </p>
        </div>

        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-brand-blue">02 / STANDINGS REORDER</p>
          <h2 className="mb-6 mt-2 font-display text-2xl font-bold">積分榜排名移動</h2>
          <div ref={standingsRef} className="bg-white">
            <div className="grid grid-cols-[44px_1fr_55px] border-b border-neutral-200 px-3 py-3 text-xs font-bold text-neutral-500">
              <span>名次</span>
              <span>球隊</span>
              <span className="text-right">積分</span>
            </div>
            {standings.map((row) => (
              <div
                key={row.teamId}
                data-motion-standings-row={`demo-${row.teamId}`}
                className="relative grid min-h-[56px] grid-cols-[44px_1fr_55px] items-center border-b border-neutral-100 bg-white px-3"
              >
                <span className="font-display text-lg font-bold tabular-nums">{row.rank}</span>
                <span className="text-sm font-semibold">{row.name}</span>
                <span className="text-right font-display text-lg font-bold tabular-nums text-brand-blue">{row.points}</span>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs leading-6 text-neutral-500">
            使用與正式積分榜相同的排名位移動畫；僅真正改變順位才觸發
          </p>
        </div>
      </div>
      <div className="mt-12 flex flex-wrap gap-5 border-t border-neutral-200 pt-6 text-sm font-bold text-brand-blue">
        <Link to="/schedule" className="hover:underline">查看真實賽程效果</Link>
        <Link to="/standings" className="hover:underline">查看真實積分榜</Link>
        <Link to="/" className="hover:underline">查看首頁相簿與導覽</Link>
      </div>
    </section>
  );
};

export default MotionDemoPage;
