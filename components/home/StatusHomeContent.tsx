import React from 'react';
import { CheckCircle2, Clock3 } from 'lucide-react';
import { Link } from 'react-router-dom';
import BrandStory from '../BrandStory';
import ClubGrid from '../ClubGrid';
import NewsSection from '../NewsSection';

interface StatusHomeContentProps {
  status: 'review' | 'upcoming';
}

const StatusOverview: React.FC<StatusHomeContentProps> = ({ status }) => {
  const review = status === 'review';
  return (
    <section className="border-b border-neutral-200 bg-white px-4 py-14 md:px-6 md:py-20">
      <div className="mx-auto max-w-5xl text-center">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-brand-blue/10 text-brand-blue">
          {review ? <Clock3 className="h-7 w-7" /> : <CheckCircle2 className="h-7 w-7" />}
        </div>
        <p className="text-xs font-black uppercase tracking-[0.25em] text-brand-blue">
          {review ? '報名審核中' : '賽季準備中'}
        </p>
        <h2 className="mt-3 font-display text-3xl font-black uppercase text-brand-black md:text-5xl">
          {review ? '球隊審核與分級進行中' : '參賽球隊與級別即將公布'}
        </h2>
        <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-neutral-500 md:text-base">
          {review
            ? '主辦單位將依報名資料、過往成績、主要球員組成及各級別整體實力進行審核與分級'
            : '錄取球隊、正式級別、球員登錄時程及完整賽程將依序公布'}
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Link to="/news" className="rounded-full bg-brand-black px-6 py-3 text-xs font-black uppercase tracking-widest text-white">
            查看最新公告
          </Link>
          <Link to="/registration" className="rounded-full border border-neutral-300 px-6 py-3 text-xs font-black uppercase tracking-widest text-brand-black">
            查看賽季資訊
          </Link>
        </div>
      </div>
    </section>
  );
};

const StatusHomeContent: React.FC<StatusHomeContentProps> = ({ status }) => (
  <>
    <StatusOverview status={status} />
    <section className="container mx-auto px-4 py-12 md:px-6 md:py-16">
      <NewsSection />
    </section>
    <div id="teams">
      <ClubGrid />
    </div>
    <BrandStory />
  </>
);

export default StatusHomeContent;
