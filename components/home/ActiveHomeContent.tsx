import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Trophy } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useSeason } from '../../hooks/useSeason';
import { MatchStatus } from '../../types';
import type { LeagueId } from '../../types/season';
import BrandStory from '../BrandStory';
import ClubGrid from '../ClubGrid';
import MatchCenter from '../MatchCenter';
import NewsSection from '../NewsSection';
import PhotoCarousel from '../PhotoCarousel';
import PreSeasonStandings from '../PreSeasonStandings';
import Standings from '../Standings';
import VideoHub from '../VideoHub';

const ActiveHomeContent: React.FC = () => {
  const { activeSeason, seasonData } = useSeason();
  const [activeLeague, setActiveLeague] = useState<LeagueId>(activeSeason.enabledLeagues[0]);

  useEffect(() => {
    if (!activeSeason.enabledLeagues.includes(activeLeague)) {
      setActiveLeague(activeSeason.enabledLeagues[0]);
    }
  }, [activeLeague, activeSeason.enabledLeagues]);

  const participantTeamNames = activeSeason.seasonParticipants?.leagues[activeLeague] ?? [];
  const hasFinishedMatches = useMemo(
    () =>
      seasonData.matches.some(
        (match) =>
          match.league === activeLeague &&
          match.resultType !== 'VOID' &&
          match.countsForStandings !== false &&
          (match.status === MatchStatus.FINISHED ||
            (match.homeScore !== null && match.awayScore !== null)),
      ),
    [activeLeague, seasonData.matches],
  );
  const showConfirmedTeams = !hasFinishedMatches && participantTeamNames.length > 0;

  return (
    <>
      <div id="match-center" className="container relative z-20 mx-auto -mt-4 px-4 pb-10 md:-mt-5 md:px-6 md:pb-14">
        <div className="border-t-4 border-brand-blue bg-white shadow-[0_16px_40px_rgba(0,0,0,0.12)] ring-1 ring-black/5">
          <MatchCenter />
        </div>
      </div>

      <section id="standings-and-news" className="border-t border-neutral-200 bg-white py-12 md:py-16">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:items-start lg:gap-14">
            <div className="lg:col-span-8">
              <NewsSection />
            </div>

            <section className="lg:col-span-4" aria-labelledby="home-standings-title">
              <div className="flex items-end justify-between gap-4 border-b border-neutral-200 pb-4">
                <div>
                  <p className="mb-1 text-[10px] font-black uppercase tracking-[0.24em] text-brand-blue">
                    {activeSeason.status === 'completed' ? 'Final Ranking' : 'Ranking'} · {activeSeason.shortName}
                  </p>
                  <h2 id="home-standings-title" className="flex items-center font-display text-3xl font-black tracking-tight text-brand-black md:text-4xl">
                    <Trophy className="mr-2 h-6 w-6 text-brand-blue" aria-hidden="true" />
                    {activeSeason.status === 'completed' ? '最終排名' : '戰績排名'}
                  </h2>
                </div>
              </div>

              <div className="flex min-h-12 items-center gap-5 border-b border-neutral-200" role="tablist" aria-label="切換積分榜級別">
                {activeSeason.enabledLeagues.map((leagueId) => {
                  const active = leagueId === activeLeague;
                  return (
                    <button
                      key={leagueId}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      onClick={() => setActiveLeague(leagueId)}
                      className={`relative min-h-12 px-1 text-xs font-black tracking-wider transition-colors ${
                        active ? 'text-brand-black' : 'text-neutral-400 hover:text-brand-black'
                      }`}
                    >
                      {leagueId}
                      <span
                        className={`absolute inset-x-0 bottom-0 h-0.5 transition-opacity ${
                          active ? 'bg-brand-blue opacity-100' : 'opacity-0'
                        }`}
                      />
                    </button>
                  );
                })}
              </div>

              <div className="pt-4">
                {showConfirmedTeams ? (
                  <PreSeasonStandings
                    league={activeLeague}
                    teamNames={participantTeamNames}
                    variant="widget"
                  />
                ) : (
                  <Standings league={activeLeague} variant="widget" />
                )}
              </div>

              <Link
                to="/standings"
                onClick={() => {
                  try {
                    window.sessionStorage.setItem('standingsActiveLeague', activeLeague);
                  } catch {
                    // Session storage may be unavailable.
                  }
                }}
                className="group mt-4 flex min-h-11 items-center justify-end border-t border-neutral-200 pt-4 text-xs font-black tracking-wider text-brand-blue transition-colors hover:text-brand-black"
              >
                查看完整積分榜
                <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </section>
          </div>
        </div>
      </section>

      <div id="teams">
        <ClubGrid />
      </div>
      <VideoHub />
      <PhotoCarousel />
      <BrandStory />
    </>
  );
};

export default ActiveHomeContent;
