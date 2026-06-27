import React, { useMemo } from 'react';
import { ArrowLeft, CalendarDays, TrendingUp, UserRound } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import EmptyState from '../components/EmptyState';
import FullSchedule from '../components/FullSchedule';
import SeasonSelector from '../components/SeasonSelector';
import TeamRankChart, { type TeamRankPoint } from '../components/TeamRankChart';
import { CURRENT_SEASON_ID } from '../config/siteConfig';
import { useSeason } from '../hooks/useSeason';
import { calculateLeagueTable } from '../services/competitionEngine';
import { getSeasonData } from '../services/seasonDataJson';
import { MatchStatus } from '../types';

const TeamPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    activeSeason,
    activeSeasonId,
    seasonData,
    availableSeasons,
  } = useSeason();
  const team = id ? seasonData.teamMap[id] : undefined;
  const referenceTeam = useMemo(() => {
    if (!id) return undefined;
    if (team) return team;

    for (const season of availableSeasons) {
      const candidate = getSeasonData(season.id).teamMap[id];
      if (candidate) return candidate;
    }

    return undefined;
  }, [availableSeasons, id, team]);
  const displayTeam = team ?? referenceTeam;
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

  const rankHistory = useMemo<TeamRankPoint[]>(() => {
    if (!team) return [];

    const completedTeamMatches = teamMatches.filter(
      (match) => match.status === MatchStatus.FINISHED,
    );
    const roundOrder = [...new Set(completedTeamMatches.map((match) => String(match.round)))];

    return roundOrder.flatMap((round, index) => {
      const includedRounds = new Set(roundOrder.slice(0, index + 1));
      const matchesThroughRound = seasonData.matches.filter(
        (match) =>
          match.league === team.leagueId &&
          match.status === MatchStatus.FINISHED &&
          includedRounds.has(String(match.round)),
      );
      const row = calculateLeagueTable({
        league: team.leagueId,
        teams: seasonData.teams,
        matches: matchesThroughRound,
        matchEvents: seasonData.matchEvents,
        rules: activeSeason.rules,
        leagueConfig: activeSeason.leagues[team.leagueId],
      }).find((standingRow) => standingRow.teamId === team.id);

      return row
        ? [{ round, rank: row.rank, points: row.points, played: row.played }]
        : [];
    });
  }, [activeSeason.leagues, activeSeason.rules, seasonData.matchEvents, seasonData.matches, seasonData.teams, team, teamMatches]);

  const leagueTeamCount = useMemo(
    () =>
      team
        ? seasonData.teams.filter(
            (item) => item.leagueId === team.leagueId && item.competitionStatus !== 'WITHDRAWN',
          ).length
        : 0,
    [seasonData.teams, team],
  );

  if (!displayTeam) {
    return (
      <div className="min-h-[75vh] bg-white px-4 py-16 md:py-28">
        <div className="mx-auto max-w-4xl">
          <EmptyState title="找不到此球隊" description="此球隊資料不存在或網址已失效" />
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
      <section className="relative border-b border-neutral-200 bg-neutral-950 px-4 py-12 text-white md:px-12 md:py-20">
        <div
          className="absolute inset-0 opacity-30"
          style={{ background: `linear-gradient(135deg, ${displayTeam.primaryColor}, transparent 70%)` }}
        />
        <div className="relative mx-auto max-w-7xl">
          <div className="mb-10 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
            <Link
              to={backLink}
              className="inline-flex items-center text-xs font-bold uppercase tracking-widest text-white/70 hover:text-white"
            >
              <ArrowLeft className="mr-2 h-4 w-4" /> {backLabel}
            </Link>
            <div className="flex w-full justify-end sm:w-auto">
              <SeasonSelector />
            </div>
          </div>

          <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
            <div className="flex items-center gap-6">
              <div className="flex h-28 w-28 shrink-0 items-center justify-center rounded-2xl bg-white p-4 shadow-2xl md:h-36 md:w-36">
                <img src={displayTeam.logo} alt={displayTeam.name} className="max-h-full max-w-full object-contain" />
              </div>
              <div className="min-w-0">
                <span className="text-xs font-black uppercase tracking-[0.25em] text-white/60">
                  {team ? team.leagueId : `${activeSeason.shortName} 未參賽`}
                </span>
                <h1 className="mt-2 font-display text-4xl font-black leading-none md:text-6xl">
                  {displayTeam.shortName}
                </h1>
                <p className="mt-3 text-sm font-bold text-white/70 md:text-base">{displayTeam.name}</p>
              </div>
            </div>

            {standing && (
              <div className="grid grid-cols-3 gap-6 rounded-xl border border-white/10 bg-white/5 px-6 py-4 backdrop-blur">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-white/50">排名</p>
                  <p className="mt-1 font-display text-3xl font-black">{standing.rank}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-white/50">場次</p>
                  <p className="mt-1 font-display text-3xl font-black">{standing.played}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-white/50">積分</p>
                  <p className="mt-1 font-display text-3xl font-black text-brand-accent">{standing.points}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {!team ? (
        <div className="mx-auto max-w-4xl px-4 py-16 md:px-12 md:py-24">
          <EmptyState
            title={`未參加 ${activeSeason.shortName} 賽季`}
            description="此球隊在所選賽季沒有參賽資料，請使用上方賽季選單查看其他賽季"
          />
        </div>
      ) : (
        <div className="mx-auto max-w-7xl space-y-14 px-4 py-12 md:px-12 md:py-16">
          <section>
            <div className="mb-5 flex items-end justify-between gap-4 border-b border-neutral-200 pb-3">
              <div className="flex items-center">
                <TrendingUp className="mr-2 h-5 w-5 text-brand-blue" />
                <h2 className="font-display text-2xl font-black uppercase">排名走勢</h2>
              </div>
              <span className="text-xs font-bold text-neutral-400">{activeSeason.shortName} · {team.leagueId}</span>
            </div>
            {rankHistory.length > 0 ? (
              <TeamRankChart points={rankHistory} teamCount={leagueTeamCount} />
            ) : (
              <p className="py-12 text-center text-sm text-neutral-400">完成首輪比賽後更新排名走勢</p>
            )}
          </section>

          <section>
            <div className="mb-5 flex items-end justify-between gap-4 border-b border-neutral-200 pb-3">
              <div className="flex items-center">
                <CalendarDays className="mr-2 h-5 w-5 text-brand-blue" />
                <h2 className="font-display text-2xl font-black uppercase">賽程與結果</h2>
              </div>
              <span className="text-xs font-bold text-neutral-400">共 {teamMatches.length} 場</span>
            </div>
            {teamMatches.length > 0 ? (
              <FullSchedule
                matches={teamMatches}
                teamMap={seasonData.teamMap}
                leagueFilter="ALL"
                onMatchClick={(matchId) => navigate(`/schedule?season=${activeSeasonId}&match=${matchId}`)}
              />
            ) : (
              <p className="py-12 text-center text-sm text-neutral-400">此球隊目前尚未公布賽程</p>
            )}
          </section>

          <section>
            <div className="mb-5 flex items-center border-b border-neutral-200 pb-3">
              <UserRound className="mr-2 h-5 w-5 text-brand-blue" />
              <h2 className="font-display text-2xl font-black uppercase">球員名單</h2>
            </div>
            {players.length > 0 ? (
              <div className="grid gap-x-8 gap-y-1 sm:grid-cols-2 lg:grid-cols-3">
                {players.map((player) => (
                  <div key={player.id} className="grid grid-cols-[3rem_1fr] items-center border-b border-neutral-100 py-3">
                    <span className="font-display text-xl font-black text-brand-blue">{player.number}</span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold">{player.name}</p>
                      {player.englishName && (
                        <p className="truncate text-[10px] uppercase tracking-wider text-neutral-400">
                          {player.englishName}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="py-10 text-sm text-neutral-400">球員名單尚未公布</p>
            )}
          </section>
        </div>
      )}
    </div>
  );
};

export default TeamPage;
