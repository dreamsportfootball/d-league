import React, { useMemo } from 'react';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import EmptyState from '../components/EmptyState';
import FullSchedule from '../components/FullSchedule';
import { getSeasonConfig, isSeasonId } from '../config/seasons';
import { getSeasonData } from '../services/seasonDataJson';
import type { LeagueId } from '../types/season';

const isLeagueId = (value: string | undefined): value is LeagueId =>
  value === 'L1' || value === 'L2' || value === 'L3';

const RoundPage: React.FC = () => {
  const params = useParams<{ seasonId: string; league: string; round: string }>();
  const navigate = useNavigate();
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

    return { season, data, matches };
  }, [league, round, seasonId]);

  if (!seasonId || !league || !round || !payload || payload.matches.length === 0) {
    return (
      <div className="min-h-[75vh] bg-white px-4 py-16 md:py-28">
        <div className="mx-auto max-w-5xl">
          <EmptyState title="找不到此輪賽事" description="此輪賽事不存在、尚未公布，或網址已失效" />
          <div className="mt-8 text-center">
            <Link to="/schedule" className="text-sm font-semibold text-brand-blue">返回賽程</Link>
          </div>
        </div>
      </div>
    );
  }

  const { season, data, matches } = payload;

  return (
    <div className="min-h-screen bg-white pb-24">
      <section className="border-b border-neutral-200 bg-neutral-50 px-4 py-10 md:px-12 md:py-16">
        <div className="mx-auto max-w-6xl">
          <Link
            to={`/schedule?season=${seasonId}`}
            className="inline-flex min-h-11 items-center text-xs font-semibold text-neutral-500 transition-colors hover:text-brand-black"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            返回賽程
          </Link>

          <p className="mt-6 text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-400">
            D LEAGUE ROUND
          </p>
          <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight text-brand-black md:text-6xl">
            {season.shortName} {league} 第 {round} 輪
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-neutral-500">
            本輪官方賽程與賽果，點擊比賽可查看原本的比賽詳情卡片。
          </p>
        </div>
      </section>

      <main className="mx-auto max-w-6xl space-y-14 px-4 py-10 md:px-12 md:py-14">
        <section aria-labelledby="round-matches-heading">
          <div className="mb-5 flex items-center justify-between border-b border-neutral-200 pb-3">
            <h2 id="round-matches-heading" className="font-display text-2xl font-semibold text-brand-black">
              本輪賽程與賽果
            </h2>
            <span className="text-[11px] font-medium text-neutral-400">共 {matches.length} 場</span>
          </div>
          <FullSchedule
            matches={matches}
            teamMap={data.teamMap}
            leagueFilter="ALL"
            onMatchClick={(matchId) => navigate(`/schedule?season=${seasonId}&match=${matchId}`)}
          />
        </section>

        <section className="grid gap-3 border-t border-neutral-200 pt-8 sm:grid-cols-2">
          <Link
            to={`/standings?season=${seasonId}`}
            className="flex min-h-12 items-center justify-between border border-neutral-200 px-4 text-sm font-medium text-brand-black hover:border-brand-blue hover:text-brand-blue"
          >
            查看 {season.shortName} 積分榜 <ChevronRight className="h-4 w-4" />
          </Link>
          <Link
            to={`/stats?season=${seasonId}`}
            className="flex min-h-12 items-center justify-between border border-neutral-200 px-4 text-sm font-medium text-brand-black hover:border-brand-blue hover:text-brand-blue"
          >
            查看射手與紀律數據 <ChevronRight className="h-4 w-4" />
          </Link>
        </section>
      </main>
    </div>
  );
};

export default RoundPage;