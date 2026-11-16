import React from 'react';
import { ArrowRight, CalendarDays, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { CURRENT_SEASON_ID } from '../config/siteConfig';
import { useFollowedTeam } from '../hooks/useFollowedTeam';
import { getTeamIdentity } from '../services/entityData';
import { useSeason } from '../hooks/useSeason';
import { MatchStatus } from '../types';
import { formatTaipeiDateWithWeekday, formatTaipeiTime } from '../utils/dateFormat';

const FollowedTeamSpotlight: React.FC = () => {
  const { followedTeamId, clearFollowedTeam } = useFollowedTeam();
  const { seasonData, activeSeason } = useSeason();
  if (!followedTeamId || activeSeason.id !== CURRENT_SEASON_ID) return null;
  const team = seasonData.teams.find((entry) => getTeamIdentity(entry) === followedTeamId);
  if (!team) return null;

  const teamMatches = seasonData.matches.filter((match) =>
    match.homeTeamId === team.id || match.awayTeamId === team.id
  );
  const future = teamMatches.filter((match) => match.status === MatchStatus.SCHEDULED && Date.parse(match.timestamp) > Date.now())
    .sort((a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp))[0];
  const latest = teamMatches.filter((match) => match.status === MatchStatus.FINISHED)
    .sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp))[0];
  const match = future ?? latest;
  const opponent = match && seasonData.teamMap[match.homeTeamId === team.id ? match.awayTeamId : match.homeTeamId];

  return (
    <section aria-label="我追蹤的球隊" className="container mx-auto px-4 pb-8 pt-2 md:px-6">
      <div className="flex flex-wrap items-center gap-4 border-l-[3px] border-brand-blue bg-neutral-50 px-5 py-5 md:gap-7 md:px-8">
        <Link to={'/teams/' + followedTeamId + '?season=' + CURRENT_SEASON_ID}
          className="group flex min-w-0 flex-1 items-center gap-4 focus-visible:outline-2 focus-visible:outline-brand-blue">
          <img src={team.logo} alt="" loading="lazy" className="h-14 w-14 shrink-0 object-contain" />
          <span className="min-w-0">
            <span className="mb-1 flex items-center gap-1.5 text-[11px] font-bold text-brand-blue"><Star className="h-3.5 w-3.5 fill-current" aria-hidden="true" /> 我追蹤的球隊</span>
            <span className="block truncate font-display text-xl font-black text-brand-black group-hover:text-brand-blue">{team.name}</span>
            <span className="text-xs text-neutral-500">{team.leagueId} · 2026/27</span>
          </span>
        </Link>
        {match && opponent && (
          <Link to={'/matches/' + match.id} className="group flex min-h-11 min-w-0 items-center gap-3 border-l border-neutral-200 pl-4 text-sm transition-colors hover:text-brand-blue focus-visible:outline-2 focus-visible:outline-brand-blue md:pl-7">
            <CalendarDays className="hidden h-5 w-5 shrink-0 text-brand-blue sm:block" aria-hidden="true" />
            <span className="min-w-0">
              <span className="block text-[11px] font-semibold text-neutral-500">{future ? '下一場' : '最近賽果'} · {formatTaipeiDateWithWeekday(match.timestamp)} {formatTaipeiTime(match.timestamp)}</span>
              <span className="block truncate font-bold text-brand-black group-hover:text-brand-blue">
                vs {opponent.shortName || opponent.name}
                {!future && match.homeScore !== null && match.awayScore !== null ? ' · ' + match.homeScore + ' - ' + match.awayScore : ''}
              </span>
            </span>
            <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
          </Link>
        )}
        <button type="button" onClick={clearFollowedTeam}
          className="min-h-11 shrink-0 px-2 text-xs font-bold text-neutral-500 hover:text-brand-blue focus-visible:outline-2 focus-visible:outline-brand-blue">取消追蹤</button>
      </div>
    </section>
  );
};

export default FollowedTeamSpotlight;
