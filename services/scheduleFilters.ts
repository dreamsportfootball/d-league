import { MatchStatus, type Match } from '../types';
import type { LeagueId, SeasonId } from '../types/season';
import type { SeasonTeam } from '../types/team';

export type LeagueFilter = LeagueId | 'ALL';
export type StatusFilter = 'ALL' | 'UPCOMING' | 'FINISHED';
export type FacetKey = 'league' | 'team' | 'round' | 'date' | 'status';

export interface ScheduleFilters {
  league: LeagueFilter;
  team: string;
  round: string;
  date: string;
  status: StatusFilter;
}

export interface FacetOptions {
  leagueIds: LeagueId[];
  teams: SeasonTeam[];
  rounds: string[];
  dates: string[];
  statuses: StatusFilter[];
}

export const EMPTY_FILTERS: ScheduleFilters = {
  league: 'ALL',
  team: 'ALL',
  round: 'ALL',
  date: 'ALL',
  status: 'ALL',
};

export const matchPassesFilters = (
  match: Match,
  filters: ScheduleFilters,
  excludedFacet?: FacetKey,
): boolean => {
  if (excludedFacet !== 'league' && filters.league !== 'ALL' && match.league !== filters.league) {
    return false;
  }
  if (
    excludedFacet !== 'team' &&
    filters.team !== 'ALL' &&
    match.homeTeamId !== filters.team &&
    match.awayTeamId !== filters.team
  ) {
    return false;
  }
  if (excludedFacet !== 'round' && filters.round !== 'ALL' && String(match.round) !== filters.round) {
    return false;
  }
  if (excludedFacet !== 'date' && filters.date !== 'ALL' && !match.timestamp.startsWith(filters.date)) {
    return false;
  }
  if (excludedFacet !== 'status') {
    if (filters.status === 'UPCOMING' && match.status !== MatchStatus.SCHEDULED) return false;
    if (filters.status === 'FINISHED' && match.status !== MatchStatus.FINISHED) return false;
  }
  return true;
};

export const getFacetOptions = (
  matches: Match[],
  teams: SeasonTeam[],
  filters: ScheduleFilters,
  enabledLeagues: LeagueId[],
): FacetOptions => {
  const leagueIdsWithMatches = new Set(
    matches
      .filter((match) => matchPassesFilters(match, filters, 'league'))
      .map((match) => match.league),
  );
  const leagueIds = enabledLeagues.filter((leagueId) => leagueIdsWithMatches.has(leagueId));

  const teamIds = new Set<string>();
  matches
    .filter((match) => matchPassesFilters(match, filters, 'team'))
    .forEach((match) => {
      teamIds.add(match.homeTeamId);
      teamIds.add(match.awayTeamId);
    });
  const availableTeams = teams
    .filter((team) => teamIds.has(team.id))
    .sort((a, b) => a.name.localeCompare(b.name, 'zh-TW'));

  const rounds = [...new Set(
    matches
      .filter((match) => matchPassesFilters(match, filters, 'round'))
      .map((match) => String(match.round)),
  )].sort((a, b) => Number(a) - Number(b));

  const dates = [...new Set(
    matches
      .filter((match) => matchPassesFilters(match, filters, 'date'))
      .map((match) => match.timestamp.split('T')[0]),
  )].sort();

  const statusMatches = matches.filter((match) => matchPassesFilters(match, filters, 'status'));
  const statuses: StatusFilter[] = ['ALL'];
  if (statusMatches.some((match) => match.status === MatchStatus.FINISHED)) statuses.push('FINISHED');
  if (statusMatches.some((match) => match.status === MatchStatus.SCHEDULED)) statuses.push('UPCOMING');

  return { leagueIds, teams: availableTeams, rounds, dates, statuses };
};

const isFacetValueAvailable = (
  facet: FacetKey,
  value: string,
  matches: Match[],
  filters: ScheduleFilters,
): boolean => {
  if (value === 'ALL') return true;
  const candidateFilters = { ...filters, [facet]: value } as ScheduleFilters;
  return matches.some((match) => matchPassesFilters(match, candidateFilters));
};

