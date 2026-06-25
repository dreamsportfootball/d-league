import type { SeasonId } from './season';

export interface MediaAlbum {
  id: string;
  seasonId: SeasonId;
  title: string;
  date: string;
  cover: string;
  link: string;
}
