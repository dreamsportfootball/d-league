import { useEffect, useState } from 'react';

const STORAGE_KEY = 'dleague:followed-team:v1';
const CHANGE_EVENT = 'dleague:followed-team-change';

const readFollowedTeam = (): string | null => {
  try { return window.localStorage.getItem(STORAGE_KEY); }
  catch { return null; }
};

export const useFollowedTeam = (): {
  followedTeamId: string | null;
  toggleFollowedTeam: (teamId: string) => void;
  clearFollowedTeam: () => void;
} => {
  const [followedTeamId, setTeamId] = useState<string | null>(readFollowedTeam);

  useEffect(() => {
    const sync = () => setTeamId(readFollowedTeam());
    window.addEventListener('storage', sync);
    window.addEventListener(CHANGE_EVENT, sync);
    return () => {
      window.removeEventListener('storage', sync);
      window.removeEventListener(CHANGE_EVENT, sync);
    };
  }, []);

  const update = (teamId: string | null): void => {
    try {
      if (teamId) window.localStorage.setItem(STORAGE_KEY, teamId);
      else window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Private browsing may disable persistence; still update this view.
    }
    setTeamId(teamId);
    window.dispatchEvent(new Event(CHANGE_EVENT));
  };
  return {
    followedTeamId,
    toggleFollowedTeam: (teamId) => update(followedTeamId === teamId ? null : teamId),
    clearFollowedTeam: () => update(null),
  };
};
