import React, { useMemo, useRef, useState } from 'react';
import { ArrowUpRight, Instagram, Youtube } from 'lucide-react';
import DataFilterToolbar from '../components/DataFilterToolbar';
import EmptyState from '../components/EmptyState';
import ResponsiveFilterDrawer, { type FilterDrawerField } from '../components/ResponsiveFilterDrawer';
import SeasonPageHeader from '../components/SeasonPageHeader';
import { useSeason } from '../hooks/useSeason';
import type { MediaAlbum } from '../types/media';
import type { SeasonId } from '../types/season';

const ZenAlbum: React.FC<{ album: MediaAlbum }> = ({ album }) => (
  <div className="group block">
    <div className="relative mb-4 aspect-[3/2] overflow-hidden bg-neutral-100">
      <img
        src={album.cover}
        alt={album.title}
        loading="lazy"
        className="pointer-events-none h-full w-full object-cover transition-transform duration-700 ease-out md:group-hover:scale-105"
      />
    </div>

    <div className="flex flex-col items-start">
      <span className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-400">
        {album.date}
      </span>

      <a
        href={album.link}
        target="_blank"
        rel="noopener noreferrer"
        className="mb-2 inline-flex min-h-11 items-center space-x-1 text-[11px] font-bold text-brand-blue transition-colors hover:text-blue-800"
      >
        <span className="border-b border-transparent pb-0.5 transition-all hover:border-blue-800">查看相簿</span>
        <ArrowUpRight className="h-3 w-3" />
      </a>

      <h3 className="font-display text-xl font-bold leading-tight text-brand-black">{album.title}</h3>
    </div>
  </div>
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

  const sortedSeasons = useMemo(
    () => [...availableSeasons].sort((a, b) => b.id.localeCompare(a.id)),
    [availableSeasons],
  );
  const draftSeason = availableSeasons.find((season) => season.id === draftSeasonId) ?? activeSeason;
  const reversedAlbums = useMemo(
    () => seasonData.albums.slice().reverse(),
    [seasonData.albums],
  );

  const scrollGallery = (direction: 'left' | 'right') => {
    const container = galleryRef.current;
    if (!container) return;
    container.scrollBy({
      left: direction === 'left' ? -container.clientWidth * 0.8 : container.clientWidth * 0.8,
      behavior: 'smooth',
    });
  };

  const hasMedia = reversedAlbums.length > 0 || Boolean(activeSeason.youtubePlaylistEmbedUrl);
  const mediaItemCount = reversedAlbums.length + (activeSeason.youtubePlaylistEmbedUrl ? 1 : 0);
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
          primaryText={`${mediaItemCount} 項媒體`}
          secondaryText={activeSeason.shortName}
          onOpen={openFilters}
          ariaLabel="開啟賽事媒體篩選"
        />

        {!hasMedia ? (
          <EmptyState
            title="新賽季媒體內容尚未發布"
            description="相簿及比賽影片將於新賽季開始後陸續更新"
            showRegistrationLink={false}
            primaryAction={{
              label: '查看 2025/26 賽事媒體',
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
                      className="flex h-11 w-11 items-center justify-center rounded-lg border border-neutral-300 transition-colors hover:bg-neutral-100"
                      aria-label="上一組相簿"
                    >
                      <span className="text-lg leading-none">‹</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => scrollGallery('right')}
                      className="flex h-11 w-11 items-center justify-center rounded-lg border border-neutral-300 transition-colors hover:bg-neutral-100"
                      aria-label="下一組相簿"
                    >
                      <span className="text-lg leading-none">›</span>
                    </button>
                  </div>
                </div>

                <div
                  ref={galleryRef}
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
