import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSeason } from '../hooks/useSeason';
import { getTeamIdentity } from '../services/entityData';
import { getTeamLogoUrl } from '../services/teamBranding';
import AutoFitText from './AutoFitText';
import EmptyState from './EmptyState';

const ClubGrid: React.FC = () => {
  const { activeSeason, seasonData } = useSeason();
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [thumbWidthPercent, setThumbWidthPercent] = useState(100);

  const detailedTeamByName = useMemo(
    () => new Map(
      seasonData.teams
        .filter((team) => team.competitionStatus !== 'WITHDRAWN')
        .map((team) => [team.name, team] as const),
    ),
    [seasonData.teams],
  );

  const clubs = useMemo(() => {
    const participants = activeSeason.seasonParticipants;
    if (participants) {
      return activeSeason.enabledLeagues.flatMap((leagueId) =>
        (participants.leagues[leagueId] ?? []).map((teamName) => {
          const team = detailedTeamByName.get(teamName);
          return {
            key: `${leagueId}-${teamName}`,
            name: teamName,
            shortName: team?.shortName ?? teamName,
            leagueId,
            team,
            logo: getTeamLogoUrl(activeSeason.id, teamName) ?? team?.logo ?? null,
          };
        }),
      );
    }

    return seasonData.teams
      .filter((team) => team.competitionStatus !== 'WITHDRAWN')
      .map((team) => ({
        key: team.id,
        name: team.name,
        shortName: team.shortName,
        leagueId: team.leagueId,
        team,
        logo: team.logo,
      }));
  }, [activeSeason.enabledLeagues, activeSeason.id, activeSeason.seasonParticipants, detailedTeamByName, seasonData.teams]);

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
  }, [clubs.length]);

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

        {clubs.length === 0 ? (
          <EmptyState
            title="參賽球隊尚未公布"
            description="參賽球隊將於審核完成後公布"
            showRegistrationLink={activeSeason.status === 'registration'}
          />
        ) : (
          <>
            <p className="-mt-3 mb-9 text-xs font-medium text-neutral-400 md:-mt-5 md:mb-14 md:text-sm">
              {activeSeason.shortName}｜{clubs.length} 支正式參賽球隊
            </p>

            <div
              ref={scrollRef}
              onScroll={updateScrollState}
              className="no-scrollbar -mx-4 flex snap-x snap-proximity gap-5 overflow-x-auto px-4 pb-6 pt-1 touch-pan-x md:mx-0 md:grid md:grid-cols-4 md:items-end md:justify-items-center md:gap-x-8 md:gap-y-14 md:overflow-visible md:px-0 md:pb-0 lg:grid-cols-6"
            >
              {clubs.map((club) => {
                const className = "group flex w-[24vw] shrink-0 snap-center flex-col items-center transition-transform md:w-full";
                const content = (
                  <>
                    <div className="relative mb-3 flex h-14 w-14 items-center justify-center transition-all duration-300 md:mb-5 md:h-20 md:w-20">
                      <div className="absolute inset-0 rounded-full bg-brand-black/5 opacity-0 blur-xl transition-opacity duration-300 md:group-hover:opacity-50" />
                      {club.logo && (
                        <img
                          src={club.logo}
                          alt={club.name}
                          className="relative z-10 max-h-full max-w-full object-contain drop-shadow-md transition-all duration-500 md:grayscale-[30%] md:group-hover:grayscale-0"
                        />
                      )}
                    </div>
                    <div className="w-full min-w-0 px-1 text-center">
                      <AutoFitText
                        text={club.shortName}
                        minFontSize={6}
                        lineHeight={1.15}
                        className="text-center text-[10px] font-bold uppercase tracking-widest text-brand-black transition-colors md:text-sm md:text-neutral-500 md:group-hover:text-brand-black"
                      />
                    </div>
                    <span className="mt-1 text-[9px] font-black uppercase tracking-widest text-brand-blue">
                      {club.leagueId}
                    </span>
                    <div className="mt-2 h-1 w-0 bg-brand-blue transition-all duration-300 md:mt-3 md:group-hover:w-12" />
                  </>
                );

                if (!club.team) {
                  return (
                    <div key={club.key} className={className} aria-label={`${club.name} ${club.leagueId}`}>
                      {content}
                    </div>
                  );
                }

                return (
                  <Link
                    key={club.key}
                    to={`/teams/${getTeamIdentity(club.team)}?season=${activeSeason.id}`}
                    className={`${className} hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-brand-blue focus:ring-offset-2`}
                    aria-label={`查看 ${club.name} 球隊頁`}
                  >
                    {content}
                  </Link>
                );
              })}
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
