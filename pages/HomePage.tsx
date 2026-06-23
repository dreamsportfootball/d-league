import React, { useEffect, useState } from 'react';
import { ArrowRight, Trophy } from 'lucide-react';
import { Link } from 'react-router-dom';
import Hero from '../components/Hero';
import MatchCenter from '../components/MatchCenter';
import Standings from '../components/Standings';
import VideoHub from '../components/VideoHub';
import ClubGrid from '../components/ClubGrid';
import BrandStory from '../components/BrandStory';
import NewsSection from '../components/NewsSection';
import PhotoCarousel from '../components/PhotoCarousel';
import RegistrationOverview from '../components/RegistrationOverview';
import { useSeason } from '../hooks/useSeason';
import type { LeagueId } from '../types/season';

const HomePage: React.FC = () => {
  const { activeSeason } = useSeason();
  const [activeLeague, setActiveLeague] = useState<LeagueId>(activeSeason.enabledLeagues[0]);

  useEffect(() => {
    if (!activeSeason.enabledLeagues.includes(activeLeague)) {
      setActiveLeague(activeSeason.enabledLeagues[0]);
    }
  }, [activeLeague, activeSeason.enabledLeagues]);

  if (activeSeason.status === 'registration') {
    return (
      <div className="w-full overflow-x-hidden">
        <Hero />
        <RegistrationOverview />
        <BrandStory />
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-hidden">
      <Hero />

      <div id="match-center" className="container relative z-20 mx-auto -mt-5 px-0 pb-12 md:px-6">
        <div className="overflow-hidden rounded-t-xl border-neutral-100 bg-white shadow-2xl ring-1 ring-black/5 md:border">
          <MatchCenter />
        </div>
      </div>

      <section id="standings-and-news" className="container mx-auto mb-16 px-4 py-4 md:px-6">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:items-start">
          <div className="order-2 lg:order-1 lg:col-span-4">
            <div className="mb-4 flex items-end justify-between border-b border-neutral-100 pb-2">
              <div>
                <span className="mb-1 block font-sans text-[10px] font-bold uppercase tracking-[0.25em] text-neutral-400">
                  Ranking
                </span>
                <h3 className="flex items-center font-display text-3xl font-bold tracking-wide text-brand-black">
                  <Trophy className="mr-2 h-6 w-6 translate-y-[2px] text-brand-blue" />
                  戰績排名
                </h3>
              </div>

              <div className="flex space-x-1 rounded-full bg-neutral-100 p-1">
                {activeSeason.enabledLeagues.map((league) => (
                  <button
                    key={league}
                    type="button"
                    onClick={() => setActiveLeague(league)}
                    className={`rounded-full px-4 py-1 text-xs font-bold uppercase transition-all ${
                      activeLeague === league
                        ? 'bg-white text-brand-black shadow-sm'
                        : 'text-neutral-400 hover:text-neutral-600'
                    }`}
                  >
                    <span className="md:hidden">{league}</span>
                    <span className="hidden md:inline">{activeSeason.leagues[league]?.displayName ?? league}</span>
                  </button>
                ))}
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
                className="group flex items-center justify-center text-xs font-bold uppercase tracking-widest text-brand-blue transition-colors hover:text-brand-black"
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
    </div>
  );
};

export default HomePage;
