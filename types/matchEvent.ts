export type MatchEventType = 'GOAL' | 'YELLOW_CARD' | 'RED_CARD' | 'SECOND_YELLOW';

export interface MatchEvent {
  id: string;
  minute: number;
  player: string;
  type: MatchEventType;
  team: 'HOME' | 'AWAY';
  isPK?: boolean;
  isOwnGoal?: boolean;
}
