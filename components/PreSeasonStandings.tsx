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
}

const TeamCell: React.FC<TeamCellProps> = ({ teamName, team, logoUrl, seasonId, compact = false }) => {
  const content = (
    <>
      <span className={`${compact ? 'h-7 w-7' : 'h-9 w-9'} flex shrink-0 items-center justify-center`} aria-hidden="true">
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
          賽季尚未開賽，先顯示本季確認參賽球隊
        </p>
        <div className="border-y border-neutral-100">
          {rows.map(({ teamName, team, logoUrl }) => (
            <div key={teamName} className="border-b border-neutral-50 py-1 last:border-b-0">
              <TeamCell
                teamName={teamName}
                team={team}
                logoUrl={logoUrl}
                seasonId={activeSeasonId}
                compact
              />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="mb-5 border-l-4 border-brand-blue pl-4">
        <p className="font-display text-xl font-black text-brand-black">賽季尚未開賽</p>
        <p className="mt-1 text-xs font-medium leading-5 text-neutral-500 md:text-sm">
          目前先顯示 {league} 正式參賽球隊，名次與積分將於首輪正式比賽完成後產生。
        </p>
      </div>

      <div className="border-y border-neutral-200">
        <div className="grid grid-cols-[1fr_auto] items-center border-b border-neutral-200 py-3 text-[10px] font-bold uppercase tracking-widest text-neutral-500 md:text-[11px]">
          <span>參賽球隊</span>
          <span>狀態</span>
        </div>
        {rows.map(({ teamName, team, logoUrl }) => (
          <div
            key={teamName}
            className="grid min-h-[64px] grid-cols-[minmax(0,1fr)_auto] items-center gap-4 border-b border-neutral-100 py-2 last:border-b-0"
          >
            <TeamCell
              teamName={teamName}
              team={team}
              logoUrl={logoUrl}
              seasonId={activeSeasonId}
            />
            <span className="shrink-0 text-[10px] font-black uppercase tracking-widest text-brand-blue md:text-xs">
              已確認參賽
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PreSeasonStandings;
