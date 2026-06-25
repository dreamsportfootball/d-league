import React, { useMemo } from 'react';
import { ArrowLeft, CalendarDays, Shield, Trophy, UserRound } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import EmptyState from '../components/EmptyState';
import { CURRENT_SEASON_ID } from '../config/siteConfig';
import { useSeason } from '../hooks/useSeason';
import { calculateLeagueTable, calculatePlayerCompetitionStats } from '../services/competitionEngine';
import { MatchStatus } from '../types';
import { formatTaipeiDate } from '../utils/dateFormat';

const TeamPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { activeSeason, activeSeasonId, seasonData } = useSeason();
  const team = id ? seasonData.teamMap[id] : undefined;
  const isHistoricalSeason = activeSeasonId !== CURRENT_SEASON_ID;
  const backLink = isHistoricalSeason ? `/standings?season=${activeSeasonId}` : '/#teams';
  const backLabel = isHistoricalSeason
    ? `返回 ${activeSeason.shortName} 積分榜`
    : '返回參賽球隊';

  const players = useMemo(
    () =>
      team
        ? seasonData.players
            .filter((player) => player.teamId === team.id)
            .sort((a, b) => a.number - b.number)
        : [],
    [seasonData.players, team],
  );

  const teamMatches = useMemo(
    () =>
      team
        ? seasonData.matches
            .filter((match) => match.homeTeamId === team.id || match.awayTeamId === team.id)
            .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
        : [],
    [seasonData.matches, team],
  );

  const nextMatch = teamMatches.find((match) => match.status === MatchStatus.SCHEDULED);
  const recentResults = teamMatches
    .filter((match) => match.status === MatchStatus.FINISHED)
    .slice(-5)
    .reverse();

  const standing = useMemo(() => {
    if (!team) return undefined;
    return calculateLeagueTable({
      league: team.leagueId,
      teams: seasonData.teams,
      matches: seasonData.matches,
      matchEvents: seasonData.matchEvents,
      rules: activeSeason.rules,
      leagueConfig: activeSeason.leagues[team.leagueId],
    }).find((row) => row.teamId === team.id);
  }, [activeSeason.leagues, activeSeason.rules, seasonData.matchEvents, seasonData.matches, seasonData.teams, team]);

  const teamStats = useMemo(() => {
    if (!team) return [];
    return calculatePlayerCompetitionStats(
      team.leagueId,
      seasonData.teams,
      seasonData.players,
      seasonData.matches,
      seasonData.matchEvents,
    )
      .filter((player) => player.teamId === team.id)
      .sort((a, b) => b.goals - a.goals || b.yellowCards - a.yellowCards);
  }, [seasonData.matchEvents, seasonData.matches, seasonData.players, seasonData.teams, team]);

  if (!team) {
    return (
      <div className="min-h-[75vh] bg-white px-4 py-16 md:py-28">
        <div className="mx-auto max-w-4xl">
          <EmptyState title="找不到此球隊" description="此球隊可能不屬於目前選擇的賽季" />
          <div className="mt-8 text-center">
            <Link to={backLink} className="text-sm font-bold text-brand-blue">
              {backLabel}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pb-24">
      <section className="relative overflow-hidden border-b border-neutral-200 bg-neutral-950 px-4 py-12 text-white md:px-12 md:py-20">
        <div className="absolute inset-0 opacity-30" style={{ background: `linear-gradient(135deg, ${team.primaryColor}, transparent 70%)` }} />
        <div className="relative mx-auto max-w-7xl">
          <Link to={backLink} className="mb-10 inline-flex items-center text-xs font-bold uppercase tracking-widest text-white/70 hover:text-white">
            <ArrowLeft className="mr-2 h-4 w-4" /> {backLabel}
          </Link>
          <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
            <div className="flex items-center gap-6">
              <div className="flex h-28 w-28 items-center justify-center rounded-2xl bg-white p-4 shadow-2xl md:h-36 md:w-36">
                <img src={team.logo} alt={team.name} className="max-h-full max-w-full object-contain" />
              </div>
              <div>
                <span className="text-xs font-black uppercase tracking-[0.25em] text-white/60">{team.leagueId}</span>
                <h1 className="mt-2 font-display text-4xl font-black leading-none md:text-6xl">{team.shortName}</h1>
                <p className="mt-3 text-sm font-bold text-white/70 md:text-base">{team.name}</p>
              </div>
            </div>
            {standing && (
              <div className="grid grid-cols-3 gap-6 rounded-xl border border-white/10 bg-white/5 px-6 py-4 backdrop-blur">
                <div><p className="text-[10px] uppercase tracking-widest text-white/50">排名</p><p className="mt-1 font-display text-3xl font-black">{standing.rank}</p></div>
                <div><p className="text-[10px] uppercase tracking-widest text-white/50">場次</p><p className="mt-1 font-display text-3xl font-black">{standing.played}</p></div>
                <div><p className="text-[10px] uppercase tracking-widest text-white/50">積分</p><p className="mt-1 font-display text-3xl font-black text-brand-accent">{standing.points}</p></div>
              </div>
            )}
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-7xl gap-12 px-4 py-12 md:px-12 lg:grid-cols-[1.35fr_.65fr]">
        <div className="space-y-12">
          <section>
            <div className="mb-5 flex items-center border-b border-neutral-200 pb-3">
              <UserRound className="mr-2 h-5 w-5 text-brand-blue" />
              <h2 className="font-display text-2xl font-black uppercase">球員名單</h2>
            </div>
            {players.length > 0 ? (
              <div className="grid gap-x-8 gap-y-1 sm:grid-cols-2">
                {players.map((player) => (
                  <div key={player.id} className="grid grid-cols-[3rem_1fr] items-center border-b border-neutral-100 py-3">
                    <span className="font-display text-xl font-black text-brand-blue">{player.number}</span>
                    <div className="min-w-0"><p className="truncate text-sm font-bold">{player.name}</p>{player.englishName && <p className="truncate text-[10px] uppercase tracking-wider text-neutral-400">{player.englishName}</p>}</div>
                  </div>
                ))}
              </div>
            ) : <p className="py-10 text-sm text-neutral-400">球員名單尚未公布</p>}
          </section>

          <section>
            <div className="mb-5 flex items-center border-b border-neutral-200 pb-3">
              <Trophy className="mr-2 h-5 w-5 text-brand-blue" />
              <h2 className="font-display text-2xl font-black uppercase">球隊數據</h2>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="rounded-xl bg-neutral-50 p-5"><p className="text-xs font-bold text-neutral-400">進球</p><p className="mt-2 font-display text-3xl font-black">{teamStats.reduce((sum, player) => sum + player.goals, 0)}</p></div>
              <div className="rounded-xl bg-neutral-50 p-5"><p className="text-xs font-bold text-neutral-400">黃牌</p><p className="mt-2 font-display text-3xl font-black">{teamStats.reduce((sum, player) => sum + player.yellowCards, 0)}</p></div>
              <div className="rounded-xl bg-neutral-50 p-5"><p className="text-xs font-bold text-neutral-400">紅牌</p><p className="mt-2 font-display text-3xl font-black">{teamStats.reduce((sum, player) => sum + player.directRedCards + player.secondYellowDismissals, 0)}</p></div>
            </div>
          </section>
        </div>

        <aside className="space-y-8">
          <section className="rounded-xl border border-neutral-200 p-6">
            <div className="mb-4 flex items-center"><CalendarDays className="mr-2 h-5 w-5 text-brand-blue" /><h2 className="font-display text-xl font-black">下一場比賽</h2></div>
            {nextMatch ? (
              <div>
                <p className="text-xs font-bold text-neutral-400">{formatTaipeiDate(nextMatch.timestamp)} · {nextMatch.league} 第{nextMatch.round}輪</p>
                <p className="mt-3 text-base font-black">{seasonData.teamMap[nextMatch.homeTeamId]?.shortName} vs {seasonData.teamMap[nextMatch.awayTeamId]?.shortName}</p>
                <Link to={`/schedule?season=${activeSeasonId}&match=${nextMatch.id}`} className="mt-4 inline-flex text-xs font-bold text-brand-blue">查看賽程</Link>
              </div>
            ) : <p className="text-sm text-neutral-400">目前沒有未來賽程</p>}
          </section>

          <section className="rounded-xl border border-neutral-200 p-6">
            <div className="mb-4 flex items-center"><Shield className="mr-2 h-5 w-5 text-brand-blue" /><h2 className="font-display text-xl font-black">近期賽果</h2></div>
            {recentResults.length > 0 ? (
              <div className="space-y-4">
                {recentResults.map((match) => (
                  <Link key={match.id} to={`/schedule?season=${activeSeasonId}&match=${match.id}`} className="block border-b border-neutral-100 pb-4 last:border-0 last:pb-0">
                    <p className="text-[10px] font-bold text-neutral-400">{formatTaipeiDate(match.timestamp)}</p>
                    <p className="mt-1 text-sm font-black">{seasonData.teamMap[match.homeTeamId]?.shortName} {match.homeScore}–{match.awayScore} {seasonData.teamMap[match.awayTeamId]?.shortName}</p>
                  </Link>
                ))}
              </div>
            ) : <p className="text-sm text-neutral-400">目前尚無完賽紀錄</p>}
          </section>
        </aside>
      </div>
    </div>
  );
};

export default TeamPage;
