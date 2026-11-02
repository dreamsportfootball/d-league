import React, { useMemo } from 'react';
import { ArrowUpRight, ExternalLink, Instagram, MonitorPlay, Signal } from 'lucide-react';
import { Link } from 'react-router-dom';
import { D_LEAGUE_YOUTUBE_URL } from '../config/siteConfig';
import { useSeason } from '../hooks/useSeason';
import type { MediaAlbum } from '../types/media';

interface SideAlbumRowProps {
  album: MediaAlbum;
}

const SideAlbumRow: React.FC<SideAlbumRowProps> = ({ album }) => {
  const separatorIndex = album.title.indexOf('｜');
  const competition = separatorIndex >= 0 ? album.title.slice(0, separatorIndex).trim() : '';
  const title = separatorIndex >= 0 ? album.title.slice(separatorIndex + 1).trim() : album.title;

  return (
    <a
      href={album.link}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={'查看 ' + album.title + ' 比賽照片'}
      className="group flex min-h-28 items-center gap-3 border-b border-neutral-800 py-3 transition-colors hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950"
    >
      <div className="aspect-[3/2] w-28 shrink-0 overflow-hidden bg-neutral-800 sm:w-32 lg:w-28 xl:w-32">
        <img
          src={album.cover}
          alt=""
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-105 motion-reduce:transform-none"
        />
      </div>

      <div className="min-w-0 flex-1">
        <p className="mb-1 flex flex-wrap gap-x-2 text-[11px] font-medium text-neutral-400">
          {competition && <span>{competition}</span>}
          <span>{album.date.replaceAll('/', '.')}</span>
        </p>
        <h4 className="line-clamp-2 text-sm font-bold leading-snug text-white">
          {title}
        </h4>
        <span className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-neutral-400 transition-colors group-hover:text-brand-accent">
          查看相簿
          <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
        </span>
      </div>
    </a>
  );
};

const VideoHub: React.FC = () => {
  const { activeSeason, seasonData } = useSeason();
  const latestAlbums = useMemo(
    () => [...seasonData.albums]
      .sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id))
      .slice(0, 3),
    [seasonData.albums],
  );

  if (!activeSeason.youtubePlaylistEmbedUrl && latestAlbums.length === 0) {
    return null;
  }

  return (
    <section className="relative overflow-hidden border-y border-neutral-900 bg-neutral-950 py-12 md:py-20">
      <div className="container relative z-10 mx-auto px-4 md:px-6">
        <div className="mb-10 flex items-end justify-between">
          <div>
            <div className="mb-2 flex items-center space-x-2">
              <MonitorPlay className="h-5 w-5 text-brand-accent" />
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-brand-accent">D LEAGUE TV</span>
            </div>
            <h2 className="font-display text-3xl font-black uppercase tracking-tight text-white md:text-5xl">
              賽事 媒體中心
            </h2>
          </div>

          <a
            href="https://www.instagram.com/d.league_tw/"
            target="_blank"
            rel="noopener noreferrer"
            className="group hidden items-center space-x-2 rounded-full border border-neutral-700 px-6 py-2 text-xs font-bold uppercase text-white transition-all hover:border-white hover:bg-white hover:text-black md:flex"
          >
            <Instagram className="h-3 w-3" />
            <span>追蹤官方 Instagram</span>
          </a>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 lg:gap-12">
          <div className="group lg:col-span-2">
            {activeSeason.youtubePlaylistEmbedUrl ? (
              <>
                <div className="relative aspect-video overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900 shadow-2xl ring-1 ring-white/5">
                  <iframe
                    className="relative z-10 h-full w-full"
                    src={activeSeason.youtubePlaylistEmbedUrl}
                    title={`${activeSeason.displayName} 比賽影片`}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    loading="lazy"
                  />
                </div>

                <div className="mt-5 flex items-start justify-between">
                  <div>
                    <div className="mb-1 flex items-center space-x-2">
                      <Signal className="h-4 w-4 text-brand-accent" />
                      <span className="text-xs font-bold uppercase tracking-wider text-brand-accent">Official YouTube</span>
                    </div>
                    <h3 className="mb-1 font-display text-2xl font-bold uppercase tracking-wide text-white">
                      {activeSeason.youtubePlaylistLabel ?? `${activeSeason.shortName} 全場比賽影片`}
                    </h3>
                    <p className="text-sm text-neutral-400">點擊播放清單即可觀看本季賽事影片</p>
                  </div>

                  <a
                    href={D_LEAGUE_YOUTUBE_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group/yt mt-2 flex items-center text-xs font-bold text-white/50 transition-colors hover:text-white"
                  >
                    <span>訂閱頻道</span>
                    <ExternalLink className="ml-1 h-3 w-3 transition-transform group-hover/yt:translate-x-0.5" />
                  </a>
                </div>
              </>
            ) : (
              <div className="flex aspect-video items-center justify-center rounded-2xl border border-dashed border-neutral-700 bg-neutral-900">
                <p className="text-sm font-medium text-neutral-500">本賽季影片尚未發布</p>
              </div>
            )}
          </div>

          <div className="flex h-full min-w-0 flex-col">
            <div className="mb-3 flex items-center justify-between border-b border-neutral-800 pb-4">
              <h3 className="text-sm font-bold tracking-wider text-white">最新相簿</h3>
              <span className="text-[10px] font-semibold uppercase tracking-widest text-neutral-500">
                Match Photos
              </span>
            </div>

            {latestAlbums.length > 0 ? (
              <>
                <div className="flex flex-col">
                  {latestAlbums.map((album) => (
                    <SideAlbumRow key={album.id} album={album} />
                  ))}
                </div>
                <Link
                  to={'/media?season=' + activeSeason.id}
                  className="mt-3 inline-flex min-h-11 items-center justify-between gap-3 text-sm font-bold text-white transition-colors hover:text-brand-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950"
                >
                  查看所有賽事相簿
                  <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </>
            ) : (
              <div className="flex flex-1 items-center justify-center border-b border-neutral-800 px-4 py-10 text-center">
                <p className="text-sm text-neutral-400">本賽季相簿尚未發布，比賽日後陸續更新</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default VideoHub;
