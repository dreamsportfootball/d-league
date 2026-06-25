import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useSeason } from '../hooks/useSeason';
import { assetUrl } from '../services/seasonData';

const Hero: React.FC = () => {
  const [loaded, setLoaded] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const { activeSeason } = useSeason();

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
  }, [
    activeSeason.heroFallbackImage,
    activeSeason.heroImageDesktop,
    activeSeason.heroImageMobile,
    imageFailed,
  ]);

  const isRegistration = activeSeason.status === 'registration';
  const showRegistrationPoster =
    isRegistration && Boolean(activeSeason.heroImageDesktop) && !imageFailed;
  const expectedTeamCount = activeSeason.leagues[activeSeason.enabledLeagues[0]]?.expectedTeamCount;
  const leagueCount = activeSeason.enabledLeagues.length;

  if (showRegistrationPoster) {
    return (
      <section className="bg-brand-black" aria-labelledby="registration-hero-title">
        <h1 id="registration-hero-title" className="sr-only">
          {activeSeason.registrationMessage ?? `${activeSeason.displayName} 正式開放報名`}
        </h1>

        <picture className="block w-full">
          {activeSeason.heroImageMobile && (
            <source
              media="(max-width: 767px)"
              srcSet={heroImages.mobile}
              width={960}
              height={1200}
            />
          )}
          <img
            src={heroImages.desktop}
            onError={() => setImageFailed(true)}
            alt={`${activeSeason.displayName} 正式報名開放，設有 ${activeSeason.enabledLeagues.join('、')} 三個級別`}
            width={1920}
            height={800}
            loading="eager"
            decoding="async"
            fetchPriority="high"
            data-image-priority="true"
            className="block h-auto w-full"
          />
        </picture>

        <div className="border-t border-white/10 bg-brand-black">
          <div className="container mx-auto grid grid-cols-1 gap-3 px-4 py-4 sm:flex sm:items-center sm:justify-center md:px-6 md:py-5">
            {activeSeason.registrationFormUrl && (
              <a
                href={activeSeason.registrationFormUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 w-full items-center justify-center bg-brand-accent px-7 py-3 text-sm font-black uppercase tracking-widest text-brand-black transition-colors hover:bg-white focus:outline-none focus:ring-2 focus:ring-brand-accent focus:ring-offset-2 focus:ring-offset-brand-black sm:w-auto"
              >
                立即報名
                <ArrowRight className="ml-2 h-5 w-5" />
              </a>
            )}

            <Link
              to="/registration"
              className="inline-flex min-h-11 w-full items-center justify-center border border-white/45 px-7 py-3 text-sm font-bold uppercase tracking-widest text-white transition-colors hover:border-white hover:bg-white hover:text-brand-black focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-brand-black sm:w-auto"
            >
              報名詳情
            </Link>

            {activeSeason.regulationsUrl && (
              <a
                href={activeSeason.regulationsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 w-full items-center justify-center px-5 py-3 text-sm font-bold uppercase tracking-widest text-white/80 transition-colors hover:text-brand-accent focus:outline-none focus:ring-2 focus:ring-brand-accent focus:ring-offset-2 focus:ring-offset-brand-black sm:w-auto"
              >
                <FileText className="mr-2 h-5 w-5" />
                競賽規程
              </a>
            )}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="relative flex min-h-[58vh] items-center justify-center overflow-hidden bg-brand-black md:min-h-[68vh]">
      <div
        className={`absolute inset-0 z-0 transition-transform duration-[20s] ease-out ${
          loaded ? 'scale-105' : 'scale-100'
        }`}
      >
        <picture className="block h-full w-full">
          {!imageFailed && activeSeason.heroImageMobile && (
            <source media="(max-width: 767px)" srcSet={heroImages.mobile} />
          )}
          <img
            src={heroImages.desktop}
            onError={() => setImageFailed(true)}
            alt={`${activeSeason.displayName} 主視覺`}
            loading="eager"
            decoding="async"
            fetchPriority="high"
            data-image-priority="true"
            className="h-full w-full object-cover object-center opacity-90 md:object-center"
          />
        </picture>
        <div className="absolute inset-0 bg-gradient-to-r from-brand-black/75 via-brand-black/35 to-brand-black/10" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-brand-black/55" />
      </div>

      <div className="container relative z-10 mx-auto mb-16 mt-12 px-4 text-center md:px-6 md:text-left">
        <div className="max-w-5xl">
          <p className="mb-4 font-display text-xl font-black uppercase tracking-[0.32em] text-brand-accent md:text-3xl">
            Season {activeSeason.shortName}
          </p>
          <h1 className="font-display text-5xl font-black uppercase leading-[0.9] tracking-tighter text-white drop-shadow-2xl sm:text-7xl md:text-8xl lg:text-[9rem]">
            D LEAGUE
          </h1>
          <h2 className="mt-6 border-l-4 border-brand-accent pl-3 font-display text-2xl font-bold uppercase tracking-widest text-white md:text-4xl lg:text-5xl">
            台南夢達七人足球聯賽
          </h2>

          {isRegistration && (
            <p className="mt-6 max-w-2xl text-sm font-semibold leading-7 text-white/85 md:text-base">
              {activeSeason.shortName} 賽季設置 {activeSeason.enabledLeagues.join('、')}，共 {leagueCount} 個級別，各級別預計錄取 {expectedTeamCount ?? 0} 支球隊，正式實施升降級制度
            </p>
          )}

          <div
            className={`mt-8 flex flex-col items-center gap-4 transition-all duration-1000 ease-out sm:flex-row md:items-start ${
              loaded ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
            }`}
          >
            {isRegistration ? (
              <>
                {activeSeason.registrationFormUrl && (
                  <a
                    href={activeSeason.registrationFormUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative px-8 py-4 font-bold uppercase tracking-widest text-brand-black transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-brand-accent focus:ring-offset-2 focus:ring-offset-brand-black"
                  >
                    <span className="absolute inset-0 -skew-x-12 bg-brand-accent shadow-lg shadow-brand-accent/20 transition-colors duration-300 group-hover:bg-white" />
                    <span className="relative z-10 flex items-center">
                      立即報名
                      <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                    </span>
                  </a>
                )}

                <Link
                  to="/registration"
                  className="group relative px-8 py-4 font-bold uppercase tracking-widest text-white transition-colors duration-300 hover:text-brand-black focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-brand-black"
                >
                  <span className="absolute inset-0 -skew-x-12 border border-white/40 backdrop-blur-sm transition-all duration-300 group-hover:border-white group-hover:bg-white" />
                  <span className="relative z-10">報名詳情</span>
                </Link>

                {activeSeason.regulationsUrl && (
                  <a
                    href={activeSeason.regulationsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-4 py-4 text-sm font-bold uppercase tracking-widest text-white/80 transition-colors hover:text-brand-accent focus:outline-none focus:ring-2 focus:ring-brand-accent"
                  >
                    <FileText className="mr-2 h-5 w-5" />
                    競賽規程
                  </a>
                )}
              </>
            ) : (
              <>
                <Link
                  to="/schedule"
                  className="group relative px-8 py-4 font-bold uppercase tracking-widest text-brand-black transition-colors duration-300"
                >
                  <span className="absolute inset-0 -skew-x-12 bg-brand-accent transition-colors duration-300 group-hover:bg-white" />
                  <span className="relative z-10 flex items-center">
                    查看賽程
                    <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </span>
                </Link>
                {activeSeason.regulationsUrl && (
                  <a
                    href={activeSeason.regulationsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative px-8 py-4 font-bold uppercase tracking-widest text-white transition-colors duration-300 hover:text-brand-black"
                  >
                    <span className="absolute inset-0 -skew-x-12 border border-white/30 backdrop-blur-sm transition-all duration-300 group-hover:border-white group-hover:bg-white" />
                    <span className="relative z-10 flex items-center">
                      <FileText className="mr-2 h-5 w-5" />
                      賽事規程
                    </span>
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
