import React from 'react';
import { Camera, ExternalLink } from 'lucide-react';
import { useSeason } from '../hooks/useSeason';

const PhotoCarousel: React.FC = () => {
  const { activeSeason, seasonData } = useSeason();
  const albums = seasonData.albums.slice(0, 3);

  if (albums.length === 0) return null;

  return (
    <section className="border-t border-neutral-200 bg-white py-12 md:py-16" aria-labelledby="home-gallery-title">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex flex-col gap-4 border-b border-neutral-200 pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-1 flex items-center gap-2 text-brand-blue">
              <Camera className="h-4 w-4" aria-hidden="true" />
              <p className="text-[10px] font-black uppercase tracking-[0.24em]">
                Official Gallery · {activeSeason.shortName}
              </p>
            </div>
            <h2 id="home-gallery-title" className="font-display text-3xl font-black tracking-tight text-brand-black md:text-5xl">
              賽事圖集
            </h2>
          </div>
          <p className="text-xs font-bold text-neutral-400">僅顯示本賽季已發布相簿</p>
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {albums.map((album) => (
            <a
              key={album.id}
              href={album.link}
              target="_blank"
              rel="noopener noreferrer"
              className="group block border border-neutral-200 bg-white transition-colors hover:border-brand-blue"
            >
              <div className="aspect-[4/3] overflow-hidden bg-neutral-100">
                <img
                  src={album.cover}
                  alt={album.title}
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                />
              </div>
              <div className="flex items-end justify-between gap-4 border-t border-neutral-200 p-4 md:p-5">
                <div className="min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-[0.14em] text-brand-blue">{album.date}</p>
                  <h3 className="mt-2 line-clamp-2 font-display text-xl font-bold leading-tight text-brand-black">
                    {album.title}
                  </h3>
                </div>
                <ExternalLink className="h-4 w-4 shrink-0 text-neutral-300 transition-colors group-hover:text-brand-blue" aria-hidden="true" />
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PhotoCarousel;
