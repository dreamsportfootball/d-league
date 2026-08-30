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
  number: number;
  gender: string;
  nationality: string;
  /** ISO date (YYYY-MM-DD). When present, age is resolved at the season age reference date. */
  birthDate?: string;
  /** Legacy/reference-date age retained for records that do not yet have a verified birth date. */
  age: number;
  registrations?: PlayerRegistration[];
}
