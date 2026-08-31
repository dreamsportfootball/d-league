import React, { useMemo } from 'react';
import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useSeason } from '../hooks/useSeason';
import { getTeamIdentity } from '../services/entityData';
import { getTeamLogoUrl } from '../services/teamBranding';
import EmptyState from './EmptyState';

const ClubGrid: React.FC = () => {
  const { activeSeason, seasonData } = useSeason();

  const detailedTeamByName = useMemo(
    () =>
      new Map(
        seasonData.teams
          .filter((team) => team.competitionStatus !== 'WITHDRAWN')
          .map((team) => [team.name, team] as const),
      ),
    [seasonData.teams],
  );

  const leagueGroups = useMemo(
    () =>
      activeSeason.enabledLeagues.map((leagueId) => {
        const participantNames = activeSeason.seasonParticipants?.leagues[leagueId] ?? [];
        const fallbackTeams = seasonData.teams.filter(
          (team) => team.leagueId === leagueId && team.competitionStatus !== 'WITHDRAWN',
        );

        const clubs = participantNames.length > 0
          ? participantNames.map((teamName) => {
              const team = detailedTeamByName.get(teamName);
              return {
                key: `${leagueId}-${teamName}`,
                name: teamName,
                shortName: team?.shortName ?? teamName,
                team,
                logo: getTeamLogoUrl(activeSeason.id, teamName) ?? team?.logo ?? null,
              };
            })
          : fallbackTeams.map((team) => ({
              key: team.id,
              name: team.name,
              shortName: team.shortName,
              team,
              logo: team.logo,
            }));

        return { leagueId, clubs };
      }),
    [activeSeason.enabledLeagues, activeSeason.id, activeSeason.seasonParticipants, detailedTeamByName, seasonData.teams],
  );

  const totalClubs = leagueGroups.reduce((total, group) => total + group.clubs.length, 0);

  return (
    <section className="border-y border-neutral-200 bg-neutral-50 py-12 md:py-16" aria-labelledby="home-clubs-title">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex flex-col gap-4 border-b border-neutral-300 pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-1 text-[10px] font-black uppercase tracking-[0.24em] text-brand-blue">
              Confirmed Clubs · {activeSeason.shortName}
            </p>
            <h2 id="home-clubs-title" className="font-display text-3xl font-black tracking-tight text-brand-black md:text-5xl">
              參賽球隊
            </h2>
          </div>
          <p className="text-sm font-black tracking-wide text-neutral-500">
            {totalClubs > 0 ? `${totalClubs} 支正式參賽球隊` : '名單尚未公布'}
          </p>
        </div>

        {totalClubs === 0 ? (
          <div className="mt-8">
            <EmptyState
              title="參賽球隊尚未公布"
              description="參賽球隊將於審核完成後公布"
              showRegistrationLink={activeSeason.status === 'registration'}
            />
          </div>
        ) : (
          <div className="mt-8 grid gap-6 lg:grid-cols-3 lg:gap-px lg:border lg:border-neutral-200 lg:bg-neutral-200">
            {leagueGroups.map(({ leagueId, clubs }) => (
              <section key={leagueId} className="border border-neutral-200 bg-white lg:border-0" aria-labelledby={`home-${leagueId}-title`}>
                <div className="flex min-h-20 items-center justify-between bg-brand-black px-5 py-4 text-white">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.24em] text-brand-accent">
                      League {leagueId.slice(1)}
                    </p>
                    <h3 id={`home-${leagueId}-title`} className="mt-1 font-display text-3xl font-black tracking-tight">
                      {leagueId}
                    </h3>
                  </div>
                  <span className="text-xs font-black tracking-wider text-white/60">{clubs.length} 隊</span>
                </div>

                <ol className="grid grid-cols-2 lg:grid-cols-1">
                  {clubs.map((club, index) => {
                    const content = (
                      <>
                        <span className="w-6 shrink-0 font-display text-sm font-black tabular-nums text-brand-blue">
                          {String(index + 1).padStart(2, '0')}
                        </span>
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center">
                          {club.logo ? (
                            <img
                              src={club.logo}
                              alt=""
                              loading="lazy"
                              decoding="async"
                              className="max-h-9 max-w-9 object-contain"
                            />
                          ) : (
                            <span className="h-7 w-7 border border-neutral-200 bg-neutral-50" aria-hidden="true" />
                          )}
                        </span>
                        <span className="min-w-0 flex-1 text-xs font-bold leading-5 text-brand-black sm:text-sm lg:text-base">
                          {club.shortName}
                        </span>
                        {club.team && (
                          <ChevronRight className="hidden h-4 w-4 shrink-0 text-neutral-300 transition-colors group-hover:text-brand-blue sm:block" aria-hidden="true" />
                        )}
                      </>
                    );

                    return (
                      <li
                        key={club.key}
                        className="border-b border-neutral-200 odd:border-r last:border-b-0 lg:border-r-0 lg:last:border-b-0"
                      >
                        {club.team ? (
                          <Link
                            to={`/teams/${getTeamIdentity(club.team)}?season=${activeSeason.id}`}
                            className="group flex min-h-20 items-center gap-2 px-3 py-3 transition-colors hover:bg-neutral-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-blue sm:gap-3 sm:px-4 lg:min-h-16 lg:px-5"
                            aria-label={`查看 ${club.name} 球隊頁`}
                            data-scroll-anchor-id={`home-club-grid:${club.key}`}
                          >
                            {content}
                          </Link>
                        ) : (
                          <div className="flex min-h-20 items-center gap-2 px-3 py-3 sm:gap-3 sm:px-4 lg:min-h-16 lg:px-5" aria-label={`${club.name} ${leagueId}`}>
                            {content}
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ol>
              </section>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default ClubGrid;
