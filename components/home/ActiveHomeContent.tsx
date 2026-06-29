import React, { useEffect, useState } from 'react';
import { ArrowRight, Trophy } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useSeason } from '../../hooks/useSeason';
import type { LeagueId } from '../../types/season';
import BrandStory from '../BrandStory';
import ClubGrid from '../ClubGrid';
import MatchCenter from '../MatchCenter';
import NewsSection from '../NewsSection';
import PhotoCarousel from '../PhotoCarousel';
import Standings from '../Standings';
import Tabs from '../Tabs';
import VideoHub from '../VideoHub';

const ActiveHomeContent: React.FC = () => {
  const { activeSeason } = useSeason();
  const [activeLeague, setActiveLeague] = useState<LeagueId>(activeSeason.enabledLeagues[0]);

  useEffect(() => {
    if (!activeSeason.enabledLeagues.includes(activeLeague)) {
      setActiveLeague(activeSeason.enabledLeagues[0]);
    }
  }, [activeLeague, activeSeason.enabledLeagues]);

  return (
    <>
      <div id="match-center" className="container relative z-20 mx-auto -mt-5 px-0 pb-12 md:px-6">
        <div className="overflow-hidden rounded-t-xl border-neutral-100 bg-white shadow-2xl ring-1 ring-black/5 md:border">
          <MatchCenter />
        </div>
      </div>

      <section id="standings-and-news" className="container mx-auto mb-16 px-4 py-4 md:px-6">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:items-start">
          <div className="order-2 lg:order-1 lg:col-span-4">
            <div className="mb-4 flex items-end justify-between gap-4 border-b border-neutral-100 pb-2">
              <div>
                <span className="mb-1 block font-sans text-[10px] font-bold uppercase tracking-[0.25em] text-neutral-400">
                  {activeSeason.status === 'completed' ? 'Final Ranking' : 'Ranking'}
                </span>
                <h3 className="flex items-center font-display text-3xl font-bold tracking-wide text-brand-black">
                  <Trophy className="mr-2 h-6 w-6 translate-y-[2px] text-brand-blue" />
                  {activeSeason.status === 'completed' ? '最終排名' : '戰績排名'}
                </h3>
              </div>

              <div className="rounded-full bg-neutral-100 p-1">
                <Tabs
                  options={activeSeason.enabledLeagues}
                  active={activeLeague}
                  onChange={setActiveLeague}
                  getLabel={(league) => league}
                  variant="compact"
                  ariaLabel="切換積分榜級別"
                />
              </div>
            </div>

            <Standings league={activeLeague} variant="widget" />

            <div className="mt-4 text-center">
              <Link
                to="/standings"
                onClick={() => {
                  try {
                    window.sessionStorage.setItem('standingsActiveLeague', activeLeague);
                  } catch {
                    // Session storage may be unavailable.
                  }
                }}
                className="group flex min-h-11 items-center justify-center text-xs font-bold uppercase tracking-widest text-brand-blue transition-colors hover:text-brand-black"
              >
                查看完整積分榜
                <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </div>

          <div className="order-1 lg:order-2 lg:col-span-8">
            <NewsSection />
          </div>
        </div>
      </section>

      <VideoHub />
      <PhotoCarousel />
      <div id="teams">
        <ClubGrid />
      </div>
      <BrandStory />
    </>
  );
};

export default ActiveHomeContent;
