import { useEffect, useState } from 'react';

const STORAGE_KEY = 'dleague:followed-teams:v2';
const LEGACY_STORAGE_KEY = 'dleague:followed-team:v1';
const CHANGE_EVENT = 'dleague:followed-team-change';

const readFollowedTeams = (): string[] => {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved !== null) {
      const parsed: unknown = JSON.parse(saved);
      return Array.isArray(parsed)
        ? [...new Set(parsed.filter((id): id is string => typeof id === 'string' && id.trim().length > 0))]
        : [];
    }

    // Keep the previously followed team when upgrading from single-team storage.
    const legacyTeamId = window.localStorage.getItem(LEGACY_STORAGE_KEY);
    return legacyTeamId ? [legacyTeamId] : [];
  } catch {
    return [];
  }
};

export const useFollowedTeam = (): {
  followedTeamIds: string[];
  toggleFollowedTeam: (teamId: string) => void;
  removeFollowedTeam: (teamId: string) => void;
  clearFollowedTeams: () => void;
} => {
  const [followedTeamIds, setTeamIds] = useState<string[]>(readFollowedTeams);

  useEffect(() => {
    const sync = () => {
      try {
        // If storage is blocked, a same-tab update is already reflected in state.
        if (window.localStorage.getItem(STORAGE_KEY) === null
            && window.localStorage.getItem(LEGACY_STORAGE_KEY) === null) return;
      } catch {
        return;
      }
      setTeamIds(readFollowedTeams());
    };
    window.addEventListener('storage', sync);
    window.addEventListener(CHANGE_EVENT, sync);
    return () => {
      window.removeEventListener('storage', sync);
      window.removeEventListener(CHANGE_EVENT, sync);
    };
  }, []);

  const update = (teamIds: string[]): void => {
    setTeamIds(teamIds);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(teamIds));
      window.dispatchEvent(new Event(CHANGE_EVENT));
    } catch {
      // Private browsing may disable persistence; the current view still updates.
    }
  };

  return {
    followedTeamIds,
    toggleFollowedTeam: (teamId) => update(
      followedTeamIds.includes(teamId)
        ? followedTeamIds.filter((id) => id !== teamId)
        : [...followedTeamIds, teamId],
    ),
    removeFollowedTeam: (teamId) => update(followedTeamIds.filter((id) => id !== teamId)),
    clearFollowedTeams: () => update([]),
  };
};
