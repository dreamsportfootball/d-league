export type DisciplineSubjectType = 'PLAYER' | 'STAFF';

export type SuspensionReason =
  | 'ACCUMULATED_YELLOW'
  | 'SECOND_YELLOW'
  | 'DIRECT_RED'
  | 'MANUAL_DECISION';

export interface DisciplineDecision {
  id: string;
  subjectType: DisciplineSubjectType;
  subjectId: string;
  subjectName: string;
  teamId: string;
  issuedAt: string;
  sourceMatchId?: string;
  additionalSuspensionMatches: number;
  publicSummary?: string;
  status?: 'ACTIVE' | 'OVERTURNED';
}

export interface MatchLineup {
  homePlayerIds: string[];
  awayPlayerIds: string[];
  homeStaffIds?: string[];
  awayStaffIds?: string[];
}

export interface SuspensionRecord {
  id: string;
  subjectType: DisciplineSubjectType;
  subjectId: string;
  subjectName: string;
  teamIdAtIssue: string;
  sourceMatchId?: string;
  reason: SuspensionReason;
  totalMatches: number;
  servedMatchIds: string[];
  remainingMatches: number;
  nextMatchId?: string;
  resetCrossMatchYellowsOnCompletion: boolean;
  status: 'ACTIVE' | 'COMPLETED';
}

export interface DisciplineSummary {
  subjectType: DisciplineSubjectType;
  subjectId: string;
  subjectName: string;
  currentTeamId: string;
  yellowCards: number;
  secondYellowDismissals: number;
  directRedCards: number;
  crossMatchYellowCount: number;
  suspensionMatches: number;
  servedSuspensionMatches: number;
  remainingSuspensionMatches: number;
  fineAmount: number;
}

export interface SuspensionViolation {
  matchId: string;
  subjectId: string;
  subjectName: string;
  teamId: string;
  message: string;
}

export interface DisciplineEngineResult {
  summaries: DisciplineSummary[];
  suspensions: SuspensionRecord[];
  violations: SuspensionViolation[];
}
