import React, { useMemo } from 'react';
import {
  ArrowDown,
  CalendarDays,
  Camera,
  MapPin,
  Trophy,
  UsersRound,
} from 'lucide-react';
import {
  CUP_EVENT,
  CUP_GROUP_RANKING_RULE_LABEL,
  CUP_GROUP_STANDINGS,
  CUP_MATCHES,
  CUP_TEAMS,
  type CupGroup,
  type CupGroupStanding,
  type CupMatch,
  type CupTeam,
} from '../cupData';
import { formatTaipeiDate, formatTaipeiTime } from '../utils/dateFormat';

const CUP_RED = '#8f1d1d';
const CUP_GOLD = '#c8a45a';

const assetUrl = (path: string): string =>
  `${import.meta.env.BASE_URL}${path.replace(/^\/+/, '').replace(/^d-league\//, '')}`;

const getMatch = (matchId: number): CupMatch | undefined =>
  CUP_MATCHES.find((match) => match.id === matchId);

const getTeam = (teamId: string): CupTeam | undefined => CUP_TEAMS[teamId];

const getWinnerTeamId = (match?: CupMatch): string | null => {
  if (!match || match.homeScore === undefined || match.awayScore === undefined) return null;
  if (match.homeScore > match.awayScore) return match.homeTeamId;
  if (match.awayScore > match.homeScore) return match.awayTeamId;
  if (match.homePenalty !== undefined && match.awayPenalty !== undefined) {
    return match.homePenalty > match.awayPenalty ? match.homeTeamId : match.awayTeamId;
  }
  return null;
};

const getLoserTeamId = (match?: CupMatch): string | null => {
  const winnerId = getWinnerTeamId(match);
  if (!match || !winnerId) return null;
  return winnerId === match.homeTeamId ? match.awayTeamId : match.homeTeamId;
};

const getScoreLabel = (match: CupMatch): string => {
  if (match.homeScore === undefined || match.awayScore === undefined) return 'VS';
  return `${match.homeScore} - ${match.awayScore}`;
};

const getPenaltyLabel = (match: CupMatch): string | null =>
  match.homePenalty !== undefined && match.awayPenalty !== undefined
    ? `PK ${match.homePenalty} - ${match.awayPenalty}`
    : null;

const SectionHeader: React.FC<{
  index: string;
  title: string;
  description?: string;
  light?: boolean;
}> = ({ index, title, description, light = false }) => (
  <div className="mb-8 flex flex-col gap-3 border-b pb-5 md:mb-10 md:flex-row md:items-end md:justify-between md:gap-8">
    <div className="flex items-baseline gap-4">
      <span
        className="font-display text-sm font-black tracking-[0.18em]"
        style={{ color: light ? CUP_GOLD : CUP_RED }}
      >
        {index}
      </span>
      <h2
        className={`font-display text-3xl font-black uppercase tracking-tight md:text-5xl ${
          light ? 'text-white' : 'text-brand-black'
        }`}
      >
        {title}
      </h2>
    </div>
    {description && (
      <p className={`max-w-xl text-sm font-medium leading-7 ${light ? 'text-white/55' : 'text-neutral-500'}`}>
        {description}
      </p>
    )}
  </div>
);

const ResultMatch: React.FC<{ match: CupMatch; featured?: boolean }> = ({ match, featured = false }) => {
  const homeTeam = getTeam(match.homeTeamId);
  const awayTeam = getTeam(match.awayTeamId);
  const winnerId = getWinnerTeamId(match);
  const penaltyLabel = getPenaltyLabel(match);

  if (!homeTeam || !awayTeam) return null;

  return (
    <div
      data-cup-match-id={match.id}
      className={`grid grid-cols-[minmax(0,1fr)_72px_minmax(0,1fr)] items-center border-b px-0 py-5 last:border-b-0 md:grid-cols-[minmax(0,1fr)_112px_minmax(0,1fr)] md:py-6 ${
        featured ? 'border-white/15 text-white' : 'border-neutral-200 text-brand-black'
      }`}
    >
      <div className="min-w-0 text-right">
        <p className={`break-words text-sm md:text-lg ${winnerId === homeTeam.id ? 'font-black' : 'font-bold opacity-55'}`}>
          {homeTeam.name}
        </p>
      </div>
      <div className="px-2 text-center">
        <p className={`font-display text-2xl font-black tabular-nums md:text-4xl ${featured ? 'text-white' : 'text-brand-black'}`}>
          {getScoreLabel(match)}
        </p>
        {penaltyLabel && (
          <p className={`mt-1 text-[10px] font-black uppercase tracking-wider ${featured ? 'text-[#e7c77e]' : 'text-[#8f1d1d]'}`}>
            {penaltyLabel}
          </p>
        )}
      </div>
      <div className="min-w-0 text-left">
        <p className={`break-words text-sm md:text-lg ${winnerId === awayTeam.id ? 'font-black' : 'font-bold opacity-55'}`}>
          {awayTeam.name}
        </p>
      </div>
    </div>
  );
};

