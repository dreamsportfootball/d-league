import React from 'react';

const BrandStory: React.FC = () => (
  <section className="dl-brand-story relative overflow-hidden bg-neutral-950 py-20 text-white md:py-32">

    <div className="container relative z-10 mx-auto max-w-6xl px-4 text-left md:px-6">
      <h2 className="mb-10 font-display text-5xl font-black leading-tight text-white md:text-7xl">
        不只是一場比賽<br />
        <span className="text-brand-accent">而是一個起點</span>
      </h2>
      <div className="max-w-2xl space-y-6 text-lg font-medium leading-relaxed text-neutral-200 md:text-xl">
        <p>
          我們致力建立一個
          <span className="whitespace-nowrap">能讓更多人能夠踢、願意踢、</span>
          <span className="whitespace-nowrap">享受踢的草根聯賽</span>
        </p>
      </div>
      <div className="mt-14 flex flex-wrap items-center justify-start gap-3 border-t border-white/20 pt-7">
        <span className="font-display text-4xl font-black text-white md:text-5xl">DREAM IT.</span>
        <span className="stroke-black font-display text-4xl font-black text-brand-accent md:text-5xl">PLAY IT.</span>
      </div>
    </div>
  </section>
);

export default BrandStory;
