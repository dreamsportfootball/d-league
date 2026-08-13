import React from 'react';
import { CheckCircle2, Clock3 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useSeason } from '../../hooks/useSeason';
import BrandStory from '../BrandStory';
import NewsSection from '../NewsSection';
import RegistrationResults from '../RegistrationResults';
import SeasonParticipants from '../SeasonParticipants';

interface StatusHomeContentProps {
  status: 'review' | 'upcoming';
}

const formatDeadline = (value: string): string => {
  const [datePart, timePart = ''] = value.split('T');
  const date = datePart.replaceAll('-', '/');
  const time = timePart.slice(0, 5);
  return time ? `${date} ${time}` : date;
};

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

const StatusHomeContent: React.FC<StatusHomeContentProps> = ({ status }) => {
  const { activeSeason } = useSeason();
  const seasonParticipants = activeSeason.seasonParticipants;
  const registrationResults = activeSeason.registrationResults;
  const primaryDeadline = seasonParticipants?.deadlines[0];

  return (
    <>
      {seasonParticipants && (
        <section className="border-b border-neutral-200 bg-neutral-950 text-white">
          <div className="container mx-auto grid max-w-7xl gap-px bg-white/10 md:grid-cols-[1fr_auto_1fr]">
            <div className="bg-neutral-950 px-5 py-5 md:px-7 md:py-6">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-brand-accent">目前階段</p>
              <p className="mt-2 font-display text-xl font-black md:text-2xl">球員及隊職員登錄</p>
            </div>
            {primaryDeadline && (
              <div className="bg-neutral-950 px-5 py-5 md:min-w-[280px] md:px-7 md:py-6">
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/45">{primaryDeadline.label}</p>
                <p className="mt-2 font-display text-xl font-black tabular-nums text-brand-accent md:text-2xl">
                  {formatDeadline(primaryDeadline.deadline)}
                </p>
              </div>
            )}
            <div className="bg-neutral-950 px-5 py-5 md:px-7 md:py-6">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/45">下一步</p>
              <p className="mt-2 text-sm font-bold leading-6 text-white/85">完整賽程、領隊會議及其他賽季資訊將另行公告</p>
            </div>
          </div>
        </section>
      )}

      {seasonParticipants ? (
        <section id="teams" className="scroll-mt-20 bg-white pb-12 pt-12 md:pb-16 md:pt-16">
          <div className="container mx-auto max-w-7xl px-4 md:px-6">
            <SeasonParticipants participants={seasonParticipants} />
          </div>
        </section>
      ) : registrationResults ? (
        <section id="teams" className="scroll-mt-20 bg-white pb-12 pt-12 md:pb-16 md:pt-16">
          <div className="container mx-auto max-w-7xl px-4 md:px-6">
            <RegistrationResults results={registrationResults} />
          </div>
        </section>
      ) : (
        <StatusOverview status={status} />
      )}
      <section className="container mx-auto px-4 py-12 md:px-6 md:py-16">
        <NewsSection />
      </section>
      <BrandStory />
    </>
  );
};

export default StatusHomeContent;
