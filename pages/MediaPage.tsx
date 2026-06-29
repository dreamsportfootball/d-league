import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowUpRight, Instagram, Play, Youtube } from 'lucide-react';
import DataFilterToolbar from '../components/DataFilterToolbar';
import EmptyState from '../components/EmptyState';
import ResponsiveFilterDrawer, { type FilterDrawerField } from '../components/ResponsiveFilterDrawer';
import SeasonPageHeader from '../components/SeasonPageHeader';
import { useSeason } from '../hooks/useSeason';
import type { Video } from '../types';
import type { MediaAlbum } from '../types/media';
import type { SeasonId } from '../types/season';

const getMediaYearLabel = (seasonId: SeasonId): string => seasonId.split('-')[0];

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
      <span className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-400">
        {album.date}
      </span>
      <span className="mb-2 inline-flex min-h-11 items-center space-x-1 text-[11px] font-bold text-brand-blue transition-colors group-hover:text-blue-800">
        <span className="border-b border-transparent pb-0.5 transition-all group-hover:border-blue-800">查看相簿</span>
        <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
      </span>
      <h3 className="font-display text-xl font-bold leading-tight text-brand-black">{album.title}</h3>
    </div>
  </a>
);

const HighlightVideo: React.FC<{ video: Video }> = ({ video }) => (
  <a
    href={video.link}
    target="_blank"
    rel="noopener noreferrer"
    className="group block focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-4"
  >
    <div className="relative mb-4 aspect-[4/5] overflow-hidden bg-neutral-100">
      <img
        src={video.thumbnail}
        alt={video.title || 'D LEAGUE 賽事精華'}
        loading="lazy"
        className="h-full w-full object-cover transition-transform duration-700 ease-out md:group-hover:scale-105"
      />
      <div className="absolute inset-0 flex items-center justify-center bg-black/10 transition-colors group-hover:bg-black/20">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/95 text-brand-black shadow-lg">
          <Play className="ml-0.5 h-5 w-5 fill-current" aria-hidden="true" />
        </span>
      </div>
    </div>
    <div className="flex items-center justify-between gap-4 text-[10px] font-bold uppercase tracking-[0.16em] text-neutral-400">
      <span>{video.date}</span>
      <span>{video.duration}</span>
    </div>
    <h3 className="mt-2 font-display text-lg font-bold leading-tight text-brand-black transition-colors group-hover:text-brand-blue">
      {video.title || '賽事精華'}
    </h3>
  </a>
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
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const sortedSeasons = useMemo(
    () => [...availableSeasons].sort((a, b) => b.id.localeCompare(a.id)),
    [availableSeasons],
  );
  const reversedAlbums = useMemo(
    () => seasonData.albums.slice().reverse(),
    [seasonData.albums],
  );
  const highlights = useMemo(
    () => seasonData.media.slice().sort((a, b) => b.date.localeCompare(a.date)),
    [seasonData.media],
  );

  const updateGalleryControls = () => {
    const container = galleryRef.current;
    if (!container) {
      setCanScrollLeft(false);
      setCanScrollRight(false);
      return;
    }
    setCanScrollLeft(container.scrollLeft > 4);
    setCanScrollRight(container.scrollLeft + container.clientWidth < container.scrollWidth - 4);
  };

  useEffect(() => {
    const frame = window.requestAnimationFrame(updateGalleryControls);
    window.addEventListener('resize', updateGalleryControls);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener('resize', updateGalleryControls);
    };
  }, [reversedAlbums]);

  const scrollGallery = (direction: 'left' | 'right') => {
    const container = galleryRef.current;
    if (!container) return;
    container.scrollBy({
      left: direction === 'left' ? -container.clientWidth * 0.8 : container.clientWidth * 0.8,
      behavior: 'smooth',
    });
  };

  const hasMedia =
    reversedAlbums.length > 0 ||
    highlights.length > 0 ||
    Boolean(activeSeason.youtubePlaylistEmbedUrl);
  const mediaItemCount =
    reversedAlbums.length + highlights.length + (activeSeason.youtubePlaylistEmbedUrl ? 1 : 0);
  const yearField: FilterDrawerField = {
    id: 'year',
    label: '年份',
    value: draftSeasonId,
    displayValue: getMediaYearLabel(draftSeasonId),
    options: sortedSeasons.map((season) => ({
      value: season.id,
      label: getMediaYearLabel(season.id),
    })),
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
          primaryText={`${mediaItemCount} 項媒體`}
          secondaryText={getMediaYearLabel(activeSeasonId)}
          onOpen={openFilters}
          ariaLabel="開啟賽事媒體年份篩選"
        />

        {!hasMedia ? (
          <EmptyState
            title="新賽季媒體內容尚未發布"
            description="相簿及比賽影片將於新賽季開始後陸續更新"
            showRegistrationLink={false}
            primaryAction={{
              label: '查看 2025 年賽事媒體',
              to: '/media?season=2025-26',
            }}
          />
        ) : (
          <>
            {reversedAlbums.length > 0 && (
              <div className="mb-12 md:mb-24">
                <div className="mb-8 flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="mr-4 h-[2px] w-8 bg-brand-black" />
                    <h2 className="font-display text-xl font-bold uppercase tracking-widest text-brand-black">
                      賽事相簿
                    </h2>
                  </div>

                  <div className="hidden space-x-2 md:flex">
                    <button
                      type="button"
                      onClick={() => scrollGallery('left')}
                      disabled={!canScrollLeft}
                      className="flex h-11 w-11 items-center justify-center rounded-lg border border-neutral-300 transition-colors hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent"
                      aria-label="上一組相簿"
                    >
                      <span className="text-lg leading-none">‹</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => scrollGallery('right')}
                      disabled={!canScrollRight}
                      className="flex h-11 w-11 items-center justify-center rounded-lg border border-neutral-300 transition-colors hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent"
                      aria-label="下一組相簿"
                    >
                      <span className="text-lg leading-none">›</span>
                    </button>
                  </div>
                </div>

                <div
                  ref={galleryRef}
                  onScroll={updateGalleryControls}
                  className="no-scrollbar flex snap-x space-x-6 overflow-x-auto pb-6 pt-1"
                >
                  {reversedAlbums.map((album) => (
                    <div key={album.id} className="w-[80vw] shrink-0 snap-start sm:w-[400px]">
                      <ZenAlbum album={album} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {highlights.length > 0 && (
              <section className="mb-12 md:mb-24">
                <div className="mb-8 flex items-center">
                  <div className="mr-4 h-[2px] w-8 bg-brand-black" />
                  <h2 className="font-display text-xl font-bold uppercase tracking-widest text-brand-black">
                    賽事精華
                  </h2>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 md:gap-x-8">
                  {highlights.map((video) => (
                    <HighlightVideo key={video.id} video={video} />
                  ))}
                </div>
              </section>
            )}

            {activeSeason.youtubePlaylistEmbedUrl && (
              <div className="mb-12">
                <div className="mb-8 flex items-center">
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
                className="group flex min-h-11 items-center text-xs font-bold uppercase tracking-widest text-neutral-400 transition-colors hover:text-red-600"
              >
                <Youtube className="mr-2 h-4 w-4" />
                <span className="translate-y-[1px] border-b border-transparent transition-all group-hover:border-red-600">YouTube</span>
              </a>

              <a
                href="https://www.instagram.com/d.league_tw/"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex min-h-11 items-center text-xs font-bold uppercase tracking-widest text-neutral-400 transition-colors hover:text-pink-600"
              >
                <Instagram className="mr-2 h-4 w-4" />
                <span className="translate-y-[1px] border-b border-transparent transition-all group-hover:border-pink-600">Instagram</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      <ResponsiveFilterDrawer
        open={filtersOpen}
        fields={[yearField]}
        onClose={() => setFiltersOpen(false)}
        onClear={() => setDraftSeasonId(activeSeasonId)}
        clearDisabled={draftSeasonId === activeSeasonId}
        onApply={applyFilters}
        applyLabel="查看賽事媒體"
        title="篩選賽事媒體"
        subtitle="目前可依年份切換媒體內容"
      />
    </div>
  );
};

export default MediaPage;
