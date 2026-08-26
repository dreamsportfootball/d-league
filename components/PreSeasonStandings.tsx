import React, { useMemo, useState } from 'react';
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
}

interface TeamCellProps {
  teamName: string;
  team?: SeasonTeam;
  logoUrl: string | null;
  seasonId: string;
  compact?: boolean;
}

const TeamCell: React.FC<TeamCellProps> = ({
  teamName,
  team,
  logoUrl,
  seasonId,
  compact = false,
}) => {
  const content = (
    <>
      <span className={`${compact ? 'h-7 w-7' : 'h-8 w-8'} flex shrink-0 items-center justify-center`} aria-hidden="true">
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

const StandingRowStylePreview: React.FC = () => {
  const samples = [
    {
      label: 'L1 第 1 名',
      status: '冠軍',
      rowClass: 'bg-brand-blue/5',
      barClass: 'bg-brand-blue',
    },
    {
      label: 'L2／L3 第 1 名',
      status: '升級',
      rowClass: 'bg-green-50/70',
      barClass: 'bg-green-500',
    },
    {
      label: 'L1／L2 第 6 名',
      status: '降級',
      rowClass: 'bg-red-50/70',
      barClass: 'bg-red-500',
    },
  ];

  return (
    <div className="mb-6" aria-label="積分榜升降級顏色說明">
      <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-neutral-500">排名顏色預覽</p>
      <div className="overflow-hidden border-y border-neutral-100">
        {samples.map((sample) => (
          <div
            key={sample.label}
            className={`relative flex min-h-11 items-center border-b border-neutral-100 px-4 last:border-b-0 ${sample.rowClass}`}
          >
            <span className={`absolute bottom-2 left-0 top-2 w-1 rounded-r-full ${sample.barClass}`} aria-hidden="true" />
            <span className="text-xs font-bold text-brand-black">{sample.label}</span>
            <span className="ml-auto text-xs font-bold text-neutral-600">{sample.status}</span>
          </div>
        ))}
      </div>
      <p className="mt-2 text-[10px] leading-5 text-neutral-500">僅示意正式積分榜的狀態顏色，不代表目前球隊排名。</p>
    </div>
  );
};

const PreSeasonStandings: React.FC<PreSeasonStandingsProps> = ({ league, teamNames }) => {
  const { activeSeasonId, seasonData } = useSeason();
  const [mobileExpanded, setMobileExpanded] = useState(false);
  const publishedTeamByName = useMemo(
    () => new Map(seasonData.teams
      .filter((team) => team.leagueId === league && team.competitionStatus !== 'WITHDRAWN')
      .map((team): [string, SeasonTeam] => [team.name, team])),
    [league, seasonData.teams],
  );

  const rows = teamNames.map((teamName) => ({
    teamName,
    team: publishedTeamByName.get(teamName),
    logoUrl: getTeamLogoUrl(activeSeasonId, teamName),
  }));

  return (
    <div className="w-full">
      <p className="mb-3 text-xs font-medium leading-5 text-neutral-500">
        賽季尚未開賽，名次將於首輪正式比賽完成後產生
      </p>

      <StandingRowStylePreview />

      <div className="mb-2 flex justify-end md:hidden">
        <button
          type="button"
          onClick={() => setMobileExpanded((expanded) => !expanded)}
          aria-expanded={mobileExpanded}
          className="min-h-11 rounded-sm px-2 text-xs font-bold text-brand-blue transition-colors hover:bg-neutral-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue/30"
        >
          {mobileExpanded ? '收起數據 ↑' : '查看完整數據 ↓'}
        </button>
      </div>

      {!mobileExpanded && (
        <div className="md:hidden">
          <table className="w-full table-fixed border-collapse">
            <thead className="border-b border-neutral-200 text-[10px] font-bold tracking-wider text-neutral-500">
              <tr>
                <th className="w-9 px-1 py-3 text-left">名次</th>
                <th className="py-3 pl-2 pr-1 text-left">球隊</th>
                <th className="w-10 px-1 py-3 text-center">場次</th>
                <th className="w-12 px-1 py-3 text-center">淨勝</th>
                <th className="w-12 px-1 py-3 text-center text-brand-blue">積分</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ teamName, team, logoUrl }) => (
                <tr key={teamName} className="border-b border-neutral-100">
                  <td className="px-1 py-3 font-mono text-xs font-bold text-neutral-400">-</td>
                  <td className="py-1.5 pl-2 pr-1">
                    <TeamCell teamName={teamName} team={team} logoUrl={logoUrl} seasonId={activeSeasonId} compact />
                  </td>
                  <td className="px-1 py-3 text-center text-xs tabular-nums">0</td>
                  <td className="px-1 py-3 text-center text-xs tabular-nums">0</td>
                  <td className="px-1 py-3 text-center text-xs font-semibold tabular-nums text-brand-blue">0</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {mobileExpanded && (
        <div className="overflow-x-auto md:hidden">
          <table className="w-full min-w-[740px] border-collapse">
            <thead className="border-b border-neutral-200 text-[10px] font-bold tracking-widest text-neutral-500">
              <tr>
                <th className="w-8 px-1 py-3 text-left">名次</th>
                <th className="w-[140px] py-3 pl-2 pr-2 text-left">球隊</th>
                <th className="w-10 px-1 py-3 text-center">場次</th>
                <th className="w-10 px-1 py-3 text-center">勝</th>
                <th className="w-10 px-1 py-3 text-center">和</th>
                <th className="w-10 px-1 py-3 text-center">敗</th>
                <th className="w-10 px-1 py-3 text-center">進球</th>
                <th className="w-10 px-1 py-3 text-center">失球</th>
                <th className="w-12 px-1 py-3 text-center">淨勝</th>
                <th className="w-12 px-1 py-3 text-center text-brand-blue">積分</th>
                <th className="w-[50px] px-1 py-3 text-left">近況</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ teamName, team, logoUrl }) => (
                <tr key={teamName} className="border-b border-neutral-100">
                  <td className="px-1 py-3 font-mono text-xs font-bold text-neutral-400">-</td>
                  <td className="py-1.5 pl-2 pr-2">
                    <TeamCell teamName={teamName} team={team} logoUrl={logoUrl} seasonId={activeSeasonId} compact />
                  </td>
                  {[0, 0, 0, 0, 0, 0, 0, 0].map((value, index) => (
                    <td key={`${teamName}-${index}`} className="px-1 py-3 text-center text-xs tabular-nums">{value}</td>
                  ))}
                  <td className="px-1 py-3 text-left text-xs text-neutral-400">-</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="hidden overflow-x-auto md:block">
        <table className="w-full border-collapse">
          <thead className="border-b border-neutral-200 text-[11px] font-bold tracking-widest text-neutral-500">
            <tr>
              <th className="w-10 px-1 py-3 text-left">名次</th>
              <th className="w-[220px] px-4 py-3 text-left">球隊</th>
              <th className="w-10 px-1 py-3 text-center">場次</th>
              <th className="w-10 px-1 py-3 text-center">勝</th>
              <th className="w-10 px-1 py-3 text-center">和</th>
              <th className="w-10 px-1 py-3 text-center">敗</th>
              <th className="w-10 px-1 py-3 text-center">進球</th>
              <th className="w-10 px-1 py-3 text-center">失球</th>
              <th className="w-12 px-1 py-3 text-center">淨勝</th>
              <th className="w-12 px-1 py-3 text-center text-brand-blue">積分</th>
              <th className="w-[50px] px-1 py-3 text-left">近況</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ teamName, team, logoUrl }) => (
              <tr key={teamName} className="border-b border-neutral-100 transition-colors hover:bg-neutral-50/50">
                <td className="px-1 py-3 font-mono text-sm font-bold text-neutral-400">-</td>
                <td className="px-4 py-1.5">
                  <TeamCell teamName={teamName} team={team} logoUrl={logoUrl} seasonId={activeSeasonId} />
                </td>
                {[0, 0, 0, 0, 0, 0, 0, 0].map((value, index) => (
                  <td key={`${teamName}-${index}`} className="px-1 py-3 text-center text-sm tabular-nums">{value}</td>
                ))}
                <td className="px-1 py-3 text-left text-sm text-neutral-400">-</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PreSeasonStandings;
