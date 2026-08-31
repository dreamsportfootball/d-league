import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SHOW_REGISTRATION_NAV } from '../config/siteConfig';
import { useSeason } from '../hooks/useSeason';
import { assetUrl } from '../services/seasonData';

const Hero: React.FC = () => {
  const [loaded, setLoaded] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const { activeSeason, seasonData } = useSeason();

  useEffect(() => {
    setLoaded(true);
  }, []);

  useEffect(() => {
    setImageFailed(false);
  }, [activeSeason.id]);

  const heroImages = useMemo(() => {
    const fallback = assetUrl(activeSeason.heroFallbackImage);
    return {
      fallback,
      desktop: imageFailed
        ? fallback
        : assetUrl(activeSeason.heroImageDesktop ?? activeSeason.heroFallbackImage),
      mobile: imageFailed
        ? fallback
        : assetUrl(
            activeSeason.heroImageMobile ??
              activeSeason.heroImageDesktop ??
              activeSeason.heroFallbackImage,
          ),
    };
  }, [activeSeason.heroFallbackImage, activeSeason.heroImageDesktop, activeSeason.heroImageMobile, imageFailed]);

  const isRegistration = activeSeason.status === 'registration';
  const participantsPublished = Boolean(activeSeason.seasonParticipants);
  const resultsPublished = Boolean(activeSeason.registrationResults);
  const announcementPublished = participantsPublished || resultsPublished;
  const schedulePublished = seasonData.matches.length > 0;
  const previewingActiveSeason = import.meta.env.VITE_PREVIEW_SEASON_STATUS === 'active';
  const showSeasonPoster =
    (isRegistration || announcementPublished) && Boolean(activeSeason.heroImageDesktop) && !imageFailed;
  const showSeasonPosterActions = !previewingActiveSeason || schedulePublished;
  const expectedTeamCount = activeSeason.leagues[activeSeason.enabledLeagues[0]]?.expectedTeamCount;
  const leagueCount = activeSeason.enabledLeagues.length;
  const participantTeamCount = activeSeason.seasonParticipants
    ? activeSeason.enabledLeagues.reduce(
        (count, leagueId) => count + (activeSeason.seasonParticipants?.leagues[leagueId]?.length ?? 0),
        0,
      )
    : 0;

  if (showSeasonPoster) {
    return (
      <section className="bg-brand-black" aria-labelledby="season-hero-title">
        <h1 id="season-hero-title" className="sr-only">
          {activeSeason.registrationMessage ?? `${activeSeason.displayName} 賽季資訊`}
        </h1>

        <picture className="block w-full">
          {activeSeason.heroImageMobile && (
            <source media="(max-width: 767px)" srcSet={heroImages.mobile} width={960} height={1200} />
          )}
          <img
            src={heroImages.desktop}
            onError={() => setImageFailed(true)}
            alt={previewingActiveSeason
              ? `${activeSeason.displayName} 官方主視覺`
              : participantsPublished
                ? `${activeSeason.displayName} 正式參賽隊伍及分級已公布`
                : resultsPublished
                  ? `${activeSeason.displayName} 錄取名單已公布`
                  : `${activeSeason.displayName} 正式報名開放，設有 ${activeSeason.enabledLeagues.join('、')} 三個級別`}
            width={1920}
            height={800}
            loading="eager"
            decoding="async"
            fetchPriority="high"
            data-image-priority="true"
            className="block h-auto w-full"
          />
        </picture>

        {previewingActiveSeason && participantsPublished && (
          <div className="border-t border-white/10 bg-brand-black text-white">
            <div className="container mx-auto flex flex-col px-4 sm:flex-row sm:items-stretch sm:justify-between md:px-6">
              <div className="min-w-0 border-l-2 border-brand-accent py-4 pl-4 sm:flex sm:flex-1 sm:items-center sm:py-5 md:pl-5">
                <div>
                  <p className="font-display text-xs font-black uppercase tracking-[0.24em] text-brand-accent sm:text-sm">
                    D LEAGUE · {activeSeason.shortName}
                  </p>
                  <p className="mt-1 text-sm font-bold leading-6 text-white sm:text-base">
                    {activeSeason.registrationMessage ?? '正式參賽隊伍及分級已公布'}
                  </p>
                </div>
              </div>

              <dl className="grid grid-cols-2 border-t border-white/10 sm:min-w-[24rem] sm:border-l sm:border-t-0 sm:border-white/10">
                <div className="flex min-h-20 flex-col justify-center border-r border-white/10 px-4 py-3 sm:px-6">
                  <dt className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/50">正式參賽</dt>
                  <dd className="mt-1 font-display text-2xl font-black leading-none tracking-tight text-white sm:text-3xl">
                    {participantTeamCount}
                    <span className="ml-1 text-xs font-bold tracking-normal text-white/60 sm:text-sm">支</span>
                  </dd>
                </div>
                <div className="flex min-h-20 flex-col justify-center px-4 py-3 sm:px-6">
                  <dt className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/50">聯賽級別</dt>
                  <dd className="mt-1 whitespace-nowrap font-display text-xl font-black leading-none tracking-tight text-white sm:text-2xl">
                    {activeSeason.enabledLeagues.join(' · ')}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        )}

        {showSeasonPosterActions && (
          <div className="border-t border-white/10 bg-brand-black">
            <div className="container mx-auto grid grid-cols-1 gap-3 px-4 py-4 sm:flex sm:items-center sm:justify-center md:px-6 md:py-5">
              {!announcementPublished && activeSeason.registrationFormUrl && (
                <a href={activeSeason.registrationFormUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 w-full items-center justify-center bg-brand-accent px-7 py-3 text-sm font-black uppercase tracking-widest text-brand-black transition-colors hover:bg-white focus:outline-none focus:ring-2 focus:ring-brand-accent focus:ring-offset-2 focus:ring-offset-brand-black sm:w-auto">
                  立即報名 <ArrowRight className="ml-2 h-5 w-5" />
                </a>
              )}
              {!announcementPublished && SHOW_REGISTRATION_NAV && !previewingActiveSeason && (
                <Link to="/registration" className="inline-flex min-h-11 w-full items-center justify-center border border-white/45 px-7 py-3 text-sm font-bold uppercase tracking-widest text-white transition-colors hover:border-white hover:bg-white hover:text-brand-black focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-brand-black sm:w-auto">
                  報名詳情
                </Link>
              )}

              {announcementPublished && schedulePublished && (
                <>
                  <Link to="/schedule" className="inline-flex min-h-11 w-full items-center justify-center bg-brand-accent px-7 py-3 text-sm font-black uppercase tracking-widest text-brand-black transition-colors hover:bg-white focus:outline-none focus:ring-2 focus:ring-brand-accent focus:ring-offset-2 focus:ring-offset-brand-black sm:w-auto">
                    查看賽程 <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                  {SHOW_REGISTRATION_NAV && !previewingActiveSeason && (
                    <Link to="/registration" className="inline-flex min-h-11 w-full items-center justify-center border border-white/45 px-7 py-3 text-sm font-bold uppercase tracking-widest text-white transition-colors hover:border-white hover:bg-white hover:text-brand-black focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-brand-black sm:w-auto">
                      {participantsPublished ? '查看正式分級' : '查看錄取名單'}
                    </Link>
                  )}
                </>
              )}

              {announcementPublished && !schedulePublished && !previewingActiveSeason && (
                <>
                  {SHOW_REGISTRATION_NAV ? (
                    <Link to="/registration" className="inline-flex min-h-11 w-full items-center justify-center bg-brand-accent px-7 py-3 text-sm font-black uppercase tracking-widest text-brand-black transition-colors hover:bg-white focus:outline-none focus:ring-2 focus:ring-brand-accent focus:ring-offset-2 focus:ring-offset-brand-black sm:w-auto">
                      {participantsPublished ? '查看正式分級' : '查看錄取名單'} <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                  ) : (
                    <Link to="/news" className="inline-flex min-h-11 w-full items-center justify-center bg-brand-accent px-7 py-3 text-sm font-black uppercase tracking-widest text-brand-black transition-colors hover:bg-white focus:outline-none focus:ring-2 focus:ring-brand-accent focus:ring-offset-2 focus:ring-offset-brand-black sm:w-auto">
                      查看最新公告 <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                  )}
                  {SHOW_REGISTRATION_NAV && (
                    <Link to="/news" className="inline-flex min-h-11 w-full items-center justify-center border border-white/45 px-7 py-3 text-sm font-bold uppercase tracking-widest text-white transition-colors hover:border-white hover:bg-white hover:text-brand-black focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-brand-black sm:w-auto">
                      查看最新公告
                    </Link>
                  )}
                </>
              )}

              {!previewingActiveSeason && activeSeason.regulationsUrl && (
                <a href={activeSeason.regulationsUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 w-full items-center justify-center px-5 py-3 text-sm font-bold uppercase tracking-widest text-white/80 transition-colors hover:text-brand-accent focus:outline-none focus:ring-2 focus:ring-brand-accent focus:ring-offset-2 focus:ring-offset-brand-black sm:w-auto">
                  <FileText className="mr-2 h-5 w-5" />競賽規程
                </a>
              )}
            </div>
          </div>
        )}
      </section>
    );
  }

  return (
    <section className="relative flex min-h-[58vh] items-center justify-center overflow-hidden bg-brand-black md:min-h-[68vh]">
      <div className={`absolute inset-0 z-0 transition-transform duration-[20s] ease-out ${loaded ? 'scale-105' : 'scale-100'}`}>
        <picture className="block h-full w-full">
          {!imageFailed && activeSeason.heroImageMobile && <source media="(max-width: 767px)" srcSet={heroImages.mobile} />}
          <img src={heroImages.desktop} onError={() => setImageFailed(true)} alt={`${activeSeason.displayName} 主視覺`} loading="eager" decoding="async" fetchPriority="high" data-image-priority="true" className="h-full w-full object-cover object-center opacity-90 md:object-center" />
        </picture>
        <div className="absolute inset-0 bg-gradient-to-r from-brand-black/75 via-brand-black/35 to-brand-black/10" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-brand-black/55" />
      </div>

      <div className="container relative z-10 mx-auto mb-16 mt-12 px-4 text-center md:px-6 md:text-left">
        <div className="max-w-5xl">
          <p className="mb-4 font-display text-xl font-black uppercase tracking-[0.32em] text-brand-accent md:text-3xl">Season {activeSeason.shortName}</p>
          <h1 className="font-display text-5xl font-black uppercase leading-[0.9] tracking-tighter text-white drop-shadow-2xl sm:text-7xl md:text-8xl lg:text-[9rem]">D LEAGUE</h1>
          <h2 className="mt-6 border-l-4 border-brand-accent pl-3 font-display text-2xl font-bold uppercase tracking-widest text-white md:text-4xl lg:text-5xl">台南夢達七人足球聯賽</h2>

          {isRegistration && (
            <p className="mt-6 max-w-2xl text-sm font-semibold leading-7 text-white/85 md:text-base">
              {activeSeason.shortName} 賽季設置 {activeSeason.enabledLeagues.join('、')}，共 {leagueCount} 個級別，各級別預計錄取 {expectedTeamCount ?? 0} 支球隊，正式實施升降級制度
            </p>
          )}

          <div className={`mt-8 flex flex-col items-center gap-4 transition-all duration-1000 ease-out sm:flex-row md:items-start ${loaded ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
            {isRegistration ? (
              <>
                {activeSeason.registrationFormUrl && (
                  <a href={activeSeason.registrationFormUrl} target="_blank" rel="noopener noreferrer" className="group relative px-8 py-4 font-bold uppercase tracking-widest text-brand-black transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-brand-accent focus:ring-offset-2 focus:ring-offset-brand-black">
                    <span className="absolute inset-0 -skew-x-12 bg-brand-accent shadow-lg shadow-brand-accent/20 transition-colors duration-300 group-hover:bg-white" />
                    <span className="relative z-10 flex items-center">立即報名<ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" /></span>
                  </a>
                )}
                {SHOW_REGISTRATION_NAV && (
                  <Link to="/registration" className="group relative px-8 py-4 font-bold uppercase tracking-widest text-white transition-colors duration-300 hover:text-brand-black focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-brand-black">
                    <span className="absolute inset-0 -skew-x-12 border border-white/40 backdrop-blur-sm transition-all duration-300 group-hover:border-white group-hover:bg-white" />
                    <span className="relative z-10">報名詳情</span>
                  </Link>
                )}
                {activeSeason.regulationsUrl && (
                  <a href={activeSeason.regulationsUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-4 py-4 text-sm font-bold uppercase tracking-widest text-white/80 transition-colors hover:text-brand-accent focus:outline-none focus:ring-2 focus:ring-brand-accent">
                    <FileText className="mr-2 h-5 w-5" />競賽規程
                  </a>
                )}
              </>
            ) : (
              <>
                <Link to="/schedule" className="group relative px-8 py-4 font-bold uppercase tracking-widest text-brand-black transition-colors duration-300">
                  <span className="absolute inset-0 -skew-x-12 bg-brand-accent transition-colors duration-300 group-hover:bg-white" />
                  <span className="relative z-10 flex items-center">查看賽程<ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" /></span>
                </Link>
                <Link to="/standings" className="group relative px-8 py-4 font-bold uppercase tracking-widest text-white transition-colors duration-300 hover:text-brand-black">
                  <span className="absolute inset-0 -skew-x-12 border border-white/30 backdrop-blur-sm transition-all duration-300 group-hover:border-white group-hover:bg-white" />
                  <span className="relative z-10">查看積分榜</span>
                </Link>
                {!previewingActiveSeason && activeSeason.regulationsUrl && (
                  <a href={activeSeason.regulationsUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-4 py-4 text-sm font-bold uppercase tracking-widest text-white/75 transition-colors hover:text-brand-accent">
                    <FileText className="mr-2 h-5 w-5" />賽事規程
                  </a>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
