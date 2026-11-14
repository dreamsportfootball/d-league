import type { SeasonId } from './season';

export interface MediaAlbum {
  id: string;
  seasonId: SeasonId;
  title: string;
  date: string;
  matchDay?: number;
  /** A single photo collection shared by all fixtures on a match day. */
  scope?: 'MATCH_DAY';
  cover: string;
  thumbnail?: string;
  link: string;
}
