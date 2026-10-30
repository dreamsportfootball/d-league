import { getSeasonConfig } from '../config/seasons';
import { SEASON_IDS } from '../config/siteManifest.js';
import type { SeasonConfig, SeasonId } from '../types/season';
import type { SeasonTeam, TeamStaffMember } from '../types/team';
import { getSeasonData } from './seasonDataJson';

export interface TeamStaffProfile {
  id: string;
  name: string;
  englishName?: string;
  image?: string;
  roles: string[];
}

export interface StaffSeasonRecord {
  seasonId: SeasonId;
  season: SeasonConfig;
  team: SeasonTeam;
  staff: TeamStaffProfile;
}

/** Keep people on different teams separate unless their identity was verified. */
export const getStaffIdentity = (team: SeasonTeam, staff: TeamStaffMember): string =>
  staff.identityId ?? staff.id ?? 'staff-' + (team.identityId ?? team.id) + '-' + staff.name;

/** One profile per person even when they hold multiple roles in a team. */
export const getTeamStaffProfiles = (team: SeasonTeam): TeamStaffProfile[] => {
  const profiles = new Map<string, TeamStaffProfile>();
  for (const member of team.staff ?? []) {
    const id = getStaffIdentity(team, member);
    const existing = profiles.get(id);
    if (existing) {
      if (!existing.roles.includes(member.role)) existing.roles.push(member.role);
      if (!existing.image && member.image) existing.image = member.image;
      continue;
    }
    profiles.set(id, {
      id,
      name: member.name,
      englishName: member.englishName,
      image: member.image,
      roles: [member.role],
    });
  }
  return [...profiles.values()];
};

export const getStaffHistory = (identity: string): StaffSeasonRecord[] =>
  (SEASON_IDS as readonly SeasonId[])
    .flatMap((seasonId) => {
      const data = getSeasonData(seasonId);
      return data.teams.flatMap((team) =>
        getTeamStaffProfiles(team)
          .filter((staff) => staff.id === identity)
          .map((staff) => ({
            seasonId,
            season: getSeasonConfig(seasonId),
            team,
            staff,
          })),
      );
    })
    .sort((a, b) => b.seasonId.localeCompare(a.seasonId));
