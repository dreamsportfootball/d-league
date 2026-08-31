import React, { useMemo, useState } from 'react';
import {
  CalendarDays,
  ExternalLink,
  Facebook,
  Globe2,
  History,
  Instagram,
  TrendingUp,
  UserRound,
  Youtube,
} from 'lucide-react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import AutoFitText from '../components/AutoFitText';
import BackButton from '../components/BackButton';
import EmptyState from '../components/EmptyState';
import FullSchedule from '../components/FullSchedule';
import MatchDialog from '../components/MatchDialog';
import TeamRankChart, { type TeamRankPoint } from '../components/TeamRankChart';
import { isSeasonId } from '../config/seasons';
import { SeasonContext } from '../contexts/SeasonContext';
import {
  CUP_EVENT,
  getCupMatchesForTeam,
  getCupTeamByIdentity,
  getCupTeamPlacementLabel,
} from '../cupData';
import { useSeason } from '../hooks/useSeason';
import { calculateLeagueTable } from '../services/competitionEngine';
import { getPlayerIdentity, getTeamHistory, getTeamIdentity } from '../services/entityData';
import { MatchStatus, type Match } from '../types';
import type { SeasonTeam, TeamSocialLinks } from '../types/team';

interface RoundBucket {
  round: string;
  matches: Match[];
  firstKickoff: number;
}

interface TeamSocialLinkItem {
  platform: keyof TeamSocialLinks;
  label: string;
  href: string;
  icon: React.ReactNode;
}

interface TeamCompetitionHistoryRow {
  id: string;
  period: string;
  competition: string;
  result: string;
  record: string;
  startYear: number;
  href?: string;
}

const isResolvedMatch = (match: Match): boolean =>
  match.status === MatchStatus.FINISHED ||
  match.resultType === 'VOID' ||
  (match.homeScore !== null && match.awayScore !== null);

const formatLeagueName = (leagueId: string): string => {
  const match = /^L(\d+)$/i.exec(leagueId);
  return match ? `LEAGUE ${match[1]}` : leagueId;
};

const formatStatValue = (value: number | undefined): number | '-' =>
  typeof value === 'number' ? value : '-';

const isSafeExternalUrl = (value: string): boolean => {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
};

const getTeamSocialLinks = (team: SeasonTeam): TeamSocialLinkItem[] => {
  const links = team.socialLinks;
  if (!links) return [];

  const candidates: Array<TeamSocialLinkItem | null> = [
    links.instagram && isSafeExternalUrl(links.instagram)
      ? { platform: 'instagram', label: 'Instagram', href: links.instagram, icon: <Instagram className="h-4 w-4" /> }
      : null,
    links.facebook && isSafeExternalUrl(links.facebook)
      ? { platform: 'facebook', label: 'Facebook', href: links.facebook, icon: <Facebook className="h-4 w-4" /> }
      : null,
    links.youtube && isSafeExternalUrl(links.youtube)
      ? { platform: 'youtube', label: 'YouTube', href: links.youtube, icon: <Youtube className="h-4 w-4" /> }
      : null,
    links.website && isSafeExternalUrl(links.website)
      ? { platform: 'website', label: '官方網站', href: links.website, icon: <Globe2 className="h-4 w-4" /> }
      : null,
  ];

  return candidates.filter((item): item is TeamSocialLinkItem => item !== null);
};

