import React, { useEffect, useRef, useState } from 'react';
import { ExternalLink } from 'lucide-react';

interface MatchVideoPlayerProps {
  label: string;
  url: string;
  loadDelayMs?: number;
  sourceNote?: string;
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

const MatchVideoPlayer: React.FC<MatchVideoPlayerProps> = ({ label, url, loadDelayMs = 500, sourceNote }) => {
  const youtubeEmbedUrl = getYouTubeEmbedUrl(url);
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const [loadedUrl, setLoadedUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!youtubeEmbedUrl || loadedUrl === url) return;

    const container = videoContainerRef.current;
    if (!container) return;

    // Observe the actual dialog scroll area, rather than the window.
    // Loading the YouTube iframe only after it remains visible avoids
    // starting heavyweight player scripts while someone scrolls down.
    if (typeof IntersectionObserver === 'undefined') {
      setLoadedUrl(url);
      return;
    }

    const scrollRoot = container.closest<HTMLElement>('[data-match-dialog-scroller]');
    let isVisible = false;
    let pendingLoad: number | null = null;

    const scheduleWhenIdle = () => {
      if (pendingLoad !== null) {
        window.clearTimeout(pendingLoad);
        pendingLoad = null;
      }
      if (!isVisible) return;

      // A video entering the viewport is not enough: postpone heavy YouTube
      // initialization until the user has stopped scrolling inside the dialog.
      pendingLoad = window.setTimeout(() => {
        pendingLoad = null;
        setLoadedUrl(url);
        observer.disconnect();
      }, loadDelayMs);
    };

    const handleScroll = () => {
      if (isVisible) scheduleWhenIdle();
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        isVisible = Boolean(entry && entry.intersectionRatio >= 0.35);
        scheduleWhenIdle();
      },
      { root: scrollRoot, rootMargin: '0px', threshold: 0.35 },
    );

    scrollRoot?.addEventListener('scroll', handleScroll, { passive: true });
    observer.observe(container);
    return () => {
      scrollRoot?.removeEventListener('scroll', handleScroll);
      observer.disconnect();
      if (pendingLoad !== null) window.clearTimeout(pendingLoad);
    };
  }, [youtubeEmbedUrl, url, loadedUrl, loadDelayMs]);

  if (youtubeEmbedUrl) {
    return (
      <div className="py-4" data-match-video-entry={label}>
        <p className="mb-3 text-sm font-bold text-brand-black">{label}</p>
        {sourceNote && <p className="mb-3 text-xs leading-relaxed text-neutral-500" role="note">{sourceNote}</p>}
        <div ref={videoContainerRef} className="aspect-video overflow-hidden bg-black">
          {loadedUrl === url && (
            <iframe
              src={youtubeEmbedUrl}
              title={`${label}比賽影片`}
              className="h-full w-full border-0"
              loading="lazy"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          )}
        </div>
      </div>
    );
  }

  if (isDirectVideoUrl(url)) {
    return (
      <div className="py-4">
        <p className="mb-3 text-sm font-bold text-brand-black">{label}</p>
        {sourceNote && <p className="mb-3 text-xs leading-relaxed text-neutral-500" role="note">{sourceNote}</p>}
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
