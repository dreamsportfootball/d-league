import React, { useMemo } from 'react';
import { ArrowLeft, CalendarDays, Shield, Trophy, UserRound } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import EmptyState from '../components/EmptyState';
import { useSeason } from '../hooks/useSeason';
import { calculateLeagueTable, calculatePlayerCompetitionStats } from '../services/competitionEngine';
import { MatchStatus } from '../types';
import { formatTaipeiDate } from '../utils/dateFormat';

const TeamPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { activeSeason, activeSeasonId, seasonData } = useSeason();
  const team = id ? seasonData.teamMap[id] : undefined;

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
            <Link to={`/?season=${activeSeasonId}#teams`} className="text-sm font-bold text-brand-blue">
              返回參賽球隊
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
          <Link to={`/?season=${activeSeasonId}#teams`} className="mb-10 inline-flex items-center text-xs font-bold uppercase tracking-widest text-white/70 hover:text-white">
            <ArrowLeft className="mr-2 h-4 w-4" /> 返回球隊列表
          </Link>
          <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
            <div className="flex items-center gap-6">
              <div className="flex h-28 w-28 items-center justify-center rounded-2xl bg-white p-4 shadow-2xl md:h-36 md:w-36">
                <img src={team.logo} alt={team.name} className="max-h-full max-w-full object-contain" />
              </div>
              <div>
                <p className="mb-2 text-xs font-black uppercase tracking-[0.25em] text-brand-accent">{activeSeason.shortName} · {team.leagueId}</p>
                <h1 className="font-display text-3xl font-black uppercase leading-tight md:text-5xl">{team.name}</h1>
              </div>
            </div>
            {standing && (
              <div className="grid grid-cols-3 gap-6 border-t border-white/20 pt-6 text-center md:border-l md:border-t-0 md:pl-8 md:pt-0">
                <div><p className="font-display text-3xl font-black">{standing.position}</p><p className="text-[10px] font-bold uppercase tracking-widest text-white/50">排名</p></div>
                <div><p className="font-display text-3xl font-black">{standing.points}</p><p className="text-[10px] font-bold uppercase tracking-widest text-white/50">積分</p></div>
                <div><p className="font-display text-3xl font-black">{standing.played}</p><p className="text-[10px] font-bold uppercase tracking-widest text-white/50">場次</p></div>
              </div>
            )}
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-7xl gap-12 px-4 py-10 md:px-12 md:py-16 lg:grid-cols-12">
        <div className="space-y-12 lg:col-span-8">
          <section>
            <div className="mb-5 flex items-center"><CalendarDays className="mr-2 h-5 w-5 text-brand-blue" /><h2 className="font-display text-2xl font-black uppercase">近期賽程</h2></div>
            {nextMatch ? (
              <div className="border-y border-neutral-200 py-6">
                <p className="mb-2 text-xs font-bold text-neutral-400">{formatTaipeiDate(nextMatch.timestamp)}</p>
                <p className="text-lg font-black text-brand-black">下一場正式賽事</p>
              </div>
            ) : <p className="text-sm text-neutral-400">目前沒有待進行賽事</p>}
          </section>

          <section>
            <div className="mb-5 flex items-center"><Trophy className="mr-2 h-5 w-5 text-brand-blue" /><h2 className="font-display text-2xl font-black uppercase">近期戰績</h2></div>
            {recentResults.length > 0 ? (
              <div className="divide-y divide-neutral-100 border-y border-neutral-200">
                {recentResults.map((match) => <div key={match.id} className="flex items-center justify-between py-4"><span className="text-xs font-bold text-neutral-400">{formatTaipeiDate(match.timestamp)}</span><span className="font-display text-xl font-black">{match.homeScore}－{match.awayScore}</span></div>)}
              </div>
            ) : <p className="text-sm text-neutral-400">目前沒有正式賽果</p>}
          </section>
        </div>

        <aside className="space-y-10 lg:col-span-4">
          <section>
            <div className="mb-5 flex items-center"><UserRound className="mr-2 h-5 w-5 text-brand-blue" /><h2 className="font-display text-xl font-black uppercase">球員名單</h2></div>
            {players.length > 0 ? <div className="divide-y divide-neutral-100 border-y border-neutral-200">{players.map((player) => <div key={player.id} className="grid grid-cols-[2.5rem_1fr] py-3 text-sm"><span className="font-display font-black text-brand-blue">{player.number}</span><span className="font-bold">{player.name}</span></div>)}</div> : <p className="text-sm text-neutral-400">球員名單尚未公布</p>}
          </section>

          {teamStats.length > 0 && (
            <section>
              <div className="mb-5 flex items-center"><Shield className="mr-2 h-5 w-5 text-brand-blue" /><h2 className="font-display text-xl font-black uppercase">球員數據</h2></div>
              <div className="divide-y divide-neutral-100 border-y border-neutral-200">{teamStats.slice(0, 5).map((player) => <div key={player.subjectId} className="flex items-center justify-between py-3 text-sm"><span className="font-bold">{player.name}</span><span className="font-display font-black text-brand-blue">{player.goals}</span></div>)}</div>
            </section>
          )}
        </aside>
      </div>
    </div>
  );
};

export default TeamPage;
