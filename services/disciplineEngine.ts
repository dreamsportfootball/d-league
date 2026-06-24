import type { Match } from '../types';
import { MatchStatus } from '../types';
import type {
  DisciplineDecision,
  DisciplineEngineResult,
  DisciplineSubjectType,
  DisciplineSummary,
  MatchLineup,
  SuspensionReason,
  SuspensionRecord,
  SuspensionViolation,
} from '../types/discipline';
import type { MatchEvent } from '../types/matchEvent';
import type { PlayerProfile } from '../types/player';
import type { CompetitionRules } from '../types/season';

interface DisciplineEngineOptions {
  matches: Match[];
  matchEvents: Record<string, MatchEvent[]>;
  players: PlayerProfile[];
  lineups?: Record<string, MatchLineup>;
  decisions?: DisciplineDecision[];
  rules: CompetitionRules;
}

interface SubjectState {
  subjectType: DisciplineSubjectType;
  subjectId: string;
  subjectName: string;
  currentTeamId: string;
  yellowCards: number;
  secondYellowDismissals: number;
  directRedCards: number;
  crossMatchYellowCount: number;
  fineAmount: number;
  orders: SuspensionRecord[];
}

const isFinishedMatch = (match: Match): boolean =>
  match.status === MatchStatus.FINISHED ||
  (match.homeScore !== null && match.awayScore !== null);

const countsForSuspensionService = (match: Match): boolean =>
  isFinishedMatch(match) &&
  match.resultType !== 'VOID' &&
  match.countsForSuspensionService !== false;

const resolvePlayerTeamAt = (
  player: PlayerProfile | undefined,
  timestamp: string,
  fallbackTeamId: string,
): string => {
  if (!player?.registrations?.length) return player?.teamId ?? fallbackTeamId;
  const target = new Date(timestamp).getTime();
  const registration = player.registrations.find((item) => {
    const start = new Date(item.effectiveFrom).getTime();
    const end = item.effectiveTo ? new Date(item.effectiveTo).getTime() : Number.POSITIVE_INFINITY;
    return target >= start && target < end;
  });
  return registration?.teamId ?? player.teamId ?? fallbackTeamId;
};

const resolveSubject = (
  event: MatchEvent,
  teamId: string,
  players: PlayerProfile[],
): { subjectType: DisciplineSubjectType; subjectId: string; subjectName: string; player?: PlayerProfile } => {
  const subjectType = event.subjectType ?? 'PLAYER';
  const explicitId = event.subjectId ?? event.playerId;
  if (explicitId) {
    const player = subjectType === 'PLAYER' ? players.find((item) => item.id === explicitId) : undefined;
    return {
      subjectType,
      subjectId: explicitId,
      subjectName: player?.name ?? event.player,
      player,
    };
  }

  const candidates = subjectType === 'PLAYER'
    ? players.filter((player) => player.name === event.player)
    : [];
  const teamCandidate = candidates.find((player) => player.teamId === teamId);
  const player = teamCandidate ?? (candidates.length === 1 ? candidates[0] : undefined);
  return {
    subjectType,
    subjectId: player?.id ?? `legacy:${subjectType}:${teamId}:${event.player}`,
    subjectName: player?.name ?? event.player,
    player,
  };
};

const createState = (
  subjectType: DisciplineSubjectType,
  subjectId: string,
  subjectName: string,
  teamId: string,
): SubjectState => ({
  subjectType,
  subjectId,
  subjectName,
  currentTeamId: teamId,
  yellowCards: 0,
  secondYellowDismissals: 0,
  directRedCards: 0,
  crossMatchYellowCount: 0,
  fineAmount: 0,
  orders: [],
});

const createSuspension = (
  state: SubjectState,
  sourceMatchId: string | undefined,
  reason: SuspensionReason,
  totalMatches: number,
  resetCrossMatchYellowsOnCompletion: boolean,
  id?: string,
): SuspensionRecord => ({
  id: id ?? `auto:${sourceMatchId ?? 'none'}:${state.subjectId}:${reason}`,
  subjectType: state.subjectType,
  subjectId: state.subjectId,
  subjectName: state.subjectName,
  teamIdAtIssue: state.currentTeamId,
  sourceMatchId,
  reason,
  totalMatches,
  servedMatchIds: [],
  remainingMatches: totalMatches,
  resetCrossMatchYellowsOnCompletion,
  status: totalMatches > 0 ? 'ACTIVE' : 'COMPLETED',
});

