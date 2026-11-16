import React, { useEffect, useMemo, useRef, useState } from 'react';
import { CalendarDays, Search, ShieldCheck, UserRound, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SEASON_IDS } from '../config/siteManifest.js';
import { useModalScrollLock } from '../hooks/useModalScrollLock';
import { getPlayerIdentity, getTeamIdentity } from '../services/entityData';
import { getLatestPlayerImageUrl, getSeasonData } from '../services/seasonDataJson';
import PortraitPhoto from './PortraitPhoto';

interface SearchEntry {
  id: string;
  group: '球隊' | '球員' | '賽事';
  title: string;
  subtitle: string;
  href: string;
  searchable: string;
  seasonPriority: number;
  identityKey?: string;
  imageUrl?: string;
}

interface GlobalSearchProps {
  open: boolean;
  onClose: () => void;
}

const normalize = (value: string): string => value.toLocaleLowerCase('zh-TW').replace(/\s+/g, '');

const SEARCH_ENTRIES: SearchEntry[] = [...SEASON_IDS].reverse().flatMap((seasonId, seasonPriority) => {
  const data = getSeasonData(seasonId);
  const teams: SearchEntry[] = data.teams.filter((team) => team.competitionStatus !== 'WITHDRAWN').map((team) => ({
    id: 'team:' + seasonId + ':' + team.id,
    group: '球隊',
    title: team.name,
    subtitle: seasonId.replace('-', '/') + ' · ' + team.leagueId,
    href: '/teams/' + getTeamIdentity(team) + '?season=' + seasonId,
    searchable: normalize([team.name, team.shortName, team.leagueId, seasonId].join(' ')),
    seasonPriority,
    imageUrl: team.logo,
  }));
  const players: SearchEntry[] = data.players
    .filter((player) => player.rosterStatus !== 'INACTIVE_REPLACED' && player.hideFromTeamRoster !== true)
    .map((player) => {
      const team = data.teamMap[player.teamId];
      return {
        id: 'player:' + seasonId + ':' + player.id,
        group: '球員',
        title: player.name,
        subtitle: (team?.name ?? '未指定球隊') + ' · #' + (player.number ?? '-') + ' · ' + seasonId.replace('-', '/'),
        href: '/players/' + getPlayerIdentity(player) + '?season=' + seasonId,
        searchable: normalize([
          player.name, player.englishName ?? '', String(player.number ?? ''),
          '#' + (player.number ?? ''), team?.name ?? '', team?.shortName ?? '', seasonId,
        ].join(' ')),
        seasonPriority,
        identityKey: 'player:' + getPlayerIdentity(player),
        imageUrl: getLatestPlayerImageUrl(player),
      };
    });
  const matches: SearchEntry[] = data.matches.flatMap((match) => {
    const home = data.teamMap[match.homeTeamId];
    const away = data.teamMap[match.awayTeamId];
    if (!home || !away) return [];
    return [{
      id: 'match:' + seasonId + ':' + match.id,
      group: '賽事' as const,
      title: (home.shortName || home.name) + ' vs ' + (away.shortName || away.name),
      subtitle: seasonId.replace('-', '/') + ' · ' + match.league + ' 第 ' + match.round + ' 輪',
      href: '/matches/' + match.id + '?season=' + seasonId,
      searchable: normalize([
        home.name, away.name, home.shortName, away.shortName,
        match.id, match.league, String(match.round), seasonId,
      ].join(' ')),
      seasonPriority,
    }];
  });
  return [...teams, ...players, ...matches];
});

const searchEntries = (query: string): SearchEntry[] => {
  const tokens = query.trim().split(/\s+/).filter(Boolean).map(normalize);
  if (!tokens.length) return [];
  const ranked = SEARCH_ENTRIES.flatMap((entry) => {
    if (!tokens.every((token) => entry.searchable.includes(token))) return [];
    const name = normalize(entry.title);
    const score = tokens.reduce((value, token) => value + (
      name === token ? 100 : name.startsWith(token) ? 60 : name.includes(token) ? 35 : 5
    ), 0) - entry.seasonPriority * 3;
    return [{ entry, score }];
  })
    .sort((a, b) => b.score - a.score || a.entry.title.localeCompare(b.entry.title, 'zh-TW'))
;
  const seen = new Set<string>();
  const results: SearchEntry[] = [];
  for (const { entry } of ranked) {
    const key = entry.identityKey ?? entry.id;
    if (seen.has(key)) continue;
    seen.add(key);
    results.push(entry);
    if (results.length === 12) break;
  }
  return results;
};

