import React from 'react';
import { ExternalLink } from 'lucide-react';

interface MatchVideoPlayerProps {
  label: string;
  url: string;
}

const getYouTubeEmbedUrl = (value: string): string | null => {
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
    return `https://www.youtube-nocookie.com/embed/${videoId}`;
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
  const youtubeEmbedUrl = getYouTubeEmbedUrl(url);

  if (youtubeEmbedUrl) {
    return (
      <div className="py-4">
        <p className="mb-3 text-sm font-bold text-brand-black">{label}</p>
        <div className="aspect-video overflow-hidden rounded-lg bg-black">
          <iframe
            src={youtubeEmbedUrl}
            title={`${label}比賽影片`}
            className="h-full w-full border-0"
            loading="lazy"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
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
          className="aspect-video w-full rounded-lg bg-black object-contain"
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
