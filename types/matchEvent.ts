import type { DisciplineSubjectType } from './discipline';

export type MatchEventType = 'GOAL' | 'YELLOW_CARD' | 'RED_CARD' | 'SECOND_YELLOW';

export interface MatchEvent {
  id: string;
  minute: number;
  player: string;
  playerId?: string;
  subjectType?: DisciplineSubjectType;
  subjectId?: string;
  type: MatchEventType;
  team: 'HOME' | 'AWAY';
  isPK?: boolean;
  isOwnGoal?: boolean;
}
