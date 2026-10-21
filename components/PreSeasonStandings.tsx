import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useSeason } from '../hooks/useSeason';
import { getTeamIdentity } from '../services/entityData';
import { getTeamLogoUrl } from '../services/teamBranding';
import type { LeagueId } from '../types/season';
import type { SeasonTeam } from '../types/team';
import AutoFitText from './AutoFitText';

interface PreSeasonStandingsProps {
  league: LeagueId;
  teamNames: readonly string[];
  variant?: 'page' | 'widget';
}

interface TeamCellProps {
  teamName: string;
  team?: SeasonTeam;
  logoUrl: string | null;
  seasonId: string;
  compact?: boolean;
  anchorId?: string;
}

const TeamCell: React.FC<TeamCellProps> = ({
  teamName,
  team,
  logoUrl,
  seasonId,
  compact = false,
  anchorId,
}) => {
  const content = (
    <>
      <span
        className={`${compact ? 'h-7 w-7' : 'h-8 w-8'} flex shrink-0 items-center justify-center`}
        aria-hidden="true"
      >
        {logoUrl && <img src={logoUrl} alt="" className="max-h-full max-w-full object-contain" />}
      </span>
      <div className="min-w-0 flex-1">
        <AutoFitText
          text={teamName}
          maxFontSize={compact ? 13 : 14}
          minFontSize={7}
          className="font-bold text-brand-black"
        />
      </div>
    </>
  );

  if (!team) {
    return <div className="flex min-h-11 min-w-0 items-center space-x-2 md:space-x-3">{content}</div>;
  }

  return (
    <Link
      to={`/teams/${getTeamIdentity(team)}?season=${seasonId}`}
      data-scroll-anchor-id={anchorId}
      className="flex min-h-11 min-w-0 items-center space-x-2 rounded-sm outline-none hover:text-brand-blue focus-visible:ring-2 focus-visible:ring-brand-blue/30 md:space-x-3"
      aria-label={`查看 ${teamName} 球隊頁`}
    >
      {content}
    </Link>
  );
};

const PreSeasonStandings: React.FC<PreSeasonStandingsProps> = ({
  league,
  teamNames,
  variant = 'page',
}) => {
  const { activeSeasonId, seasonData } = useSeason();
  const publishedTeamByName = useMemo(
    () =>
      new Map(
        seasonData.teams
          .filter((team) => team.leagueId === league && team.competitionStatus !== 'WITHDRAWN')
          .map((team): [string, SeasonTeam] => [team.name, team]),
      ),
    [league, seasonData.teams],
  );

  const rows = teamNames.map((teamName) => ({
    teamName,
    team: publishedTeamByName.get(teamName),
    logoUrl: getTeamLogoUrl(activeSeasonId, teamName),
  }));

  const isWidget = variant === 'widget';

  return (
    <section className="w-full" aria-label={`${league} 正式參賽隊伍（尚未產生排名）`}>
      <p className={`font-medium leading-relaxed text-neutral-600 ${isWidget ? 'mb-3 text-xs' : 'mb-5 text-sm'}`}>
        尚未進行正式比賽，積分與排名將於首輪賽果確認後更新
      </p>
      <div className="mb-2 flex items-center justify-between gap-4">
        <h2 className={`font-display font-bold text-brand-black ${isWidget ? 'text-base' : 'text-xl'}`}>
          已確認參賽隊伍
        </h2>
        <span className="shrink-0 text-xs font-semibold text-neutral-500">共 {rows.length} 隊</span>
      </div>
      <div className={isWidget ? 'divide-y divide-neutral-100' : 'grid grid-cols-1 gap-x-8 sm:grid-cols-2'}>
        {rows.map(({ teamName, team, logoUrl }) => (
          <div key={teamName} className="min-w-0 border-b border-neutral-100 py-2">
            <TeamCell
              teamName={teamName}
              team={team}
              logoUrl={logoUrl}
              seasonId={activeSeasonId}
              compact={isWidget}
              anchorId={team ? `${isWidget ? 'home-standings' : 'preseason-standings-team'}-${activeSeasonId}-${league}-${team.id}` : undefined}
            />
          </div>
        ))}
      </div>
    </section>
  );
};

export default PreSeasonStandings;
