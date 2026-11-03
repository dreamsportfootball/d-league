import type { SeasonId } from '../types/season';

export interface PhotographerCredit {
  instagram: string;
  name?: string;
}

type CreditsByDate = Record<string, PhotographerCredit[]>;

// Credits are scoped to an individual season and match day, not duplicated
// across every match album. Add confirmed handles to the season's JSON file.
const creditsBySeason = import.meta.glob('../data/seasons/*/photoCredits.json', {
  eager: true,
  import: 'default',
}) as Record<string, CreditsByDate>;

export const getMatchDayPhotoCredits = (seasonId: SeasonId, date: string): PhotographerCredit[] =>
  creditsBySeason[`../data/seasons/${seasonId}/photoCredits.json`]?.[date] ?? [];
