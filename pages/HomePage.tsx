import React, { useEffect, useState } from 'react';
import { ArrowRight, CheckCircle2, Clock3, Trophy } from 'lucide-react';
import { Link, Navigate } from 'react-router-dom';
import BrandStory from '../components/BrandStory';
import ClubGrid from '../components/ClubGrid';
import Hero from '../components/Hero';
import MatchCenter from '../components/MatchCenter';
import NewsSection from '../components/NewsSection';
import PhotoCarousel from '../components/PhotoCarousel';
import RegistrationOverview from '../components/RegistrationOverview';
import StaffPartnerTeamPopup from '../components/StaffPartnerTeamPopup';
import Standings from '../components/Standings';
import Tabs from '../components/Tabs';
import VideoHub from '../components/VideoHub';
import { DEFAULT_SEASON_ID } from '../config/seasons';
import { useSeason } from '../hooks/useSeason';
import type { LeagueId } from '../types/season';

const StatusOverview: React.FC<{ status: 'review' | 'upcoming' }> = ({ status }) => {
  const review = status === 'review';
  return (
    <section className="border-b border-neutral-200 bg-white px-4 py-14 md:px-6 md:py-20">
      <div className="mx-auto max-w-5xl text-center">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-brand-blue/10 text-brand-blue">
          {review ? <Clock3 className="h-7 w-7" /> : <CheckCircle2 className="h-7 w-7" />}
        </div>
        <p className="text-xs font-black uppercase tracking-[0.25em] text-brand-blue">
          {review ? '報名審核中' : '賽季準備中'}
        </p>
        <h2 className="mt-3 font-display text-3xl font-black uppercase text-brand-black md:text-5xl">
          {review ? '球隊審核與分級進行中' : '參賽球隊與級別即將公布'}
        </h2>
        <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-neutral-500 md:text-base">
          {review
            ? '主辦單位將依報名資料、過往成績、主要球員組成及各級別整體實力進行審核與分級'
            : '錄取球隊、正式級別、球員登錄時程及完整賽程將依序公布'}
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Link to="/news" className="rounded-full bg-brand-black px-6 py-3 text-xs font-black uppercase tracking-widest text-white">
            查看最新公告
          </Link>
          <Link to="/registration" className="rounded-full border border-neutral-300 px-6 py-3 text-xs font-black uppercase tracking-widest text-brand-black">
            查看賽季資訊
          </Link>
        </div>
      </div>
    </section>
  );
};

const HomePage: React.FC = () => {
  const { activeSeasonId, activeSeason } = useSeason();
  const [activeLeague, setActiveLeague] = useState<LeagueId>(activeSeason.enabledLeagues[0]);

  useEffect(() => {
    if (!activeSeason.enabledLeagues.includes(activeLeague)) {
      setActiveLeague(activeSeason.enabledLeagues[0]);
    }
  }, [activeLeague, activeSeason.enabledLeagues]);

  if (activeSeasonId !== DEFAULT_SEASON_ID) {
    return <Navigate to={`/?season=${DEFAULT_SEASON_ID}`} replace />;
  }

  if (activeSeason.status === 'registration') {
    return (
      <div className="w-full overflow-x-hidden">
        <StaffPartnerTeamPopup />
        <Hero />
        <RegistrationOverview />
        <section className="container mx-auto px-4 py-12 md:px-6 md:py-16">
          <NewsSection />
        </section>
        <div id="teams"><ClubGrid /></div>
        <BrandStory />
      </div>
    );
  }

  if (activeSeason.status === 'review' || activeSeason.status === 'upcoming') {
    return (
      <div className="w-full overflow-x-hidden">
        <Hero />
        <StatusOverview status={activeSeason.status} />
        <section className="container mx-auto px-4 py-12 md:px-6 md:py-16"><NewsSection /></section>
        <div id="teams"><ClubGrid /></div>
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

          <div className="order-1 lg:order-2 lg:col-span-8"><NewsSection /></div>
        </div>
      </section>

      <VideoHub />
      <PhotoCarousel />
      <div id="teams"><ClubGrid /></div>
      <BrandStory />
    </div>
  );
};

export default HomePage;