export const reconcileFilters = (
  proposedFilters: ScheduleFilters,
  changedFacet: FacetKey,
  matches: Match[],
): ScheduleFilters => {
  const nextFilters = { ...proposedFilters };
  const facets: FacetKey[] = ['league', 'status', 'team', 'date', 'round'];

  for (let pass = 0; pass < facets.length; pass += 1) {
    let changed = false;
    for (const facet of facets) {
      if (facet === changedFacet || nextFilters[facet] === 'ALL') continue;
      if (!isFacetValueAvailable(facet, nextFilters[facet], matches, nextFilters)) {
        nextFilters[facet] = 'ALL';
        changed = true;
      }
    }
    if (!changed) break;
  }

  return nextFilters;
};

export const getStatusSummary = (status: StatusFilter): string => {
  if (status === 'FINISHED') return '已完賽';
  if (status === 'UPCOMING') return '即將開賽';
  return '全部狀態';
};

const SCHEDULE_FILTERS_STORAGE_PREFIX = 'dleague:schedule-filters:';

const getScheduleFiltersStorageKey = (seasonId: SeasonId): string =>
  `${SCHEDULE_FILTERS_STORAGE_PREFIX}${seasonId}`;

export const readScheduleFilters = (
  seasonId: SeasonId,
  enabledLeagues: LeagueId[],
  matches: Match[],
  teams: SeasonTeam[],
): ScheduleFilters => {
  try {
    const raw = window.sessionStorage.getItem(getScheduleFiltersStorageKey(seasonId));
    if (!raw) return { ...EMPTY_FILTERS };

    const value = JSON.parse(raw) as Partial<Record<keyof ScheduleFilters, unknown>>;
    const savedLeague = value.league;
    const savedTeam = value.team;
    const savedRound = value.round;
    const savedDate = value.date;
    const savedStatus = value.status;
    const league: LeagueFilter =
      savedLeague === 'ALL' ||
      (typeof savedLeague === 'string' && enabledLeagues.includes(savedLeague as LeagueId))
        ? savedLeague as LeagueFilter
        : 'ALL';
    const team = typeof savedTeam === 'string' &&
      (savedTeam === 'ALL' || teams.some((candidate) => candidate.id === savedTeam))
      ? savedTeam
      : 'ALL';
    const round = typeof savedRound === 'string' &&
      (savedRound === 'ALL' || matches.some((match) => String(match.round) === savedRound))
      ? savedRound
      : 'ALL';
    const date = typeof savedDate === 'string' &&
      (savedDate === 'ALL' || matches.some((match) => match.timestamp.startsWith(savedDate)))
      ? savedDate
      : 'ALL';
    const status: StatusFilter =
      savedStatus === 'ALL' || savedStatus === 'UPCOMING' || savedStatus === 'FINISHED'
        ? savedStatus
        : 'ALL';

    const nextFilters: ScheduleFilters = { league, team, round, date, status };
    const facets: FacetKey[] = ['league', 'status', 'team', 'date', 'round'];
    for (let pass = 0; pass < facets.length; pass += 1) {
      let changed = false;
      for (const facet of facets) {
        if (nextFilters[facet] === 'ALL') continue;
        if (!isFacetValueAvailable(facet, nextFilters[facet], matches, nextFilters)) {
          nextFilters[facet] = 'ALL';
          changed = true;
        }
      }
      if (!changed) break;
    }

    return nextFilters;
  } catch {
    return { ...EMPTY_FILTERS };
  }
};

export const writeScheduleFilters = (seasonId: SeasonId, filters: ScheduleFilters): void => {
  try {
    window.sessionStorage.setItem(getScheduleFiltersStorageKey(seasonId), JSON.stringify(filters));
  } catch {
    // Session storage may be unavailable.
  }
};

