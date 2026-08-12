import React, { useMemo } from 'react';
import { ArrowLeft, BarChart3, ChevronRight, Target, Trophy } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import EmptyState from '../components/EmptyState';
import FullSchedule from '../components/FullSchedule';
import { getSeasonConfig, isSeasonId } from '../config/seasons';
import { getMatchRecord, getPlayerIdentity, getRoundInsights } from '../services/entityData';
import { getSeasonData } from '../services/seasonDataJson';
import type { LeagueId } from '../types/season';

const isLeagueId = (value: string | undefined): value is LeagueId =>
  value === 'L1' || value === 'L2' || value === 'L3';

const RoundPage: React.FC = () => {
  const params = useParams<{ seasonId: string; league: string; round: string }>();
  const seasonId = isSeasonId(params.seasonId) ? params.seasonId : undefined;
  const league = isLeagueId(params.league) ? params.league : undefined;
  const round = params.round ? decodeURIComponent(params.round) : '';

  const payload = useMemo(() => {
    if (!seasonId || !league || !round) return null;
    const season = getSeasonConfig(seasonId);
    const data = getSeasonData(seasonId);
    const matches = data.matches
      .filter(
        (match) =>
          match.league === league &&
          String(match.round) === round,
      )
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    if (matches.length === 0) return { season, data, matches, insights: null };
    const record = getMatchRecord(matches[0].id, seasonId);
    return {
      season,
      data,
      matches,
      insights: record ? getRoundInsights(record) : null,
    };
  }, [league, round, seasonId]);

  if (!seasonId || !league || !round || !payload || payload.matches.length === 0) {
    return (
      <div className="min-h-[75vh] bg-white px-4 py-16 md:py-28">
        <div className="mx-auto max-w-5xl">
          <EmptyState title="找不到此輪賽事" description="此輪賽事不存在、尚未公布，或網址已失效" />
          <div className="mt-8 text-center">
            <Link to="/schedule" className="text-sm font-black text-brand-blue">返回賽程</Link>
          </div>
        </div>
      </div>
    );
  }

  const { season, data, matches, insights } = payload;
  const topScorerProfile = insights?.topScorer?.playerId
    ? data.players.find((player) => player.id === insights.topScorer?.playerId)
    : undefined;
  const biggestMatches = insights
    ? matches.filter((match) => insights.biggestMatchIds.includes(match.id))
    : [];

  return (
    <div className="min-h-screen bg-white pb-24">
      <section className="border-b border-neutral-200 bg-neutral-50 px-4 py-10 md:px-12 md:py-16">
        <div className="mx-auto max-w-6xl">
          <Link
            to={`/schedule?season=${seasonId}`}
            className="inline-flex min-h-11 items-center text-xs font-black text-neutral-500 transition-colors hover:text-brand-black"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            返回賽程
          </Link>

          <p className="mt-6 text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400">
            D LEAGUE ROUND CENTER
          </p>
          <h1 className="mt-2 font-display text-4xl font-black tracking-tight text-brand-black md:text-6xl">
            {season.shortName} {league} 第 {round} 輪
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-neutral-500">
            本輪官方賽程、比數、進球與數據洞察，由 D LEAGUE 賽事資料自動彙整。
          </p>
        </div>
      </section>

      <main className="mx-auto max-w-6xl space-y-14 px-4 py-10 md:px-12 md:py-14">
        <section aria-labelledby="round-insights-heading">
          <div className="mb-4 flex items-center border-b border-neutral-200 pb-3">
            <BarChart3 className="mr-2 h-5 w-5 text-brand-blue" aria-hidden="true" />
            <h2 id="round-insights-heading" className="font-display text-2xl font-black text-brand-black">
              本輪數據洞察
            </h2>
          </div>

          {insights ? (
            <>
              <div className="grid grid-cols-2 gap-px overflow-hidden border border-neutral-200 bg-neutral-200 sm:grid-cols-4">
                {[
                  ['已完成比賽', insights.completedMatches],
                  ['本輪總進球', insights.totalGoals],
                  ['場均進球', insights.averageGoals.toFixed(1)],
                  ['最大勝差', insights.biggestMargin],
                ].map(([label, value]) => (
                  <div key={label} className="bg-white p-5">
                    <p className="text-[10px] font-black tracking-wider text-neutral-400">{label}</p>
                    <p className="mt-2 font-display text-3xl font-black tabular-nums text-brand-black">{value}</p>
                  </div>
                ))}
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <div className="border border-neutral-200 p-5">
                  <div className="flex items-center text-brand-blue">
                    <Target className="mr-2 h-4 w-4" aria-hidden="true" />
                    <p className="text-[10px] font-black uppercase tracking-[0.16em]">本輪進球最多</p>
                  </div>
                  {insights.topScorer ? (
                    topScorerProfile ? (
                      <Link
                        to={`/players/${getPlayerIdentity(topScorerProfile)}?season=${seasonId}`}
                        className="mt-3 inline-flex items-center font-display text-2xl font-black text-brand-black hover:text-brand-blue"
                      >
                        {insights.topScorer.name} · {insights.topScorer.goals} 球
                        <ChevronRight className="ml-2 h-4 w-4" />
                      </Link>
                    ) : (
                      <p className="mt-3 font-display text-2xl font-black text-brand-black">
                        {insights.topScorer.name} · {insights.topScorer.goals} 球
                      </p>
                    )
                  ) : (
                    <p className="mt-3 text-sm text-neutral-400">目前尚無進球資料</p>
                  )}
                </div>

                <div className="border border-neutral-200 p-5">
                  <div className="flex items-center text-brand-blue">
                    <Trophy className="mr-2 h-4 w-4" aria-hidden="true" />
                    <p className="text-[10px] font-black uppercase tracking-[0.16em]">本輪最大勝差</p>
                  </div>
                  {biggestMatches.length > 0 && insights.biggestMargin > 0 ? (
                    <div className="mt-3 space-y-2">
                      {biggestMatches.map((match) => {
                        const home = data.teamMap[match.homeTeamId];
                        const away = data.teamMap[match.awayTeamId];
                        if (!home || !away) return null;
                        return (
                          <Link
                            key={match.id}
                            to={`/matches/${match.id}?season=${seasonId}`}
                            className="block font-black text-brand-black hover:text-brand-blue"
                          >
                            {home.shortName} {match.homeScore ?? '—'}–{match.awayScore ?? '—'} {away.shortName}
                          </Link>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="mt-3 text-sm text-neutral-400">目前尚無可比較的完賽結果</p>
                  )}
                </div>
              </div>
            </>
          ) : (
            <p className="py-8 text-sm text-neutral-400">本輪完成比賽後自動產生數據洞察</p>
          )}
        </section>

        <section aria-labelledby="round-matches-heading">
          <div className="mb-5 flex items-center justify-between border-b border-neutral-200 pb-3">
            <h2 id="round-matches-heading" className="font-display text-2xl font-black text-brand-black">
              本輪賽程與賽果
            </h2>
            <span className="text-[11px] font-black text-neutral-400">共 {matches.length} 場</span>
          </div>
          <FullSchedule
            matches={matches}
            teamMap={data.teamMap}
            leagueFilter="ALL"
            onMatchClick={() => undefined}
          />
        </section>

        <section className="grid gap-3 border-t border-neutral-200 pt-8 sm:grid-cols-2">
          <Link
            to={`/standings?season=${seasonId}`}
            className="flex min-h-12 items-center justify-between border border-neutral-200 px-4 text-sm font-black text-brand-black hover:border-brand-blue hover:text-brand-blue"
          >
            查看 {season.shortName} 積分榜 <ChevronRight className="h-4 w-4" />
          </Link>
          <Link
            to={`/stats?season=${seasonId}`}
            className="flex min-h-12 items-center justify-between border border-neutral-200 px-4 text-sm font-black text-brand-black hover:border-brand-blue hover:text-brand-blue"
          >
            查看射手與紀律數據 <ChevronRight className="h-4 w-4" />
          </Link>
        </section>
      </main>
    </div>
  );
};

export default RoundPage;
