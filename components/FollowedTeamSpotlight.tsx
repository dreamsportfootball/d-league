import React from 'react';
import { ArrowUpRight, Star, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { CURRENT_SEASON_ID } from '../config/siteConfig';
import { useFollowedTeam } from '../hooks/useFollowedTeam';
import { useSeason } from '../hooks/useSeason';
import { getTeamIdentity } from '../services/entityData';
import { MatchStatus } from '../types';
import { formatTaipeiDateWithWeekday, formatTaipeiTime } from '../utils/dateFormat';

const FollowedTeamSpotlight: React.FC = () => {
  const { followedTeamIds, removeFollowedTeam } = useFollowedTeam();
  const { seasonData, activeSeason } = useSeason();
  if (followedTeamIds.length === 0 || activeSeason.id !== CURRENT_SEASON_ID) return null;

  const teams = followedTeamIds.flatMap((id) => {
    const team = seasonData.teams.find((entry) => getTeamIdentity(entry) === id);
    return team ? [team] : [];
  });
  if (teams.length === 0) return null;

  return (
    <section aria-labelledby="followed-teams-title" className="container mx-auto px-4 pb-7 pt-2 md:px-6">
      <div className="mb-3 flex items-baseline justify-between gap-3 border-b border-neutral-200 pb-3">
        <h2 id="followed-teams-title" className="font-display text-xl font-extrabold tracking-wide text-brand-black md:text-2xl">
          追蹤球隊
        </h2>
        <span className="text-xs font-semibold text-neutral-500">{teams.length} 支球隊</span>
      </div>

      <div className="grid grid-cols-1 gap-x-8 md:grid-cols-2">
        {teams.map((team) => {
          const teamId = getTeamIdentity(team);
          const matches = seasonData.matches.filter(
            (match) => match.homeTeamId === team.id || match.awayTeamId === team.id,
          );
          const future = matches
            .filter((match) => match.status === MatchStatus.SCHEDULED && Date.parse(match.timestamp) > Date.now())
            .sort((a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp))[0];
          const latest = matches
            .filter((match) => match.status === MatchStatus.FINISHED)
            .sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp))[0];
          const match = future ?? latest;
          const opponent = match
            ? seasonData.teamMap[match.homeTeamId === team.id ? match.awayTeamId : match.homeTeamId]
            : undefined;

          return (
            <div key={teamId} className="flex min-w-0 items-center gap-3 border-b border-neutral-200 py-4">
              <Link
                to={`/teams/${teamId}?season=${CURRENT_SEASON_ID}`}
                aria-label={`查看${team.name}球隊資料`}
                className="flex h-12 w-12 shrink-0 items-center justify-center focus-visible:outline-2 focus-visible:outline-brand-blue"
              >
                <img src={team.logo} alt="" loading="lazy" className="h-full w-full object-contain" />
              </Link>
              <div className="min-w-0 flex-1">
                <Link
                  to={`/teams/${teamId}?season=${CURRENT_SEASON_ID}`}
                  className="block truncate text-sm font-extrabold text-brand-black transition-colors hover:text-brand-blue focus-visible:outline-2 focus-visible:outline-brand-blue md:text-base"
                >
                  {team.name}
                </Link>
                <p className="mt-0.5 text-[11px] font-semibold text-neutral-500">{team.leagueId} · {activeSeason.shortName}</p>
                {match && opponent ? (
                  <Link
                    to={`/?match=${match.id}`}
                    className="group mt-2 inline-flex min-h-11 max-w-full items-center gap-1.5 text-left text-[12px] font-semibold text-neutral-700 transition-colors hover:text-brand-blue focus-visible:outline-2 focus-visible:outline-brand-blue"
                    aria-label={`查看${team.name}${future ? '下一場' : '最近一場'}比賽：對${opponent.name}`}
                  >
                    <span className="min-w-0">
                      <span className="block text-[11px] text-neutral-500">
                        {future ? '下一場' : '最近賽果'} · {formatTaipeiDateWithWeekday(match.timestamp)} {formatTaipeiTime(match.timestamp)}
                      </span>
                      <span className="block truncate group-hover:text-brand-blue">
                        vs {opponent.shortName || opponent.name}
                        {!future && match.homeScore !== null && match.awayScore !== null
                          ? ` · ${match.homeScore} - ${match.awayScore}`
                          : ''}
                      </span>
                    </span>
                    <ArrowUpRight className="h-4 w-4 shrink-0 text-brand-blue" aria-hidden="true" />
                  </Link>
                ) : (
                  <p className="mt-2 text-xs text-neutral-500">目前沒有可查看的比賽</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => removeFollowedTeam(teamId)}
                aria-label={`取消追蹤${team.name}`}
                title="取消追蹤"
                className="flex h-11 w-11 shrink-0 items-center justify-center text-neutral-400 transition-colors hover:text-brand-blue focus-visible:outline-2 focus-visible:outline-brand-blue"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default FollowedTeamSpotlight;
