import React, { useEffect, useState } from 'react';
import { Camera } from 'lucide-react';
import { assetUrl } from '../services/seasonData';

const carouselImages = [1, 2, 3, 4, 5].map((id) => ({
  id,
  src: assetUrl(`assets/carousel/slide-${id}.jpg`),
}));

const PhotoCarousel: React.FC = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [touchStartX, setTouchStartX] = useState(0);

  const nextSlide = () => {
    setActiveIndex((prevIndex) => (prevIndex + 1) % carouselImages.length);
  };

  const prevSlide = () => {
    setActiveIndex((prevIndex) => (prevIndex - 1 + carouselImages.length) % carouselImages.length);
  };

  useEffect(() => {
    const interval = window.setInterval(nextSlide, 5000);
    return () => window.clearInterval(interval);
  }, []);

  const handleTouchEnd = (event: React.TouchEvent) => {
    const swipeDistance = event.changedTouches[0].clientX - touchStartX;
    if (touchStartX === 0) return;
    if (swipeDistance > 50) prevSlide();
    if (swipeDistance < -50) nextSlide();
    setTouchStartX(0);
  };

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-white via-neutral-50 to-white py-12 md:py-20">
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
            className="group relative aspect-[16/10] overflow-hidden rounded-lg bg-neutral-200 shadow-2xl md:aspect-[16/7]"
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
                <img
                  src={image.src}
                  alt={`賽事精選圖片 ${image.id}`}
                  className="h-full w-full object-cover"
                  loading="lazy"
                  onError={(event) => {
                    event.currentTarget.onerror = null;
                    event.currentTarget.src = 'https://images.unsplash.com/photo-1517466787929-bc90951d0974?q=80&w=1200&auto=format&fit=crop';
                  }}
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-black/10" />
              </div>
            ))}
          </div>

          <div className="mt-8 flex justify-center space-x-3">
            {carouselImages.map((image, index) => (
              <button
                key={image.id}
                type="button"
                onClick={() => setActiveIndex(index)}
                className={`h-1.5 rounded-full transition-all duration-500 ease-out ${
                  index === activeIndex
                    ? 'w-8 bg-brand-blue shadow-lg shadow-brand-blue/30'
                    : 'w-2 bg-neutral-300 hover:bg-neutral-400'
                }`}
                aria-label={`前往第 ${index + 1} 張圖片`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default PhotoCarousel;
