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
    <section className="dl-clubs-section overflow-hidden bg-neutral-50 pb-12 pt-14 md:pb-24 md:pt-24">
      <div className="container mx-auto px-4 md:px-6">
        <div className="relative mb-9 md:mb-12">
          <h2 className="dl-clubs-title font-display text-4xl font-black tracking-tight text-brand-black md:text-6xl">
            參賽 <span className="text-brand-blue">球隊</span>
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
            <p className="mb-9 text-sm font-medium text-neutral-600 md:mb-12">
              {activeSeason.shortName}｜{clubs.length} 支正式參賽球隊
            </p>

            <div
              ref={scrollRef}
              onScroll={updateScrollState}
              className="no-scrollbar -mx-4 flex snap-x snap-proximity gap-3 overflow-x-auto px-4 pb-6 pt-1 touch-pan-x md:mx-0 md:grid md:grid-cols-3 md:items-stretch md:gap-4 md:overflow-visible md:px-0 md:pb-0 lg:grid-cols-6"
            >
              {clubs.map((club) => {
                const className = "dl-club-item group flex w-[42vw] max-w-[190px] shrink-0 snap-center flex-col items-center justify-center transition-transform md:w-full md:max-w-none";
                const content = (
                  <>
                    <div className="relative mb-4 flex h-20 w-20 items-center justify-center md:mb-5 md:h-24 md:w-24">
                      <div className="absolute inset-0 rounded-full bg-brand-black/5 opacity-0 blur-xl transition-opacity duration-300 md:group-hover:opacity-50" />
                      {club.logo && (
                        <img
                          src={club.logo}
                          alt={club.name}
                          className="relative z-10 max-h-full max-w-full object-contain"
                        />
                      )}
                    </div>
                    <div className="w-full min-w-0 px-1 text-center">
                      <AutoFitText
                        text={club.shortName}
                        minFontSize={11}
                        lineHeight={1.15}
                        className="text-center text-[13px] font-bold leading-snug text-brand-black transition-colors md:text-sm"
                      />
                    </div>
                    <span className="mt-3 text-[11px] font-bold tracking-wide text-brand-blue">
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
                    className={`${className} hover:-translate-y-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-2`}
                    aria-label={`查看 ${club.name} 球隊頁`}
                    data-scroll-anchor-id={`home-club-grid:${club.key}`}
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