const GlobalSearch: React.FC<GlobalSearchProps> = ({ open, onClose }) => {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const closeRef = useRef(onClose);
  const focusBeforeOpen = useRef<HTMLElement | null>(null);
  const results = useMemo(() => searchEntries(query), [query]);
  useModalScrollLock(open);

  useEffect(() => { closeRef.current = onClose; }, [onClose]);
  useEffect(() => {
    if (!open) return;
    focusBeforeOpen.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    inputRef.current?.focus();
    const handleKeydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeRef.current();
      }
    };
    document.addEventListener('keydown', handleKeydown);
    return () => {
      document.removeEventListener('keydown', handleKeydown);
      focusBeforeOpen.current?.focus();
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[1200] flex items-start justify-center px-3 pt-[min(15vh,110px)] sm:px-6" role="presentation">
      <button type="button" className="absolute inset-0 bg-black/70" onClick={onClose} aria-label="關閉搜尋" />
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="dleague-global-search-title"
        className="relative flex max-h-[75dvh] w-full max-w-[680px] flex-col overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-2xl"
        onKeyDown={(event) => {
          if (event.key !== 'Tab') return;
          const items = (Array.from(event.currentTarget.querySelectorAll('input, button, a[href]')) as HTMLElement[]).filter((el) => !el.hasAttribute('disabled'));
          if (items.length === 0) return;
          const first = items[0];
          const last = items[items.length - 1];
          if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
          else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
        }}
      >
        <div className="flex items-center gap-3 border-b border-neutral-200 px-4 sm:px-6">
          <Search className="h-5 w-5 shrink-0 text-brand-blue" aria-hidden="true" />
          <label id="dleague-global-search-title" htmlFor="dleague-search-input" className="sr-only">搜尋球隊、球員與賽事</label>
          <input
            ref={inputRef}
            id="dleague-search-input"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="搜尋球隊、球員、背號或比賽"
            autoComplete="off"
            className="h-16 w-full min-w-0 bg-transparent text-base font-medium text-brand-black outline-none placeholder:text-neutral-400"
          />
          <button type="button" onClick={onClose} className="flex h-11 w-11 shrink-0 items-center justify-center text-neutral-500 hover:text-brand-blue focus-visible:outline-2 focus-visible:outline-brand-blue" aria-label="關閉搜尋">
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
        <div className="min-h-24 overflow-y-auto overscroll-contain py-3" aria-live="polite">
          {!query.trim() ? (
            <p className="px-5 py-7 text-center text-sm text-neutral-500">輸入姓名、背號、球隊或賽事關鍵字</p>
          ) : results.length === 0 ? (
            <p className="px-5 py-7 text-center text-sm text-neutral-500">沒有符合的結果，請調整關鍵字。</p>
          ) : (
            results.map((item) => (
              <Link key={item.id} to={item.href} onClick={() => { setQuery(''); onClose(); }}
                className="group flex min-h-14 items-center gap-3 px-5 py-3 transition-colors hover:bg-neutral-100 active:bg-neutral-100 focus-visible:bg-neutral-100 focus-visible:outline-2 focus-visible:outline-brand-blue">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-sm bg-neutral-100 text-brand-blue group-hover:bg-white" aria-hidden="true">
                  {item.imageUrl ? (
                    item.group === '球員' ? (
                      <PortraitPhoto src={item.imageUrl} alt="" loading="lazy" className="h-full w-full object-cover object-top" />
                    ) : (
                      <img src={item.imageUrl} alt="" loading="lazy" className="h-full w-full object-contain p-1" />
                    )
                  ) : item.group === '球員' ? <UserRound className="h-4 w-4" /> : item.group === '球隊' ? <ShieldCheck className="h-4 w-4" /> : <CalendarDays className="h-4 w-4" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-bold text-brand-black group-hover:text-brand-blue">{item.title}</span>
                  <span className="block truncate text-xs text-neutral-500">{item.subtitle}</span>
                </span>
                <span className="shrink-0 text-[10px] font-bold text-neutral-500">{item.group}</span>
              </Link>
            ))
          )}
        </div>
        <div className="border-t border-neutral-100 px-5 py-3 text-xs text-neutral-500">可查詢 2026/27 與 2025/26 已公布資料</div>
      </section>
    </div>
  );
};

export default GlobalSearch;
