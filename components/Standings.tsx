import React, { useMemo } from 'react';
import { useSeason } from '../hooks/useSeason';
import { MatchStatus, type Standing } from '../types';
import type { LeagueId } from '../types/season';

const calculateStandings = (
  league: LeagueId,
  teamIds: string[],
  matches: ReturnType<typeof useSeason>['seasonData']['matches'],
): Standing[] => {
  const standingsMap: Record<string, Standing> = {};

  teamIds.forEach((teamId) => {
    standingsMap[teamId] = {
      teamId,
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      gf: 0,
      ga: 0,
      gd: 0,
      points: 0,
      form: [],
    };
  });

  matches
    .filter(
      (match) =>
        match.league === league &&
        (match.status === MatchStatus.FINISHED ||
          (match.homeScore !== null && match.awayScore !== null)),
    )
    .forEach((match) => {
      const home = standingsMap[match.homeTeamId];
      const away = standingsMap[match.awayTeamId];
      if (!home || !away) return;

      const homeScore = match.homeScore ?? 0;
      const awayScore = match.awayScore ?? 0;

      home.played += 1;
      away.played += 1;
      home.gf += homeScore;
      home.ga += awayScore;
      away.gf += awayScore;
      away.ga += homeScore;
      home.gd = home.gf - home.ga;
      away.gd = away.gf - away.ga;

      if (homeScore > awayScore) {
        home.won += 1;
        home.points += 3;
        away.lost += 1;
        home.form.unshift('W');
        away.form.unshift('L');
      } else if (homeScore < awayScore) {
        away.won += 1;
        away.points += 3;
        home.lost += 1;
        away.form.unshift('W');
        home.form.unshift('L');
      } else {
        home.drawn += 1;
        away.drawn += 1;
        home.points += 1;
        away.points += 1;
        home.form.unshift('D');
        away.form.unshift('D');
      }
    });

  return Object.values(standingsMap).sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.gd !== a.gd) return b.gd - a.gd;
    return b.gf - a.gf;
  });
};

const FormBadge: React.FC<{ result: 'W' | 'D' | 'L' }> = ({ result }) => {
  const colorClass =
    result === 'W' ? 'bg-green-500' : result === 'D' ? 'bg-neutral-400' : 'bg-red-500';
  return <div className={`mx-0.5 h-2 w-2 rounded-full ${colorClass}`} title={result} />;
};

const rankBar = (index: number) => (index === 0 ? 'bg-brand-blue' : 'bg-transparent');

interface StandingsProps {
  league: LeagueId;
  variant?: 'widget' | 'page';
}

const Standings: React.FC<StandingsProps> = ({ league, variant = 'page' }) => {
  const { seasonData } = useSeason();
  const leagueTeamIds = useMemo(
    () => seasonData.teams.filter((team) => team.leagueId === league).map((team) => team.id),
    [league, seasonData.teams],
  );

  const standings = useMemo(
    () => calculateStandings(league, leagueTeamIds, seasonData.matches),
    [league, leagueTeamIds, seasonData.matches],
  );

  const isWidget = variant === 'widget';
  const displayed = standings.slice(0, isWidget ? 6 : standings.length);

  if (isWidget) {
    return (
      <div className="w-full text-xs">
        <div className="grid grid-cols-[2rem_1fr_2rem_2rem] gap-2 border-b border-neutral-100 py-2 text-[10px] font-bold tracking-wider text-neutral-500">
          <span>#</span>
          <span>球隊</span>
          <span className="text-center">場次</span>
          <span className="text-center">積分</span>
        </div>
        {displayed.map((row, index) => {
          const team = seasonData.teamMap[row.teamId];
          if (!team) return null;
          return (
            <div
              key={row.teamId}
              className="grid grid-cols-[2rem_1fr_2rem_2rem] items-center gap-2 border-b border-neutral-50 py-3 transition-colors hover:bg-neutral-50/50"
            >
              <div className="relative flex items-center pl-1">
                <div className={`absolute left-0 h-3 w-0.5 rounded-full ${rankBar(index)}`} />
                <span className="ml-2 font-medium tabular-nums text-brand-black">{index + 1}</span>
              </div>
              <div className="flex min-w-0 items-center space-x-2">
                <img src={team.logo} alt={team.name} className="h-5 w-5 object-contain" />
                <span className="truncate font-bold text-brand-black">{team.name}</span>
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
          {displayed.map((row, index) => {
            const team = seasonData.teamMap[row.teamId];
            if (!team) return null;
            return (
              <tr
                key={row.teamId}
                className="border-b border-neutral-100 transition-colors last:border-0 hover:bg-neutral-50/50"
              >
                <td className="w-8 px-1 py-3 md:w-10">
                  <div className="relative flex items-center pl-1">
                    <div className={`absolute left-0 h-6 w-1 rounded-full ${rankBar(index)}`} />
                    <span className="ml-3 font-mono text-xs font-bold tabular-nums text-brand-black md:text-sm">
                      {index + 1}
                    </span>
                  </div>
                </td>
                <td className="w-[140px] whitespace-nowrap py-3 pl-2 pr-2 md:w-[220px] md:px-4">
                  <div className="flex items-center space-x-3">
                    <img src={team.logo} alt={team.name} className="h-7 w-7 shrink-0 object-contain md:h-8 md:w-8" />
                    <span className="text-xs font-bold text-brand-black md:text-sm">{team.name}</span>
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