const KnockoutCompetition: React.FC<{
  label: string;
  matches: CupMatch[];
  tone: 'cup' | 'plate';
}> = ({ label, matches, tone }) => {
  const finalMatch = matches.find((match) => match.round.includes('決賽') && !match.round.includes('準決賽'));
  const otherMatches = matches.filter((match) => match.id !== finalMatch?.id);

  return (
    <section className="border-t-4 bg-white" style={{ borderTopColor: tone === 'cup' ? CUP_RED : '#44403c' }}>
      <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-4 md:px-7">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400">Knockout Stage</p>
          <h3 className="mt-1 font-display text-2xl font-black uppercase text-brand-black">{label}</h3>
        </div>
        <Trophy className={`h-6 w-6 ${tone === 'cup' ? 'text-[#8f1d1d]' : 'text-neutral-500'}`} aria-hidden="true" />
      </div>

      {finalMatch && (
        <div className="px-5 py-6 md:px-7">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-black tracking-[0.12em] text-[#8f1d1d]">{finalMatch.round}</p>
            <p className="text-[10px] font-bold text-neutral-400">
              {formatTaipeiTime(finalMatch.timestamp)} · {finalMatch.venue} 場
            </p>
          </div>
          <ResultMatch match={finalMatch} />
        </div>
      )}

      <div className="border-t border-neutral-200 px-5 py-2 md:px-7">
        {otherMatches.map((match) => (
          <div key={match.id} className="border-b border-neutral-100 py-3 last:border-b-0">
            <div className="mb-1 flex items-center justify-between">
              <p className="text-[10px] font-black tracking-[0.1em] text-neutral-400">{match.round}</p>
              <p className="text-[10px] font-bold text-neutral-400">
                {formatTaipeiTime(match.timestamp)} · {match.venue} 場
              </p>
            </div>
            <ResultMatch match={match} />
          </div>
        ))}
      </div>
    </section>
  );
};

const CompactGroupMatch: React.FC<{ match?: CupMatch }> = ({ match }) => {
  if (!match) return <div className="min-h-[58px]" />;
  const homeTeam = getTeam(match.homeTeamId);
  const awayTeam = getTeam(match.awayTeamId);
  if (!homeTeam || !awayTeam) return null;

  return (
    <div className="grid min-h-[58px] grid-cols-[minmax(0,1fr)_54px_minmax(0,1fr)] items-center gap-2 border-t border-neutral-200 py-3 first:border-t-0 md:border-l md:border-t-0 md:px-5">
      <span className="min-w-0 break-words text-right text-xs font-bold leading-5 text-brand-black md:text-sm">
        {homeTeam.name}
      </span>
      <span className="text-center font-display text-xl font-black tabular-nums text-brand-black">
        {getScoreLabel(match)}
      </span>
      <span className="min-w-0 break-words text-left text-xs font-bold leading-5 text-brand-black md:text-sm">
        {awayTeam.name}
      </span>
    </div>
  );
};

const TeamGroup: React.FC<{
  group: CupGroup;
  standings: CupGroupStanding[];
  placementLabels: Record<string, string>;
}> = ({ group, standings, placementLabels }) => (
  <section data-cup-group={group} className="border-t-4 border-[#8f1d1d] bg-white">
    <div className="flex items-end justify-between border-b border-neutral-200 px-5 py-5 md:px-7">
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400">Group</p>
        <h3 className="mt-1 font-display text-3xl font-black text-brand-black">{group} 組</h3>
      </div>
      <span className="font-display text-5xl font-black text-neutral-100" aria-hidden="true">{group}</span>
    </div>
    <ol className="px-5 md:px-7">
      {standings.map((standing) => {
        const team = standing.team;
        return (
          <li key={team.id} className="grid min-h-16 grid-cols-[36px_minmax(0,1fr)_auto] items-center border-b border-neutral-100 last:border-b-0">
            <span className="font-display text-sm font-black text-[#8f1d1d]">{String(standing.rank).padStart(2, '0')}</span>
            <span className="min-w-0 break-words pr-4 text-sm font-black text-brand-black md:text-base">{team.name}</span>
            <div className="text-right">
              <span className="block text-[10px] font-black tabular-nums text-neutral-500">
                {standing.points} 分 · {standing.goalDifference >= 0 ? '+' : ''}{standing.goalDifference}
              </span>
              {standing.tieBreakStatus === 'PENALTY_SHOOTOUT_REQUIRED' ? (
                <span className="mt-1 block text-[9px] font-black uppercase tracking-[0.1em] text-[#8f1d1d]">PK 待定</span>
              ) : placementLabels[team.id] ? (
                <span className="mt-1 block text-[9px] font-black uppercase tracking-[0.1em] text-neutral-400">
                  {placementLabels[team.id]}
                </span>
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  </section>
);

const CupPage: React.FC = () => {
  const cupFinal = getMatch(CUP_EVENT.cupFinalMatchId);
  const cupThirdPlace = getMatch(CUP_EVENT.cupThirdPlaceMatchId);
  const plateFinal = getMatch(CUP_EVENT.plateFinalMatchId);
  const plateThirdPlace = getMatch(CUP_EVENT.plateThirdPlaceMatchId);

  const cupChampion = getTeam(getWinnerTeamId(cupFinal) ?? '');
  const cupRunnerUp = getTeam(getLoserTeamId(cupFinal) ?? '');
  const cupThird = getTeam(getWinnerTeamId(cupThirdPlace) ?? '');
  const plateChampion = getTeam(getWinnerTeamId(plateFinal) ?? '');
  const plateRunnerUp = getTeam(getLoserTeamId(plateFinal) ?? '');
  const plateThird = getTeam(getWinnerTeamId(plateThirdPlace) ?? '');

  const groupStageMatches = useMemo(
    () => CUP_MATCHES.filter((match) => match.round.startsWith('小組賽')),
    [],
  );
  const timeSlots = useMemo(
    () => [...new Set(groupStageMatches.map((match) => match.timestamp))].sort(),
    [groupStageMatches],
  );
  const cupKnockoutMatches = useMemo(
    () => CUP_MATCHES.filter((match) => match.round.startsWith('盃賽')),
    [],
  );
  const plateKnockoutMatches = useMemo(
    () => CUP_MATCHES.filter((match) => match.round.startsWith('盤賽')),
    [],
  );

  const placementLabels: Record<string, string> = {};
  if (cupChampion) placementLabels[cupChampion.id] = '盃賽冠軍';
  if (cupRunnerUp) placementLabels[cupRunnerUp.id] = '盃賽亞軍';
  if (cupThird) placementLabels[cupThird.id] = '盃賽季軍';
  if (plateChampion) placementLabels[plateChampion.id] = '盤賽冠軍';
  if (plateRunnerUp) placementLabels[plateRunnerUp.id] = '盤賽亞軍';
  if (plateThird) placementLabels[plateThird.id] = '盤賽季軍';

  return (
    <div className="min-h-screen bg-[#f7f3ee] text-brand-black">
      <section className="relative overflow-hidden bg-[#240b0b] text-white">
        <div
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              'linear-gradient(45deg, rgba(200,164,90,.12) 1px, transparent 1px), linear-gradient(-45deg, rgba(200,164,90,.08) 1px, transparent 1px)',
            backgroundSize: '42px 42px',
          }}
          aria-hidden="true"
        />
        <div className="absolute inset-y-0 left-0 w-full bg-gradient-to-r from-[#240b0b] via-[#4a1010]/95 to-transparent lg:w-3/4" aria-hidden="true" />

        <div className="relative mx-auto grid min-h-[720px] max-w-7xl lg:grid-cols-[1.05fr_.95fr]">
          <div className="flex flex-col justify-center px-4 py-14 md:px-12 md:py-20 lg:py-24">
            <div className="mb-8 flex items-center gap-3">
              <span className="h-px w-10 bg-[#c8a45a]" />
              <span className="text-[11px] font-black uppercase tracking-[0.28em] text-[#e1c47f]">D LEAGUE CUP</span>
            </div>

            <h1 className="max-w-3xl font-display text-5xl font-black uppercase leading-[0.94] tracking-tight md:text-7xl xl:text-[92px]">
              2026 台南夢達
              <span className="mt-2 block text-[#e1c47f]">新春賀歲盃</span>
            </h1>

            <div className="mt-10 border-l-4 border-[#c8a45a] pl-5 md:mt-12 md:pl-7">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-white/55">盃賽冠軍</p>
              <p className="mt-2 font-display text-4xl font-black tracking-tight text-white md:text-6xl">
                {cupChampion?.name ?? '賽果待確認'}
              </p>
              {cupFinal && cupRunnerUp && (
                <p className="mt-4 text-sm font-bold text-white/65 md:text-base">
                  決賽　{cupChampion?.name} {cupFinal.homeTeamId === cupChampion?.id ? cupFinal.homeScore : cupFinal.awayScore}
                  <span className="mx-2 text-[#e1c47f]">-</span>
                  {cupFinal.homeTeamId === cupChampion?.id ? cupFinal.awayScore : cupFinal.homeScore} {cupRunnerUp.name}
                </p>
              )}
            </div>

            <div className="mt-10 flex flex-wrap gap-3">
              <a
                href="#results"
                className="inline-flex min-h-12 items-center justify-center bg-[#c8a45a] px-6 text-sm font-black text-[#240b0b] transition-colors hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#240b0b]"
              >
                查看完整賽果
                <ArrowDown className="ml-2 h-4 w-4" aria-hidden="true" />
              </a>
              <a
                href="#gallery"
                className="inline-flex min-h-12 items-center justify-center border border-white/30 px-6 text-sm font-black text-white transition-colors hover:border-white hover:bg-white hover:text-[#240b0b] focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                賽事影像
              </a>
            </div>
          </div>

          <div className="relative min-h-[480px] overflow-hidden lg:min-h-full">
            <img
              src={assetUrl(CUP_EVENT.heroImage)}
              alt={`${cupChampion?.name ?? '盃賽冠軍'}頒獎典禮`}
              className="absolute inset-0 h-full w-full object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#240b0b] via-transparent to-black/10 lg:bg-gradient-to-r lg:from-[#240b0b]/65 lg:via-transparent lg:to-transparent" aria-hidden="true" />
            <div className="absolute bottom-6 right-5 text-right md:bottom-10 md:right-10">
              <p className="font-display text-5xl font-black leading-none text-white/20 md:text-7xl">CHAMPIONS</p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-neutral-200 bg-white" aria-label="賽事總覽">
        <div className="mx-auto grid max-w-7xl grid-cols-2 px-4 md:grid-cols-5 md:px-12">
          <div className="border-b border-r border-neutral-200 py-6 pr-4 md:border-b-0 md:py-8">
            <CalendarDays className="mb-3 h-4 w-4 text-[#8f1d1d]" aria-hidden="true" />
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-neutral-400">日期</p>
            <p className="mt-1 font-display text-lg font-black">{formatTaipeiDate(CUP_EVENT.date, '.')}</p>
          </div>
          <div className="border-b border-neutral-200 py-6 pl-4 md:border-b-0 md:border-r md:px-6 md:py-8">
            <MapPin className="mb-3 h-4 w-4 text-[#8f1d1d]" aria-hidden="true" />
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-neutral-400">場地</p>
            <p className="mt-1 text-sm font-black leading-6">{CUP_EVENT.venue}</p>
          </div>
          <div className="border-r border-neutral-200 py-6 pr-4 md:px-6 md:py-8">
            <UsersRound className="mb-3 h-4 w-4 text-[#8f1d1d]" aria-hidden="true" />
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-neutral-400">參賽規模</p>
            <p className="mt-1 font-display text-lg font-black">{CUP_EVENT.teamCount} 支球隊</p>
          </div>
          <div className="py-6 pl-4 md:border-r md:px-6 md:py-8">
            <Trophy className="mb-3 h-4 w-4 text-[#8f1d1d]" aria-hidden="true" />
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-neutral-400">賽事</p>
            <p className="mt-1 font-display text-lg font-black">{CUP_EVENT.matchCount} 場比賽</p>
          </div>
          <div className="col-span-2 border-t border-neutral-200 py-6 md:col-span-1 md:border-t-0 md:pl-6 md:py-8">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-neutral-400">賽制</p>
            <p className="mt-2 text-sm font-black leading-6">{CUP_EVENT.format}</p>
            <p className="mt-1 text-xs font-bold text-neutral-400">每隊 {CUP_EVENT.matchesPerTeam} 場</p>
          </div>
        </div>
      </section>

      <main>
        <section id="honours" className="scroll-mt-24 px-4 py-16 md:px-12 md:py-24">
          <div className="mx-auto max-w-7xl">
            <SectionHeader
              index="01"
              title="賽事榮譽"
              description="完整記錄首屆新春賀歲盃的盃賽與盤賽名次"
            />

            <div className="grid gap-8 lg:grid-cols-[1.45fr_.55fr]">
              <div className="border-t-4 border-[#c8a45a] bg-white">
                <div className="grid border-b border-neutral-200 px-5 py-7 md:grid-cols-[120px_1fr_auto] md:items-center md:px-8">
                  <span className="font-display text-6xl font-black text-[#c8a45a]">01</span>
                  <div className="mt-3 md:mt-0">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400">Cup Champion</p>
                    <p className="mt-1 font-display text-3xl font-black md:text-5xl">{cupChampion?.name}</p>
                  </div>
                  <Trophy className="mt-5 h-9 w-9 text-[#c8a45a] md:mt-0" aria-hidden="true" />
                </div>

                <div className="grid md:grid-cols-2">
                  <div className="border-b border-neutral-200 px-5 py-6 md:border-b-0 md:border-r md:px-8">
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-neutral-400">盃賽亞軍</p>
                    <p className="mt-2 text-xl font-black">{cupRunnerUp?.name}</p>
                  </div>
                  <div className="px-5 py-6 md:px-8">
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-neutral-400">盃賽季軍</p>
                    <p className="mt-2 text-xl font-black">{cupThird?.name}</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col justify-between bg-[#4a1010] p-7 text-white md:p-9">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#d7b86e]">Plate Champion</p>
                  <p className="mt-3 font-display text-3xl font-black leading-tight md:text-4xl">{plateChampion?.name}</p>
                </div>
                <div className="mt-12 border-t border-white/15 pt-5">
                  <p className="text-xs font-bold text-white/50">盤賽亞軍</p>
                  <p className="mt-1 text-base font-black">{plateRunnerUp?.name}</p>
                  {plateThird && (
                    <p className="mt-4 text-xs font-bold text-white/50">盤賽季軍　<span className="text-white">{plateThird.name}</span></p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="results" className="scroll-mt-24 bg-white px-4 py-16 md:px-12 md:py-24">
          <div className="mx-auto max-w-7xl">
            <SectionHeader
              index="02"
              title="淘汰賽結果"
              description="由準決賽至決賽，完整呈現盃賽與盤賽的最終結果"
            />
            <div className="grid gap-8 lg:grid-cols-2">
              <KnockoutCompetition label="盃賽" matches={cupKnockoutMatches} tone="cup" />
              <KnockoutCompetition label="盤賽" matches={plateKnockoutMatches} tone="plate" />
            </div>
          </div>
        </section>

        <section className="px-4 py-16 md:px-12 md:py-24">
          <div className="mx-auto max-w-7xl">
            <SectionHeader
              index="03"
              title="小組賽賽果"
              description="上午兩個場地同步進行的小組循環賽完整紀錄"
            />

            <div className="border-y border-neutral-300 bg-white">
              <div className="hidden grid-cols-[90px_1fr_1fr] border-b border-neutral-300 bg-neutral-50 md:grid">
                <span className="px-5 py-4 text-[10px] font-black uppercase tracking-[0.18em] text-neutral-400">時間</span>
                <span className="border-l border-neutral-300 px-5 py-4 text-[10px] font-black uppercase tracking-[0.18em] text-neutral-400">A 場</span>
                <span className="border-l border-neutral-300 px-5 py-4 text-[10px] font-black uppercase tracking-[0.18em] text-neutral-400">B 場</span>
              </div>

              {timeSlots.map((timestamp) => {
                const matches = groupStageMatches.filter((match) => match.timestamp === timestamp);
                const venueAMatch = matches.find((match) => match.venue === 'A');
                const venueBMatch = matches.find((match) => match.venue === 'B');
                return (
                  <div key={timestamp} className="border-b border-neutral-300 last:border-b-0 md:grid md:grid-cols-[90px_1fr_1fr]">
                    <div className="flex items-center justify-between bg-neutral-50 px-4 py-3 md:block md:bg-white md:px-5 md:py-5">
                      <span className="font-display text-xl font-black tabular-nums text-[#8f1d1d]">{formatTaipeiTime(timestamp)}</span>
                      <span className="text-[10px] font-black uppercase tracking-[0.12em] text-neutral-400 md:hidden">兩場同步</span>
                    </div>
                    <div className="px-4 md:px-0"><span className="mb-1 mt-3 block text-[9px] font-black tracking-[0.14em] text-neutral-400 md:hidden">A 場</span><CompactGroupMatch match={venueAMatch} /></div>
                    <div className="px-4 pb-3 md:px-0 md:pb-0"><span className="mb-1 mt-3 block text-[9px] font-black tracking-[0.14em] text-neutral-400 md:hidden">B 場</span><CompactGroupMatch match={venueBMatch} /></div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="bg-white px-4 py-16 md:px-12 md:py-24">
          <div className="mx-auto max-w-7xl">
            <SectionHeader
              index="04"
              title="小組排名"
              description={CUP_GROUP_RANKING_RULE_LABEL}
            />
            <div className="grid gap-8 md:grid-cols-2">
              <TeamGroup group="A" standings={CUP_GROUP_STANDINGS.A} placementLabels={placementLabels} />
              <TeamGroup group="B" standings={CUP_GROUP_STANDINGS.B} placementLabels={placementLabels} />
            </div>
            <p className="mt-6 border-l-2 border-[#8f1d1d] pl-4 text-xs font-bold leading-6 text-neutral-500">
              小組前兩名進入盃賽：A1 對 B2、B1 對 A2；小組後兩名進入盤賽：A3 對 B4、B3 對 A4
            </p>
          </div>
        </section>

        <section id="gallery" className="scroll-mt-24 bg-[#1f0b0b] px-4 py-16 text-white md:px-12 md:py-24">
          <div className="mx-auto max-w-7xl">
            <SectionHeader
              index="05"
              title="賽事影像"
              description="記錄球員、球隊及頒獎時刻，保存新春賀歲盃的完整賽事記憶"
              light
            />

            <div className="mb-8 flex items-center gap-3">
              <Camera className="h-4 w-4 text-[#d7b86e]" aria-hidden="true" />
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/45">Matchday Gallery</p>
            </div>

            <div className="grid grid-cols-2 gap-2 md:grid-cols-3 md:gap-4">
              {CUP_EVENT.highlightImages.map((photo, index) => (
                <figure
                  key={photo.id}
                  className={`group relative overflow-hidden bg-black ${index === 0 ? 'col-span-2 row-span-2 md:col-span-2' : ''}`}
                >
                  <img
                    src={assetUrl(photo.src)}
                    alt={photo.alt}
                    loading={index === 0 ? 'eager' : 'lazy'}
                    className={`w-full object-cover transition-transform duration-700 group-hover:scale-[1.03] ${index === 0 ? 'aspect-[4/3] h-full md:aspect-[16/10]' : 'aspect-[4/5]'}`}
                  />
                  <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-white/10" aria-hidden="true" />
                </figure>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default CupPage;
