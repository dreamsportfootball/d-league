import React, { useMemo, useRef, useState } from 'react';
import { ArrowUpRight, Instagram, Youtube } from 'lucide-react';
import DataFilterToolbar from '../components/DataFilterToolbar';
import EmptyState from '../components/EmptyState';
import ResponsiveFilterDrawer, { type FilterDrawerField } from '../components/ResponsiveFilterDrawer';
import SeasonPageHeader from '../components/SeasonPageHeader';
import { useSeason } from '../hooks/useSeason';
import { getSeasonData } from '../services/seasonDataJson';
import type { MediaAlbum } from '../types/media';
import type { SeasonId } from '../types/season';

const formatMediaDate = (value: string): string =>
  value.replaceAll('.', '/').replaceAll('-', '/');

const ZenAlbum: React.FC<{ album: MediaAlbum }> = ({ album }) => (
  <a
    href={album.link}
    target="_blank"
    rel="noopener noreferrer"
    className="group block focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-4"
  >
    <div className="relative mb-4 aspect-[3/2] overflow-hidden bg-neutral-100">
      <img
        src={album.cover}
        alt={album.title}
        loading="lazy"
        className="h-full w-full object-cover transition-transform duration-700 ease-out md:group-hover:scale-105"
      />
    </div>

    <div className="flex flex-col items-start">
      <span className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-500">
        {formatMediaDate(album.date)}
      </span>
      <span className="mb-2 inline-flex min-h-11 items-center space-x-1 text-[11px] font-bold text-brand-blue transition-colors group-hover:text-blue-800">
        <span className="border-b border-transparent pb-0.5 transition-colors group-hover:border-blue-800">查看相簿</span>
        <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
      </span>
      <h3 className="text-pretty font-display text-xl font-bold leading-tight text-brand-black">{album.title}</h3>
    </div>
  </a>
);

const PhotoUsageNotice: React.FC = () => (
  <section aria-labelledby="photo-usage-notice-title">
    <h2 id="photo-usage-notice-title" className="mb-0 text-xs font-bold leading-5 text-brand-black md:text-sm">
      照片使用須知
    </h2>
    <p className="text-xs leading-5 text-neutral-500 md:text-sm md:leading-5">
      參賽球隊及球員可免費下載照片，供個人或球隊非商業分享；發布時請標記攝影師及 D LEAGUE 官方帳號。不確定攝影師或有商業用途，請先聯絡主辦單位確認。
    </p>
  </section>
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
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [draftSeasonId, setDraftSeasonId] = useState<SeasonId>(activeSeasonId);
  const dragRef = useRef({ active: false, startX: 0, scrollLeft: 0, moved: false });

  const sortedSeasons = useMemo(
    () => [...availableSeasons].sort((a, b) => b.id.localeCompare(a.id)),
    [availableSeasons],
  );
  const draftSeason = availableSeasons.find((season) => season.id === draftSeasonId) ?? activeSeason;
  const alternativeSeason = sortedSeasons.find((season) =>
    season.id !== activeSeasonId &&
    (getSeasonData(season.id).albums.length > 0 || Boolean(season.youtubePlaylistEmbedUrl)),
  );
  const reversedAlbums = useMemo(
    () => seasonData.albums.slice().reverse(),
    [seasonData.albums],
  );

  const stopGalleryDrag = () => {
    dragRef.current.active = false;
    if (galleryRef.current) galleryRef.current.style.scrollSnapType = '';
  };

  const onGalleryMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    const gallery = galleryRef.current;
    if (!gallery) return;
    dragRef.current = {
      active: true,
      startX: event.clientX,
      scrollLeft: gallery.scrollLeft,
      moved: false,
    };
  };

  const onGalleryMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    const gallery = galleryRef.current;
    const drag = dragRef.current;
    if (!gallery || !drag.active) return;
    if ((event.buttons & 1) === 0) {
      stopGalleryDrag();
      return;
    }
    const distance = event.clientX - drag.startX;
    if (!drag.moved && Math.abs(distance) < 6) return;
    if (!drag.moved) {
      drag.moved = true;
      gallery.style.scrollSnapType = 'none';
    }
    event.preventDefault();
    gallery.scrollLeft = drag.scrollLeft - distance;
  };

  const onGalleryClickCapture = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!dragRef.current.moved) return;
    event.preventDefault();
    event.stopPropagation();
    dragRef.current.moved = false;
  };

  const onGalleryKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget) return;
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    galleryRef.current?.scrollBy({
      left: (event.key === 'ArrowRight' ? 1 : -1) * 320,
      behavior: 'smooth',
    });
  };

  const hasMedia =
    reversedAlbums.length > 0 ||
    Boolean(activeSeason.youtubePlaylistEmbedUrl);
  const mediaItemCount =
    reversedAlbums.length + (activeSeason.youtubePlaylistEmbedUrl ? 1 : 0);
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
            <div className="mt-6 md:mt-8">
              <PhotoUsageNotice />
            </div>
          </>
        ) : (
          <>
            {reversedAlbums.length > 0 && (
              <div className="mb-12 md:mb-16">
                <div className="mb-6 flex items-center md:mb-8">
                  <div className="flex items-center">
                    <div className="mr-4 h-[2px] w-8 bg-brand-black" />
                    <h2 className="font-display text-xl font-bold uppercase tracking-widest text-brand-black">
                      賽事相簿
                    </h2>
                  </div>

                </div>

                <div
                  ref={galleryRef}
                  role="region"
                  aria-label="賽事相簿，可左右滑動或使用方向鍵瀏覽"
                  tabIndex={0}
                  onMouseDown={onGalleryMouseDown}
                  onMouseMove={onGalleryMouseMove}
                  onMouseUp={stopGalleryDrag}
                  onMouseLeave={stopGalleryDrag}
                  onClickCapture={onGalleryClickCapture}
                  onDragStart={(event) => event.preventDefault()}
                  onKeyDown={onGalleryKeyDown}
                  className="no-scrollbar flex cursor-grab snap-x space-x-6 overflow-x-auto pb-6 pt-1 select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue active:cursor-grabbing"
                >
                  {reversedAlbums.map((album) => (
                    <div key={album.id} className="w-[80vw] shrink-0 snap-start sm:w-[400px]">
                      <ZenAlbum album={album} />
                    </div>
                  ))}
                </div>
                <div className="mt-6 md:mt-8">
                  <PhotoUsageNotice />
                </div>
              </div>
            )}

            {reversedAlbums.length === 0 && (
              <div className="mb-8">
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

        <div className="mt-16">
          <div className="flex w-full justify-center">
            <div className="mb-8 h-px w-3/4 bg-neutral-100 md:mb-10" />
          </div>

          <div className="flex flex-col items-center">
            <p className="mb-3 text-xs font-bold uppercase tracking-widest text-neutral-400">追蹤我們</p>
            <div className="flex space-x-6">
              <a
                href="https://www.youtube.com/@DreamSportFootball"
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
    </div>
  );
};

export default MediaPage;
