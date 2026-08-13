import React, { useState } from 'react';

export interface TeamRankPoint {
  round: string;
  rank: number;
  points: number;
  played: number;
}

interface TeamRankChartProps {
  points: TeamRankPoint[];
  teamCount: number;
}

const TeamRankChart: React.FC<TeamRankChartProps> = ({ points, teamCount }) => {
  const [activePointIndex, setActivePointIndex] = useState<number | null>(null);

  if (points.length === 0 || teamCount <= 0) return null;

  const chartBounds = { left: 8, right: 8, top: 12, bottom: 23 };
  const chartWidth = 100 - chartBounds.left - chartBounds.right;
  const chartHeight = 100 - chartBounds.top - chartBounds.bottom;
  const rankSpan = Math.max(1, teamCount - 1);
  const xPosition = (index: number): number =>
    points.length === 1
      ? chartBounds.left + chartWidth / 2
      : chartBounds.left + (index / (points.length - 1)) * chartWidth;
  const yPosition = (rank: number): number =>
    chartBounds.top + ((rank - 1) / rankSpan) * chartHeight;
  const linePoints = points
    .map((point, index) => `${xPosition(index)},${yPosition(point.rank)}`)
    .join(' ');
  const labelStep = Math.max(1, Math.ceil(points.length / 6));
  const labelRanks = teamCount <= 6
    ? Array.from({ length: teamCount }, (_, index) => index + 1)
    : [...new Set([1, Math.ceil(teamCount / 2), teamCount])];

  return (
    <div
      className="border-y border-neutral-100 py-3 md:py-4"
      onMouseLeave={() => setActivePointIndex(null)}
    >
      <div className="relative h-[160px] w-full md:h-[190px]">
        {labelRanks.map((rank) => {
          const y = yPosition(rank);
          return (
            <div
              key={rank}
              className="pointer-events-none absolute left-0 right-0"
              style={{ top: `${y}%` }}
              aria-hidden="true"
            >
              <span className="absolute left-0 -translate-y-1/2 text-[10px] font-bold tabular-nums text-neutral-400">
                {rank}
              </span>
              <span
                className="absolute h-px bg-neutral-200"
                style={{
                  left: `${chartBounds.left}%`,
                  right: `${chartBounds.right}%`,
                }}
              />
            </div>
          );
        })}

        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="pointer-events-none absolute inset-0 h-full w-full"
          role="img"
          aria-labelledby="team-rank-chart-title team-rank-chart-description"
        >
          <title id="team-rank-chart-title">球隊排名走勢</title>
          <desc id="team-rank-chart-description">
            顯示同級別完整輪次結束後的正式排名變化，第 1 名位於圖表最上方
          </desc>
          {points.length > 1 && (
            <polyline
              points={linePoints}
              fill="none"
              stroke="currentColor"
              strokeWidth="0.9"
              vectorEffect="non-scaling-stroke"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-brand-blue"
            />
          )}
        </svg>

        {points.map((point, index) => {
          const x = xPosition(index);
          const y = yPosition(point.rank);
          const isActive = activePointIndex === index;
          const tooltipBelow = y < 35;
          const showRoundLabel =
            index === 0 ||
            index === points.length - 1 ||
            index % labelStep === 0;
          const tooltipAlignment =
            index === 0
              ? 'left-0'
              : index === points.length - 1
                ? 'right-0'
                : 'left-1/2 -translate-x-1/2';

          return (
            <React.Fragment key={`${point.round}-${index}`}>
              {showRoundLabel ? (
                <button
                  type="button"
                  aria-label={`第 ${point.round} 輪，第 ${point.rank} 名，${point.points} 分，已賽 ${point.played} 場`}
                  aria-pressed={isActive}
                  onMouseEnter={() => setActivePointIndex(index)}
                  onFocus={() => setActivePointIndex(index)}
                  onBlur={() => setActivePointIndex(null)}
                  onClick={() => setActivePointIndex((current) => current === index ? null : index)}
                  className="absolute flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full outline-none focus:ring-2 focus:ring-brand-blue focus:ring-offset-2"
                  style={{ left: `${x}%`, top: `${y}%` }}
                >
                  <span className="h-2.5 w-2.5 rounded-full border-[3px] border-brand-blue bg-white" />
                  <span className="sr-only">查看第 {point.round} 輪排名</span>
                  {isActive && (
                    <span
                      className={`pointer-events-none absolute z-10 w-40 border border-neutral-200 bg-white px-3 py-2 text-left shadow-lg ${tooltipAlignment} ${
                        tooltipBelow ? 'top-[calc(100%+6px)]' : 'bottom-[calc(100%+6px)]'
                      }`}
                    >
                      <span className="block text-[10px] font-black tracking-[0.12em] text-brand-blue">
                        第 {point.round} 輪
                      </span>
                      <span className="mt-1 block text-xs font-bold text-brand-black">
                        第 {point.rank} 名 · {point.points} 分
                      </span>
                      <span className="mt-0.5 block text-[10px] font-medium text-neutral-500">
                        已賽 {point.played} 場
                      </span>
                    </span>
                  )}
                </button>
              ) : (
                <span
                  className="pointer-events-none absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-brand-blue bg-white"
                  style={{ left: `${x}%`, top: `${y}%` }}
                  aria-hidden="true"
                />
              )}

              {showRoundLabel && (
                <span
                  className="pointer-events-none absolute -translate-x-1/2 text-[10px] font-bold text-neutral-500"
                  style={{ left: `${x}%`, bottom: '4%' }}
                  aria-hidden="true"
                >
                  R{point.round}
                </span>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

export default TeamRankChart;
