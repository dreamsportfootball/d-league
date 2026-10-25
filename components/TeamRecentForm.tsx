import React, { useMemo } from 'react';
import { Activity } from 'lucide-react';
import type { Match } from '../types';
import type { SeasonTeam } from '../types/team';
import { getTeamFormSummary, type FormResult } from '../services/teamForm';

interface Props {
  teamId: string;
  seasonLabel: string;
  matches: Match[];
  teamMap: Record<string, SeasonTeam>;
  onMatchClick: (matchId: string) => void;
}
const labels: Record<FormResult, string> = { W: '勝', D: '和', L: '負' };
const colors: Record<FormResult, string> = {
  W: 'bg-brand-blue text-white',
  D: 'bg-neutral-200 text-neutral-800',
  L: 'bg-neutral-800 text-white',
};
const TeamRecentForm: React.FC<Props> = ({ teamId, seasonLabel, matches, teamMap, onMatchClick }) => {
  const summary = useMemo(() => getTeamFormSummary(teamId, matches), [teamId, matches]);
  return (
    <section aria-labelledby="team-recent-form-title">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-neutral-200 pb-3">
        <div className="flex items-center">
          <Activity className="mr-2 h-5 w-5 text-brand-blue" aria-hidden="true" />
          <h2 id="team-recent-form-title" className="font-display text-2xl font-extrabold text-brand-black">球隊近期狀態</h2>
        </div>
        <span className="text-[11px] font-semibold text-neutral-500">{seasonLabel} · 正式聯賽</span>
      </div>
      {summary.recent.length === 0 ? (
        <p className="py-8 text-sm text-neutral-500">本賽季尚未有正式賽果，首場比賽完成後將顯示近期狀態。</p>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="mb-3 text-xs font-bold text-neutral-500">最近 {summary.recent.length} 場 · 由舊到新</p>
            <div className="flex flex-wrap gap-2.5">
              {[...summary.recent].reverse().map(({ match, result, goalsFor, goalsAgainst }) => {
                const opponentId = match.homeTeamId === teamId ? match.awayTeamId : match.homeTeamId;
                const opponent = teamMap[opponentId]?.shortName ?? teamMap[opponentId]?.name ?? '對手';
                return (
                  <button
                    key={match.id}
                    type="button"
                    onClick={() => onMatchClick(match.id)}
                    className={'flex h-12 w-12 items-center justify-center text-base font-black transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue ' + colors[result]}
                    aria-label={opponent + '，' + labels[result] + '，' + goalsFor + ' 比 ' + goalsAgainst + '，查看賽事'}
                    title={opponent + ' · ' + labels[result] + ' ' + goalsFor + '-' + goalsAgainst}
                  >
                    {result}
                  </button>
                );
              })}
            </div>
            <p className="mt-3 text-xs text-neutral-500">點擊標記可查看該場比賽</p>
          </div>
          <dl className="grid grid-cols-3 divide-x divide-neutral-200 border-y border-neutral-200 py-4 text-center">
            {[
              ['連勝', summary.winStreak ? summary.winStreak + ' 場' : '—'],
              ['近五場進球', String(summary.goalsFor)],
              ['近五場失球', String(summary.goalsAgainst)],
            ].map(([label, value]) => (
              <div key={label} className="min-w-0 px-2">
                <dt className="text-[10px] font-bold tracking-wide text-neutral-500">{label}</dt>
                <dd className="mt-1 font-display text-2xl font-black tabular-nums text-brand-black sm:text-3xl">{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}
    </section>
  );
};
export default TeamRecentForm;
