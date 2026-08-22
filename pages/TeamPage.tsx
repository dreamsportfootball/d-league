import React, { useMemo, useState } from 'react';
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
import MatchDialog from '../components/MatchDialog';
import TeamRankChart, { type TeamRankPoint } from '../components/TeamRankChart';
import { isSeasonId } from '../config/seasons';
import { SeasonContext } from '../contexts/SeasonContext';
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
  displayLabel: string;
  href: string;
  icon: React.ReactNode;
}

const isResolvedMatch = (match: Match): boolean =>
  match.status === MatchStatus.FINISHED ||
  match.resultType === 'VOID' ||
  (match.homeScore !== null && match.awayScore !== null);

const formatLeagueName = (leagueId: string): string => {
  const match = /^L(\d+)$/i.exec(leagueId);
  return match ? `LEAGUE ${match[1]}` : leagueId;
};

const isSafeExternalUrl = (value: string): boolean => {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
};

const getInstagramHandle = (href: string): string => {
  try {
    const url = new URL(href);
    const handle = url.pathname.split('/').filter(Boolean)[0];
    return handle ? `@${handle}` : 'Instagram';
  } catch {
    return 'Instagram';
  }
};

const isLightColor = (hex: string): boolean => {
  const match = /^#([0-9a-f]{6})$/i.exec(hex.trim());
  if (!match) return false;

  const value = match[1];
  const channels = [0, 2, 4].map((offset) => parseInt(value.slice(offset, offset + 2), 16) / 255);
  const linear = channels.map((channel) =>
    channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4,
  );
  const luminance = 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
  return luminance > 0.52;
};

const getTeamSocialLinks = (team: SeasonTeam): TeamSocialLinkItem[] => {
  const links = team.socialLinks;
  if (!links) return [];

  const candidates: Array<TeamSocialLinkItem | null> = [
    links.instagram && isSafeExternalUrl(links.instagram)
      ? {
          platform: 'instagram',
          label: 'Instagram',
          displayLabel: getInstagramHandle(links.instagram),
          href: links.instagram,
          icon: <Instagram className="h-4 w-4" />,
        }
      : null,
    links.facebook && isSafeExternalUrl(links.facebook)
      ? {
          platform: 'facebook',
          label: 'Facebook',
          displayLabel: 'Facebook',
          href: links.facebook,
          icon: <Facebook className="h-4 w-4" />,
        }
      : null,
    links.youtube && isSafeExternalUrl(links.youtube)
      ? {
          platform: 'youtube',
          label: 'YouTube',
          displayLabel: 'YouTube',
          href: links.youtube,
          icon: <Youtube className="h-4 w-4" />,
        }
      : null,
    links.website && isSafeExternalUrl(links.website)
      ? {
          platform: 'website',
          label: '官方網站',
          displayLabel: '官方網站',
          href: links.website,
          icon: <Globe2 className="h-4 w-4" />,
        }
      : null,
  ];

  return candidates.filter((item): item is TeamSocialLinkItem => item !== null);
};

