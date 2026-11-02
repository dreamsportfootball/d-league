export interface PlayerRegistration {
  teamId: string;
  effectiveFrom: string;
  effectiveTo?: string;
}

export interface PlayerProfile {
  id: string;
  identityId?: string;
  teamId: string;
  name: string;
  englishName?: string;
  /** Null means the shirt number has not yet been confirmed for this season. */
  number: number | null;
  gender: string;
  nationality: string;
  /** ISO date (YYYY-MM-DD). When present, age is resolved at the season age reference date. */
  birthDate?: string;
  /** Legacy/reference-date age retained for records that do not yet have a verified birth date. */
  age: number | null;
  /** Confirmed former teams in the same season; transfer dates are not recorded. */
  previousTeamIds?: string[];
  registrations?: PlayerRegistration[];
}