const TeamPage: React.FC = () => {
  const { id = '' } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const { availableSeasons } = useSeason();
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const [failedTeamLogo, setFailedTeamLogo] = useState<string | null>(null);
  const requestedSeason = searchParams.get('season');
  const history = useMemo(() => getTeamHistory(id), [id]);

  if (history.length === 0) {
    return (
      <div className="min-h-[75vh] bg-white px-4 py-16 md:py-28">
        <div className="mx-auto max-w-5xl">
          <EmptyState title="找不到此球隊" description="此球隊不存在、尚未登錄，或網址已失效" />
          <div className="mt-8 text-center">
            <BackButton
              fallbackTo={isSeasonId(requestedSeason) ? `/standings?season=${requestedSeason}` : '/standings'}
              className="inline-flex min-h-11 items-center text-sm font-bold text-brand-blue hover:text-brand-black"
            />
          </div>
        </div>
      </div>
    );
  }

  const selectedRecord =
    (isSeasonId(requestedSeason)
      ? history.find((record) => record.seasonId === requestedSeason)
      : undefined) ?? history[0];
  const { team, data, season, seasonId } = selectedRecord;
  const socialLinks = getTeamSocialLinks(team);
  const displayShortName = team.shortName?.trim() && team.shortName.trim() !== team.name.trim()
    ? team.shortName.trim()
    : '';
  const players = data.players
    .filter((player) => player.teamId === team.id)
    .sort((a, b) => a.number - b.number || a.name.localeCompare(b.name, 'zh-TW'));
  const teamMatches = data.matches
    .filter((match) => match.homeTeamId === team.id || match.awayTeamId === team.id)
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  const cupTeam = getCupTeamByIdentity(getTeamIdentity(team));
  const cupMatches = cupTeam ? getCupMatchesForTeam(cupTeam.id) : [];
  const cupPlacement = cupTeam ? getCupTeamPlacementLabel(cupTeam.id) : null;
  const competitionHistory: TeamCompetitionHistoryRow[] = (() => {
    const leagueRows: TeamCompetitionHistoryRow[] = history.map((record) => {
      const row = calculateLeagueTable({
        league: record.team.leagueId,
        teams: record.data.teams,
        matches: record.data.matches,
        matchEvents: record.data.matchEvents,
        rules: record.season.rules,
        leagueConfig: record.season.leagues[record.team.leagueId],
      }).find((item) => item.teamId === record.team.id);

      return {
        id: `league-${record.seasonId}`,
        period: record.season.shortName,
        competition: `D LEAGUE · ${formatLeagueName(record.team.leagueId)}`,
        result: row?.played ? `#${row.rank}` : '-',
        record: row?.played ? `${row.points} 分` : '-',
        startYear: Number.parseInt(record.seasonId.slice(0, 4), 10),
      };
    });

    if (!cupTeam || cupMatches.length === 0) return leagueRows;

    const cupYear = new Date(CUP_EVENT.date).getFullYear();
    const cupRow: TeamCompetitionHistoryRow = {
      id: `cup-${cupTeam.id}-${cupYear}`,
      period: String(cupYear),
      competition: CUP_EVENT.shortName,
      result: cupPlacement ?? '參賽',
      record: `${cupMatches.length} 場`,
      startYear: cupYear,
      href: '/cup',
    };
    const insertIndex = leagueRows.findIndex((row) => row.startYear < cupYear);

    return insertIndex === -1
      ? [...leagueRows, cupRow]
      : [...leagueRows.slice(0, insertIndex), cupRow, ...leagueRows.slice(insertIndex)];
  })();
  const dialogSeasonContext = {
    activeSeasonId: seasonId,
    activeSeason: season,
    seasonData: data,
    availableSeasons,
    setActiveSeason: () => {},
  };

  const leagueConfig = season.leagues[team.leagueId];
  const standings = calculateLeagueTable({
    league: team.leagueId,
    teams: data.teams,
    matches: data.matches,
    matchEvents: data.matchEvents,
    rules: season.rules,
    leagueConfig,
  });
  const standing = standings.find((row) => row.teamId === team.id);
  const activeLeagueTeams = data.teams.filter(
    (candidate) => candidate.leagueId === team.leagueId && candidate.competitionStatus !== 'WITHDRAWN',
  );
  const activeLeagueTeamIds = new Set(activeLeagueTeams.map((candidate) => candidate.id));
  const eligibleLeagueMatches = data.matches.filter(
    (match) =>
      match.league === team.leagueId &&
      activeLeagueTeamIds.has(match.homeTeamId) &&
      activeLeagueTeamIds.has(match.awayTeamId),
  );
  const seasonHasStarted = eligibleLeagueMatches.some(isResolvedMatch);

  const rankHistory: TeamRankPoint[] = (() => {
    if (activeLeagueTeams.length < 2) return [];
    const buckets = new Map<string, RoundBucket>();
    eligibleLeagueMatches.forEach((match) => {
      const round = String(match.round);
      const kickoff = new Date(match.timestamp).getTime();
      const current = buckets.get(round);
      if (current) {
        current.matches.push(match);
        current.firstKickoff = Math.min(current.firstKickoff, kickoff);
      } else {
        buckets.set(round, { round, matches: [match], firstKickoff: kickoff });
      }
    });

    const expectedMatchesPerRound = Math.max(1, Math.floor(activeLeagueTeams.length / 2));
    const completedRounds = [...buckets.values()]
      .filter((bucket) => bucket.matches.length >= expectedMatchesPerRound && bucket.matches.every(isResolvedMatch))
      .sort((a, b) => a.firstKickoff - b.firstKickoff);

    const completedMatches: Match[] = [];
    return completedRounds.flatMap((bucket) => {
      completedMatches.push(...bucket.matches);
      const row = calculateLeagueTable({
        league: team.leagueId,
        teams: data.teams,
        matches: completedMatches,
        matchEvents: data.matchEvents,
        rules: season.rules,
        leagueConfig,
      }).find((item) => item.teamId === team.id);
      return row ? [{ round: bucket.round, rank: row.rank, points: row.points, played: row.played }] : [];
    });
  })();

  const renderSocialLinks = (mobile: boolean) => (
    <div className={mobile ? 'mt-4 flex flex-wrap gap-x-5 gap-y-2 sm:hidden' : 'hidden flex-wrap justify-end gap-x-5 gap-y-2 sm:flex'}>
      {socialLinks.map((link) => (
        <a
          key={link.platform}
          href={link.href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`前往 ${team.name} ${link.label}`}
          className="group inline-flex min-h-11 items-center gap-2 text-xs font-bold text-neutral-500 transition-colors hover:text-brand-blue"
        >
          {link.icon}
          <span>{link.label}</span>
          <ExternalLink className="h-3.5 w-3.5 text-neutral-300 transition-colors group-hover:text-brand-blue" />
        </a>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-white pb-24">
      <section className="relative overflow-hidden border-b border-neutral-200 bg-neutral-50 px-4 py-10 md:px-12 md:py-12">
        <div className="pointer-events-none absolute -right-20 top-8 h-72 w-72 rounded-full opacity-[0.08] blur-3xl" style={{ backgroundColor: team.primaryColor }} />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex h-1" aria-hidden="true">
          <span className="w-1/2" style={{ backgroundColor: team.kits?.home ?? team.primaryColor }} />
          <span className="w-1/2" style={{ backgroundColor: team.kits?.away ?? team.secondaryColor ?? '#ffffff' }} />
        </div>
        <div className="relative mx-auto max-w-7xl">
          <div className="flex items-start justify-between gap-4">
            <BackButton
              fallbackTo={`/standings?season=${seasonId}`}
              className="inline-flex min-h-11 items-center text-xs font-bold text-neutral-500 hover:text-brand-black"
            />
            {socialLinks.length > 0 && renderSocialLinks(false)}
          </div>

          <div className="mt-6 flex min-w-0 items-start gap-5 sm:items-center sm:gap-7 md:mt-4">
            {team.logo && failedTeamLogo !== team.logo && (
              <div className="flex h-24 w-24 shrink-0 items-center justify-center md:h-28 md:w-28">
                <img
                  src={team.logo}
                  alt={`${team.name} 隊徽`}
                  className="max-h-full max-w-full object-contain"
                  onError={() => setFailedTeamLogo(team.logo)}
                />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="mb-2 text-[11px] font-black uppercase tracking-[0.18em] text-brand-blue sm:text-xs">
                {season.shortName} · {formatLeagueName(team.leagueId)}
              </p>
              <h1><AutoFitText text={team.name} minFontSize={16} lineHeight={0.98} className="font-display text-4xl font-extrabold tracking-tight text-brand-black sm:text-5xl xl:text-6xl" /></h1>
              {displayShortName && <p className="mt-2 text-xs font-semibold text-neutral-500">球隊簡稱 <span className="ml-2 font-bold text-brand-black">{displayShortName}</span></p>}
              {socialLinks.length > 0 && renderSocialLinks(true)}
            </div>
          </div>

          <dl className="mt-7 grid grid-cols-4 divide-x divide-neutral-300 border-t border-neutral-300 pt-4 md:mt-6">
            {[
              ['排名', seasonHasStarted && standing ? formatStatValue(standing.rank) : '-'],
              ['場次', seasonHasStarted && standing ? formatStatValue(standing.played) : '-'],
              ['進球', seasonHasStarted && standing ? formatStatValue(standing.gf) : '-'],
              ['積分', seasonHasStarted && standing ? formatStatValue(standing.points) : '-'],
            ].map(([label, value]) => <div key={label} className="px-2 text-center sm:px-6"><dt className="text-[10px] font-semibold tracking-wider text-neutral-500">{label}</dt><dd className="mt-1 font-display text-2xl font-black tabular-nums text-brand-black sm:text-3xl">{value}</dd></div>)}
          </dl>
        </div>
      </section>

      <main className="mx-auto max-w-7xl space-y-12 px-4 py-12 md:space-y-14 md:px-12 md:py-14">
        <section>
          <div className="mb-3 flex items-center border-b border-neutral-200 pb-3"><TrendingUp className="mr-2 h-5 w-5 text-brand-blue" /><h2 className="font-display text-2xl font-extrabold text-brand-black">排名走勢</h2></div>
          {rankHistory.length > 0 ? <TeamRankChart points={rankHistory} teamCount={activeLeagueTeams.length} /> : <p className="py-10 text-sm text-neutral-400">{seasonHasStarted ? '目前尚未形成完整輪次排名走勢' : '完成首輪正式比賽後更新排名走勢'}</p>}
        </section>

        <section>
          <div className="mb-5 flex items-center justify-between border-b border-neutral-200 pb-3"><div className="flex items-center"><CalendarDays className="mr-2 h-5 w-5 text-brand-blue" /><h2 className="font-display text-2xl font-extrabold text-brand-black">賽程與賽果</h2></div><span className="text-[11px] font-semibold text-neutral-500">共 {teamMatches.length} 場</span></div>
          {teamMatches.length > 0 ? <FullSchedule matches={teamMatches} teamMap={data.teamMap} leagueFilter="ALL" variant="team" onMatchClick={setSelectedMatchId} /> : <p className="py-10 text-sm text-neutral-400">此賽季尚未公布賽程</p>}
        </section>

        {team.staff && team.staff.length > 0 && (
          <section>
            <div className="mb-5 flex items-center border-b border-neutral-200 pb-3"><UserRound className="mr-2 h-5 w-5 text-brand-blue" /><h2 className="font-display text-2xl font-extrabold text-brand-black">隊職員</h2></div>
            <div className="grid gap-x-10 sm:grid-cols-2 xl:grid-cols-3">
              {team.staff.map((staff) => (
                <div key={`${staff.role}-${staff.name}`} className="grid min-h-16 grid-cols-[4rem_minmax(0,1fr)] items-center border-b border-neutral-100 py-3">
                  <span className="text-xs font-black tracking-wider text-brand-blue">{staff.role}</span>
                  <div className="min-w-0">
                    <p className="break-words text-sm font-bold text-brand-black">{staff.name}</p>
                    {staff.englishName && <p className="mt-0.5 break-words text-[10px] uppercase tracking-wider text-neutral-500">{staff.englishName}</p>}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        <section>
          <div className="mb-5 flex items-center border-b border-neutral-200 pb-3"><UserRound className="mr-2 h-5 w-5 text-brand-blue" /><h2 className="font-display text-2xl font-extrabold text-brand-black">球員名單</h2></div>
          {players.length > 0 ? <div className="grid gap-x-10 sm:grid-cols-2 xl:grid-cols-3">{players.map((player) => <Link key={player.id} to={`/players/${getPlayerIdentity(player)}?season=${seasonId}`} className="grid min-h-16 grid-cols-[3rem_minmax(0,1fr)] items-center border-b border-neutral-100 py-3 transition-colors hover:bg-neutral-50"><span className="font-display text-xl font-black tabular-nums text-brand-blue">{player.number}</span><div className="min-w-0"><p className="break-words text-sm font-bold text-brand-black">{player.name}</p>{player.englishName && <p className="mt-0.5 break-words text-[10px] uppercase tracking-wider text-neutral-500">{player.englishName}</p>}</div></Link>)}</div> : <p className="py-10 text-sm text-neutral-400">球員名單尚未公布</p>}
        </section>

        <section>
          <div className="mb-5 flex items-center border-b border-neutral-200 pb-3"><History className="mr-2 h-5 w-5 text-brand-blue" /><h2 className="font-display text-2xl font-extrabold text-brand-black">歷年賽事</h2></div>
          <div role="table" aria-label="歷年賽事">
            <div role="row" className="grid grid-cols-[64px_minmax(0,1fr)_76px_56px] items-center gap-3 pb-2 text-[10px] font-bold tracking-wider text-neutral-500 sm:grid-cols-[90px_minmax(0,1fr)_120px_80px]">
              <span role="columnheader">年度</span>
              <span role="columnheader">賽事</span>
              <span role="columnheader" className="text-center">成績</span>
              <span role="columnheader" className="text-right">紀錄</span>
            </div>
            <div className="divide-y divide-neutral-100">
              {competitionHistory.map((record) => (
                <div
                  role="row"
                  key={record.id}
                  className="grid grid-cols-[64px_minmax(0,1fr)_76px_56px] items-center gap-3 py-4 text-sm sm:grid-cols-[90px_minmax(0,1fr)_120px_80px]"
                >
                  <span role="cell" className="font-bold text-brand-black">{record.period}</span>
                  <span role="cell" className="min-w-0 break-words font-semibold text-neutral-500">
                    {record.href ? (
                      <Link to={record.href} className="font-bold text-brand-black hover:text-brand-blue">
                        {record.competition}
                      </Link>
                    ) : record.competition}
                  </span>
                  <span role="cell" className="break-words text-center font-bold text-brand-black">{record.result}</span>
                  <span role="cell" className="text-right font-bold text-brand-blue">{record.record}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {selectedMatchId && (
        <SeasonContext.Provider value={dialogSeasonContext}>
          <MatchDialog
            matchId={selectedMatchId}
            onClose={() => setSelectedMatchId(null)}
            onSelectMatch={setSelectedMatchId}
            navigationMatchIds={teamMatches.map((match) => match.id)}
          />
        </SeasonContext.Provider>
      )}
    </div>
  );
};

export default TeamPage;
