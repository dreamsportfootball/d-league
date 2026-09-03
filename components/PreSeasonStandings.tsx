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
    () => new Map(
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

  if (variant === 'widget') {
    return (
      <div className="w-full text-xs">
        <p className="mb-2 text-[10px] font-medium leading-5 text-neutral-400">
          尚未有正式賽果，先顯示本季確認參賽球隊
        </p>
        <div className="divide-y divide-neutral-100 border-y border-neutral-100">
          {rows.map(({ teamName, team, logoUrl }) => (
            <div key={teamName} className="flex min-h-12 items-center gap-3 py-1.5">
              <div className="min-w-0 flex-1">
                <TeamCell
                  teamName={teamName}
                  team={team}
                  logoUrl={logoUrl}
                  seasonId={activeSeasonId}
                  compact
                  anchorId={team ? `home-standings-${activeSeasonId}-${league}-${team.id}` : undefined}
                />
              </div>
              <span className="shrink-0 text-[9px] font-black uppercase tracking-wider text-neutral-400">
                未開賽
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="mb-5 border-l-2 border-brand-blue bg-neutral-50 px-4 py-3">
        <p className="text-sm font-bold text-brand-black">尚未產生正式排名</p>
        <p className="mt-1 text-xs font-medium leading-5 text-neutral-500">
          賽季尚未開賽，名次與積分將於首輪正式比賽完成後更新
        </p>
      </div>

      <div className="border-y border-neutral-200">
        <div className="grid grid-cols-[minmax(0,1fr)_72px] items-center gap-4 border-b border-neutral-200 py-3 text-[10px] font-bold uppercase tracking-wider text-neutral-500 md:grid-cols-[minmax(0,1fr)_96px]">
          <span>正式參賽球隊</span>
          <span className="text-right">狀態</span>
        </div>
        <div className="divide-y divide-neutral-100">
          {rows.map(({ teamName, team, logoUrl }) => (
            <div
              key={teamName}
              className="grid min-h-14 grid-cols-[minmax(0,1fr)_72px] items-center gap-4 py-1.5 md:grid-cols-[minmax(0,1fr)_96px]"
            >
              <TeamCell
                teamName={teamName}
                team={team}
                logoUrl={logoUrl}
                seasonId={activeSeasonId}
                anchorId={team ? `preseason-standings-team-${activeSeasonId}-${league}-${team.id}` : undefined}
              />
              <span className="text-right text-[10px] font-black uppercase tracking-wider text-neutral-400">
                等待首輪
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PreSeasonStandings;
