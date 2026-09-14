import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { MapPin } from 'lucide-react';
import { createPortal } from 'react-dom';
import { useLocation } from 'react-router-dom';
import { useSeason } from '../hooks/useSeason';
import { getSeasonData } from '../services/seasonDataJson';
import { MatchStatus, type Match } from '../types';
import { formatTaipeiDate, formatTaipeiDateWithWeekday, formatTaipeiTime } from '../utils/dateFormat';

const VENUE_MAP_URL = 'https://share.google/rI921QclMDxQ37xFg';

interface ScheduleViewSnapshot {
  pathname: string;
  search: string;
  hash: string;
  scrollY: number;
}

const getScheduleViewKey = (pathname: string, search: string): string => {
  const params = new URLSearchParams(search);
  params.delete('match');
  params.sort();
  const normalizedSearch = params.toString();
  return `${pathname}${normalizedSearch ? `?${normalizedSearch}` : ''}`;
};

const isScheduleMatchDialogTransition = (
  previous: ScheduleViewSnapshot,
  current: Pick<ScheduleViewSnapshot, 'pathname' | 'search' | 'hash'>,
): boolean => {
  if (previous.pathname !== '/schedule' || current.pathname !== '/schedule') return false;
  if (previous.hash !== current.hash) return false;

  const previousParams = new URLSearchParams(previous.search);
  const currentParams = new URLSearchParams(current.search);
  const previousMatchId = previousParams.get('match');
  const currentMatchId = currentParams.get('match');
  if (previousMatchId === currentMatchId) return false;

  return getScheduleViewKey(previous.pathname, previous.search) ===
    getScheduleViewKey(current.pathname, current.search);
};

const ScheduleMatchScrollGuard: React.FC = () => {
  const location = useLocation();
  const previousLocationRef = useRef<ScheduleViewSnapshot | null>(null);

  useLayoutEffect(() => {
    const previous = previousLocationRef.current;
    const shouldRestore = Boolean(previous && isScheduleMatchDialogTransition(previous, location));
    const restoredScrollY = shouldRestore && previous ? previous.scrollY : window.scrollY;

    if (shouldRestore) {
      window.scrollTo({ top: restoredScrollY, behavior: 'auto' });
    }

    const currentSnapshot: ScheduleViewSnapshot = {
      pathname: location.pathname,
      search: location.search,
      hash: location.hash,
      scrollY: restoredScrollY,
    };
    previousLocationRef.current = currentSnapshot;

    const handleScroll = () => {
      if (previousLocationRef.current === currentSnapshot) {
        currentSnapshot.scrollY = window.scrollY;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [location.hash, location.pathname, location.search]);

  return null;
};

const ScheduleAutoPosition: React.FC = () => {
  const location = useLocation();
  const { seasonData } = useSeason();
  const positionedViewRef = useRef<string | null>(null);
  const scheduleViewKey = useMemo(
    () => getScheduleViewKey(location.pathname, location.search),
    [location.pathname, location.search],
  );
  const targetMatch = useMemo(() => {
    if (location.pathname !== '/schedule' || seasonData.matches.length === 0) return null;
    const sorted = seasonData.matches.slice().sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    const now = Date.now();
    return sorted.find((match) => new Date(match.timestamp).getTime() >= now) ?? sorted[sorted.length - 1] ?? null;
  }, [location.pathname, seasonData.matches]);

  useEffect(() => {
    if (location.pathname !== '/schedule') return;
    if (new URLSearchParams(location.search).has('match')) {
      positionedViewRef.current = scheduleViewKey;
      return;
    }
    if (!targetMatch || positionedViewRef.current === scheduleViewKey) return;
    positionedViewRef.current = scheduleViewKey;

    const timer = window.setTimeout(() => {
      if (window.scrollY > 420) return;
      const desktopLabel = formatTaipeiDate(targetMatch.timestamp);
      const mobileLabel = formatTaipeiDateWithWeekday(targetMatch.timestamp).replaceAll('.', '/');
      const target = Array.from(document.querySelectorAll<HTMLElement>('#main-content span')).find((element) => {
        const label = element.textContent?.trim();
        return label === desktopLabel || label === mobileLabel;
      });
      if (!target) return;
      target.scrollIntoView({ block: 'start', behavior: 'auto' });
      window.scrollBy({ top: -82, behavior: 'auto' });
    }, 420);
    return () => window.clearTimeout(timer);
  }, [location.pathname, location.search, scheduleViewKey, targetMatch]);

  return null;
};

interface VenuePortalPayload {
  mount: HTMLElement;
  match: Match;
}

const MatchVenuePortal: React.FC = () => {
  const { availableSeasons } = useSeason();
  const [payload, setPayload] = useState<VenuePortalPayload | null>(null);

  useEffect(() => {
    let currentMount: HTMLElement | null = null;
    const scan = () => {
      const dialog = document.querySelector<HTMLElement>('[role="dialog"][aria-labelledby="match-dialog-title"]');
      if (!dialog) {
        currentMount?.remove();
        currentMount = null;
        setPayload(null);
        return;
      }
      const header = dialog.firstElementChild as HTMLElement | null;
      if (!header) return;
      const dialogText = header.innerText;
      let selectedMatch: Match | null = null;
      for (const season of availableSeasons) {
        const data = getSeasonData(season.id);
        selectedMatch = data.matches.find((match) => {
          if (match.status !== MatchStatus.SCHEDULED) return false;
          const home = data.teamMap[match.homeTeamId];
          const away = data.teamMap[match.awayTeamId];
          if (!home || !away) return false;
          return dialogText.includes(home.name) && dialogText.includes(away.name) && dialogText.includes(formatTaipeiTime(match.timestamp));
        }) ?? null;
        if (selectedMatch) break;
      }
      if (!selectedMatch) {
        currentMount?.remove();
        currentMount = null;
        setPayload(null);
        return;
      }
      if (!currentMount || !header.contains(currentMount)) {
        currentMount?.remove();
        currentMount = document.createElement('div');
        currentMount.setAttribute('data-match-venue-enhancement', 'true');
        header.appendChild(currentMount);
      }
      setPayload((current) => current?.mount === currentMount && current.match.id === selectedMatch?.id ? current : { mount: currentMount as HTMLElement, match: selectedMatch as Match });
    };

    scan();
    const observer = new MutationObserver(scan);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => {
      observer.disconnect();
      currentMount?.remove();
      setPayload(null);
    };
  }, [availableSeasons]);

  if (!payload) return null;
  return createPortal(
    <div className="mx-auto mt-5 flex max-w-xl flex-col items-center justify-center gap-2 rounded-xl bg-neutral-50 px-4 py-3 text-center sm:flex-row sm:gap-4">
      <span className="inline-flex items-center text-xs font-bold text-neutral-600"><MapPin className="mr-1.5 h-4 w-4 text-brand-blue" aria-hidden="true" />{payload.match.venue}</span>
      <a href={VENUE_MAP_URL} target="_blank" rel="noopener noreferrer" className="text-xs font-black text-brand-blue hover:underline">查看地圖</a>
    </div>,
    payload.mount,
  );
};

const ExperienceEnhancements: React.FC = () => (
  <>
    <ScheduleMatchScrollGuard />
    <ScheduleAutoPosition />
    <MatchVenuePortal />
  </>
);

export default ExperienceEnhancements;
