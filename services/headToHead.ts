import { SEASON_IDS } from '../config/siteManifest.js';
import { MatchStatus, type Match } from '../types';
import type { SeasonId } from '../types/season';
import type { SeasonTeam } from '../types/team';
import { getTeamHistory, getTeamIdentity } from './entityData';

export interface HeadToHeadMeeting {
  matchId: string;
  seasonId: SeasonId;
  league: Match['league'];
  round: Match['round'];
  timestamp: string;
  leftScore: number;
  rightScore: number;
}

export interface HeadToHeadSummary {
  totalMeetings: number;
  leftWins: number;
  draws: number;
  rightWins: number;
  leftGoals: number;
  rightGoals: number;
  recentMeetings: HeadToHeadMeeting[];
}

const seasonIds = SEASON_IDS as readonly SeasonId[];

export const calculateHeadToHead = (
  leftTeam: SeasonTeam,
  rightTeam: SeasonTeam,
): HeadToHeadSummary | null => {
  const leftIdentity = getTeamIdentity(leftTeam);
  const rightIdentity = getTeamIdentity(rightTeam);
  if (leftIdentity === rightIdentity) return null;

  const leftHistory = getTeamHistory(leftIdentity);
  const rightHistory = getTeamHistory(rightIdentity);
  const meetings: HeadToHeadMeeting[] = [];

  for (const seasonId of seasonIds) {
    const leftRecord = leftHistory.find((record) => record.seasonId === seasonId);
    const rightRecord = rightHistory.find((record) => record.seasonId === seasonId);
    if (!leftRecord || !rightRecord) continue;

    const leftTeamId = leftRecord.team.id;
    const rightTeamId = rightRecord.team.id;
    leftRecord.data.matches.forEach((match) => {
      if (
        match.league === 'CUP' ||
        match.status !== MatchStatus.FINISHED ||
        match.resultType === 'VOID' ||
        match.homeScore === null ||
        match.awayScore === null
      ) return;

      const leftIsHome = match.homeTeamId === leftTeamId && match.awayTeamId === rightTeamId;
      const leftIsAway = match.homeTeamId === rightTeamId && match.awayTeamId === leftTeamId;
      if (!leftIsHome && !leftIsAway) return;

      meetings.push({
        matchId: match.id,
        seasonId,
        league: match.league,
        round: match.round,
        timestamp: match.timestamp,
        leftScore: leftIsHome ? match.homeScore : match.awayScore,
        rightScore: leftIsHome ? match.awayScore : match.homeScore,
      });
    });
  }

  if (meetings.length === 0) return null;

  const sortedMeetings = meetings.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );
  let leftWins = 0;
  let draws = 0;
  let rightWins = 0;
  let leftGoals = 0;
  let rightGoals = 0;

  sortedMeetings.forEach((meeting) => {
    leftGoals += meeting.leftScore;
    rightGoals += meeting.rightScore;
    if (meeting.leftScore > meeting.rightScore) leftWins += 1;
    else if (meeting.leftScore < meeting.rightScore) rightWins += 1;
    else draws += 1;
  });

  return {
    totalMeetings: sortedMeetings.length,
    leftWins,
    draws,
    rightWins,
    leftGoals,
    rightGoals,
    recentMeetings: sortedMeetings.slice(0, 3),
  };
};
