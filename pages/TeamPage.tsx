import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  CalendarDays,
  Facebook,
  Globe2,
  Instagram,
  TrendingUp,
  UserRound,
  Youtube,
} from 'lucide-react';
import { Link, Navigate, useParams } from 'react-router-dom';
import AutoFitText from '../components/AutoFitText';
import EmptyState from '../components/EmptyState';
import FullSchedule from '../components/FullSchedule';
import MatchDialog from '../components/MatchDialog';
import TeamRankChart, { type TeamRankPoint } from '../components/TeamRankChart';
import { CURRENT_SEASON_ID } from '../config/siteConfig';
import { useSeason } from '../hooks/useSeason';
import { calculateLeagueTable } from '../services/competitionEngine';
import { getSeasonData } from '../services/seasonDataJson';
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

const getTeamIdentity = (team: SeasonTeam): string => team.identityId ?? team.id;

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
      ? {
          platform: 'instagram',
          label: 'Instagram',
          href: links.instagram,
          icon: <Instagram className="h-4 w-4" aria-hidden="true" />,
        }
      : null,
    links.facebook && isSafeExternalUrl(links.facebook)
      ? {
          platform: 'facebook',
          label: 'Facebook',
          href: links.facebook,
          icon: <Facebook className="h-4 w-4" aria-hidden="true" />,
        }
      : null,
    links.youtube && isSafeExternalUrl(links.youtube)
      ? {
          platform: 'youtube',
          label: 'YouTube',
          href: links.youtube,
          icon: <Youtube className="h-4 w-4" aria-hidden="true" />,
        }
      : null,
    links.website && isSafeExternalUrl(links.website)
      ? {
          platform: 'website',
          label: '官方網站',
          href: links.website,
          icon: <Globe2 className="h-4 w-4" aria-hidden="true" />,
        }
      : null,
  ];

  return candidates.filter((item): item is TeamSocialLinkItem => item !== null);
};

const TeamPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const {
    activeSeason,
    activeSeasonId,
    seasonData,
    availableSeasons,
  } = useSeason();
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);

  const referenceTeam = useMemo(() => {
    if (!id) return undefined;

    for (const season of availableSeasons) {
      const candidate = getSeasonData(season.id).teams.find(
        (item) => item.id === id || item.identityId === id,
      );
      if (candidate) return candidate;
    }

    return undefined;
  }, [availableSeasons, id]);

  const identityId = referenceTeam ? getTeamIdentity(referenceTeam) : id;
  const team = useMemo(
    () => seasonData.teams.find(
      (candidate) =>
        candidate.id === id ||
        (identityId !== undefined && getTeamIdentity(candidate) === identityId),
    ),
    [id, identityId, seasonData.teams],
  );
  const displayTeam = team;
  const backLink = '/#teams';
  const backLabel = '返回參賽球隊';

  const socialLinks = useMemo(
    () => (displayTeam ? getTeamSocialLinks(displayTeam) : []),
    [displayTeam],
  );

  const players = useMemo(
    () =>
      team
        ? seasonData.players
            .filter((player) => player.teamId === team.id)
            .sort((a, b) => a.number - b.number || a.name.localeCompare(b.name, 'zh-TW'))
        : [],
    [seasonData.players, team],
  );

  const teamMatches = useMemo(
    () =>
      team
        ? seasonData.matches
            .filter((match) => match.homeTeamId === team.id || match.awayTeamId === team.id)
            .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
        : [],
    [seasonData.matches, team],
  );
  const teamMatchIds = useMemo(() => teamMatches.map((match) => match.id), [teamMatches]);

  useEffect(() => {
    setSelectedMatchId(null);
  }, [activeSeasonId, team?.id]);

  const standing = useMemo(() => {
    if (!team) return undefined;
    return calculateLeagueTable({
      league: team.leagueId,
      teams: seasonData.teams,
      matches: seasonData.matches,
      matchEvents: seasonData.matchEvents,
      rules: activeSeason.rules,
      leagueConfig: activeSeason.leagues[team.leagueId],
    }).find((row) => row.teamId === team.id);
  }, [activeSeason.leagues, activeSeason.rules, seasonData.matchEvents, seasonData.matches, seasonData.teams, team]);

  const activeLeagueTeams = useMemo(
    () =>
      team
        ? seasonData.teams.filter(
            (item) => item.leagueId === team.leagueId && item.competitionStatus !== 'WITHDRAWN',
          )
        : [],
    [seasonData.teams, team],
  );
  const leagueTeamCount = activeLeagueTeams.length;
  const activeLeagueTeamIds = useMemo(
    () => new Set(activeLeagueTeams.map((item) => item.id)),
    [activeLeagueTeams],
  );
  const eligibleLeagueMatches = useMemo(
    () =>
      team
        ? seasonData.matches.filter(
            (match) =>
              match.league === team.leagueId &&
              activeLeagueTeamIds.has(match.homeTeamId) &&
              activeLeagueTeamIds.has(match.awayTeamId),
          )
        : [],
    [activeLeagueTeamIds, seasonData.matches, team],
  );
  const seasonHasStarted = eligibleLeagueMatches.some(isResolvedMatch);

  const rankHistory = useMemo<TeamRankPoint[]>(() => {
    if (!team || leagueTeamCount < 2) return [];

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

    const expectedMatchesPerRound = Math.max(1, Math.floor(leagueTeamCount / 2));
    const completedRounds = [...buckets.values()]
      .filter(
        (bucket) =>
          bucket.matches.length >= expectedMatchesPerRound &&
          bucket.matches.every(isResolvedMatch),
      )
      .sort((a, b) => a.firstKickoff - b.firstKickoff);

    const completedMatches: Match[] = [];
    return completedRounds.flatMap((bucket) => {
      completedMatches.push(...bucket.matches);
      const row = calculateLeagueTable({
        league: team.leagueId,
        teams: seasonData.teams,
        matches: completedMatches,
        matchEvents: seasonData.matchEvents,
        rules: activeSeason.rules,
        leagueConfig: activeSeason.leagues[team.leagueId],
      }).find((standingRow) => standingRow.teamId === team.id);

      return row
        ? [{ round: bucket.round, rank: row.rank, points: row.points, played: row.played }]
        : [];
    });
  }, [activeSeason.leagues, activeSeason.rules, eligibleLeagueMatches, leagueTeamCount, seasonData.matchEvents, seasonData.teams, team]);

  if (activeSeasonId !== CURRENT_SEASON_ID) {
    return <Navigate to={`/standings?season=${activeSeasonId}`} replace />;
  }

  if (!displayTeam) {
    return (
      <div className="min-h-[75vh] bg-white px-4 py-16 md:py-28">
        <div className="mx-auto max-w-4xl">
          <EmptyState title="找不到此球隊" description="此球隊未參加目前營運賽季或網址已失效" />
          <div className="mt-8 text-center">
            <Link to={backLink} className="text-sm font-bold text-brand-blue">
              {backLabel}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const leagueConfig = activeSeason.leagues[displayTeam.leagueId];
  const leagueLabel = leagueConfig?.displayName ?? displayTeam.leagueId;
  const rankValue = seasonHasStarted && standing ? standing.rank : '—';
  const playedValue = standing?.played ?? 0;
  const pointsValue = standing?.points ?? 0;
  const goalsValue = standing?.gf ?? 0;

  return (
    <div className="min-h-screen overflow-x-hidden bg-white pb-0 md:pb-24">
      <section className="relative overflow-hidden border-b border-neutral-200 bg-neutral-50 px-4 py-10 text-brand-black md:px-12 md:py-16 lg:py-20">
        <div
          className="pointer-events-none absolute -right-20 top-8 h-64 w-64 rounded-full opacity-[0.08] blur-3xl md:h-96 md:w-96"
          style={{ backgroundColor: displayTeam.primaryColor }}
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute bottom-0 left-0 h-0.5 w-full opacity-70"
          style={{ backgroundColor: displayTeam.primaryColor }}
          aria-hidden="true"
        />

        <div className="relative mx-auto max-w-7xl">
          <div className="mb-8 md:mb-12">
            <Link
              to={backLink}
              className="inline-flex min-h-11 items-center text-[11px] font-bold uppercase tracking-[0.12em] text-neutral-500 transition-colors hover:text-brand-black"
            >
              <ArrowLeft className="mr-2 h-4 w-4 shrink-0" />
              {backLabel}
            </Link>
          </div>

          <div className="flex min-w-0 items-start gap-5 sm:items-center sm:gap-8">
            <div className="relative flex h-24 w-24 shrink-0 items-center justify-center sm:h-32 sm:w-32 xl:h-36 xl:w-36">
              <div
                className="pointer-events-none absolute inset-2 rounded-full opacity-10"
                style={{ backgroundColor: displayTeam.primaryColor }}
                aria-hidden="true"
              />
              <img
                src={displayTeam.logo}
                alt={`${displayTeam.name} 隊徽`}
                className="relative max-h-full max-w-full object-contain drop-shadow-[0_10px_22px_rgba(0,0,0,0.14)]"
              />
            </div>
            <div className="min-w-0 flex-1 pt-1 sm:pt-0">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-neutral-500 sm:text-xs">
                {leagueLabel} · {activeSeason.shortName} 賽季
              </p>
              <h1 className="mt-3 min-w-0">
                <AutoFitText
                  text={displayTeam.name}
                  minFontSize={16}
                  lineHeight={0.98}
                  className="font-display text-4xl font-black tracking-tight text-brand-black sm:text-5xl xl:text-6xl"
                />
              </h1>
              <div className="mt-3 flex min-w-0 items-baseline gap-2 text-xs font-bold text-neutral-500 sm:text-sm">
                <span className="shrink-0">球隊簡稱</span>
                <div className="min-w-0 flex-1">
                  <AutoFitText
                    text={displayTeam.shortName}
                    minFontSize={7}
                    lineHeight={1.2}
                    className="text-xs font-bold text-brand-black sm:text-sm"
                  />
                </div>
              </div>
              {socialLinks.length > 0 && (
                <div className="mt-4 flex flex-wrap items-center gap-2" aria-label={`${displayTeam.name} 社群連結`}>
                  {socialLinks.map((link) => (
                    <a
                      key={link.platform}
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={link.label}
                      aria-label={`前往 ${displayTeam.name} ${link.label}`}
                      className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-500 transition-colors hover:border-brand-blue hover:text-brand-blue focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-2"
                    >
                      {link.icon}
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>

          <dl className="mt-9 grid grid-cols-4 divide-x divide-neutral-300/80 border-t border-neutral-300/80 pt-5 sm:mt-10 sm:pt-6">
            <div className="px-2 text-center sm:px-6">
              <dt className="text-[10px] font-bold tracking-widest text-neutral-500">排名</dt>
              <dd className="mt-1.5 font-display text-2xl font-black tabular-nums text-brand-black sm:text-3xl">
                {rankValue}
              </dd>
            </div>
            <div className="px-2 text-center sm:px-6">
              <dt className="text-[10px] font-bold tracking-widest text-neutral-500">場次</dt>
              <dd className="mt-1.5 font-display text-2xl font-black tabular-nums text-brand-black sm:text-3xl">
                {playedValue}
              </dd>
            </div>
            <div className="px-2 text-center sm:px-6">
              <dt className="text-[10px] font-bold tracking-widest text-neutral-500">進球</dt>
              <dd className="mt-1.5 font-display text-2xl font-black tabular-nums text-brand-black sm:text-3xl">
                {goalsValue}
              </dd>
            </div>
            <div className="px-2 text-center sm:px-6">
              <dt className="text-[10px] font-bold tracking-widest text-neutral-500">積分</dt>
              <dd className="mt-1.5 font-display text-2xl font-black tabular-nums text-brand-blue sm:text-3xl">
                {pointsValue}
              </dd>
            </div>
          </dl>
        </div>
      </section>

      <main className="mx-auto max-w-7xl space-y-16 px-4 py-12 md:px-12 md:py-16 lg:space-y-20">
        {!seasonHasStarted && (
          <section className="border-y border-neutral-200 py-6">
            <p className="font-display text-xl font-black text-brand-black">賽季尚未開始</p>
            <p className="mt-2 text-sm leading-6 text-neutral-500">
              完成首輪正式比賽後，排名走勢與比賽紀錄將自動更新
            </p>
          </section>
        )}

        <section aria-labelledby="team-rank-heading">
          <div className="mb-3 flex items-end justify-between gap-4 border-b border-neutral-200 pb-3">
            <div className="flex min-w-0 items-center">
              <TrendingUp className="mr-2 h-5 w-5 shrink-0 text-brand-blue" aria-hidden="true" />
              <h2 id="team-rank-heading" className="font-display text-2xl font-black uppercase text-brand-black">
                排名走勢
              </h2>
            </div>
            <span className="shrink-0 text-[11px] font-bold text-neutral-400">
              {activeSeason.shortName} · {displayTeam.leagueId}
            </span>
          </div>
          {rankHistory.length > 0 ? (
            <TeamRankChart points={rankHistory} teamCount={leagueTeamCount} />
          ) : (
            <p className="border-y border-neutral-100 py-10 text-center text-sm text-neutral-400">
              完成首輪比賽後更新排名走勢
            </p>
          )}
        </section>

        <section aria-labelledby="team-schedule-heading">
          <div className="mb-5 flex items-end justify-between gap-4 border-b border-neutral-200 pb-3">
            <div className="flex min-w-0 items-center">
              <CalendarDays className="mr-2 h-5 w-5 shrink-0 text-brand-blue" aria-hidden="true" />
              <h2 id="team-schedule-heading" className="font-display text-2xl font-black uppercase text-brand-black">
                賽程
              </h2>
            </div>
            <span className="shrink-0 text-[11px] font-bold text-neutral-400">共 {teamMatches.length} 場</span>
          </div>
          {teamMatches.length > 0 ? (
            <FullSchedule
              matches={teamMatches}
              teamMap={seasonData.teamMap}
              leagueFilter="ALL"
              variant="team"
              onMatchClick={setSelectedMatchId}
            />
          ) : (
            <div className="border-y border-neutral-100 py-12 text-center">
              <p className="text-sm font-bold text-neutral-500">此球隊目前尚未公布賽程</p>
              <p className="mt-2 text-xs text-neutral-400">賽程公布後會在此顯示完整比賽紀錄</p>
            </div>
          )}
        </section>

        <section aria-labelledby="team-squad-heading">
          <div className="mb-5 flex items-center border-b border-neutral-200 pb-3">
            <UserRound className="mr-2 h-5 w-5 shrink-0 text-brand-blue" aria-hidden="true" />
            <h2 id="team-squad-heading" className="font-display text-2xl font-black uppercase text-brand-black">
              球員名單
            </h2>
          </div>
          {players.length > 0 ? (
            <div className="grid gap-x-10 sm:grid-cols-2 xl:grid-cols-3">
              {players.map((player) => (
                <div key={player.id} className="grid min-h-16 grid-cols-[3rem_minmax(0,1fr)] items-center border-b border-neutral-100 py-3">
                  <span className="font-display text-xl font-black tabular-nums text-brand-blue">
                    {player.number}
                  </span>
                  <div className="min-w-0">
                    <p className="break-words text-sm font-bold leading-5 text-brand-black">{player.name}</p>
                    {player.englishName && (
                      <p className="mt-0.5 break-words text-[10px] uppercase leading-4 tracking-wider text-neutral-400">
                        {player.englishName}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="border-y border-neutral-100 py-10 text-sm text-neutral-400">球員名單尚未公布</p>
          )}
        </section>
      </main>

      <MatchDialog
        matchId={selectedMatchId}
        onClose={() => setSelectedMatchId(null)}
        onSelectMatch={setSelectedMatchId}
        navigationMatchIds={teamMatchIds}
      />
    </div>
  );
};

export default TeamPage;
