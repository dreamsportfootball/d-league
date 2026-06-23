import React, { useMemo } from 'react';
import { ArrowRight, CalendarDays, FileText, MapPin, Trophy, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useSeason } from '../hooks/useSeason';

const formatDate = (value?: string): string => {
  if (!value) return '尚未公布';
  return value.replaceAll('-', '/');
};

const RegistrationOverview: React.FC = () => {
  const { activeSeason } = useSeason();

  const leagueConfigs = useMemo(
    () =>
      activeSeason.enabledLeagues
        .map((leagueId) => activeSeason.leagues[leagueId])
        .filter((league): league is NonNullable<typeof league> => Boolean(league)),
    [activeSeason.enabledLeagues, activeSeason.leagues],
  );

  const expectedTeamCount = leagueConfigs[0]?.expectedTeamCount;
  const leagueCount = activeSeason.enabledLeagues.length;

  return (
    <section className="bg-white py-14 md:py-20">
      <div className="container mx-auto max-w-7xl px-4 md:px-6">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:items-start">
          <div className="lg:col-span-5">
            <span className="mb-3 block text-xs font-black uppercase tracking-[0.28em] text-brand-blue">
              Registration Open
            </span>
            <h2 className="font-display text-4xl font-black uppercase leading-tight tracking-tight text-brand-black md:text-6xl">
              {activeSeason.shortName}
              <span className="block text-brand-blue">正式開放報名</span>
            </h2>
            <p className="mt-6 max-w-xl text-sm font-medium leading-7 text-neutral-600 md:text-base">
              {activeSeason.enabledLeagues.join('、')} 共 {leagueCount} 個級別同步開放報名，各級別預計錄取 {expectedTeamCount ?? 0} 支球隊，並正式實施升降級制度
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              {activeSeason.registrationFormUrl && (
                <a
                  href={activeSeason.registrationFormUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-12 items-center justify-center bg-brand-accent px-6 py-3 text-sm font-black uppercase tracking-widest text-brand-black transition-colors hover:bg-brand-black hover:text-white focus:outline-none focus:ring-2 focus:ring-brand-blue focus:ring-offset-2"
                >
                  立即報名
                  <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                </a>
              )}

              <Link
                to="/registration"
                className="inline-flex min-h-12 items-center justify-center border border-neutral-300 px-6 py-3 text-sm font-black uppercase tracking-widest text-brand-black transition-colors hover:border-brand-blue hover:text-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue focus:ring-offset-2"
              >
                報名詳情
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-px overflow-hidden border border-neutral-200 bg-neutral-200 sm:grid-cols-2 lg:col-span-7">
            <div className="bg-white p-6 md:p-8">
              <CalendarDays className="mb-5 h-6 w-6 text-brand-blue" aria-hidden="true" />
              <p className="text-xs font-black uppercase tracking-widest text-neutral-400">報名期間</p>
              <p className="mt-2 font-display text-xl font-bold text-brand-black">
                {formatDate(activeSeason.registrationStart)}－{formatDate(activeSeason.registrationEnd)}
              </p>
            </div>

            <div className="bg-white p-6 md:p-8">
              <MapPin className="mb-5 h-6 w-6 text-brand-blue" aria-hidden="true" />
              <p className="text-xs font-black uppercase tracking-widest text-neutral-400">比賽地點</p>
              <p className="mt-2 text-sm font-bold leading-6 text-brand-black">{activeSeason.venue}</p>
            </div>

            <div className="bg-white p-6 md:p-8">
              <Trophy className="mb-5 h-6 w-6 text-brand-blue" aria-hidden="true" />
              <p className="text-xs font-black uppercase tracking-widest text-neutral-400">賽事級別</p>
              <p className="mt-2 font-display text-2xl font-black tracking-wider text-brand-black">
                {activeSeason.enabledLeagues.join(' / ')}
              </p>
            </div>

            <div className="bg-white p-6 md:p-8">
              <Users className="mb-5 h-6 w-6 text-brand-blue" aria-hidden="true" />
              <p className="text-xs font-black uppercase tracking-widest text-neutral-400">預計隊數</p>
              <p className="mt-2 font-display text-2xl font-black text-brand-black">
                每級別 {expectedTeamCount ?? 0} 隊
              </p>
            </div>
          </div>
        </div>

        {activeSeason.regulationsUrl && (
          <div className="mt-8 flex justify-end">
            <a
              href={activeSeason.regulationsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-sm font-bold text-neutral-500 transition-colors hover:text-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue focus:ring-offset-2"
            >
              <FileText className="mr-2 h-4 w-4" aria-hidden="true" />
              查看競賽規程
            </a>
          </div>
        )}
      </div>
    </section>
  );
};

export default RegistrationOverview;
