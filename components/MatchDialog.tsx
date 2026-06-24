import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Copy,
  ExternalLink,
  Image as ImageIcon,
  MapPin,
  Newspaper,
  Share2,
  Users,
  Video,
  X,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useSeason } from '../hooks/useSeason';
import { MatchStatus } from '../types';
import MatchEvents from './MatchEvents';

interface MatchDialogProps {
  matchId: string | null;
  onClose: () => void;
  onSelectMatch: (matchId: string) => void;
}

const formatDateTime = (timestamp: string) => {
  const date = new Date(timestamp);
  return {
    date: date.toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      weekday: 'short',
    }),
    time: date.toLocaleTimeString('zh-TW', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }),
  };
};

const MatchDialog: React.FC<MatchDialogProps> = ({ matchId, onClose, onSelectMatch }) => {
  const { activeSeason, seasonData } = useSeason();
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const [shareStatus, setShareStatus] = useState<'IDLE' | 'COPIED' | 'FAILED'>('IDLE');

  const match = useMemo(
    () => seasonData.matches.find((item) => item.id === matchId) ?? null,
    [matchId, seasonData.matches],
  );

  const relatedMatches = useMemo(() => {
    if (!match) return [];
    return seasonData.matches
      .filter((item) => item.league === match.league)
      .slice()
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }, [match, seasonData.matches]);

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
      ).filter((element) => !element.hasAttribute('disabled'));
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
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
  const { date, time } = formatDateTime(match.timestamp);
  const isFinished = match.status === MatchStatus.FINISHED;
  const statusLabel = isFinished ? '完賽' : '即將開賽';

  const handleShare = async () => {
    const shareData = {
      title: `${homeTeam.name} vs ${awayTeam.name}｜${activeSeason.displayName}`,
      text: `${match.league} 第 ${match.round} 輪｜${homeTeam.name} vs ${awayTeam.name}`,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        return;
      }
      await navigator.clipboard.writeText(window.location.href);
      setShareStatus('COPIED');
    } catch {
      setShareStatus('FAILED');
    }
  };

  return (
    <div className="fixed inset-0 z-[1100] flex items-end justify-center sm:items-center sm:p-6">
      <button
        type="button"
        aria-label="關閉比賽詳情"
        className="absolute inset-0 bg-black/65 backdrop-blur-sm"
        onClick={onClose}
      />

      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="match-dialog-title"
        className="relative flex max-h-[100dvh] w-full max-w-3xl flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:max-h-[92dvh] sm:rounded-2xl"
      >
        <div className="relative shrink-0 border-b border-neutral-100 bg-neutral-50 px-5 pb-6 pt-5 sm:px-8 sm:pt-7">
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white text-neutral-500 shadow-sm transition-colors hover:bg-neutral-100 hover:text-brand-black focus:outline-none focus:ring-2 focus:ring-brand-blue"
            aria-label="關閉"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="mb-5 pr-12 text-center">
            <span className="inline-flex rounded-full bg-brand-blue/10 px-3 py-1 text-xs font-black uppercase tracking-widest text-brand-blue">
              {match.league} · 第 {match.round} 輪
            </span>
            <div className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs font-medium text-neutral-500">
              <span className="flex items-center">
                <CalendarDays className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
                {date} {time}
              </span>
              <span className="flex items-center">
                <MapPin className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
                {match.venue}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 sm:gap-8">
            <Link
              to={`/teams/${homeTeam.id}?season=${activeSeason.id}`}
              onClick={onClose}
              className="group flex min-w-0 flex-col items-center"
            >
              <img src={homeTeam.logo} alt={homeTeam.name} className="mb-2 h-16 w-16 object-contain sm:h-20 sm:w-20" />
              <h2 className="max-w-full truncate text-center text-xs font-black text-brand-black group-hover:text-brand-blue sm:text-base">
                {homeTeam.shortName}
              </h2>
            </Link>

            <div className="flex min-w-[92px] flex-col items-center">
              <div id="match-dialog-title" className="font-display text-4xl font-black tabular-nums tracking-tight text-brand-black sm:text-6xl">
                {isFinished ? `${match.homeScore ?? '-'} - ${match.awayScore ?? '-'}` : 'VS'}
              </div>
              <span className="mt-2 text-[10px] font-black uppercase tracking-[0.18em] text-neutral-400">
                {statusLabel}
              </span>
            </div>

            <Link
              to={`/teams/${awayTeam.id}?season=${activeSeason.id}`}
              onClick={onClose}
              className="group flex min-w-0 flex-col items-center"
            >
              <img src={awayTeam.logo} alt={awayTeam.name} className="mb-2 h-16 w-16 object-contain sm:h-20 sm:w-20" />
              <h2 className="max-w-full truncate text-center text-xs font-black text-brand-black group-hover:text-brand-blue sm:text-base">
                {awayTeam.shortName}
              </h2>
            </Link>
          </div>

          {match.administrativeNote && (
            <p className="mx-auto mt-5 max-w-xl rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-center text-xs font-bold leading-5 text-amber-800">
              {match.administrativeNote}
            </p>
          )}
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain bg-white">
          <section className="border-b border-neutral-100 px-5 py-6 sm:px-8">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-[0.18em] text-neutral-500">比賽事件</h3>
              <button
                type="button"
                onClick={handleShare}
                className="inline-flex min-h-10 items-center rounded-full border border-neutral-200 px-4 text-xs font-bold text-brand-black transition-colors hover:border-brand-blue hover:text-brand-blue"
              >
                {shareStatus === 'COPIED' ? <Copy className="mr-2 h-4 w-4" /> : <Share2 className="mr-2 h-4 w-4" />}
                {shareStatus === 'COPIED' ? '連結已複製' : shareStatus === 'FAILED' ? '無法分享' : '分享比賽'}
              </button>
            </div>
            <MatchEvents matchId={match.id} />
          </section>

          {lineup && (
            <section className="border-b border-neutral-100 px-5 py-7 sm:px-8">
              <div className="mb-5 flex items-center">
                <Users className="mr-2 h-4 w-4 text-brand-blue" aria-hidden="true" />
                <h3 className="text-xs font-black uppercase tracking-[0.18em] text-neutral-500">出賽名單</h3>
              </div>
              <div className="grid gap-8 sm:grid-cols-2">
                {[
                  { team: homeTeam, players: homePlayers ?? [] },
                  { team: awayTeam, players: awayPlayers ?? [] },
                ].map(({ team, players }) => (
                  <div key={team.id}>
                    <div className="mb-3 flex items-center border-b border-neutral-100 pb-2">
                      <img src={team.logo} alt="" className="mr-2 h-6 w-6 object-contain" />
                      <p className="text-sm font-black text-brand-black">{team.shortName}</p>
                    </div>
                    {players.length > 0 ? (
                      <div className="space-y-2">
                        {players.map((player) => player && (
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
              <h3 className="mb-4 text-xs font-black uppercase tracking-[0.18em] text-neutral-500">相關內容</h3>
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
