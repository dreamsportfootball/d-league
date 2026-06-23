import type { MatchEvent } from './types/matchEvent';

declare global {
  interface ObjectConstructor {
    entries(value: Record<string, MatchEvent[]>): Array<[string, MatchEvent[]]>;
  }
}

export {};
