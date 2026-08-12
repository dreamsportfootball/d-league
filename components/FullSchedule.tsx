import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { MatchStatus, type Match } from '../types';
import type { LeagueId } from '../types/season';
import type { SeasonTeam } from '../types/team';
import { formatTaipeiDate, formatTaipeiDateWithWeekday, formatTaipeiTime } from '../utils/dateFormat';
import AutoFitText from './AutoFitText';

type LeagueFilter = LeagueId | 'ALL';
type FullScheduleVariant = 'default' | 'team';

interface FullScheduleProps {
  matches: Match[];
  teamMap: Record<string, SeasonTeam>;
  onMatchClick: (matchId: string) => void;
  leagueFilter: LeagueFilter;
  variant?: FullScheduleVariant;
}

const getStatusLabel = (match: Match): string => {
  if (match.administrativeNote?.trim()) return match.administrativeNote.trim();
  return match.status === MatchStatus.FINISHED ? '比賽結束' : '尚未開賽';
};

const Score: React.FC<{ match: Match }> = ({ match }) => {
  const hasScore = match.status === MatchStatus.FINISHED && match.homeScore !== null && match.awayScore !== null;
  return hasScore ? <span className="font-display text-xl font-black tracking-tight tabular-nums text-brand-black md:text-2xl">{match.homeScore} - {match.awayScore}</span> : <span className="font-display text-[10px] font-black uppercase tracking-[0.16em] text-neutral-300">VS</span>;
};

const FullSchedule: React.FC<FullScheduleProps> = ({ matches, teamMap, onMatchClick: _onMatchClick, leagueFilter, variant = 'default' }) => {
  const filteredMatches = useMemo(() => {
    const filtered = leagueFilter === 'ALL' ? matches.slice() : matches.filter((match) => match.league === leagueFilter);
    return filtered.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }, [leagueFilter, matches]);

  let lastDate = '';
  return (
    <div className="w-full">
      {filteredMatches.map((match, index) => {
        const home = teamMap[match.homeTeamId];
        const away = teamMap[match.awayTeamId];
        if (!home || !away) return null;
        const date = formatTaipeiDate(match.timestamp);
        const mobileDate = formatTaipeiDateWithWeekday(match.timestamp).replaceAll('.', '/');
        const isNewDate = date !== lastDate;
        if (isNewDate) lastDate = date;
        const status = getStatusLabel(match);
        const seasonId = home.seasonId ?? away.seasonId;
        const rowBackground = index % 2 === 0 ? 'bg-white' : 'bg-neutral-50/60';

        return (
          <React.Fragment key={match.id}>
            {isNewDate && variant !== 'team' && <div className="sticky top-16 z-20 mt-7 border-b border-neutral-100 bg-white/95 py-3 backdrop-blur"><div className="flex items-center"><span className="mr-3 h-4 w-1 bg-brand-accent" /><span className="font-display text-sm font-black tracking-[0.12em] text-brand-black">{date}</span></div></div>}
            <Link to={`/matches/${match.id}?season=${seasonId}`} data-analytics-event="match_open" data-analytics-label={match.id} aria-label={`${home.name} 對 ${away.name}，${status}`} className={`group block border-b border-neutral-100 px-1.5 py-3 transition-colors hover:bg-neutral-100 ${rowBackground}`}>
              <div className="grid min-h-14 grid-cols-[82px_minmax(0,1fr)_52px_minmax(0,1fr)] items-center gap-1 md:grid-cols-[142px_minmax(0,1fr)_78px_minmax(0,1fr)_92px] md:gap-3">
                <div className="min-w-0"><p className="whitespace-nowrap font-display text-[9px] font-black text-neutral-500 md:text-[11px]">{variant === 'team' ? mobileDate : formatTaipeiTime(match.timestamp)}</p><p className="mt-1 whitespace-nowrap text-[8px] font-bold text-neutral-400 md:text-[9px]">{variant === 'team' ? `${formatTaipeiTime(match.timestamp)} · ` : ''}{match.league} 第 {match.round} 輪</p></div>
                <div className="flex min-w-0 items-center justify-end gap-1.5 md:gap-3"><div className="min-w-0 flex-1 text-right"><AutoFitText text={home.name} maxFontSize={16} minFontSize={8} className="font-black text-brand-black" /></div><img src={home.logo} alt={home.name} loading="lazy" decoding="async" className="h-7 w-7 shrink-0 object-contain md:h-9 md:w-9" /></div>
                <div className="text-center"><Score match={match} /></div>
                <div className="flex min-w-0 items-center justify-start gap-1.5 md:gap-3"><img src={away.logo} alt={away.name} loading="lazy" decoding="async" className="h-7 w-7 shrink-0 object-contain md:h-9 md:w-9" /><div className="min-w-0 flex-1"><AutoFitText text={away.name} maxFontSize={16} minFontSize={8} className="font-black text-brand-black" /></div></div>
                <div className="hidden text-right md:block">{match.administrativeNote && <p className="truncate text-[9px] font-bold text-amber-700" title={match.administrativeNote}>{match.administrativeNote}</p>}<p className="mt-1 text-[9px] font-black uppercase tracking-wider text-brand-blue">完整比賽頁 →</p></div>
              </div>
            </Link>
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default FullSchedule;
