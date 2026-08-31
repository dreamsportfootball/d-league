import React from 'react';
import { ExternalLink, Instagram, MonitorPlay, Signal, Youtube } from 'lucide-react';
import { useSeason } from '../hooks/useSeason';

interface SideVideoCardProps {
  title: string;
  meta: string;
  image: string;
  type: 'YOUTUBE' | 'INSTAGRAM';
  link: string;
  badge?: string;
}

const SideVideoCard: React.FC<SideVideoCardProps> = ({
  title,
  meta,
  image,
  type,
  link,
  badge,
}) => (
  <a
    href={link}
    target="_blank"
    rel="noopener noreferrer"
    className="group relative flex gap-4 overflow-hidden rounded-xl border border-transparent p-3 transition-all duration-300 hover:border-white/10 hover:bg-white/5"
  >
    <div className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/5 to-transparent transition-transform duration-700 ease-in-out group-hover:translate-x-full" />

    <div className="relative h-20 w-32 shrink-0 overflow-hidden rounded-lg bg-neutral-800 ring-1 ring-white/10 transition-all group-hover:ring-white/30 md:h-24 md:w-40">
      <img
        src={image}
        alt={title}
        loading="lazy"
        className="h-full w-full object-cover opacity-80 transition-all duration-700 ease-out group-hover:scale-110 group-hover:opacity-100"
      />

      <div className="absolute right-1 top-1 z-10">
        {type === 'INSTAGRAM' ? (
          <div className="rounded-md bg-black/50 p-1 backdrop-blur-md">
            <Instagram className="h-3 w-3 text-white" />
          </div>
        ) : (
          <div className="rounded-md bg-red-600 p-1 shadow-sm">
            <Youtube className="h-3 w-3 text-white" />
          </div>
        )}
      </div>

      {badge && (
        <div className="absolute bottom-1 right-1 rounded bg-black/80 px-1.5 py-0.5 text-[10px] font-bold tracking-wider text-white backdrop-blur-sm">
          {badge}
        </div>
      )}
    </div>

    <div className="flex min-w-0 flex-col justify-center">
      <h4 className="mb-2 line-clamp-2 text-sm font-bold leading-snug text-neutral-300 decoration-brand-accent/50 underline-offset-4 transition-colors group-hover:text-white group-hover:underline">
        {title}
      </h4>
      <div className="flex items-center space-x-2 text-xs font-medium text-neutral-500">
        <span className="text-brand-accent">{type === 'INSTAGRAM' ? 'Reels' : 'Video'}</span>
        <span className="h-1 w-1 rounded-full bg-neutral-600" />
        <span className="text-neutral-400">{meta}</span>
      </div>
    </div>
  </a>
);

const VideoHub: React.FC = () => {
  const { activeSeason, seasonData } = useSeason();
  const latestMedia = seasonData.media.slice(0, 3);

  if (!activeSeason.youtubePlaylistEmbedUrl && latestMedia.length === 0) {
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
                    href="https://www.youtube.com/@DreamSportFootball"
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

          <div className="flex h-full flex-col">
            <div className="mb-6 flex items-center justify-between border-b border-neutral-800 pb-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-white">最新發布</h3>
              {latestMedia.length > 0 && <span className="animate-pulse text-[10px] text-brand-accent">● New</span>}
            </div>

            {latestMedia.length > 0 ? (
              <div className="flex flex-col space-y-3">
                {latestMedia.map((item) => (
                  <SideVideoCard
                    key={item.id}
                    type="INSTAGRAM"
                    title={item.title}
                    meta={item.date}
                    image={item.thumbnail}
                    link={item.link ?? 'https://www.instagram.com/d.league_tw/'}
                    badge={item.duration || 'REELS'}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-neutral-800 px-6 py-12 text-center">
                <p className="text-sm font-medium text-neutral-500">本賽季最新媒體內容尚未發布</p>
              </div>
            )}

            <div className="mt-6 flex w-full items-center justify-center md:mt-8">
              <span className="text-xs font-medium uppercase tracking-widest text-neutral-500">
                更多精彩內容請前往社群平台
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default VideoHub;
