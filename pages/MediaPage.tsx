import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowUpRight, ChevronDown, ChevronLeft, ChevronRight, Instagram, X, Youtube } from 'lucide-react';
import DataContentTransition from '../components/DataContentTransition';
import DataFilterToolbar from '../components/DataFilterToolbar';
import EmptyState from '../components/EmptyState';
import ResponsiveFilterDrawer, { type FilterDrawerField } from '../components/ResponsiveFilterDrawer';
import SeasonPageHeader from '../components/SeasonPageHeader';
import { useSeason } from '../hooks/useSeason';
import { getSeasonData } from '../services/seasonDataJson';
import { getMatchDayPhotoCredits, type PhotographerCredit } from '../services/photoCredits';
import { D_LEAGUE_YOUTUBE_URL } from '../config/siteConfig';
import type { MediaAlbum } from '../types/media';
import type { SeasonId } from '../types/season';

const formatMediaDate = (value: string): string =>
  value.replaceAll('.', '/').replaceAll('-', '/');

interface GalleryGroup {
  id: string;
  date: string;
  title: string;
  cover: string;
  albums: MediaAlbum[];
  photographers: PhotographerCredit[];
}

// The same match-day card and gallery chooser serve every season.
// Older seasons may have one shared folder per day rather than per-match folders.
const buildGalleryGroups = (albums: MediaAlbum[], seasonId: SeasonId): GalleryGroup[] => {
  const albumsByDate = new Map<string, MediaAlbum[]>();
  albums.forEach((album) => {
    const dailyAlbums = albumsByDate.get(album.date) ?? [];
    dailyAlbums.push(album);
    albumsByDate.set(album.date, dailyAlbums);
  });

  return Array.from(albumsByDate.entries())
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([date, dailyAlbums], index) => ({
      id: `day-${date}`,
      date,
      title: dailyAlbums.length > 1
        ? `比賽日 ${dailyAlbums[0].matchDay ?? index + 1}`
        : dailyAlbums[0].title,
      cover: dailyAlbums[0].cover,
      albums: dailyAlbums,
      photographers: getMatchDayPhotoCredits(seasonId, date),
    }))
    .reverse();
};

const PhotographerCredits: React.FC<{
  photographers: PhotographerCredit[];
  className?: string;
}> = ({ photographers, className = '' }) => {
  if (photographers.length === 0) return null;

  return (
    <div className={`flex flex-wrap items-center gap-x-3 gap-y-0 ${className}`}>
      {photographers.map(({ instagram, name }) => (
        <a
          key={instagram}
          href={`https://www.instagram.com/${instagram}/`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`前往攝影師 ${name ?? '@' + instagram} 的 Instagram`}
          className="inline-flex min-h-11 min-w-0 max-w-full items-center gap-1.5 rounded-sm text-xs font-medium text-neutral-500 transition-colors hover:text-brand-blue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-2"
        >
          <Instagram className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span className="min-w-0 truncate"><span className="text-neutral-400">PHOTO · </span>{name ? `${name} · @${instagram}` : `@${instagram}`}</span>
        </a>
      ))}
    </div>
  );
};

const ZenAlbum: React.FC<{ group: GalleryGroup; onOpen: () => void }> = ({ group, onOpen }) => (
  <article className="group">
    <button
      type="button"
      onClick={onOpen}
      aria-label={`查看 ${group.title} 相簿，${group.albums.length} 場比賽`}
      className="block w-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-4"
      aria-haspopup="dialog"
    >
      <div className="relative aspect-[3/2] overflow-hidden bg-neutral-100">
        <img
          src={group.cover}
          alt={group.title}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-700 ease-out md:group-hover:scale-105"
        />
      </div>
      <p className="mb-1 mt-3 text-[11px] font-semibold tracking-[0.08em] text-neutral-500">
        {formatMediaDate(group.date)}
      </p>
    </button>
    <div className="flex min-w-0 items-center justify-between gap-2">
      <button
        type="button"
        onClick={onOpen}
        aria-label={`查看 ${group.title} 相簿`}
        aria-haspopup="dialog"
        className="flex min-w-0 flex-1 items-center gap-1.5 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-2"
      >
        <h3 className="min-w-0 text-pretty font-display text-xl font-bold leading-tight text-brand-black">
          {group.title}
        </h3>
        <ArrowUpRight
          className="h-4 w-4 shrink-0 text-neutral-400 transition-colors group-hover:text-brand-blue"
          aria-hidden="true"
        />
      </button>
      <PhotographerCredits
        photographers={group.photographers}
        className="min-w-0 max-w-[59%] shrink-0 justify-end text-right"
      />
    </div>
  </article>
);

