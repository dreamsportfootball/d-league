import React from 'react';
import { ArrowRight, PlayCircle, Trophy } from 'lucide-react';
import { Link } from 'react-router-dom';

const PreviousSeasonHighlight: React.FC = () => (
  <section className="container mx-auto px-4 pb-16 md:px-6 md:pb-24">
    <div className="overflow-hidden rounded-2xl bg-brand-black px-6 py-8 text-white shadow-xl md:px-10 md:py-10">
      <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-center">
        <div className="max-w-2xl">
          <span className="mb-3 block text-[10px] font-black uppercase tracking-[0.25em] text-brand-accent">
            Previous Season
          </span>
          <h2 className="font-display text-3xl font-black uppercase tracking-tight md:text-4xl">
            2025/26 賽季精彩回顧
          </h2>
          <p className="mt-3 text-sm leading-6 text-neutral-400 md:text-base">
            查看上季積分、球員數據、比賽照片與完整賽事內容
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            to="/standings?season=2025-26"
            className="inline-flex min-h-11 items-center justify-center rounded-lg border border-neutral-700 px-5 py-2.5 text-sm font-bold transition-colors hover:border-brand-accent hover:text-brand-accent"
          >
            <Trophy className="mr-2 h-4 w-4" aria-hidden="true" />
            查看上季積分
          </Link>
          <Link
            to="/media?season=2025-26"
            className="inline-flex min-h-11 items-center justify-center rounded-lg bg-brand-accent px-5 py-2.5 text-sm font-black text-brand-black transition-transform hover:-translate-y-0.5"
          >
            <PlayCircle className="mr-2 h-4 w-4" aria-hidden="true" />
            查看精彩內容
            <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </div>
  </section>
);

export default PreviousSeasonHighlight;
