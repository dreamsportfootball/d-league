import React, { useEffect, useMemo, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { useSeason } from '../hooks/useSeason';
import EmptyState from './EmptyState';

const ClubGrid: React.FC = () => {
  const { activeSeason, seasonData } = useSeason();
  const [activeTeamId, setActiveTeamId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [thumbWidthPercent, setThumbWidthPercent] = useState(100);

  useEffect(() => {
    setActiveTeamId(null);
  }, [activeSeason.id]);

  const activeTeam = activeTeamId ? seasonData.teamMap[activeTeamId] : undefined;
  const activePlayers = useMemo(
    () =>
      activeTeamId
        ? seasonData.players
            .filter((player) => player.teamId === activeTeamId)
            .sort((a, b) => a.number - b.number)
        : [],
    [activeTeamId, seasonData.players],
  );

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
    <>
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
                點擊隊伍標誌查看詳情
              </p>

              <div
                ref={scrollRef}
                onScroll={updateScrollState}
                className="no-scrollbar -mx-4 flex snap-x snap-proximity gap-5 overflow-x-auto px-4 pb-6 pt-1 touch-pan-x md:mx-0 md:grid md:grid-cols-5 md:items-end md:justify-items-center md:gap-x-8 md:gap-y-16 md:overflow-visible md:px-0 md:pb-0"
              >
                {seasonData.teams.map((team) => (
                  <button
                    key={team.id}
                    type="button"
                    onClick={() => setActiveTeamId(team.id)}
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
                  </button>
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

      {activeTeam && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 backdrop-blur-sm md:p-8">
          <button
            type="button"
            aria-label="關閉球隊詳情"
            className="absolute inset-0 bg-black/80"
            onClick={() => setActiveTeamId(null)}
          />

          <div className="relative flex h-[650px] w-full max-w-4xl overflow-hidden rounded-xl border-2 border-brand-black/10 bg-white shadow-2xl">
            <div
              style={{ backgroundColor: activeTeam.primaryColor }}
              className="relative flex h-full w-24 shrink-0 flex-col justify-between p-4 text-white md:w-[24%] md:p-10"
            >
              <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-transparent" />
              <span className="relative z-10 font-display text-3xl font-black text-white/90 md:text-5xl">
                {String(seasonData.teams.findIndex((team) => team.id === activeTeam.id) + 1).padStart(2, '0')}
              </span>
              <div className="absolute left-1/2 top-1/2 h-32 w-32 -translate-x-1/2 -translate-y-1/2 md:h-44 md:w-44">
                <img src={activeTeam.logo} alt={activeTeam.name} className="h-full w-full object-contain drop-shadow-2xl" />
              </div>
              <span className="relative z-10 text-[10px] font-black uppercase tracking-[0.2em] text-white/80">
                DREAM IT PLAY IT
              </span>
            </div>

            <div className="relative flex flex-1 flex-col bg-white">
              <button
                type="button"
                onClick={() => setActiveTeamId(null)}
                className="absolute right-0 top-0 z-50 p-4 focus:outline-none focus:ring-2 focus:ring-brand-blue"
                aria-label="關閉"
              >
                <div className="bg-brand-black p-1 text-white transition-transform duration-300 hover:rotate-90">
                  <X className="h-6 w-6" />
                </div>
              </button>

              <div className="relative shrink-0 p-6 pb-4 md:p-8">
                <div className="absolute left-0 top-6 h-16 w-2 bg-brand-black" />
                <div className="pl-6">
                  <div className="mb-1 flex items-center space-x-3">
                    <span className="-skew-x-12 bg-brand-black px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-white">
                      OFFICIAL SQUAD
                    </span>
                    <div className="h-px flex-grow bg-neutral-200" />
                  </div>
                  <h3 className="font-display text-3xl font-black uppercase italic leading-[0.9] tracking-tighter text-brand-black sm:text-4xl md:text-5xl">
                    {activeTeam.shortName}
                  </h3>
                  <p className="mt-2 text-xs font-bold uppercase tracking-[0.3em] text-neutral-400">
                    {activeTeam.name}
                  </p>
                </div>

                <div className="relative mt-6 overflow-hidden border-l-4 bg-neutral-50 p-3" style={{ borderColor: activeTeam.primaryColor }}>
                  <p className="relative z-10 text-sm font-bold text-brand-black">
                    組別：<span className="ml-1">{activeSeason.leagues[activeTeam.leagueId]?.displayName ?? activeTeam.leagueId}</span>
                  </p>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-6 pb-8 md:px-8">
                <div className="mb-4 flex items-end justify-between border-b-2 border-brand-black pb-1">
                  <span className="font-display text-xl font-black italic tracking-tighter text-brand-black">SQUAD LIST</span>
                  <span className="mb-1 text-[10px] font-bold text-neutral-400">TOTAL: {activePlayers.length}</span>
                </div>

                {activePlayers.length > 0 ? (
                  <div className="grid grid-cols-1 gap-2">
                    {activePlayers.map((player) => (
                      <div key={player.id} className="grid grid-cols-[3rem_1fr] items-center border-b border-neutral-100 py-2">
                        <span className="font-display text-lg font-black tabular-nums text-brand-blue">{player.number}</span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-brand-black">{player.name}</p>
                          {player.englishName && (
                            <p className="truncate text-[10px] font-medium uppercase tracking-wider text-neutral-400">{player.englishName}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="py-12 text-center text-sm font-medium text-neutral-400">球員名單尚未公布</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ClubGrid;
