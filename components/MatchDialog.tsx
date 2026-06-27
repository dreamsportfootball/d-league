import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Copy,
  ExternalLink,
  Image as ImageIcon,
  Newspaper,
  Share2,
  Users,
  Video,
  X,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { CURRENT_SEASON_ID } from '../config/siteConfig';
import { useSeason } from '../hooks/useSeason';
import { MatchStatus, type Match } from '../types';
import type { SeasonTeam } from '../types/team';
import { formatTaipeiMonthDayWeekday, formatTaipeiTime } from '../utils/dateFormat';
import { buildMatchInfoText } from '../utils/matchInfoText';
import AutoFitText from './AutoFitText';
import MatchEvents from './MatchEvents';

interface MatchDialogProps {
  matchId: string | null;
  onClose: () => void;
  onSelectMatch: (matchId: string) => void;
  navigationMatchIds?: string[];
}

type ActionStatus = 'IDLE' | 'COPIED' | 'FAILED';

const copyText = async (value: string): Promise<void> => {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const textarea = document.createElement('textarea');
  textarea.value = value;
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand('copy');
  textarea.remove();
};

const MatchDialog: React.FC<MatchDialogProps> = ({
  matchId,
  onClose,
  onSelectMatch,
  navigationMatchIds,
}) => {
  const { activeSeason, seasonData } = useSeason();
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const [shareStatus, setShareStatus] = useState<ActionStatus>('IDLE');
  const [copyStatus, setCopyStatus] = useState<ActionStatus>('IDLE');

  const match = useMemo(
    () => seasonData.matches.find((item) => item.id === matchId) ?? null,
    [matchId, seasonData.matches],
  );

  const relatedMatches = useMemo(() => {
    if (!match) return [];

    if (navigationMatchIds) {
      const matchMap = new Map<string, Match>(
        seasonData.matches.map((item): [string, Match] => [item.id, item]),
      );
      return navigationMatchIds
        .map((id) => matchMap.get(id))
        .filter((item): item is Match => item !== undefined);
    }

    return seasonData.matches
      .filter((item) => item.league === match.league)
      .slice()
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }, [match, navigationMatchIds, seasonData.matches]);

  const currentIndex = match ? relatedMatches.findIndex((item) => item.id === match.id) : -1;
  const previousMatch = currentIndex > 0 ? relatedMatches[currentIndex - 1] : null;
  const nextMatch = currentIndex >= 0 && currentIndex < relatedMatches.length - 1
    ? relatedMatches[currentIndex + 1]
    : null;

  useEffect(() => {
    if (!match) return;
    previousFocusRef.current = document.activeElement as HTMLElement | null;
    document.body.style.overflow = 'hidden';
    window.setTimeout(() => closeButtonRef.current?.focus(), 0);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== 'Tab' || !dialogRef.current) return;
      const focusable = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      ) as HTMLElement[];
      const enabledFocusable = focusable.filter((element) => !element.hasAttribute('disabled'));
      if (enabledFocusable.length === 0) return;
      const first = enabledFocusable[0];
      const last = enabledFocusable[enabledFocusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
      previousFocusRef.current?.focus();
    };
  }, [match, onClose]);

  useEffect(() => {
    setShareStatus('IDLE');
    setCopyStatus('IDLE');
  }, [matchId]);

  if (!match) return null;

  const homeTeam = seasonData.teamMap[match.homeTeamId];
  const awayTeam = seasonData.teamMap[match.awayTeamId];
  if (!homeTeam || !awayTeam) return null;

  const lineup = seasonData.lineups[match.id];
  const homePlayers = lineup?.homePlayerIds
    .map((playerId) => seasonData.players.find((player) => player.id === playerId))
    .filter(Boolean)
    .sort((a, b) => (a?.number ?? 0) - (b?.number ?? 0));
  const awayPlayers = lineup?.awayPlayerIds
    .map((playerId) => seasonData.players.find((player) => player.id === playerId))
    .filter(Boolean)
    .sort((a, b) => (a?.number ?? 0) - (b?.number ?? 0));
  const album = match.albumId
    ? seasonData.albums.find((item) => item.id === match.albumId)
    : undefined;
  const report = match.reportArticleId
    ? seasonData.news.find((item) => item.id === match.reportArticleId)
    : undefined;
  const matchEvents = seasonData.matchEvents[match.id] ?? [];
  const displayDate = formatTaipeiMonthDayWeekday(match.timestamp);
  const time = formatTaipeiTime(match.timestamp);
  const isFinished = match.status === MatchStatus.FINISHED;
  const displayStatusLabel = isFinished ? '比賽結束' : '尚未開賽';
  const teamProfilesEnabled = activeSeason.id === CURRENT_SEASON_ID;
  const matchInfoText = buildMatchInfoText({
    match,
    seasonShortName: activeSeason.shortName,
    homeTeamName: homeTeam.name,
    homeTeamShortName: homeTeam.shortName || homeTeam.name,
    awayTeamName: awayTeam.name,
    awayTeamShortName: awayTeam.shortName || awayTeam.name,
    events: matchEvents,
    detailUrl: window.location.href,
  });

  const handleShare = async () => {
    const shareData = {
      title: `${homeTeam.name} vs ${awayTeam.name}｜${activeSeason.displayName}`,
      text: matchInfoText,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        return;
      }
      await copyText(window.location.href);
      setShareStatus('COPIED');
      window.setTimeout(() => setShareStatus('IDLE'), 2200);
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      setShareStatus('FAILED');
    }
  };

  const handleCopyInfo = async () => {
    try {
      await copyText(matchInfoText);
      setCopyStatus('COPIED');
      window.setTimeout(() => setCopyStatus('IDLE'), 2200);
    } catch {
      setCopyStatus('FAILED');
    }
  };

  const renderTeamIdentity = (team: SeasonTeam) => {
    const content = (
      <>
        <img
          src={team.logo}
          alt={team.name}
          className="mb-3 h-[68px] w-[68px] object-contain sm:mb-4 sm:h-24 sm:w-24"
        />
        <div className="w-full min-w-0 text-center">
          <AutoFitText
            text={team.name}
            minFontSize={8}
            className="text-sm font-black text-brand-black transition-colors group-hover:text-brand-blue sm:text-base"
          />
        </div>
      </>
    );

    return teamProfilesEnabled ? (
      <Link
        to={`/teams/${team.id}?season=${activeSeason.id}`}
        onClick={onClose}
        className="group flex min-w-0 flex-col items-center rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-2"
      >
        {content}
      </Link>
    ) : (
      <div className="group flex min-w-0 flex-col items-center">{content}</div>
    );
  };

  return (
    <div className="fixed inset-0 z-[1100] flex items-center justify-center p-3 sm:p-6">
      <button
        type="button"
        aria-label="關閉比賽詳情"
        className="absolute inset-0 bg-black/60 backdrop-blur-[3px]"
        onClick={onClose}
      />

      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="match-dialog-title"
        className="relative flex max-h-[calc(100dvh-1.5rem)] w-full max-w-[860px] flex-col overflow-hidden rounded-[24px] bg-white shadow-[0_28px_80px_rgba(0,0,0,0.28)] ring-1 ring-black/5 sm:max-h-[92dvh] sm:rounded-[30px]"
      >
        <div className="relative shrink-0 bg-white px-5 pb-5 pt-6 sm:px-12 sm:pb-7 sm:pt-9">
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            className="absolute right-3 top-3 z-10 flex h-11 w-11 items-center justify-center rounded-full text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-brand-black focus:outline-none focus:ring-2 focus:ring-brand-blue sm:right-5 sm:top-5"
            aria-label="關閉"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="mb-6 pr-10 text-center sm:mb-8 sm:pr-0">
            <p className="text-[13px] font-black tracking-[0.08em] text-brand-blue sm:text-sm">
              {match.league}・第 {match.round} 輪
            </p>
            <p className="mt-2 text-[11px] font-medium text-neutral-400 sm:text-xs">
              {displayDate}・{time}
            </p>
          </div>

          <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 sm:gap-10">
            {renderTeamIdentity(homeTeam)}

            <div className="flex min-w-[104px] flex-col items-center sm:min-w-[170px]">
              <div
                id="match-dialog-title"
                className="flex items-center justify-center gap-[0.16em] font-display text-[48px] font-black leading-none tabular-nums tracking-[-0.04em] text-brand-black sm:text-[76px]"
                aria-label={isFinished
                  ? `${homeTeam.name} ${match.homeScore ?? '-'} 比 ${match.awayScore ?? '-'} ${awayTeam.name}`
                  : `${homeTeam.name} 對 ${awayTeam.name}`}
              >
                {isFinished ? (
                  <>
                    <span>{match.homeScore ?? '-'}</span>
                    <span aria-hidden="true">-</span>
                    <span>{match.awayScore ?? '-'}</span>
                  </>
                ) : 'VS'}
              </div>
              <span className="mt-2 text-[10px] font-black tracking-[0.12em] text-neutral-400 sm:mt-3 sm:text-[11px]">
                {displayStatusLabel}
              </span>
            </div>

            {renderTeamIdentity(awayTeam)}
          </div>

          <div className="mx-auto mt-7 grid w-full max-w-sm grid-cols-2 gap-2.5 sm:mt-8 sm:flex sm:w-auto sm:max-w-none sm:justify-center">
            <button
              type="button"
              onClick={handleCopyInfo}
              data-analytics-event="match_info_copy"
              data-analytics-label={match.id}
              className="inline-flex min-h-11 items-center justify-center rounded-full border border-neutral-200 bg-white px-4 text-[13px] font-bold text-neutral-600 transition-colors hover:border-neutral-300 hover:bg-neutral-50 hover:text-brand-black active:bg-neutral-100 sm:min-h-9 sm:px-5 sm:text-xs"
            >
              <Copy className="mr-2 h-3.5 w-3.5" />
              {copyStatus === 'COPIED' ? '已複製' : copyStatus === 'FAILED' ? '複製失敗' : '複製比賽資訊'}
            </button>
            <button
              type="button"
              onClick={handleShare}
              data-analytics-event="match_share"
              data-analytics-label={match.id}
              className="inline-flex min-h-11 items-center justify-center rounded-full border border-brand-blue/20 bg-brand-blue/[0.06] px-4 text-[13px] font-bold text-brand-blue transition-colors hover:border-brand-blue/30 hover:bg-brand-blue/[0.1] active:bg-brand-blue/[0.14] sm:min-h-9 sm:px-5 sm:text-xs"
            >
              <Share2 className="mr-2 h-3.5 w-3.5" />
              {shareStatus === 'COPIED' ? '連結已複製' : shareStatus === 'FAILED' ? '無法分享' : '分享比賽'}
            </button>
          </div>

          {match.administrativeNote && (
            <p className="mx-auto mt-5 max-w-xl rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-center text-xs font-bold leading-5 text-amber-800">
              {match.administrativeNote}
            </p>
          )}
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain bg-white">
          <section className="border-b border-neutral-100 px-5 pb-8 pt-2 sm:px-12 sm:pb-10 sm:pt-3">
            <div className="flex items-center justify-center gap-4" aria-hidden="true">
              <span className="h-px w-9 bg-neutral-200 sm:w-12" />
              <h3 className="text-[11px] font-black tracking-[0.12em] text-neutral-400">比賽事件</h3>
              <span className="h-px w-9 bg-neutral-200 sm:w-12" />
            </div>
            <MatchEvents matchId={match.id} />
            <p className="mt-8 text-center text-[10px] font-bold tracking-[0.12em] text-neutral-400 sm:mt-10">
              D LEAGUE 官方賽事紀錄
            </p>
          </section>

          {lineup && (
            <section className="border-b border-neutral-100 px-5 py-7 sm:px-8">
              <div className="mb-5 flex items-center">
                <Users className="mr-2 h-4 w-4 text-brand-blue" aria-hidden="true" />
                <h3 className="text-xs font-black tracking-[0.12em] text-neutral-500">出賽名單</h3>
              </div>
              <div className="grid gap-8 sm:grid-cols-2">
                {[
                  { team: homeTeam, players: homePlayers ?? [] },
                  { team: awayTeam, players: awayPlayers ?? [] },
                ].map(({ team: lineupTeam, players: lineupPlayers }) => (
                  <div key={lineupTeam.id}>
                    <div className="mb-3 flex items-center border-b border-neutral-100 pb-2">
                      <img src={lineupTeam.logo} alt="" className="mr-2 h-6 w-6 shrink-0 object-contain" />
                      <div className="min-w-0 flex-1">
                        <AutoFitText text={lineupTeam.name} maxFontSize={14} minFontSize={7} className="font-black text-brand-black" />
                      </div>
                    </div>
                    {lineupPlayers.length > 0 ? (
                      <div className="space-y-2">
                        {lineupPlayers.map((player) => player && (
                          <div key={player.id} className="grid grid-cols-[2rem_1fr] text-sm">
                            <span className="font-display font-black tabular-nums text-brand-blue">{player.number}</span>
                            <span className="font-bold text-neutral-700">{player.name}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-neutral-400">名單尚未公布</p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {(match.videoUrl || album || report) && (
            <section className="border-b border-neutral-100 px-5 py-7 sm:px-8">
              <h3 className="mb-4 text-xs font-black tracking-[0.12em] text-neutral-500">相關內容</h3>
              <div className="grid gap-3 sm:grid-cols-3">
                {match.videoUrl && (
                  <a
                    href={match.videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex min-h-12 items-center justify-between rounded-lg border border-neutral-200 px-4 text-sm font-bold text-brand-black transition-colors hover:border-brand-blue hover:text-brand-blue"
                  >
                    <span className="flex items-center"><Video className="mr-2 h-4 w-4" />比賽影片</span>
                    <ExternalLink className="h-4 w-4" />
                  </a>
                )}
                {album && (
                  <a
                    href={album.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex min-h-12 items-center justify-between rounded-lg border border-neutral-200 px-4 text-sm font-bold text-brand-black transition-colors hover:border-brand-blue hover:text-brand-blue"
                  >
                    <span className="flex items-center"><ImageIcon className="mr-2 h-4 w-4" />比賽相簿</span>
                    <ExternalLink className="h-4 w-4" />
                  </a>
                )}
                {report && (
                  <Link
                    to={`/news/${report.id}?season=${activeSeason.id}`}
                    onClick={onClose}
                    className="flex min-h-12 items-center justify-between rounded-lg border border-neutral-200 px-4 text-sm font-bold text-brand-black transition-colors hover:border-brand-blue hover:text-brand-blue"
                  >
                    <span className="flex items-center"><Newspaper className="mr-2 h-4 w-4" />賽事戰報</span>
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                )}
              </div>
            </section>
          )}
        </div>

        <div className="grid shrink-0 grid-cols-2 border-t border-neutral-100 bg-neutral-50">
          <button
            type="button"
            disabled={!previousMatch}
            onClick={() => previousMatch && onSelectMatch(previousMatch.id)}
            className="flex min-h-14 items-center justify-start border-r border-neutral-100 px-5 text-left text-xs font-bold text-neutral-500 transition-colors hover:bg-white hover:text-brand-black disabled:cursor-not-allowed disabled:opacity-30 sm:px-8"
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            上一場
          </button>
          <button
            type="button"
            disabled={!nextMatch}
            onClick={() => nextMatch && onSelectMatch(nextMatch.id)}
            className="flex min-h-14 items-center justify-end px-5 text-right text-xs font-bold text-neutral-500 transition-colors hover:bg-white hover:text-brand-black disabled:cursor-not-allowed disabled:opacity-30 sm:px-8"
          >
            下一場
            <ChevronRight className="ml-2 h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default MatchDialog;
