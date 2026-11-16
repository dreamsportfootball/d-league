import React, { useState } from 'react';
import { ExternalLink, Play } from 'lucide-react';

interface MatchVideoPlayerProps {
  label: string;
  url: string;
}

const getYouTubeVideoId = (value: string): string | null => {
  try {
    const url = new URL(value);
    const host = url.hostname.replace(/^www\./, '');
    let videoId: string | null = null;

    if (host === 'youtu.be') {
      videoId = url.pathname.split('/').filter(Boolean)[0] ?? null;
    } else if (host === 'youtube.com' || host === 'm.youtube.com') {
      if (url.pathname === '/watch') {
        videoId = url.searchParams.get('v');
      } else {
        const pathParts = url.pathname.split('/').filter(Boolean);
        if (['embed', 'shorts', 'live'].includes(pathParts[0] ?? '')) {
          videoId = pathParts[1] ?? null;
        }
      }
    }

    if (!videoId || !/^[A-Za-z0-9_-]{6,}$/.test(videoId)) return null;
    return videoId;
  } catch {
    return null;
  }
};

const isDirectVideoUrl = (value: string): boolean => {
  try {
    const pathname = new URL(value).pathname.toLowerCase();
    return /\.(mp4|webm|ogg|m4v)$/.test(pathname);
  } catch {
    return false;
  }
};

const MatchVideoPlayer: React.FC<MatchVideoPlayerProps> = ({ label, url }) => {
  const youtubeVideoId = getYouTubeVideoId(url);
  // Keep YouTube's heavy player scripts out of the scroll path. The iframe is
  // mounted only after a person chooses to play this particular half.
  const [activatedUrl, setActivatedUrl] = useState<string | null>(null);

  if (youtubeVideoId) {
    const isActivated = activatedUrl === url;

    return (
      <div className="py-4">
        <p className="mb-3 text-sm font-bold text-brand-black">{label}</p>
        <div className="relative aspect-video overflow-hidden bg-black">
          {isActivated ? (
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${youtubeVideoId}?autoplay=1&playsinline=1`}
              title={`${label}比賽影片`}
              className="h-full w-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          ) : (
            <button
              type="button"
              onClick={() => setActivatedUrl(url)}
              aria-label={`播放${label}比賽影片`}
              className="group relative block h-full w-full cursor-pointer overflow-hidden bg-black text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-blue"
            >
              <img
                src={`https://i.ytimg.com/vi/${youtubeVideoId}/hqdefault.jpg`}
                alt=""
                loading="lazy"
                decoding="async"
                className="absolute inset-0 h-full w-full object-cover"
              />
              <span className="absolute inset-0 bg-black/35 transition-colors group-hover:bg-black/25" aria-hidden="true" />
              <span className="absolute inset-0 flex items-center justify-center" aria-hidden="true">
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-blue text-white shadow-md transition-transform group-hover:scale-105">
                  <Play className="ml-0.5 h-6 w-6 fill-current" />
                </span>
              </span>
              <span className="absolute bottom-3 left-3 text-xs font-bold text-white" aria-hidden="true">點擊播放</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  if (isDirectVideoUrl(url)) {
    return (
      <div className="py-4">
        <p className="mb-3 text-sm font-bold text-brand-black">{label}</p>
        <video
          controls
          playsInline
          preload="metadata"
          className="aspect-video w-full bg-black object-contain"
        >
          <source src={url} />
          你的瀏覽器目前無法播放此影片
        </video>
      </div>
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex min-h-12 items-center justify-between gap-4 py-3 text-sm font-bold text-brand-black transition-colors hover:text-brand-blue"
    >
      <span>{label}</span>
      <span className="flex shrink-0 items-center text-xs text-brand-blue">
        開啟影片 <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
      </span>
    </a>
  );
};

export default MatchVideoPlayer;
