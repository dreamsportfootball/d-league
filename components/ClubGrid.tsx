import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSeason } from '../hooks/useSeason';
import EmptyState from './EmptyState';

const ClubGrid: React.FC = () => {
  const { activeSeason, activeSeasonId, seasonData } = useSeason();
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [thumbWidthPercent, setThumbWidthPercent] = useState(100);

  const updateScrollState = () => {
    const element = scrollRef.current;
    if (!element) return;
    const maxScroll = element.scrollWidth - element.clientWidth;
    if (maxScroll <= 0) {
      setScrollProgress(0);
      setThumbWidthPercent(100);
      return;
    }
    setScrollProgress(Math.min(1, Math.max(0, element.scrollLeft / maxScroll)));
    setThumbWidthPercent(
      Math.max(8, Math.min(100, (element.clientWidth / element.scrollWidth) * 100)),
    );
  };

  useEffect(() => {
    updateScrollState();
    window.addEventListener('resize', updateScrollState);
    return () => window.removeEventListener('resize', updateScrollState);
  }, [seasonData.teams.length]);

  const thumbLeftPercent = (100 - thumbWidthPercent) * scrollProgress;

  return (
    <section className="overflow-hidden border-t border-neutral-200 bg-neutral-50 pb-6 pt-8 md:pb-12 md:pt-16">
      <div className="container mx-auto px-4 text-center md:px-6">
        <div className="relative mb-6 inline-block md:mb-10">
          <span className="absolute -top-4 left-1/2 -translate-x-1/2 select-none whitespace-nowrap font-display text-5xl font-black uppercase text-neutral-200/50 md:-top-6 md:text-8xl">
            The Teams
          </span>
          <h2 className="relative z-10 font-display text-3xl font-black uppercase text-brand-black md:text-5xl">
            參賽 <span className="bg-gradient-to-r from-brand-blue to-cyan-500 bg-clip-text text-transparent">球隊</span>
          </h2>
        </div>

        {seasonData.teams.length === 0 ? (
          <EmptyState
            title="參賽球隊尚未公布"
            description="參賽球隊將於審核完成後公布"
            showRegistrationLink={activeSeason.status === 'registration'}
          />
        ) : (
          <>
            <p className="-mt-3 mb-9 text-xs text-neutral-400 md:-mt-5 md:mb-16 md:text-sm">
              點擊隊伍標誌查看球隊頁面
            </p>

            <div
              ref={scrollRef}
              onScroll={updateScrollState}
              className="no-scrollbar -mx-4 flex snap-x snap-proximity gap-5 overflow-x-auto px-4 pb-6 pt-1 touch-pan-x md:mx-0 md:grid md:grid-cols-5 md:items-end md:justify-items-center md:gap-x-8 md:gap-y-16 md:overflow-visible md:px-0 md:pb-0"
            >
              {seasonData.teams.map((team) => (
                <Link
                  key={team.id}
                  to={`/teams/${team.id}?season=${activeSeasonId}`}
                  className="group flex w-[24vw] shrink-0 snap-center flex-col items-center transition-transform hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-brand-blue focus:ring-offset-2 md:w-full"
                >
                  <div className="relative mb-3 flex h-14 w-14 items-center justify-center transition-all duration-300 md:mb-6 md:h-20 md:w-20">
                    <div className="absolute inset-0 rounded-full bg-brand-black/5 opacity-0 blur-xl transition-opacity duration-300 md:group-hover:opacity-50" />
                    <img
                      src={team.logo}
                      alt={team.name}
                      className="relative z-10 max-h-full max-w-full object-contain drop-shadow-md transition-all duration-500 md:grayscale-[30%] md:group-hover:grayscale-0"
                    />
                  </div>
                  <h4 className="whitespace-nowrap text-center text-[10px] font-bold uppercase tracking-widest text-brand-black transition-colors md:text-sm md:text-neutral-400 md:group-hover:text-brand-black">
                    {team.shortName}
                  </h4>
                  <span className="mt-1 text-[9px] font-black uppercase tracking-widest text-brand-blue">
                    {team.leagueId}
                  </span>
                  <div className="mt-2 h-1 w-0 bg-brand-blue transition-all duration-300 md:mt-3 md:group-hover:w-12" />
                </Link>
              ))}
            </div>

            <div className="mt-2 flex justify-center md:hidden">
              <div className="relative h-[2px] w-full max-w-xs bg-transparent">
                <div
                  className="absolute top-0 h-full rounded-full bg-neutral-400 transition-[left,width] duration-150 ease-out"
                  style={{ width: `${thumbWidthPercent}%`, left: `${thumbLeftPercent}%` }}
                />
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  );
};

export default ClubGrid;
