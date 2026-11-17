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
  /** Published age (full birth date must never be included in client-side data). */
  age: number | null;
  /** Confirmed former teams in the same season; transfer dates are not recorded. */
  previousTeamIds?: string[];
  /** Confirmed historical participation period, without a fabricated end date. */
  participationPeriod?: 'FIRST_HALF_ONLY';
  /** Hide a retained historical player from the team's published roster only. */
  hideFromTeamRoster?: boolean;
  /** Current-season withdrawn player is retained for match and identity history. */
  rosterStatus?: 'INACTIVE_REPLACED';
  registrations?: PlayerRegistration[];
}
