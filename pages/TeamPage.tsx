import React, { useMemo } from 'react';
import {
  ArrowLeft,
  CalendarDays,
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
import EmptyState from '../components/EmptyState';
import FullSchedule from '../components/FullSchedule';
import TeamRankChart, { type TeamRankPoint } from '../components/TeamRankChart';
import { isSeasonId } from '../config/seasons';
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

const isResolvedMatch = (match: Match): boolean =>
  match.status === MatchStatus.FINISHED ||
  match.resultType === 'VOID' ||
  (match.homeScore !== null && match.awayScore !== null);

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
  const requestedSeason = searchParams.get('season');
  const history = useMemo(() => getTeamHistory(id), [id]);

  if (history.length === 0) {
    return (
      <div className="min-h-[75vh] bg-white px-4 py-16 md:py-28">
        <div className="mx-auto max-w-5xl">
          <EmptyState title="找不到此球隊" description="此球隊不存在、尚未登錄，或網址已失效" />
          <div className="mt-8 text-center">
            <Link to="/standings" className="text-sm font-black text-brand-blue">返回積分榜</Link>
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
  const identityId = getTeamIdentity(team);
  const socialLinks = getTeamSocialLinks(team);
  const players = data.players
    .filter((player) => player.teamId === team.id)
    .sort((a, b) => a.number - b.number || a.name.localeCompare(b.name, 'zh-TW'));
  const teamMatches = data.matches
    .filter((match) => match.homeTeamId === team.id || match.awayTeamId === team.id)
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

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

  return (
    <div className="min-h-screen bg-white pb-24">
      <section className="relative overflow-hidden border-b border-neutral-200 bg-neutral-50 px-4 py-10 md:px-12 md:py-16">
        <div className="pointer-events-none absolute -right-20 top-8 h-72 w-72 rounded-full opacity-[0.08] blur-3xl" style={{ backgroundColor: team.primaryColor }} />
        <div className="relative mx-auto max-w-7xl">
          <Link to={`/standings?season=${seasonId}`} className="inline-flex min-h-11 items-center text-xs font-black text-neutral-500 hover:text-brand-black"><ArrowLeft className="mr-2 h-4 w-4" />返回積分榜</Link>

          <div className="mt-6 flex min-w-0 items-start gap-5 sm:items-center sm:gap-8">
            <div className="flex h-24 w-24 shrink-0 items-center justify-center sm:h-32 sm:w-32"><img src={team.logo} alt={`${team.name} 隊徽`} className="max-h-full max-w-full object-contain" /></div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-500">{team.leagueId} · {season.shortName}</p>
              <h1 className="mt-3"><AutoFitText text={team.name} minFontSize={16} lineHeight={0.98} className="font-display text-4xl font-black tracking-tight text-brand-black sm:text-5xl xl:text-6xl" /></h1>
              <p className="mt-2 text-xs font-bold text-neutral-500">球隊簡稱 <span className="ml-2 text-brand-black">{team.shortName}</span></p>
              {socialLinks.length > 0 && <div className="mt-4 flex flex-wrap gap-2">{socialLinks.map((link) => <a key={link.platform} href={link.href} target="_blank" rel="noopener noreferrer" aria-label={`前往 ${team.name} ${link.label}`} className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-500 hover:border-brand-blue hover:text-brand-blue">{link.icon}</a>)}</div>}
            </div>
          </div>

          {history.length > 1 && <div className="mt-7 flex flex-wrap gap-2 border-t border-neutral-200 pt-5">{history.map((record) => <Link key={record.seasonId} to={`/teams/${identityId}?season=${record.seasonId}`} className={`rounded-full border px-4 py-2 text-xs font-black ${record.seasonId === seasonId ? 'border-brand-blue bg-brand-blue text-white' : 'border-neutral-200 bg-white text-neutral-500 hover:text-brand-blue'}`}>{record.season.shortName}</Link>)}</div>}

          <dl className="mt-8 grid grid-cols-4 divide-x divide-neutral-300 border-t border-neutral-300 pt-5">
            {[
              ['排名', seasonHasStarted && standing ? standing.rank : '—'],
              ['場次', standing?.played ?? 0],
              ['進球', standing?.gf ?? 0],
              ['積分', standing?.points ?? 0],
            ].map(([label, value]) => <div key={label} className="px-2 text-center sm:px-6"><dt className="text-[10px] font-black tracking-wider text-neutral-500">{label}</dt><dd className="mt-1 font-display text-2xl font-black tabular-nums text-brand-black sm:text-3xl">{value}</dd></div>)}
          </dl>
        </div>
      </section>

      <main className="mx-auto max-w-7xl space-y-16 px-4 py-12 md:px-12 md:py-16">
        <section>
          <div className="mb-3 flex items-center border-b border-neutral-200 pb-3"><TrendingUp className="mr-2 h-5 w-5 text-brand-blue" /><h2 className="font-display text-2xl font-black text-brand-black">排名走勢</h2></div>
          {rankHistory.length > 0 ? <TeamRankChart points={rankHistory} teamCount={activeLeagueTeams.length} /> : <p className="py-10 text-sm text-neutral-400">{seasonHasStarted ? '目前尚未形成完整輪次排名走勢' : '完成首輪正式比賽後更新排名走勢'}</p>}
        </section>

        <section>
          <div className="mb-5 flex items-center justify-between border-b border-neutral-200 pb-3"><div className="flex items-center"><CalendarDays className="mr-2 h-5 w-5 text-brand-blue" /><h2 className="font-display text-2xl font-black text-brand-black">賽程與賽果</h2></div><span className="text-[11px] font-bold text-neutral-400">共 {teamMatches.length} 場</span></div>
          {teamMatches.length > 0 ? <FullSchedule matches={teamMatches} teamMap={data.teamMap} leagueFilter="ALL" variant="team" onMatchClick={() => undefined} /> : <p className="py-10 text-sm text-neutral-400">此賽季尚未公布賽程</p>}
        </section>

        <section>
          <div className="mb-5 flex items-center border-b border-neutral-200 pb-3"><UserRound className="mr-2 h-5 w-5 text-brand-blue" /><h2 className="font-display text-2xl font-black text-brand-black">球員名單</h2></div>
          {players.length > 0 ? <div className="grid gap-x-10 sm:grid-cols-2 xl:grid-cols-3">{players.map((player) => <Link key={player.id} to={`/players/${getPlayerIdentity(player)}?season=${seasonId}`} className="grid min-h-16 grid-cols-[3rem_minmax(0,1fr)] items-center border-b border-neutral-100 py-3 transition-colors hover:bg-neutral-50"><span className="font-display text-xl font-black tabular-nums text-brand-blue">{player.number}</span><div className="min-w-0"><p className="break-words text-sm font-black text-brand-black">{player.name}</p>{player.englishName && <p className="mt-0.5 break-words text-[10px] uppercase tracking-wider text-neutral-400">{player.englishName}</p>}</div></Link>)}</div> : <p className="py-10 text-sm text-neutral-400">球員名單尚未公布</p>}
        </section>

        <section>
          <div className="mb-5 flex items-center border-b border-neutral-200 pb-3"><History className="mr-2 h-5 w-5 text-brand-blue" /><h2 className="font-display text-2xl font-black text-brand-black">歷年 D LEAGUE</h2></div>
          <div className="divide-y divide-neutral-100">{history.map((record) => {
            const row = calculateLeagueTable({ league: record.team.leagueId, teams: record.data.teams, matches: record.data.matches, matchEvents: record.data.matchEvents, rules: record.season.rules, leagueConfig: record.season.leagues[record.team.leagueId] }).find((item) => item.teamId === record.team.id);
            return <Link key={record.seasonId} to={`/teams/${identityId}?season=${record.seasonId}`} className="grid grid-cols-[90px_minmax(0,1fr)_72px_72px] items-center gap-3 py-4 text-sm"><span className="font-black text-brand-black">{record.season.shortName}</span><span className="font-bold text-neutral-500">{record.team.leagueId}</span><span className="text-center font-black text-brand-black">{row?.played ? `#${row.rank}` : '—'}</span><span className="text-right font-black text-brand-blue">{row?.points ?? 0} 分</span></Link>;
          })}</div>
        </section>

        <div className="border-t border-neutral-200 pt-8 text-xs leading-6 text-neutral-400">永久球隊識別碼：<span className="font-mono">{identityId}</span></div>
      </main>
    </div>
  );
};

export default TeamPage;
