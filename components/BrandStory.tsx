import React from 'react';
import SiteViewCount from './SiteViewCount';

const BrandStory: React.FC = () => (
  <section className="relative overflow-hidden bg-white py-8 md:py-16">
    <div className="pointer-events-none absolute left-1/2 top-1/2 w-full -translate-x-1/2 -translate-y-1/2 text-center">
      <span className="font-display text-[15rem] font-black uppercase leading-none text-neutral-50 opacity-60">
        DREAM
      </span>
    </div>

    <div className="container relative z-10 mx-auto max-w-3xl px-4 text-center md:px-6">
      <span className="mb-6 block text-xs font-black uppercase tracking-[0.2em] text-brand-blue">
        Our Philosophy
      </span>
      <h2 className="mb-10 font-display text-4xl font-black leading-tight text-brand-black md:text-6xl">
        不只是一場比賽<br />
        <span className="text-neutral-300">而是一個起點</span>
      </h2>
      <div className="mx-auto max-w-2xl space-y-6 text-lg font-medium leading-relaxed text-neutral-600 md:text-xl">
        <p>
          我們致力建立一個
          <span className="whitespace-nowrap">能讓更多人能夠踢、願意踢、</span>
          <span className="whitespace-nowrap">享受踢的草根聯賽</span>
        </p>
      </div>
      <div className="mt-16 flex items-center justify-center space-x-3">
        <span className="font-display text-4xl font-black text-brand-black md:text-5xl">DREAM IT.</span>
        <span className="stroke-black font-display text-4xl font-black text-brand-accent md:text-5xl">PLAY IT.</span>
      </div>
      <SiteViewCount />
    </div>
  </section>
);

export default BrandStory;
