import React, { useEffect, useRef, useState } from 'react';
import { Camera, Pause, Play } from 'lucide-react';
import { assetUrl } from '../services/seasonData';

const carouselImages = [1, 2, 3, 4, 5].map((id) => ({
  id,
  src: assetUrl(`assets/carousel/slide-${id}.jpg`),
}));

const PhotoCarousel: React.FC = () => {
  const sectionRef = useRef<HTMLElement | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [touchStartX, setTouchStartX] = useState(0);
  const [isNearViewport, setIsNearViewport] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [hasFocusWithin, setHasFocusWithin] = useState(false);
  const [isPageVisible, setIsPageVisible] = useState(() => !document.hidden);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );
  const [loadedIndices, setLoadedIndices] = useState<Set<number>>(() => new Set([0]));

  const nextSlide = () => {
    setActiveIndex((prevIndex) => (prevIndex + 1) % carouselImages.length);
  };

  const prevSlide = () => {
    setActiveIndex((prevIndex) => (prevIndex - 1 + carouselImages.length) % carouselImages.length);
  };

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const observer = new IntersectionObserver(
      ([entry]) => setIsNearViewport(entry.isIntersecting),
      { rootMargin: '240px 0px' },
    );
    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isNearViewport) return;
    const nextIndex = (activeIndex + 1) % carouselImages.length;
    setLoadedIndices((current) => {
      if (current.has(activeIndex) && current.has(nextIndex)) return current;
      const next = new Set(current);
      next.add(activeIndex);
      next.add(nextIndex);
      return next;
    });
  }, [activeIndex, isNearViewport]);

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setPrefersReducedMotion(query.matches);
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    const handleVisibilityChange = () => setIsPageVisible(!document.hidden);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  useEffect(() => {
    if (!isNearViewport || !isPageVisible || isPaused || prefersReducedMotion || isHovered || hasFocusWithin) return;
    const interval = window.setInterval(nextSlide, 5000);
    return () => window.clearInterval(interval);
  }, [isNearViewport, isPageVisible, isPaused, prefersReducedMotion, isHovered, hasFocusWithin]);

  const handleTouchEnd = (event: React.TouchEvent) => {
    const swipeDistance = event.changedTouches[0].clientX - touchStartX;
    if (touchStartX === 0) return;
    if (swipeDistance > 50) prevSlide();
    if (swipeDistance < -50) nextSlide();
    setTouchStartX(0);
  };

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden bg-gradient-to-b from-white via-neutral-50 to-white py-12 md:py-20"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocusCapture={() => setHasFocusWithin(true)}
      onBlurCapture={(event) => {
        if (!(event.relatedTarget instanceof Node) || !event.currentTarget.contains(event.relatedTarget)) {
          setHasFocusWithin(false);
        }
      }}
    >
      <div className="pointer-events-none absolute left-1/2 top-10 -translate-x-1/2 select-none whitespace-nowrap font-display text-[10rem] font-black uppercase text-neutral-100 opacity-40">
        MOMENTS
      </div>

      <div className="container relative z-10 mx-auto px-4 md:px-6">
        <div className="mb-8 flex flex-col items-center md:mb-12">
          <div className="mb-2 flex items-center space-x-2">
            <Camera className="h-4 w-4 text-brand-blue" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-blue">Official Gallery</span>
          </div>
          <h2 className="text-center font-display text-3xl font-black uppercase tracking-tight text-brand-black md:text-4xl">
            賽事 <span className="bg-gradient-to-r from-brand-blue to-cyan-500 bg-clip-text text-transparent">精選圖集</span>
          </h2>
          <div className="mt-4 h-1 w-12 rounded-full bg-brand-blue" />
        </div>

        <div className="relative mx-auto w-full max-w-5xl">
          <div
            className="group relative aspect-[16/10] overflow-hidden rounded-lg bg-neutral-950 shadow-2xl md:aspect-[16/7]"
            onTouchStart={(event) => setTouchStartX(event.touches[0].clientX)}
            onTouchEnd={handleTouchEnd}
          >
            {carouselImages.map((image, index) => (
              <div
                key={image.id}
                className={`absolute inset-0 transition-all duration-1000 ease-in-out ${
                  index === activeIndex ? 'z-10 scale-100 opacity-100' : 'z-0 scale-105 opacity-0'
                }`}
              >
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-neutral-950 text-center text-white">
                  <span className="font-display text-3xl font-black uppercase tracking-[0.16em]">D LEAGUE</span>
                  <span className="mt-2 text-[10px] font-bold uppercase tracking-[0.24em] text-white/45">Official Gallery</span>
                </div>
                {loadedIndices.has(index) && (
                  <img
                    src={image.src}
                    alt={`賽事精選圖片 ${image.id}`}
                    className="relative z-10 h-full w-full object-cover"
                    loading="lazy"
                    decoding="async"
                    onError={(event) => {
                      event.currentTarget.style.display = 'none';
                    }}
                  />
                )}
                <div className="pointer-events-none absolute inset-0 z-20 bg-gradient-to-t from-black/20 via-transparent to-black/10" />
              </div>
            ))}
          </div>

          <div className="mt-6 flex items-center justify-center gap-1.5" aria-label="賽事圖集控制">
            {carouselImages.map((image, index) => (
              <button
                key={image.id}
                type="button"
                onClick={() => setActiveIndex(index)}
                className="flex h-11 w-11 items-center justify-center rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-2"
                aria-label={`前往第 ${index + 1} 張圖片`}
                aria-current={index === activeIndex ? 'true' : undefined}
              >
                <span
                  aria-hidden="true"
                  className={`h-1.5 rounded-full transition-[width,background-color] duration-300 ${
                    index === activeIndex ? 'w-8 bg-brand-blue' : 'w-2 bg-neutral-400'
                  }`}
                />
              </button>
            ))}
            {!prefersReducedMotion && (
              <button
                type="button"
                onClick={() => setIsPaused((paused) => !paused)}
                aria-label={isPaused ? '繼續自動播放圖片' : '暫停自動播放圖片'}
                aria-pressed={isPaused}
                className="ml-2 flex h-11 w-11 items-center justify-center rounded-sm text-neutral-600 transition-colors hover:text-brand-blue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-2"
              >
                {isPaused ? <Play className="h-4 w-4" aria-hidden="true" /> : <Pause className="h-4 w-4" aria-hidden="true" />}
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default PhotoCarousel;
