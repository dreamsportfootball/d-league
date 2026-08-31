import React from 'react';
import SiteViewCount from './SiteViewCount';

const BrandStory: React.FC = () => (
  <section className="border-t border-neutral-200 bg-white py-12 md:py-16" aria-labelledby="brand-story-title">
    <div className="container mx-auto px-4 md:px-6">
      <div className="grid gap-10 md:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)] md:items-end md:gap-16">
        <div>
          <p className="mb-2 text-[10px] font-black uppercase tracking-[0.24em] text-brand-blue">
            Our Philosophy
          </p>
          <h2 id="brand-story-title" className="max-w-3xl font-display text-4xl font-black leading-[1.05] tracking-tight text-brand-black md:text-6xl">
            不只是一場比賽
            <span className="mt-1 block text-neutral-300">而是一個起點</span>
          </h2>
          <p className="mt-6 max-w-2xl text-base font-medium leading-8 text-neutral-600 md:text-lg">
            我們致力建立一個能讓更多人能夠踢、願意踢、享受踢的草根聯賽。
          </p>
        </div>

        <div className="border-l-2 border-brand-blue pl-5 md:pl-7">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-neutral-400">D LEAGUE</p>
          <p className="mt-3 font-display text-4xl font-black leading-none text-brand-black md:text-5xl">
            DREAM IT.
          </p>
          <p className="mt-2 font-display text-4xl font-black leading-none text-brand-accent md:text-5xl">
            PLAY IT.
          </p>
        </div>
      </div>

      <div className="mt-10 border-t border-neutral-200 pt-5 md:mt-14 md:pt-7">
        <SiteViewCount />
      </div>
    </div>
  </section>
);

export default BrandStory;
