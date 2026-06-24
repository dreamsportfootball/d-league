import type { Match } from '../types';
import { MatchStatus } from '../types';
import type { MatchEvent } from '../types/matchEvent';

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'] as const;
const VENUE_SHORT_NAME = '仁德文賢國中';

interface BuildMatchInfoTextParams {
  match: Match;
  seasonShortName: string;
  homeTeamName: string;
  homeTeamShortName: string;
  awayTeamName: string;
  awayTeamShortName: string;
  events: MatchEvent[];
  detailUrl: string;
}

interface ScorerGroup {
  player: string;
  goals: MatchEvent[];
}

const formatMatchDateTime = (timestamp: string): string => {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return `${year}/${month}/${day}（${WEEKDAYS[date.getDay()]}）${hours}:${minutes}`;
};

const formatGoalMinute = (event: MatchEvent): string => {
  const qualifier = event.isPK ? '（PK）' : event.isOwnGoal ? '（烏龍）' : '';
  return `${event.minute}'${qualifier}`;
};

const groupScorers = (events: MatchEvent[], team: MatchEvent['team']): ScorerGroup[] => {
  const groups = new Map<string, ScorerGroup>();

  events
    .filter((event) => event.team === team)
    .sort((a, b) => a.minute - b.minute)
    .forEach((event) => {
      const key = event.playerId ?? event.player;
      const existing = groups.get(key);
      if (existing) {
        existing.goals.push(event);
        return;
      }
      groups.set(key, { player: event.player, goals: [event] });
    });

  return [...groups.values()];
};

const formatScorerGroups = (groups: ScorerGroup[]): string =>
  groups
    .map((group) => `${group.player} ${group.goals.map(formatGoalMinute).join('、')}`)
    .join('｜');

const getScorerLines = (
  match: Match,
  events: MatchEvent[],
  homeTeamShortName: string,
  awayTeamShortName: string,
): string[] => {
  const homeScore = match.homeScore;
  const awayScore = match.awayScore;
  const isAdministrativeResult =
    Boolean(match.administrativeNote) ||
    (match.resultType !== undefined && match.resultType !== 'PLAYED');

  if (
    match.status !== MatchStatus.FINISHED ||
    isAdministrativeResult ||
    homeScore === null ||
    awayScore === null ||
    homeScore + awayScore === 0
  ) {
    return [];
  }

  const goalEvents = events.filter((event) => event.type === 'GOAL');
  if (goalEvents.length !== homeScore + awayScore) return [];

  const homeScorers = formatScorerGroups(groupScorers(goalEvents, 'HOME'));
  const awayScorers = formatScorerGroups(groupScorers(goalEvents, 'AWAY'));
  const lines: string[] = ['進球者'];

  if (homeScorers) lines.push(`${homeTeamShortName}：${homeScorers}`);
  if (awayScorers) lines.push(`${awayTeamShortName}：${awayScorers}`);

  return lines.length > 1 ? lines : [];
};

export const buildMatchInfoText = ({
  match,
  seasonShortName,
  homeTeamName,
  homeTeamShortName,
  awayTeamName,
  awayTeamShortName,
  events,
  detailUrl,
}: BuildMatchInfoTextParams): string => {
  const isFinished = match.status === MatchStatus.FINISHED;
  const headline = isFinished
    ? `D LEAGUE ${seasonShortName}｜比賽結果`
    : `D LEAGUE ${seasonShortName}`;
  const matchup = isFinished
    ? `${homeTeamName} ${match.homeScore ?? '-'} - ${match.awayScore ?? '-'} ${awayTeamName}`
    : `${homeTeamName} vs ${awayTeamName}`;
  const scorerLines = getScorerLines(
    match,
    events,
    homeTeamShortName,
    awayTeamShortName,
  );

  const lines = [
    headline,
    `${match.league}｜第 ${match.round} 輪`,
    '',
    matchup,
  ];

  if (scorerLines.length > 0) {
    lines.push('', ...scorerLines);
  }

  lines.push(
    '',
    formatMatchDateTime(match.timestamp),
    VENUE_SHORT_NAME,
  );

  if (match.administrativeNote) {
    lines.push('', `官方註記：${match.administrativeNote}`);
  }

  lines.push('', '比賽詳情', detailUrl);

  return lines.join('\n');
};