const TeamPage: React.FC = () => {
  const { id = '' } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const { availableSeasons } = useSeason();
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const requestedSeason = searchParams.get('season');
  const history = useMemo(() => getTeamHistory(id), [id]);

  if (history.length === 0) {
    return (
      <div className="min-h-[75vh] bg-white px-4 py-16 md:py-28">
        <div className="mx-auto max-w-5xl">
          <EmptyState title="找不到此球隊" description="此球隊不存在、尚未登錄，或網址已失效" />
          <div className="mt-8 text-center">
            <Link to="/standings" className="text-sm font-bold text-brand-blue">返回積分榜</Link>
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
  const displayShortName = team.shortName?.trim() && team.shortName.trim() !== team.name.trim()
    ? team.shortName.trim()
    : '';
  const heroUsesDarkText = isLightColor(team.primaryColor);
  const heroTextClass = heroUsesDarkText ? 'text-brand-black' : 'text-white';
  const heroMutedClass = heroUsesDarkText ? 'text-black/60' : 'text-white/70';
  const heroBackClass = heroUsesDarkText
    ? 'text-black/65 hover:text-brand-black'
    : 'text-white/75 hover:text-white';
  const heroSocialClass = heroUsesDarkText
    ? 'border-black/20 bg-white/25 text-brand-black hover:bg-black/10'
    : 'border-white/25 bg-black/10 text-white hover:bg-white/10';
  const heroSwatchBorderClass = heroUsesDarkText ? 'border-black/20' : 'border-white/40';

  const players = data.players
    .filter((player) => player.teamId === team.id)
    .sort((a, b) => a.number - b.number || a.name.localeCompare(b.name, 'zh-TW'));
  const teamMatches = data.matches
    .filter((match) => match.homeTeamId === team.id || match.awayTeamId === team.id)
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
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
    <div className={mobile ? 'mt-5 flex flex-wrap gap-2 sm:hidden' : 'hidden flex-wrap justify-end gap-2 sm:flex'}>
      {socialLinks.map((link) => (
        <a
          key={link.platform}
          href={link.href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`前往 ${team.name} ${link.label}`}
          className={`inline-flex min-h-11 max-w-full items-center gap-2 rounded-lg border px-3.5 text-xs font-bold transition-colors ${heroSocialClass}`}
        >
          {link.icon}
          <span>{link.label}</span>
          {link.displayLabel !== link.label && (
            <span className={heroMutedClass}>{link.displayLabel}</span>
          )}
        </a>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-white pb-24">
      <section
        className="relative overflow-hidden px-4 py-8 md:px-12 md:py-10"
        style={{ backgroundColor: team.primaryColor }}
      >
        <div
          className="pointer-events-none absolute -right-16 -top-32 h-[28rem] w-32 rotate-[-38deg] opacity-[0.13]"
          style={{ backgroundColor: team.secondaryColor ?? '#ffffff' }}
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute right-40 top-20 h-80 w-20 rotate-[-38deg] opacity-[0.08]"
          style={{ backgroundColor: team.secondaryColor ?? '#ffffff' }}
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-1"
          style={{ backgroundColor: team.secondaryColor ?? '#ffffff' }}
          aria-hidden="true"
        />

        <div className="relative mx-auto max-w-7xl">
          <div className="flex items-start justify-between gap-4">
            <Link
              to={`/standings?season=${seasonId}`}
              className={`inline-flex min-h-11 items-center text-xs font-bold transition-colors ${heroBackClass}`}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              返回積分榜
            </Link>
            {socialLinks.length > 0 && renderSocialLinks(false)}
          </div>

          <div className="mt-5 flex min-w-0 items-center gap-4 sm:mt-6 sm:gap-7 lg:gap-9">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-lg bg-white/95 p-2.5 ring-1 ring-black/10 sm:h-28 sm:w-28 sm:p-3 lg:h-32 lg:w-32">
              <img src={team.logo} alt={`${team.name} 隊徽`} className="max-h-full max-w-full object-contain" />
            </div>
            <div className="min-w-0 flex-1">
              <p className={`text-[10px] font-bold uppercase tracking-[0.16em] sm:text-xs ${heroMutedClass}`}>
                {team.leagueId} · {season.shortName}
              </p>
              <h1 className="mt-2 sm:mt-3">
                <AutoFitText
                  text={team.name}
                  minFontSize={18}
                  lineHeight={0.98}
                  className={`font-display text-3xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl ${heroTextClass}`}
                />
              </h1>
              {displayShortName && (
                <p className={`mt-2 text-xs font-semibold ${heroMutedClass}`}>
                  球隊簡稱 <span className={`ml-2 font-bold ${heroTextClass}`}>{displayShortName}</span>
                </p>
              )}

              {team.kits && (
                <div className={`mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs font-semibold ${heroMutedClass}`}>
                  {[
                    ['主場', team.kits.home],
                    ['客場', team.kits.away],
                  ].map(([label, color]) => (
                    <div key={label} className="flex items-center gap-2">
                      <span
                        className={`h-5 w-5 shrink-0 border ${heroSwatchBorderClass}`}
                        style={{ backgroundColor: color }}
                        aria-hidden="true"
                      />
                      <span>{label}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {socialLinks.length > 0 && renderSocialLinks(true)}
        </div>
      </section>

      <section className="border-b border-neutral-200 bg-white px-4 md:px-12">
        <div className="mx-auto max-w-7xl">
          <dl className="grid grid-cols-4 divide-x divide-neutral-200 py-5 sm:py-6">
            {[
              ['排名', seasonHasStarted && standing ? standing.rank : '—'],
              ['場次', seasonHasStarted && standing ? standing.played : '—'],
              ['進球', seasonHasStarted && standing ? standing.gf : '—'],
              ['積分', seasonHasStarted && standing ? standing.points : '—'],
            ].map(([label, value]) => (
              <div key={label} className="px-2 text-center sm:px-6">
                <dt className="text-[9px] font-semibold tracking-wider text-neutral-400 sm:text-[10px]">{label}</dt>
                <dd className="mt-1 font-display text-2xl font-black tabular-nums text-brand-black sm:text-3xl">{value}</dd>
              </div>
            ))}
          </dl>

          {history.length > 1 && (
            <div className="flex flex-wrap gap-2 border-t border-neutral-200 py-4">
              {history.map((record) => (
                <Link
                  key={record.seasonId}
                  to={`/teams/${identityId}?season=${record.seasonId}`}
                  className={`border px-4 py-2 text-xs font-bold ${record.seasonId === seasonId ? 'border-brand-blue bg-brand-blue text-white' : 'border-neutral-200 bg-white text-neutral-500 hover:text-brand-blue'}`}
                >
                  {record.season.shortName}
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      <main className="mx-auto max-w-7xl space-y-12 px-4 py-12 md:space-y-14 md:px-12 md:py-14">
        <section>
          <div className="mb-3 flex items-center border-b border-neutral-200 pb-3">
            <TrendingUp className="mr-2 h-5 w-5 text-brand-blue" />
            <h2 className="font-display text-2xl font-extrabold text-brand-black">排名走勢</h2>
          </div>
          {rankHistory.length > 0 ? (
            <TeamRankChart points={rankHistory} teamCount={activeLeagueTeams.length} />
          ) : (
            <p className="py-10 text-sm text-neutral-400">
              {seasonHasStarted ? '目前尚未形成完整輪次排名走勢' : '完成首輪正式比賽後更新排名走勢'}
            </p>
          )}
        </section>

        <section>
          <div className="mb-5 flex items-center justify-between border-b border-neutral-200 pb-3">
            <div className="flex items-center">
              <CalendarDays className="mr-2 h-5 w-5 text-brand-blue" />
              <h2 className="font-display text-2xl font-extrabold text-brand-black">賽程與賽果</h2>
            </div>
            <span className="text-[11px] font-semibold text-neutral-400">共 {teamMatches.length} 場</span>
          </div>
          {teamMatches.length > 0 ? (
            <FullSchedule
              matches={teamMatches}
              teamMap={data.teamMap}
              leagueFilter="ALL"
              variant="team"
              onMatchClick={setSelectedMatchId}
            />
          ) : (
            <p className="py-10 text-sm text-neutral-400">此賽季尚未公布賽程</p>
          )}
        </section>

        {team.staff && team.staff.length > 0 && (
          <section>
            <div className="mb-5 flex items-center border-b border-neutral-200 pb-3">
              <UserRound className="mr-2 h-5 w-5 text-brand-blue" />
              <h2 className="font-display text-2xl font-extrabold text-brand-black">隊職員</h2>
            </div>
            <div className="grid gap-x-10 sm:grid-cols-2 xl:grid-cols-3">
              {team.staff.map((staff) => (
                <div
                  key={`${staff.role}-${staff.name}`}
                  className="grid min-h-16 grid-cols-[4rem_minmax(0,1fr)] items-center border-b border-neutral-100 py-3"
                >
                  <span className="text-xs font-black tracking-wider text-brand-blue">{staff.role}</span>
                  <div className="min-w-0">
                    <p className="break-words text-sm font-bold text-brand-black">{staff.name}</p>
                    {staff.englishName && (
                      <p className="mt-0.5 break-words text-[10px] uppercase tracking-wider text-neutral-400">
                        {staff.englishName}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        <section>
          <div className="mb-5 flex items-center border-b border-neutral-200 pb-3">
            <UserRound className="mr-2 h-5 w-5 text-brand-blue" />
            <h2 className="font-display text-2xl font-extrabold text-brand-black">球員名單</h2>
          </div>
          {players.length > 0 ? (
            <div className="grid gap-x-6 sm:grid-cols-2 xl:grid-cols-3">
              {players.map((player) => (
                <Link
                  key={player.id}
                  to={`/players/${getPlayerIdentity(player)}?season=${seasonId}`}
                  className="group flex min-h-20 items-center gap-4 border-b border-neutral-100 py-4 transition-colors hover:border-neutral-200"
                >
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center bg-neutral-100 font-display text-lg font-black tabular-nums text-brand-blue transition-colors group-hover:bg-brand-blue group-hover:text-white">
                    {player.number}
                  </span>
                  <div className="min-w-0">
                    <p className="break-words text-sm font-bold text-brand-black group-hover:text-brand-blue">{player.name}</p>
                    {player.englishName && (
                      <p className="mt-1 break-words text-[10px] uppercase tracking-wider text-neutral-400">{player.englishName}</p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="py-10 text-sm text-neutral-400">球員名單尚未公布</p>
          )}
        </section>

        <section>
          <div className="mb-5 flex items-center border-b border-neutral-200 pb-3">
            <History className="mr-2 h-5 w-5 text-brand-blue" />
            <h2 className="font-display text-2xl font-extrabold text-brand-black">歷年 D LEAGUE</h2>
          </div>
          <div className="divide-y divide-neutral-100">
            {history.map((record) => {
              const row = calculateLeagueTable({
                league: record.team.leagueId,
                teams: record.data.teams,
                matches: record.data.matches,
                matchEvents: record.data.matchEvents,
                rules: record.season.rules,
                leagueConfig: record.season.leagues[record.team.leagueId],
              }).find((item) => item.teamId === record.team.id);
              return (
                <div
                  key={record.seasonId}
                  className="grid grid-cols-[90px_minmax(0,1fr)_72px_72px] items-center gap-3 py-4 text-sm"
                >
                  <span className="font-bold text-brand-black">{record.season.shortName}</span>
                  <span className="font-semibold text-neutral-500">{formatLeagueName(record.team.leagueId)}</span>
                  <span className="text-center font-bold text-brand-black">{row?.played ? `#${row.rank}` : '—'}</span>
                  <span className="text-right font-bold text-brand-blue">{row?.played ? `${row.points} 分` : '—'}</span>
                </div>
              );
            })}
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
