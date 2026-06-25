import React, { useMemo } from 'react';
import { calculateLeagueTable } from '../services/competitionEngine';
import { useSeason } from '../hooks/useSeason';
import type { Standing } from '../types';
import type { LeagueId } from '../types/season';
import AutoFitText from './AutoFitText';

const FormBadge: React.FC<{ result: 'W' | 'D' | 'L' }> = ({ result }) => {
  const colorClass =
    result === 'W' ? 'bg-green-500' : result === 'D' ? 'bg-neutral-400' : 'bg-red-500';
  return <div className={`mx-0.5 h-2 w-2 rounded-full ${colorClass}`} title={result} />;
};

interface StandingsProps {
  league: LeagueId;
  variant?: 'widget' | 'page';
}

const TieLabel: React.FC<{ row: Standing; compact?: boolean }> = ({ row, compact = false }) => {
  if (row.tieStatus === 'NONE') return null;
  return (
    <span
      className={`ml-1 whitespace-nowrap font-bold ${
        row.tieStatus === 'DRAW_REQUIRED' ? 'text-amber-600' : 'text-neutral-400'
      } ${compact ? 'text-[8px]' : 'text-[9px]'}`}
    >
      {row.tieStatus === 'DRAW_REQUIRED' ? '待抽籤' : '並列'}
    </span>
  );
};