const PhotoUsageNotice: React.FC = () => (
  <details className="group mt-3 border-t border-neutral-200">
    <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 py-3 marker:hidden [&::-webkit-details-marker]:hidden">
      <span className="text-[11px] font-medium leading-5 text-neutral-500 md:text-xs">
        相簿照片建議儘早下載保存
      </span>
      <span className="inline-flex shrink-0 items-center gap-1 text-[11px] font-semibold text-brand-blue md:text-xs">
        使用須知
        <ChevronDown className="h-3.5 w-3.5 transition-transform group-open:rotate-180" aria-hidden="true" />
      </span>
    </summary>
    <p className="max-w-3xl pb-4 text-xs leading-6 text-neutral-600">
      相簿整理或連結失效後，照片可能無法再取得。參賽球隊及球員可免費下載照片，供個人或球隊非商業分享；發布時請標記攝影師及 D LEAGUE 官方帳號。不確定攝影師或有商業用途，請先聯絡主辦單位確認。
    </p>
  </details>
);

const MediaPage: React.FC = () => {
  const {
    activeSeasonId,
    activeSeason,
    seasonData,
    availableSeasons,
    setActiveSeason,
  } = useSeason();
  const galleryRef = useRef<HTMLDivElement | null>(null);
  const albumDialogRef = useRef<HTMLDialogElement | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [draftSeasonId, setDraftSeasonId] = useState<SeasonId>(activeSeasonId);

  const sortedSeasons = useMemo(
    () => [...availableSeasons].sort((a, b) => b.id.localeCompare(a.id)),
    [availableSeasons],
  );
  const draftSeason = availableSeasons.find((season) => season.id === draftSeasonId) ?? activeSeason;
  const alternativeSeason = sortedSeasons.find((season) =>
    season.id !== activeSeasonId &&
    (getSeasonData(season.id).albums.length > 0 || Boolean(season.youtubePlaylistEmbedUrl)),
  );
  const galleryGroups = useMemo(
    () => buildGalleryGroups(seasonData.albums, activeSeasonId),
    [seasonData.albums, activeSeasonId],
  );
  const selectedGroup = galleryGroups.find((group) => group.id === selectedGroupId);

  useEffect(() => {
    const dialog = albumDialogRef.current;
    if (!dialog) return;
    if (!selectedGroup) {
      if (dialog.open) dialog.close();
      return;
    }

    // A native modal traps focus but does not lock background scrolling,
    // particularly on touch devices. Keep the page at its original position.
    const scrollY = window.scrollY;
    const body = document.body;
    const html = document.documentElement;
    const previousBody = {
      position: body.style.position,
      top: body.style.top,
      width: body.style.width,
      overflow: body.style.overflow,
    };
    const previousHtmlOverflow = html.style.overflow;

    body.style.position = 'fixed';
    body.style.top = `-${scrollY}px`;
    body.style.width = '100%';
    body.style.overflow = 'hidden';
    html.style.overflow = 'hidden';
    if (!dialog.open) dialog.showModal();

    return () => {
      body.style.position = previousBody.position;
      body.style.top = previousBody.top;
      body.style.width = previousBody.width;
      body.style.overflow = previousBody.overflow;
      html.style.overflow = previousHtmlOverflow;
      window.scrollTo(0, scrollY);
    };
  }, [selectedGroup]);

  const scrollGallery = (direction: 'left' | 'right') => {
    const gallery = galleryRef.current;
    if (!gallery) return;
    const card = gallery.querySelector<HTMLElement>(':scope > div');
    const cardWidth = card?.getBoundingClientRect().width ?? 400;
    gallery.scrollBy({
      left: (direction === 'left' ? -1 : 1) * (cardWidth + 24),
      behavior: 'smooth',
    });
  };

  const hasMedia =
    galleryGroups.length > 0 ||
    Boolean(activeSeason.youtubePlaylistEmbedUrl);
  const mediaItemCount =
    galleryGroups.length + (activeSeason.youtubePlaylistEmbedUrl ? 1 : 0);
  const seasonField: FilterDrawerField = {
    id: 'season',
    label: '賽季',
    value: draftSeasonId,
    displayValue: draftSeason.shortName,
    options: sortedSeasons.map((season) => ({ value: season.id, label: season.shortName })),
    onChange: (value) => setDraftSeasonId(value as SeasonId),
  };

  const openFilters = () => {
    setDraftSeasonId(activeSeasonId);
    setFiltersOpen(true);
  };

  const applyFilters = () => {
    if (draftSeasonId !== activeSeasonId) setActiveSeason(draftSeasonId);
    setFiltersOpen(false);
  };

  return (
    <div className="min-h-[85vh] bg-white pb-24 pt-6 md:pt-24">
      <div className="container mx-auto max-w-7xl px-4 md:px-12">
        <SeasonPageHeader
          title="賽事"
          accent="媒體"
          description={`${activeSeason.displayName} 精彩瞬間與比賽影片`}
          showMobileSeasonSelector={false}
          showDesktopSeasonSelector={false}
        />

        <DataFilterToolbar
          primaryText={activeSeason.shortName}
          secondaryText={`${mediaItemCount} 項媒體`}
          onOpen={openFilters}
          buttonLabel="切換賽季"
          ariaLabel="選擇賽事媒體賽季"
        />

        <DataContentTransition contentKey={activeSeasonId}>
        {!hasMedia ? (
          <>
            <EmptyState
              eyebrow="媒體更新"
              title={`${activeSeason.shortName} 賽事媒體尚未發布`}
              description="賽事相簿及全場影片會在比賽日後陸續更新。"
              showRegistrationLink={false}
              primaryAction={alternativeSeason ? {
                label: `查看 ${alternativeSeason.shortName} 賽事媒體`,
                to: `/media?season=${alternativeSeason.id}`,
              } : undefined}
            />
          </>
        ) : (
          <>
            {galleryGroups.length > 0 && (
              <div className="mb-12 md:mb-16">
                <div className="mb-6 flex items-center justify-between md:mb-8">
                  <div className="flex items-center">
                    <div className="mr-4 h-[2px] w-8 bg-brand-black" />
                    <h2 className="font-display text-xl font-bold uppercase tracking-widest text-brand-black">
                      賽事相簿
                    </h2>
                  </div>
                  <div className="hidden items-center space-x-2 md:flex">
                    <button
                      type="button"
                      onClick={() => scrollGallery('left')}
                      className="flex h-11 w-11 items-center justify-center rounded-full border border-neutral-200 text-neutral-500 transition-colors hover:border-brand-blue hover:text-brand-blue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-2"
                      aria-label="向左捲動"
                    >
                      <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={() => scrollGallery('right')}
                      className="flex h-11 w-11 items-center justify-center rounded-full border border-neutral-200 text-neutral-500 transition-colors hover:border-brand-blue hover:text-brand-blue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-2"
                      aria-label="向右捲動"
                    >
                      <ChevronRight className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                </div>
                <div
                  ref={galleryRef}
                  role="region"
                  aria-label="賽事相簿，可左右滑動瀏覽"
                  className="no-scrollbar flex snap-x snap-proximity space-x-6 overflow-x-auto pb-6 pt-1 scroll-smooth"
                >
                  {galleryGroups.map((group) => (
                    <div key={group.id} className="w-[80vw] shrink-0 snap-start sm:w-[400px]">
                      <ZenAlbum group={group} onOpen={() => setSelectedGroupId(group.id)} />
                    </div>
                  ))}
                </div>
                <PhotoUsageNotice />
              </div>
            )}

            {activeSeason.youtubePlaylistEmbedUrl && (
              <div className="mb-12 md:mb-16">
                <div className="mb-6 flex items-center md:mb-8">
                  <div className="mr-4 h-[2px] w-8 bg-brand-black" />
                  <h2 className="font-display text-xl font-bold uppercase tracking-widest text-brand-black">
                    比賽全場影片
                  </h2>
                </div>

                <div className="w-full">
                  <div className="relative mb-4 aspect-video bg-neutral-100">
                    <iframe
                      className="h-full w-full"
                      src={activeSeason.youtubePlaylistEmbedUrl}
                      title={`${activeSeason.displayName} 比賽影片`}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                      loading="lazy"
                    />
                  </div>
                  <div className="flex flex-col">
                    <h3 className="font-display text-2xl font-bold uppercase leading-tight text-brand-black">
                      {activeSeason.youtubePlaylistLabel ?? `${activeSeason.shortName} 賽季完整賽事`}
                    </h3>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
        </DataContentTransition>

        <div className="mt-16">
          <div className="flex w-full justify-center">
            <div className="mb-8 h-px w-3/4 bg-neutral-100 md:mb-10" />
          </div>

          <div className="flex flex-col items-center">
            <p className="mb-3 text-xs font-bold uppercase tracking-widest text-neutral-400">追蹤我們</p>
            <div className="flex space-x-6">
              <a
                href={D_LEAGUE_YOUTUBE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex min-h-11 items-center rounded-sm text-xs font-bold uppercase tracking-widest text-neutral-400 transition-colors hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-2"
              >
                <Youtube className="mr-2 h-4 w-4" aria-hidden="true" />
                <span className="translate-y-[1px] border-b border-transparent transition-colors group-hover:border-red-600">YouTube</span>
              </a>

              <a
                href="https://www.instagram.com/d.league_tw/"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex min-h-11 items-center rounded-sm text-xs font-bold uppercase tracking-widest text-neutral-400 transition-colors hover:text-pink-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-2"
              >
                <Instagram className="mr-2 h-4 w-4" aria-hidden="true" />
                <span className="translate-y-[1px] border-b border-transparent transition-colors group-hover:border-pink-600">Instagram</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      <ResponsiveFilterDrawer
        open={filtersOpen}
        fields={[seasonField]}
        onClose={() => setFiltersOpen(false)}
        onClear={() => setDraftSeasonId(activeSeasonId)}
        clearDisabled={draftSeasonId === activeSeasonId}
        onApply={applyFilters}
        applyLabel="查看賽事媒體"
        title="篩選賽事媒體"
        subtitle="目前可依賽季切換媒體內容"
      />

      <dialog
        ref={albumDialogRef}
        aria-labelledby="match-day-albums-title"
        onCancel={(event) => {
          event.preventDefault();
          setSelectedGroupId(null);
        }}
        onClose={() => setSelectedGroupId(null)}
        onClick={(event) => {
          if (event.target === event.currentTarget) setSelectedGroupId(null);
        }}
        className="fixed inset-0 m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-2xl overflow-hidden rounded-[20px] border-0 bg-white p-0 text-brand-black shadow-2xl backdrop:bg-black/65 sm:rounded-[24px]"
      >
        {selectedGroup && (
          <>
            <div className="flex items-start justify-between border-b border-neutral-200 px-5 py-5 sm:px-8 sm:py-6">
              <div className="min-w-0 pr-3">
                <p className="text-xs font-bold tracking-widest text-neutral-500">{formatMediaDate(selectedGroup.date)}</p>
                <h2 id="match-day-albums-title" className="mt-1 font-display text-2xl font-bold leading-tight">
                  {selectedGroup.title}
                </h2>
                <p className="mt-2 text-sm text-neutral-500">
                  {selectedGroup.albums.length > 1
                    ? '選擇比賽，查看 Google Drive 照片'
                    : '查看此比賽日的 Google Drive 相簿'}
                </p>
                <PhotographerCredits photographers={selectedGroup.photographers} className="mt-1" />
              </div>
              <button
                type="button"
                onClick={() => setSelectedGroupId(null)}
                aria-label="關閉比賽日相簿"
                className="flex h-11 w-11 shrink-0 items-center justify-center text-neutral-500 transition-colors hover:text-brand-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
            <div className="max-h-[65dvh] overflow-y-auto overscroll-contain px-5 py-2 sm:px-8">
              {selectedGroup.albums.map((album, index) => (
                <a
                  key={album.id}
                  href={album.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex min-h-24 items-center gap-4 border-b border-neutral-100 py-3 text-left last:border-b-0 hover:text-brand-blue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue sm:gap-5"
                >
                  <img src={album.thumbnail ?? album.cover} alt="" loading="lazy" className="h-16 w-24 shrink-0 object-cover sm:h-20 sm:w-32" />
                  <div className="min-w-0 flex-1">
                    <span className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-neutral-500">
                      {selectedGroup.albums.length > 1 ? `第 ${index + 1} 場` : '全日照片'}
                    </span>
                    <span className="block text-sm font-bold leading-relaxed sm:text-base">{album.title}</span>
                  </div>
                  <ArrowUpRight className="h-5 w-5 shrink-0 text-brand-blue" aria-hidden="true" />
                </a>
              ))}
            </div>
          </>
        )}
      </dialog>
    </div>
  );
};

export default MediaPage;
