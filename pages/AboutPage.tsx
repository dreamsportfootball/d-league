import React from 'react';
import { MapPin, Navigation } from 'lucide-react';
import { assetUrl } from '../services/seasonData';

const OriginVisionSection: React.FC = () => (
  <section className="relative z-10 overflow-hidden bg-white">
    <div className="container mx-auto px-6 pb-16 md:px-12 md:pb-32">
      <div className="mb-12 flex items-center justify-between md:mb-20">
        <div className="flex items-center space-x-4">
          <div className="h-[2px] w-8 bg-brand-black md:w-12" />
          <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-neutral-400 md:text-xs">
            The Origin
          </span>
        </div>
        <div className="hidden items-center space-x-3 text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-300 md:flex">
          <span>Est. 2025</span>
        </div>
      </div>

      <div className="flex flex-col gap-12 lg:flex-row lg:items-start lg:gap-24">
        <div className="relative lg:w-5/12">
          <span className="pointer-events-none absolute -left-4 -top-8 -z-10 select-none font-display text-[6rem] font-black leading-none text-neutral-50/80 md:-left-8 md:-top-12 md:text-[8rem]">
            WHY
          </span>
          <h1 className="relative z-10 mb-8 font-display text-5xl font-black uppercase leading-[0.9] tracking-tighter text-brand-black md:text-7xl">
            We Build<br />
            <span className="bg-gradient-to-r from-brand-blue to-cyan-600 bg-clip-text text-transparent">
              The Stage.
            </span>
          </h1>
          <div className="border-l-2 border-brand-accent pl-6">
            <p className="font-display text-lg font-bold leading-relaxed tracking-wide text-brand-black md:text-xl">
              不只是一場比賽，<br />而是一個起點
            </p>
          </div>
        </div>

        <div className="pt-2 lg:w-7/12 lg:pt-4">
          <div className="prose prose-neutral max-w-none">
            <p className="mb-6 text-sm font-medium leading-loose text-neutral-600 md:text-base">
              <span className="mr-2 font-display text-lg font-black uppercase text-brand-blue">D LEAGUE</span>
              我們的理念很簡單：讓更多人<span className="border-b-2 border-brand-accent/30 font-bold text-brand-black">能夠踢、願意踢、享受踢</span>
            </p>
            <p className="mb-6 text-sm font-medium leading-loose text-neutral-600 md:text-base">
              這裡不只是球員的舞台，也是裁判的舞台。整個賽季將由資深裁判帶領資淺裁判，因為我們相信，真正的比賽就是最好的養分
            </p>
            <p className="mb-8 text-sm font-medium leading-loose text-neutral-600 md:text-base">
              Dreamsport 其實背後帶著「夢想的港口」的意思，希望能創造一個環境、一個平台。一定不完美，但至少比沒有好。四年前我就想辦聯賽了，只希望這個聯賽能夠順利走下去
            </p>
            <p className="text-sm font-bold leading-loose text-brand-black md:text-base">也請大家一起幫忙</p>
            <div className="mt-12 flex items-center space-x-3 opacity-80">
              <span className="font-display text-2xl font-black italic tracking-tighter text-brand-black md:text-3xl">DREAM IT.</span>
              <span className="stroke-black font-display text-2xl font-black italic tracking-tighter text-brand-accent md:text-3xl">PLAY IT.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
);

const VenueSection: React.FC = () => {
  const venueImage = assetUrl('assets/aboutpage/Venue.jpg');

  const handleImageError = (event: React.SyntheticEvent<HTMLImageElement>) => {
    event.currentTarget.onerror = null;
    event.currentTarget.src = 'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?q=80&w=1200&auto=format&fit=crop';
  };

  return (
    <section className="relative overflow-hidden border-b border-white/10 bg-neutral-950 py-20 text-white md:py-32">
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1459865264687-595d652de67e?q=80&w=2000&auto=format&fit=crop"
          alt="足球場背景"
          className="h-full w-full object-cover opacity-20 grayscale mix-blend-luminosity"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/80 to-transparent" />
      </div>

      <div className="container relative z-10 mx-auto px-6 md:px-12">
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2 lg:gap-20">
          <div className="relative w-full lg:hidden">
            <div className="group relative aspect-[4/3] overflow-hidden rounded-sm border border-white/10 bg-neutral-900 p-2">
              <img
                src={venueImage}
                alt="仁德文賢國中人工草皮足球場"
                className="h-full w-full object-cover transition-transform duration-1000 group-hover:scale-105"
                onError={handleImageError}
              />
              <div className="absolute inset-0 bg-brand-blue/20 mix-blend-overlay" />
            </div>
          </div>

          <div>
            <div className="mb-6 flex items-center space-x-2">
              <MapPin className="h-5 w-5 text-brand-accent" />
              <span className="text-xs font-bold uppercase tracking-[0.3em] text-brand-accent">台南</span>
            </div>
            <h2 className="mb-6 font-display text-4xl font-black uppercase leading-none tracking-tight md:text-6xl">
              仁德<br />
              <span className="bg-gradient-to-r from-white to-neutral-500 bg-clip-text text-transparent">文賢國中</span>
            </h2>
            <div className="mb-10 max-w-md space-y-4">
              <p className="text-sm font-medium leading-relaxed text-neutral-400 md:text-base">
                D LEAGUE 比賽場地<br />人工草皮足球場
              </p>
            </div>
            <div className="flex flex-col gap-4 sm:flex-row">
              <a
                href="https://share.google/rI921QclMDxQ37xFg"
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center justify-center bg-white px-8 py-4 text-xs font-bold uppercase tracking-widest text-brand-black shadow-lg transition-colors duration-300 hover:bg-brand-accent hover:shadow-brand-accent/20"
              >
                <Navigation className="mr-2 h-4 w-4 transition-transform group-hover:-translate-y-0.5" />
                Google Maps
              </a>
              <div className="inline-flex cursor-default items-center justify-center border border-white/20 px-8 py-4 text-xs font-bold uppercase tracking-widest text-neutral-400">
                Artificial Turf
              </div>
            </div>
          </div>

          <div className="relative hidden lg:block">
            <div className="group relative aspect-[4/3] overflow-hidden rounded-sm border border-white/10">
              <img
                src={venueImage}
                alt="仁德文賢國中人工草皮足球場"
                className="h-full w-full object-cover transition-transform duration-1000 group-hover:scale-110"
                onError={handleImageError}
              />
              <div className="absolute inset-0 bg-brand-blue/20 mix-blend-overlay" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const AboutPage: React.FC = () => (
  <div className="min-h-screen bg-white pb-0 pt-12 md:pt-24">
    <OriginVisionSection />
    <VenueSection />
  </div>
);

export default AboutPage;
