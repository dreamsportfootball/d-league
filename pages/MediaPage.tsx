import React, { useMemo, useRef } from 'react';
import { ArrowUpRight, Instagram, Youtube } from 'lucide-react';
import EmptyState from '../components/EmptyState';
import { useSeason } from '../hooks/useSeason';
import type { MediaAlbum } from '../types/media';

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
        className="mb-2 inline-flex items-center space-x-1 text-[11px] font-bold text-brand-blue transition-colors hover:text-blue-800"
      >
        <span className="border-b border-transparent pb-0.5 transition-all hover:border-blue-800">查看相簿</span>
        <ArrowUpRight className="h-3 w-3" />
      </a>

      <h3 className="font-display text-xl font-bold leading-tight text-brand-black">{album.title}</h3>
    </div>
  </div>
);

const MediaPage: React.FC = () => {
  const { activeSeason, seasonData } = useSeason();
  const galleryRef = useRef<HTMLDivElement | null>(null);

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

  return (
    <div className="min-h-[85vh] bg-white pb-24 pt-6 md:pt-24">
      <div className="container mx-auto max-w-7xl px-4 md:px-12">
        <div className="mb-8 border-b border-neutral-100 pb-8 md:mb-16">
          <div className="flex flex-col justify-between md:flex-row md:items-end">
            <div>
              <h1 className="mb-2 font-display text-4xl font-black uppercase tracking-tight text-brand-black [-webkit-text-stroke:.25px_currentColor] md:mb-4 md:text-6xl md:font-extrabold md:[-webkit-text-stroke:0px]">
                賽事 <span className="text-brand-blue">媒體</span>
              </h1>
              <p className="text-sm font-medium tracking-wide text-neutral-400 md:text-base">
                {activeSeason.displayName} 精彩瞬間與比賽影片
              </p>
            </div>
          </div>
        </div>

        {!hasMedia ? (
          <EmptyState
            title="新賽季媒體內容尚未發布"
            description="相簿及比賽影片將於新賽季開始後陸續更新"
            showRegistrationLink={activeSeason.status === 'registration'}
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
                      className="flex h-8 w-8 items-center justify-center rounded border border-neutral-300 transition-colors hover:bg-neutral-100"
                      aria-label="上一組相簿"
                    >
                      <span className="text-lg leading-none">‹</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => scrollGallery('right')}
                      className="flex h-8 w-8 items-center justify-center rounded border border-neutral-300 transition-colors hover:bg-neutral-100"
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
                className="group flex items-center text-xs font-bold uppercase tracking-widest text-neutral-400 transition-colors hover:text-red-600"
              >
                <Youtube className="mr-2 h-4 w-4" />
                <span className="translate-y-[1px] border-b border-transparent transition-all group-hover:border-red-600">YouTube</span>
              </a>

              <a
                href="https://www.instagram.com/d.league_tw/"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center text-xs font-bold uppercase tracking-widest text-neutral-400 transition-colors hover:text-pink-600"
              >
                <Instagram className="mr-2 h-4 w-4" />
                <span className="translate-y-[1px] border-b border-transparent transition-all group-hover:border-pink-600">Instagram</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MediaPage;
