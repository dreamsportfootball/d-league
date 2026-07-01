import { MATCH_VENUE_NAME } from '../config/siteConfig';
import type { Match } from '../types';
import { MatchStatus } from '../types';
import { getTaipeiDateParts } from './dateFormat';

interface BuildMatchInfoTextParams {
  match: Match;
  seasonShortName: string;
  homeTeamName: string;
  awayTeamName: string;
  detailUrl: string;
  homeTeamShortName?: string;
  awayTeamShortName?: string;
  events?: readonly unknown[];
}

const formatMatchDateTime = (timestamp: string): string => {
  const parts = getTaipeiDateParts(timestamp);
  if (!parts) return '';
  return `${parts.year}/${parts.month}/${parts.day}（${parts.weekday}）${parts.hour}:${parts.minute}`;
};

export const buildMatchInfoText = ({
  match,
  seasonShortName,
  homeTeamName,
  awayTeamName,
  detailUrl,
}: BuildMatchInfoTextParams): string => {
  const isFinished = match.status === MatchStatus.FINISHED;
  const headline = isFinished
    ? `D LEAGUE ${seasonShortName}｜比賽結果`
    : `D LEAGUE ${seasonShortName}`;
  const matchup = isFinished
    ? `${homeTeamName} ${match.homeScore ?? '-'} - ${match.awayScore ?? '-'} ${awayTeamName}`
    : `${homeTeamName} vs ${awayTeamName}`;

  const lines = [
    headline,
    `${match.league}｜第 ${match.round} 輪`,
    '',
    matchup,
    '',
    formatMatchDateTime(match.timestamp),
    MATCH_VENUE_NAME,
  ];

  if (match.administrativeNote) {
    lines.push('', `官方註記：${match.administrativeNote}`);
  }

  lines.push('', '比賽詳情', detailUrl);

  return lines.join('\n');
};