const Standings: React.FC<StandingsProps> = ({ league, variant = 'page' }) => {
  const { activeSeason, seasonData } = useSeason();
  const leagueConfig = activeSeason.leagues[league];
  const standings = useMemo(
    () =>
      calculateLeagueTable({
        league,
        teams: seasonData.teams,
        matches: seasonData.matches,
        matchEvents: seasonData.matchEvents,
        rules: activeSeason.rules,
        leagueConfig,
      }),
    [activeSeason.rules, league, leagueConfig, seasonData.matchEvents, seasonData.matches, seasonData.teams],
  );

  const isWidget = variant === 'widget';
  const displayed = standings.slice(0, isWidget ? 6 : standings.length);
  const relegationStart =
    leagueConfig && leagueConfig.relegationPlaces > 0
      ? standings.length - leagueConfig.relegationPlaces + 1
      : Number.POSITIVE_INFINITY;

  const rankBar = (row: Standing) => {
    if (row.tieStatus === 'DRAW_REQUIRED') return 'bg-amber-400';
    if (row.rank === 1) return 'bg-brand-blue';
    if (leagueConfig && leagueConfig.promotionPlaces > 0 && row.rank <= leagueConfig.promotionPlaces) {
      return 'bg-green-500';
    }
    if (row.rank >= relegationStart) return 'bg-red-500';
    return 'bg-transparent';
  };

  if (isWidget) {
    return (
      <div className="w-full text-xs">
        <div className="grid grid-cols-[2rem_1fr_2rem_2rem] gap-2 border-b border-neutral-100 py-2 text-[10px] font-bold tracking-wider text-neutral-500">
          <span>#</span>
          <span>球隊</span>
          <span className="text-center">場次</span>
          <span className="text-center">積分</span>
        </div>
        {displayed.map((row) => {
          const team = seasonData.teamMap[row.teamId];
          if (!team) return null;
          return (
            <div
              key={row.teamId}
              className="grid grid-cols-[2rem_1fr_2rem_2rem] items-center gap-2 border-b border-neutral-50 py-3 transition-colors hover:bg-neutral-50/50"
            >
              <div className="relative flex items-center pl-1">
                <div className={`absolute left-0 h-3 w-0.5 rounded-full ${rankBar(row)}`} />
                <span className="ml-2 font-medium tabular-nums text-brand-black">{row.rank}</span>
              </div>
              <div className="flex min-w-0 items-center space-x-2">
                <img src={team.logo} alt={team.name} className="h-5 w-5 shrink-0 object-contain" />
                <div className="min-w-0 flex-1">
                  <AutoFitText text={team.name} maxFontSize={12} minFontSize={7} className="font-bold text-brand-black" />
                </div>
                <TieLabel row={row} compact />
              </div>
              <span className="text-center tabular-nums text-brand-black">{row.played}</span>
              <span className="text-center font-semibold tabular-nums text-brand-black">{row.points}</span>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full min-w-[740px] border-collapse md:min-w-0">
        <thead className="border-b border-neutral-200 text-[10px] font-bold tracking-widest text-neutral-500 md:text-[11px]">
          <tr>
            <th className="w-8 px-1 py-3 text-left md:w-10">名次</th>
            <th className="w-[140px] py-3 pl-2 pr-2 text-left md:w-[220px] md:px-4">球隊</th>
            <th className="w-10 px-1 py-3 text-center md:w-12">場次</th>
            <th className="w-10 px-1 py-3 text-center md:w-12">勝</th>
            <th className="w-10 px-1 py-3 text-center md:w-12">和</th>
            <th className="w-10 px-1 py-3 text-center md:w-12">敗</th>
            <th className="w-10 px-1 py-3 text-center md:w-12">進球</th>
            <th className="w-10 px-1 py-3 text-center md:w-12">失球</th>
            <th className="w-12 px-1 py-3 text-center md:w-14">淨勝</th>
            <th className="w-12 px-1 py-3 text-center text-brand-blue md:w-14">積分</th>
            <th className="w-[50px] px-1 py-3 text-left md:w-[60px]">近況</th>
          </tr>
        </thead>
        <tbody>
          {displayed.map((row) => {
            const team = seasonData.teamMap[row.teamId];
            if (!team) return null;
            return (
              <tr
                key={row.teamId}
                className="border-b border-neutral-100 transition-colors last:border-0 hover:bg-neutral-50/50"
              >
                <td className="w-8 px-1 py-3 md:w-10">
                  <div className="relative flex items-center pl-1">
                    <div className={`absolute left-0 h-6 w-1 rounded-full ${rankBar(row)}`} />
                    <span className="ml-3 font-mono text-xs font-bold tabular-nums text-brand-black md:text-sm">
                      {row.rank}
                    </span>
                  </div>
                </td>
                <td className="w-[140px] py-3 pl-2 pr-2 md:w-[220px] md:px-4">
                  <div className="flex min-w-0 items-center space-x-3">
                    <img src={team.logo} alt={team.name} className="h-7 w-7 shrink-0 object-contain md:h-8 md:w-8" />
                    <div className="min-w-0 flex-1">
                      <AutoFitText text={team.name} maxFontSize={14} minFontSize={7} className="font-bold text-brand-black" />
                    </div>
                    <TieLabel row={row} />
                  </div>
                </td>
                <td className="px-1 py-3 text-center text-xs tabular-nums text-brand-black md:text-sm">{row.played}</td>
                <td className="px-1 py-3 text-center text-xs tabular-nums text-brand-black md:text-sm">{row.won}</td>
                <td className="px-1 py-3 text-center text-xs tabular-nums text-brand-black md:text-sm">{row.drawn}</td>
                <td className="px-1 py-3 text-center text-xs tabular-nums text-brand-black md:text-sm">{row.lost}</td>
                <td className="px-1 py-3 text-center text-xs tabular-nums text-brand-black md:text-sm">{row.gf}</td>
                <td className="px-1 py-3 text-center text-xs tabular-nums text-brand-black md:text-sm">{row.ga}</td>
                <td className="px-1 py-3 text-center text-xs tabular-nums text-brand-black md:text-sm">{row.gd > 0 ? `+${row.gd}` : row.gd}</td>
                <td className="px-1 py-3 text-center text-xs font-semibold tabular-nums text-brand-black md:text-sm">{row.points}</td>
                <td className="px-1 py-3 text-left">
                  <div className="flex items-center">
                    {row.form.slice(0, 3).map((result, formIndex) => (
                      <FormBadge key={`${row.teamId}-${formIndex}`} result={result} />
                    ))}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default Standings;
