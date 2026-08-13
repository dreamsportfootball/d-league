import React, { useEffect, useMemo, useState } from 'react';
import { CalendarClock, MapPin } from 'lucide-react';
import { createPortal } from 'react-dom';
import { Link, useLocation } from 'react-router-dom';
import { isSeasonId } from '../config/seasons';
import { useSeason } from '../hooks/useSeason';
import { getTeamHistory } from '../services/entityData';
import { getSeasonData } from '../services/seasonDataJson';
import { MatchStatus, type Match } from '../types';
import { formatTaipeiDate, formatTaipeiDateWithWeekday, formatTaipeiMonthDayWeekday, formatTaipeiTime } from '../utils/dateFormat';

const VENUE_MAP_URL = 'https://share.google/rI921QclMDxQ37xFg';

const ScheduleAutoPosition: React.FC = () => {
  const location = useLocation();
  const { seasonData } = useSeason();
  const targetMatch = useMemo(() => {
    if (location.pathname !== '/schedule' || seasonData.matches.length === 0) return null;
    const sorted = seasonData.matches.slice().sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    const now = Date.now();
    return sorted.find((match) => new Date(match.timestamp).getTime() >= now) ?? sorted[sorted.length - 1] ?? null;
  }, [location.pathname, seasonData.matches]);

  useEffect(() => {
    if (!targetMatch || location.pathname !== '/schedule' || new URLSearchParams(location.search).has('match')) return;
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
  }, [location.pathname, location.search, targetMatch]);

  return null;
};

const TeamQuickSummary: React.FC = () => {
  const location = useLocation();
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);
  const identityId = location.pathname.startsWith('/teams/') ? decodeURIComponent(location.pathname.split('/').filter(Boolean)[1] ?? '') : '';
  const requestedSeason = new URLSearchParams(location.search).get('season');

  const payload = useMemo(() => {
    if (!identityId) return null;
    const history = getTeamHistory(identityId);
    if (history.length === 0) return null;
    const record = (isSeasonId(requestedSeason) ? history.find((item) => item.seasonId === requestedSeason) : undefined) ?? history[0];
    const matches = record.data.matches
      .filter((match) => match.homeTeamId === record.team.id || match.awayTeamId === record.team.id)
      .slice()
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    const now = Date.now();
    const nextMatch = matches.find((match) => match.status === MatchStatus.SCHEDULED && new Date(match.timestamp).getTime() >= now)
      ?? matches.find((match) => match.status === MatchStatus.SCHEDULED)
      ?? null;
    const recentMatch = matches
      .filter((match) => match.status === MatchStatus.FINISHED)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0] ?? null;
    return { ...record, nextMatch, recentMatch };
  }, [identityId, requestedSeason]);

  useEffect(() => {
    if (!payload || !location.pathname.startsWith('/teams/')) {
      setPortalTarget(null);
      return;
    }
    let mount: HTMLDivElement | null = null;
    const timer = window.setTimeout(() => {
      const hero = document.querySelector<HTMLElement>('#main-content > div > section');
      if (!hero || hero.nextElementSibling?.getAttribute('data-team-quick-summary') === 'true') return;
      mount = document.createElement('div');
      mount.setAttribute('data-team-quick-summary', 'true');
      hero.insertAdjacentElement('afterend', mount);
      setPortalTarget(mount);
    }, 0);
    return () => {
      window.clearTimeout(timer);
      setPortalTarget(null);
      mount?.remove();
      document.querySelector('[data-team-quick-summary="true"]')?.remove();
    };
  }, [location.pathname, location.search, payload]);

  if (!payload || !portalTarget || (!payload.nextMatch && !payload.recentMatch)) return null;

  const renderMatch = (label: string, match: Match, result = false) => {
    const opponentId = match.homeTeamId === payload.team.id ? match.awayTeamId : match.homeTeamId;
    const opponent = payload.data.teamMap[opponentId];
    if (!opponent) return null;
    const isHome = match.homeTeamId === payload.team.id;
    const score = match.homeScore !== null && match.awayScore !== null ? `${match.homeScore} - ${match.awayScore}` : 'VS';
    return (
      <Link to={`/schedule?season=${payload.seasonId}&match=${match.id}`} className="group flex min-h-[92px] items-center justify-between gap-4 bg-white px-5 py-4 transition-colors hover:bg-neutral-50 md:px-6">
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-brand-blue">{label}</p>
          <p className="mt-1.5 text-xs font-semibold text-neutral-400">{formatTaipeiMonthDayWeekday(match.timestamp)} · {formatTaipeiTime(match.timestamp)}</p>
          <p className="mt-1 truncate text-sm font-black text-brand-black">{isHome ? '主場' : '客場'} · {opponent.name}</p>
        </div>
        <div className="shrink-0 text-right">
          {result ? <p className="font-display text-2xl font-black tabular-nums text-brand-black">{score}</p> : <CalendarClock className="ml-auto h-5 w-5 text-brand-blue" />}
          <p className="mt-1 text-[10px] font-bold text-neutral-400 group-hover:text-brand-blue">查看詳情 →</p>
        </div>
      </Link>
    );
  };

  return createPortal(
    <section className="border-b border-neutral-200 bg-neutral-100" aria-label="球隊近期賽事摘要">
      <div className={`mx-auto grid max-w-7xl gap-px bg-neutral-200 px-0 ${payload.nextMatch && payload.recentMatch ? 'md:grid-cols-2' : ''}`}>
        {payload.nextMatch && renderMatch('下一場', payload.nextMatch)}
        {payload.recentMatch && renderMatch('最近賽果', payload.recentMatch, true)}
      </div>
    </section>,
    portalTarget,
  );
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
    <ScheduleAutoPosition />
    <TeamQuickSummary />
    <MatchVenuePortal />
  </>
);

export default ExperienceEnhancements;
