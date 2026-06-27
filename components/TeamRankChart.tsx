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

  const width = Math.max(560, 184 + Math.max(0, points.length - 1) * 96);
  const height = 300;
  const padding = { top: 42, right: 82, bottom: 58, left: 82 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  const rankSpan = Math.max(1, teamCount - 1);
  const xStep = points.length > 1 ? chartWidth / (points.length - 1) : 0;
  const xPosition = (index: number): number =>
    points.length === 1 ? padding.left + chartWidth / 2 : padding.left + index * xStep;
  const yPosition = (rank: number): number =>
    padding.top + ((rank - 1) / rankSpan) * chartHeight;
  const linePoints = points
    .map((point, index) => `${xPosition(index)},${yPosition(point.rank)}`)
    .join(' ');
  const latestPoint = points[points.length - 1];

  return (
    <div className="border-y border-neutral-100 py-5 md:py-7">
      <div className="max-w-full overflow-x-auto overscroll-x-contain pb-2">
        <div
          className="relative mx-auto h-[300px] shrink-0"
          style={{ width: `${width}px` }}
          onMouseLeave={() => setActivePointIndex(null)}
        >
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="absolute inset-0 h-full w-full"
            role="img"
            aria-labelledby="team-rank-chart-title team-rank-chart-description"
          >
            <title id="team-rank-chart-title">球隊排名走勢</title>
            <desc id="team-rank-chart-description">
              顯示同級別完整輪次結束後的正式排名變化，第 1 名位於圖表最上方
            </desc>

            {Array.from({ length: teamCount }, (_, index) => index + 1).map((rank) => {
              const y = yPosition(rank);
              return (
                <g key={rank}>
                  <line
                    x1={padding.left}
                    x2={width - padding.right}
                    y1={y}
                    y2={y}
                    stroke="currentColor"
                    strokeWidth="1"
                    className="text-neutral-200"
                  />
                  <text
                    x={padding.left - 18}
                    y={y + 4}
                    textAnchor="end"
                    className="fill-neutral-400 text-[12px] font-bold"
                  >
                    {rank}
                  </text>
                </g>
              );
            })}

            {points.length > 1 && (
              <polyline
                points={linePoints}
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-brand-blue"
              />
            )}

            {points.map((point, index) => {
              const x = xPosition(index);
              const y = yPosition(point.rank);
              return (
                <g key={`${point.round}-${index}`}>
                  <circle
                    cx={x}
                    cy={y}
                    r="5"
                    fill="white"
                    stroke="currentColor"
                    strokeWidth="3"
                    className="text-brand-blue"
                  />
                  <text
                    x={x}
                    y={height - 24}
                    textAnchor="middle"
                    className="fill-neutral-500 text-[12px] font-bold"
                  >
                    R{point.round}
                  </text>
                </g>
              );
            })}
          </svg>

          {points.map((point, index) => {
            const x = xPosition(index);
            const y = yPosition(point.rank);
            const isActive = activePointIndex === index;
            const tooltipBelow = y < 100;

            return (
              <button
                key={`control-${point.round}-${index}`}
                type="button"
                aria-label={`第 ${point.round} 輪，第 ${point.rank} 名，${point.points} 分，已賽 ${point.played} 場`}
                aria-pressed={isActive}
                onMouseEnter={() => setActivePointIndex(index)}
                onFocus={() => setActivePointIndex(index)}
                onBlur={() => setActivePointIndex(null)}
                onClick={() => setActivePointIndex((current) => current === index ? null : index)}
                className="absolute flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full outline-none focus:ring-2 focus:ring-brand-blue focus:ring-offset-2"
                style={{ left: `${x}px`, top: `${y}px` }}
              >
                <span className="sr-only">查看第 {point.round} 輪排名</span>
                {isActive && (
                  <span
                    className={`pointer-events-none absolute left-1/2 z-10 w-40 -translate-x-1/2 border border-neutral-200 bg-white px-3 py-2 text-left shadow-lg ${
                      tooltipBelow ? 'top-[calc(100%+8px)]' : 'bottom-[calc(100%+8px)]'
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
            );
          })}
        </div>
      </div>

      {points.length > 4 && (
        <p className="mt-1 text-center text-[10px] font-bold tracking-wide text-neutral-400 sm:hidden">
          左右滑動查看完整輪次
        </p>
      )}
      <p className="mt-3 text-center text-xs font-bold text-neutral-500 md:text-sm">
        最新正式排名第 {latestPoint.rank} 名 · {latestPoint.points} 分 · 已賽 {latestPoint.played} 場
      </p>
    </div>
  );
};

export default TeamRankChart;
