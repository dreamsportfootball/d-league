import React from 'react';
import { ExternalLink, Instagram, MonitorPlay, Youtube } from 'lucide-react';
import { Link } from 'react-router-dom';
import { D_LEAGUE_INSTAGRAM_URL, D_LEAGUE_YOUTUBE_URL } from '../config/siteConfig';
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
    className="group grid grid-cols-[112px_minmax(0,1fr)] gap-4 border-b border-white/10 py-4 last:border-b-0 md:grid-cols-[132px_minmax(0,1fr)]"
  >
    <div className="relative aspect-video overflow-hidden bg-neutral-900 ring-1 ring-white/10">
      <img
        src={image}
        alt={title}
        loading="lazy"
        decoding="async"
        className="h-full w-full object-cover opacity-80 transition-all duration-500 group-hover:scale-[1.03] group-hover:opacity-100"
      />
      <div className="absolute right-1 top-1 bg-black/70 p-1">
        {type === 'INSTAGRAM' ? (
          <Instagram className="h-3 w-3 text-white" />
        ) : (
          <Youtube className="h-3 w-3 text-white" />
        )}
      </div>
      {badge && (
        <span className="absolute bottom-1 right-1 bg-black/80 px-1.5 py-0.5 text-[9px] font-black tracking-wider text-white">
          {badge}
        </span>
      )}
    </div>

    <div className="flex min-w-0 flex-col justify-center">
      <p className="mb-1 text-[10px] font-black uppercase tracking-[0.14em] text-brand-accent">
        {type === 'INSTAGRAM' ? 'Reels' : 'Video'} · {meta}
      </p>
      <h3 className="line-clamp-2 text-sm font-bold leading-5 text-neutral-300 transition-colors group-hover:text-white">
        {title}
      </h3>
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
    <section className="border-y border-neutral-800 bg-neutral-950 py-12 md:py-16" aria-labelledby="home-media-title">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex flex-col gap-5 border-b border-white/10 pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-1 flex items-center gap-2 text-brand-accent">
              <MonitorPlay className="h-4 w-4" aria-hidden="true" />
              <p className="text-[10px] font-black uppercase tracking-[0.24em]">
                D LEAGUE TV · {activeSeason.shortName}
              </p>
            </div>
            <h2 id="home-media-title" className="font-display text-3xl font-black tracking-tight text-white md:text-5xl">
              賽事媒體
            </h2>
          </div>

          <a
            href={D_LEAGUE_INSTAGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center self-start border border-white/30 px-4 py-3 text-xs font-black tracking-wider text-white transition-colors hover:border-white hover:bg-white hover:text-black sm:self-auto"
          >
            <Instagram className="mr-2 h-4 w-4" />
            官方 Instagram
          </a>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3 lg:gap-10">
          <div className="lg:col-span-2">
            {activeSeason.youtubePlaylistEmbedUrl ? (
              <>
                <div className="aspect-video overflow-hidden border border-neutral-800 bg-neutral-900">
                  <iframe
                    className="h-full w-full"
                    src={activeSeason.youtubePlaylistEmbedUrl}
                    title={`${activeSeason.displayName} 比賽影片`}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    loading="lazy"
                  />
                </div>
                <div className="mt-5 flex flex-col gap-4 border-b border-white/10 pb-5 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-brand-accent">Official YouTube</p>
                    <h3 className="mt-2 font-display text-2xl font-black text-white md:text-3xl">
                      {activeSeason.youtubePlaylistLabel ?? `${activeSeason.shortName} 全場比賽影片`}
                    </h3>
                    <p className="mt-1 text-sm font-medium text-neutral-400">觀看本季已發布的完整比賽影片</p>
                  </div>
                  <a
                    href={D_LEAGUE_YOUTUBE_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-11 items-center py-3 text-xs font-black tracking-wider text-white/60 transition-colors hover:text-white"
                  >
                    前往 YouTube
                    <ExternalLink className="ml-1 h-3.5 w-3.5" />
                  </a>
                </div>
              </>
            ) : (
              <div className="flex aspect-video items-center justify-center border border-dashed border-neutral-700 bg-neutral-900 px-6 text-center">
                <p className="text-sm font-bold text-neutral-500">本賽季完整比賽影片尚未發布</p>
              </div>
            )}
          </div>

          <div>
            <div className="flex min-h-11 items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-xs font-black uppercase tracking-[0.16em] text-white">最新發布</h3>
              <Link
                to={`/media?season=${activeSeason.id}`}
                className="text-xs font-black text-brand-accent transition-colors hover:text-white"
              >
                全部媒體
              </Link>
            </div>

            {latestMedia.length > 0 ? (
              <div>
                {latestMedia.map((item) => (
                  <SideVideoCard
                    key={item.id}
                    type="INSTAGRAM"
                    title={item.title}
                    meta={item.date}
                    image={item.thumbnail}
                    link={item.link ?? D_LEAGUE_INSTAGRAM_URL}
                    badge={item.duration || 'REELS'}
                  />
                ))}
              </div>
            ) : (
              <div className="flex min-h-48 items-center justify-center border-b border-white/10 px-6 text-center">
                <p className="text-sm font-bold text-neutral-500">本賽季最新媒體內容尚未發布</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default VideoHub;