const lineupContainsSubject = (
  lineup: MatchLineup | undefined,
  match: Match,
  teamId: string,
  subjectId: string,
  subjectType: DisciplineSubjectType,
): boolean => {
  if (!lineup) return false;
  const home = teamId === match.homeTeamId;
  if (subjectType === 'STAFF') {
    return (home ? lineup.homeStaffIds : lineup.awayStaffIds)?.includes(subjectId) ?? false;
  }
  return (home ? lineup.homePlayerIds : lineup.awayPlayerIds).includes(subjectId);
};

export const calculateDiscipline = ({
  matches,
  matchEvents,
  players,
  lineups = {},
  decisions = [],
  rules,
}: DisciplineEngineOptions): DisciplineEngineResult => {
  const sortedMatches = matches
    .slice()
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  const activeDecisions = decisions.filter((decision) => decision.status !== 'OVERTURNED');
  const processedDecisionIds = new Set<string>();
  const states = new Map<string, SubjectState>();
  const violations: SuspensionViolation[] = [];

  const getState = (
    subjectType: DisciplineSubjectType,
    subjectId: string,
    subjectName: string,
    teamId: string,
  ): SubjectState => {
    const existing = states.get(subjectId);
    if (existing) {
      existing.subjectName = subjectName;
      existing.currentTeamId = teamId;
      return existing;
    }
    const state = createState(subjectType, subjectId, subjectName, teamId);
    states.set(subjectId, state);
    return state;
  };

  const addStandaloneDecisionsBefore = (timestamp: string) => {
    const limit = new Date(timestamp).getTime();
    activeDecisions.forEach((decision) => {
      if (processedDecisionIds.has(decision.id) || decision.sourceMatchId) return;
      if (new Date(decision.issuedAt).getTime() > limit) return;
      const player = players.find((item) => item.id === decision.subjectId);
      const teamId = resolvePlayerTeamAt(player, timestamp, decision.teamId);
      const state = getState(
        decision.subjectType,
        decision.subjectId,
        decision.subjectName,
        teamId,
      );
      state.orders.push(
        createSuspension(
          state,
          undefined,
          'MANUAL_DECISION',
          decision.additionalSuspensionMatches,
          false,
          `decision:${decision.id}`,
        ),
      );
      processedDecisionIds.add(decision.id);
    });
  };

  sortedMatches.forEach((match) => {
    addStandaloneDecisionsBefore(match.timestamp);

    if (countsForSuspensionService(match)) {
      states.forEach((state) => {
        const player = state.subjectType === 'PLAYER'
          ? players.find((item) => item.id === state.subjectId)
          : undefined;
        const teamId = resolvePlayerTeamAt(player, match.timestamp, state.currentTeamId);
        state.currentTeamId = teamId;
        if (teamId !== match.homeTeamId && teamId !== match.awayTeamId) return;

        const activeOrder = state.orders.find((order) => order.remainingMatches > 0);
        if (!activeOrder) return;

        if (lineupContainsSubject(lineups[match.id], match, teamId, state.subjectId, state.subjectType)) {
          violations.push({
            matchId: match.id,
            subjectId: state.subjectId,
            subjectName: state.subjectName,
            teamId,
            message: `${state.subjectName} 於停賽期間被列入出賽或隊職員名單`,
          });
          return;
        }

        activeOrder.servedMatchIds.push(match.id);
        activeOrder.remainingMatches -= 1;
        if (activeOrder.remainingMatches === 0) {
          activeOrder.status = 'COMPLETED';
          if (activeOrder.resetCrossMatchYellowsOnCompletion) {
            state.crossMatchYellowCount = 0;
          }
        }
      });
    }

    const events = matchEvents[match.id] ?? [];
    const groupedEvents = new Map<string, {
      state: SubjectState;
      ordinaryYellowCount: number;
      secondYellowCount: number;
      directRedCount: number;
    }>();

    events.forEach((event) => {
      if (event.type === 'GOAL') return;
      const teamId = event.team === 'HOME' ? match.homeTeamId : match.awayTeamId;
      const subject = resolveSubject(event, teamId, players);
      const subjectTeamId = resolvePlayerTeamAt(subject.player, match.timestamp, teamId);
      const state = getState(
        subject.subjectType,
        subject.subjectId,
        subject.subjectName,
        subjectTeamId,
      );
      const group = groupedEvents.get(state.subjectId) ?? {
        state,
        ordinaryYellowCount: 0,
        secondYellowCount: 0,
        directRedCount: 0,
      };
      if (event.type === 'YELLOW_CARD') group.ordinaryYellowCount += 1;
      if (event.type === 'SECOND_YELLOW') group.secondYellowCount += 1;
      if (event.type === 'RED_CARD') group.directRedCount += 1;
      groupedEvents.set(state.subjectId, group);
    });

    groupedEvents.forEach(({ state, ordinaryYellowCount, secondYellowCount, directRedCount }) => {
      state.yellowCards += ordinaryYellowCount + secondYellowCount;
      state.secondYellowDismissals += secondYellowCount;
      state.directRedCards += directRedCount;

      if (secondYellowCount > 0) {
        state.fineAmount += rules.secondYellowFine * secondYellowCount;
      } else {
        state.fineAmount += ordinaryYellowCount * rules.yellowCardFine;
      }
      state.fineAmount += directRedCount * rules.directRedFine;

      let automaticReason: SuspensionReason | null = null;
      if (secondYellowCount > 0) {
        automaticReason = 'SECOND_YELLOW';
      } else if (directRedCount > 0) {
        state.crossMatchYellowCount += ordinaryYellowCount;
        automaticReason = 'DIRECT_RED';
      } else if (ordinaryYellowCount > 0) {
        state.crossMatchYellowCount += ordinaryYellowCount;
        if (state.crossMatchYellowCount >= rules.yellowCardSuspensionThreshold) {
          automaticReason = 'ACCUMULATED_YELLOW';
        }
      }

      if (!automaticReason) return;
      const linkedDecisions = activeDecisions.filter(
        (decision) =>
          !processedDecisionIds.has(decision.id) &&
          decision.sourceMatchId === match.id &&
          decision.subjectId === state.subjectId,
      );
      const additionalMatches = linkedDecisions.reduce(
        (sum, decision) => sum + Math.max(0, decision.additionalSuspensionMatches),
        0,
      );
      linkedDecisions.forEach((decision) => processedDecisionIds.add(decision.id));

      state.orders.push(
        createSuspension(
          state,
          match.id,
          automaticReason,
          rules.automaticSuspensionMatches + additionalMatches,
          rules.resetCrossMatchYellowsAfterAnySuspension,
        ),
      );
    });
  });

  activeDecisions.forEach((decision) => {
    if (processedDecisionIds.has(decision.id)) return;
    const player = players.find((item) => item.id === decision.subjectId);
    const state = getState(
      decision.subjectType,
      decision.subjectId,
      decision.subjectName,
      player?.teamId ?? decision.teamId,
    );
    state.orders.push(
      createSuspension(
        state,
        decision.sourceMatchId,
        'MANUAL_DECISION',
        decision.additionalSuspensionMatches,
        false,
        `decision:${decision.id}`,
      ),
    );
    processedDecisionIds.add(decision.id);
  });

  const now = Date.now();
  states.forEach((state) => {
    const activeOrder = state.orders.find((order) => order.remainingMatches > 0);
    if (!activeOrder) return;
    const player = state.subjectType === 'PLAYER'
      ? players.find((item) => item.id === state.subjectId)
      : undefined;
    const nextMatch = sortedMatches.find((match) => {
      if (match.status !== MatchStatus.SCHEDULED || new Date(match.timestamp).getTime() < now) return false;
      const teamId = resolvePlayerTeamAt(player, match.timestamp, state.currentTeamId);
      return teamId === match.homeTeamId || teamId === match.awayTeamId;
    });
    if (nextMatch) activeOrder.nextMatchId = nextMatch.id;
  });

  const suspensions = [...states.values()].flatMap((state) => state.orders);
  const summaries: DisciplineSummary[] = [...states.values()].map((state) => {
    const suspensionMatches = state.orders.reduce((sum, order) => sum + order.totalMatches, 0);
    const servedSuspensionMatches = state.orders.reduce(
      (sum, order) => sum + order.servedMatchIds.length,
      0,
    );
    const remainingSuspensionMatches = state.orders.reduce(
      (sum, order) => sum + order.remainingMatches,
      0,
    );
    return {
      subjectType: state.subjectType,
      subjectId: state.subjectId,
      subjectName: state.subjectName,
      currentTeamId: state.currentTeamId,
      yellowCards: state.yellowCards,
      secondYellowDismissals: state.secondYellowDismissals,
      directRedCards: state.directRedCards,
      crossMatchYellowCount: state.crossMatchYellowCount,
      suspensionMatches,
      servedSuspensionMatches,
      remainingSuspensionMatches,
      fineAmount: state.fineAmount,
    };
  });

  return { summaries, suspensions, violations };
};
