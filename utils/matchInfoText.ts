import type { Match } from '../types';
import { MatchStatus } from '../types';

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'] as const;
const VENUE_SHORT_NAME = '仁德文賢國中';

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
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return `${year}/${month}/${day}（${WEEKDAYS[date.getDay()]}）${hours}:${minutes}`;
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
    VENUE_SHORT_NAME,
  ];

  if (match.administrativeNote) {
    lines.push('', `官方註記：${match.administrativeNote}`);
  }

  lines.push('', '比賽詳情', detailUrl);

  return lines.join('\n');
};
