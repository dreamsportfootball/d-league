import React from 'react';

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
  if (points.length === 0 || teamCount <= 0) return null;

  const width = 720;
  const height = 300;
  const padding = { top: 40, right: 24, bottom: 58, left: 54 };
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
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-auto w-full"
        role="img"
        aria-labelledby="team-rank-chart-title team-rank-chart-description"
      >
        <title id="team-rank-chart-title">球隊排名走勢</title>
        <desc id="team-rank-chart-description">
          顯示球隊每輪比賽完成後的聯賽排名變化
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
                strokeDasharray="4 6"
                className="text-neutral-200"
              />
              <text
                x={padding.left - 12}
                y={y + 4}
                textAnchor="end"
                className="fill-neutral-400 text-[12px] font-bold"
              >
                第{rank}名
              </text>
            </g>
          );
        })}

        {points.length > 1 && (
          <polyline
            points={linePoints}
            fill="none"
            stroke="currentColor"
            strokeWidth="4"
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
                r="7"
                fill="white"
                stroke="currentColor"
                strokeWidth="4"
                className="text-brand-blue"
              >
                <title>
                  第{point.round}輪：第{point.rank}名，{point.points}分，已賽{point.played}場
                </title>
              </circle>
              <text
                x={x}
                y={Math.max(18, y - 14)}
                textAnchor="middle"
                className="fill-brand-black text-[14px] font-black"
              >
                {point.rank}
              </text>
              <text
                x={x}
                y={height - 24}
                textAnchor="middle"
                className="fill-neutral-400 text-[12px] font-bold"
              >
                第{point.round}輪
              </text>
            </g>
          );
        })}
      </svg>

      <p className="mt-1 text-center text-xs font-bold text-neutral-500 md:text-sm">
        最新排名第 {latestPoint.rank} 名 · {latestPoint.points} 分 · 已賽 {latestPoint.played} 場
      </p>
    </div>
  );
};

export default TeamRankChart;
