import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useSeason } from '../hooks/useSeason';
import { calculateLeagueTable } from '../services/competitionEngine';
import { getTeamIdentity } from '../services/entityData';
import type { Standing } from '../types';
import type { LeagueId } from '../types/season';
import AutoFitText from './AutoFitText';

const FormBadge: React.FC<{ result: 'W' | 'D' | 'L' }> = ({ result }) => {
  const colorClass = result === 'W' ? 'bg-green-500' : result === 'D' ? 'bg-neutral-400' : 'bg-red-500';
  return <div className={`mx-0.5 h-2 w-2 rounded-full ${colorClass}`} title={result} />;
};

interface StandingsProps { league: LeagueId; variant?: 'widget' | 'page'; }

const TieLabel: React.FC<{ row: Standing; compact?: boolean }> = ({ row, compact = false }) => {
  if (row.tieStatus === 'NONE') return null;
  return <span className={`ml-1 whitespace-nowrap font-bold ${row.tieStatus === 'DRAW_REQUIRED' ? 'text-amber-600' : 'text-neutral-400'} ${compact ? 'text-[8px]' : 'text-[9px]'}`}>{row.tieStatus === 'DRAW_REQUIRED' ? '待抽籤' : '並列'}</span>;
};

const Standings: React.FC<StandingsProps> = ({ league, variant = 'page' }) => {
  const { activeSeason, seasonData } = useSeason();
  const leagueConfig = activeSeason.leagues[league];
  const standings = useMemo(() => calculateLeagueTable({ league, teams: seasonData.teams, matches: seasonData.matches, matchEvents: seasonData.matchEvents, rules: activeSeason.rules, leagueConfig }), [activeSeason.rules, league, leagueConfig, seasonData.matchEvents, seasonData.matches, seasonData.teams]);
  const isWidget = variant === 'widget';
  const displayed = standings.slice(0, isWidget ? 6 : standings.length);
  const relegationStart = leagueConfig && leagueConfig.relegationPlaces > 0 ? standings.length - leagueConfig.relegationPlaces + 1 : Number.POSITIVE_INFINITY;
  const rankBar = (row: Standing) => {
    if (row.tieStatus === 'DRAW_REQUIRED') return 'bg-amber-400';
    if (row.rank === 1) return 'bg-brand-blue';
    if (leagueConfig && leagueConfig.promotionPlaces > 0 && row.rank <= leagueConfig.promotionPlaces) return 'bg-green-500';
    if (row.rank >= relegationStart) return 'bg-red-500';
    return 'bg-transparent';
  };

  if (isWidget) {
    return <div className="w-full text-xs"><div className="grid grid-cols-[2rem_1fr_2rem_2rem] gap-2 border-b border-neutral-100 py-2 text-[10px] font-bold tracking-wider text-neutral-500"><span>#</span><span>球隊</span><span className="text-center">場次</span><span className="text-center">積分</span></div>{displayed.map((row) => {
      const team = seasonData.teamMap[row.teamId]; if (!team) return null;
      return <div key={row.teamId} className="grid grid-cols-[2rem_1fr_2rem_2rem] items-center gap-2 border-b border-neutral-50 py-3"><div className="relative flex items-center pl-1"><div className={`absolute left-0 h-3 w-0.5 rounded-full ${rankBar(row)}`} /><span className="ml-2 font-medium tabular-nums text-brand-black">{row.rank}</span></div><Link to={`/teams/${getTeamIdentity(team)}?season=${activeSeason.id}`} className="flex min-h-11 min-w-0 items-center space-x-2 rounded-sm outline-none hover:text-brand-blue" aria-label={`查看 ${team.name} 球隊頁`}><img src={team.logo} alt={team.name} className="h-5 w-5 shrink-0 object-contain" /><div className="min-w-0 flex-1"><AutoFitText text={team.name} maxFontSize={12} minFontSize={7} className="font-bold text-brand-black" /></div><TieLabel row={row} compact /></Link><span className="text-center tabular-nums">{row.played}</span><span className="text-center font-semibold tabular-nums">{row.points}</span></div>;
    })}</div>;
  }

  return (
    <div className="w-full">
      <div className="md:hidden">
        <div className="grid grid-cols-[36px_minmax(0,1fr)_38px_44px_46px] items-center gap-1 border-b border-neutral-200 py-3 text-[9px] font-bold tracking-wide text-neutral-500">
          <span className="text-left">名次</span><span>球隊</span><span className="text-center">場次</span><span className="text-center">淨勝</span><span className="text-center text-brand-blue">積分</span>
        </div>
        <div>
          {displayed.map((row) => {
            const team = seasonData.teamMap[row.teamId]; if (!team) return null;
            return (
              <div key={row.teamId} className="grid min-h-[58px] grid-cols-[36px_minmax(0,1fr)_38px_44px_46px] items-center gap-1 border-b border-neutral-100">
                <div className="relative flex h-full items-center pl-1"><div className={`absolute left-0 h-6 w-1 rounded-full ${rankBar(row)}`} /><span className="ml-2 font-mono text-xs font-bold tabular-nums text-brand-black">{row.rank}</span></div>
                <Link to={`/teams/${getTeamIdentity(team)}?season=${activeSeason.id}`} className="flex min-h-11 min-w-0 items-center gap-2 rounded-sm outline-none hover:text-brand-blue" aria-label={`查看 ${team.name} 球隊頁`}><img src={team.logo} alt={team.name} className="h-7 w-7 shrink-0 object-contain" /><div className="min-w-0 flex-1"><AutoFitText text={team.name} maxFontSize={13} minFontSize={8} className="font-bold text-brand-black" /></div><TieLabel row={row} compact /></Link>
                <span className="text-center text-xs tabular-nums text-brand-black">{row.played}</span>
                <span className="text-center text-xs tabular-nums text-brand-black">{row.gd > 0 ? `+${row.gd}` : row.gd}</span>
                <span className="text-center font-display text-base font-black tabular-nums text-brand-blue">{row.points}</span>
              </div>
            );
          })}
        </div>
        <p className="mt-3 text-[10px] font-medium leading-5 text-neutral-400">勝／和／敗、進失球與近況請使用桌面版完整積分表查看</p>
      </div>

      <div className="hidden overflow-x-auto md:block">
        <table className="w-full border-collapse">
          <thead className="border-b border-neutral-200 text-[11px] font-bold tracking-widest text-neutral-500"><tr><th className="w-10 px-1 py-3 text-left">名次</th><th className="w-[220px] px-4 py-3 text-left">球隊</th><th className="w-10 px-1 py-3 text-center">場次</th><th className="w-10 px-1 py-3 text-center">勝</th><th className="w-10 px-1 py-3 text-center">和</th><th className="w-10 px-1 py-3 text-center">敗</th><th className="w-10 px-1 py-3 text-center">進球</th><th className="w-10 px-1 py-3 text-center">失球</th><th className="w-12 px-1 py-3 text-center">淨勝</th><th className="w-12 px-1 py-3 text-center text-brand-blue">積分</th><th className="w-[50px] px-1 py-3 text-left">近況</th></tr></thead>
          <tbody>{displayed.map((row) => {
            const team = seasonData.teamMap[row.teamId]; if (!team) return null;
            return <tr key={row.teamId} className="border-b border-neutral-100 transition-colors hover:bg-neutral-50/50"><td className="px-1 py-3"><div className="relative flex items-center pl-1"><div className={`absolute left-0 h-6 w-1 rounded-full ${rankBar(row)}`} /><span className="ml-3 font-mono text-sm font-bold tabular-nums">{row.rank}</span></div></td><td className="px-4 py-1.5"><Link to={`/teams/${getTeamIdentity(team)}?season=${activeSeason.id}`} className="flex min-h-11 min-w-0 items-center space-x-3 rounded-sm outline-none hover:text-brand-blue" aria-label={`查看 ${team.name} 球隊頁`}><img src={team.logo} alt={team.name} className="h-8 w-8 shrink-0 object-contain" /><div className="min-w-0 flex-1"><AutoFitText text={team.name} maxFontSize={14} minFontSize={7} className="font-bold text-brand-black" /></div><TieLabel row={row} /></Link></td><td className="px-1 py-3 text-center text-sm tabular-nums">{row.played}</td><td className="px-1 py-3 text-center text-sm tabular-nums">{row.won}</td><td className="px-1 py-3 text-center text-sm tabular-nums">{row.drawn}</td><td className="px-1 py-3 text-center text-sm tabular-nums">{row.lost}</td><td className="px-1 py-3 text-center text-sm tabular-nums">{row.gf}</td><td className="px-1 py-3 text-center text-sm tabular-nums">{row.ga}</td><td className="px-1 py-3 text-center text-sm tabular-nums">{row.gd > 0 ? `+${row.gd}` : row.gd}</td><td className="px-1 py-3 text-center text-sm font-semibold tabular-nums">{row.points}</td><td className="px-1 py-3 text-left"><div className="flex items-center">{row.form.slice(0, 3).map((result, index) => <FormBadge key={`${row.teamId}-${index}`} result={result} />)}</div></td></tr>;
          })}</tbody>
        </table>
      </div>
    </div>
  );
};

export default Standings;
