export interface PlayerRegistration {
  teamId: string;
  effectiveFrom: string;
  effectiveTo?: string;
}

export interface PlayerProfile {
  id: string;
  teamId: string;
  name: string;
  englishName?: string;
  number: number;
  gender: string;
  nationality: string;
  age: number;
  registrations?: PlayerRegistration[];
}
