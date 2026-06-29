import React, { lazy, Suspense, useEffect } from 'react';
import { Navigate, Route, Routes, useLocation, useSearchParams } from 'react-router-dom';
import Analytics from './components/Analytics';
import AppErrorBoundary from './components/AppErrorBoundary';
import Footer from './components/Footer';
import Header from './components/Header';
import ImageLoadingOptimizer from './components/ImageLoadingOptimizer';
import MobileRegistrationBar from './components/MobileRegistrationBar';
import Seo from './components/Seo';
import { isSeasonId } from './config/seasons';
import { CURRENT_SEASON_ID } from './config/siteConfig';
import { SeasonProvider } from './contexts/SeasonContext';
import HomePage from './pages/HomePage';

const SchedulePage = lazy(() => import('./pages/SchedulePage'));
const StandingsPage = lazy(() => import('./pages/StandingsPage'));
const NewsPage = lazy(() => import('./pages/NewsPage'));
const StatsPage = lazy(() => import('./pages/StatsPage'));
const ArticleDetailPage = lazy(() => import('./pages/ArticleDetailPage'));
const TeamPage = lazy(() => import('./pages/TeamPage'));
const MediaPage = lazy(() => import('./pages/MediaPage'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
const CupPage = lazy(() => import('./pages/CupPage'));
const RegistrationPage = lazy(() => import('./pages/RegistrationPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

const preferredScrollBehavior = (): ScrollBehavior =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';

const PageSkeleton: React.FC = () => (
  <div className="min-h-[70vh] animate-pulse bg-white px-4 pb-24 pt-10 md:px-12 md:pt-24">
    <div className="mx-auto max-w-7xl">
      <div className="mb-12 flex items-end justify-between gap-6">
        <div className="w-full max-w-xl">
          <div className="mb-4 h-12 w-3/5 rounded bg-neutral-200 md:h-16" />
          <div className="h-5 w-4/5 rounded bg-neutral-100" />
        </div>
        <div className="hidden h-9 w-[148px] rounded-lg bg-neutral-100 md:block" />
      </div>
      <div className="mb-8 h-12 rounded-xl bg-neutral-100" />
      <div className="space-y-4">
        <div className="h-24 rounded-xl bg-neutral-100" />
        <div className="h-24 rounded-xl bg-neutral-100" />
        <div className="h-24 rounded-xl bg-neutral-100" />
      </div>
    </div>
  </div>
);

const SectionAnchorNavigation: React.FC = () => {
  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }

      const target = event.target;
      const anchor = target instanceof Element
        ? target.closest<HTMLAnchorElement>('a[href^="#"]')
        : null;
      const href = anchor?.getAttribute('href');

      if (!href || href === '#' || href.startsWith('#/')) return;

      const sectionId = decodeURIComponent(href.slice(1));
      const section = document.getElementById(sectionId);
      if (!section) return;

      event.preventDefault();
      const headerHeight = sectionId === 'main-content' ? 0 : 64;
      const sectionTop = section.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({
        top: sectionTop - headerHeight,
        behavior: preferredScrollBehavior(),
      });
      if (sectionId === 'main-content') section.focus({ preventScroll: true });
    };

    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  return null;
};

const ScrollMemory: React.FC = () => {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    const previousPathname = window.sessionStorage.getItem('lastPathname') || '';
    const isReturningFromArticle = previousPathname.startsWith('/news/') && pathname === '/news';

    if (isReturningFromArticle) {
      const savedY = window.sessionStorage.getItem('newsScrollY');
      if (savedY !== null) {
        const y = parseInt(savedY, 10);
        if (!Number.isNaN(y)) {
          window.scrollTo({ top: y, behavior: 'auto' });
          return;
        }
      }
      window.scrollTo(0, 0);
      return;
    }

    if (hash) {
      const id = hash.substring(1);
      const element = document.getElementById(id);
      if (element) {
        const headerHeight = id === 'main-content' ? 0 : 64;
        const elementPosition = element.getBoundingClientRect().top + window.scrollY;
        window.scrollTo({
          top: elementPosition - headerHeight,
          behavior: preferredScrollBehavior(),
        });
        return;
      }
    }

    window.scrollTo(0, 0);
  }, [pathname, hash]);

  useEffect(() => {
    return () => {
      window.sessionStorage.setItem('lastPathname', pathname);
      if (pathname === '/news') {
        window.sessionStorage.setItem('newsScrollY', String(window.scrollY));
      }
    };
  }, [pathname]);

  return null;
};

const Site: React.FC = () => (
  <SeasonProvider>
    <div className="flex min-h-screen w-full flex-col overflow-x-hidden bg-neutral-50 font-sans text-brand-black">
      <a
        href="#main-content"
        className="fixed left-4 top-2 z-[2000] -translate-y-20 bg-brand-black px-4 py-3 text-sm font-black text-white transition-transform focus:translate-y-0"
      >
        跳至主要內容
      </a>
      <Header />
      <ImageLoadingOptimizer />
      <SectionAnchorNavigation />
      <ScrollMemory />
      <Seo />
      <Analytics />

      <main id="main-content" tabIndex={-1} className="w-full flex-grow pt-16 outline-none">
        <AppErrorBoundary>
          <Suspense fallback={<PageSkeleton />}>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/registration" element={<RegistrationPage />} />
              <Route path="/schedule" element={<SchedulePage />} />
              <Route path="/standings" element={<StandingsPage />} />
              <Route path="/news" element={<NewsPage />} />
              <Route path="/stats" element={<StatsPage />} />
              <Route path="/news/:id" element={<ArticleDetailPage />} />
              <Route path="/teams/:id" element={<TeamPage />} />
              <Route path="/media" element={<MediaPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/cup" element={<CupPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Suspense>
        </AppErrorBoundary>
      </main>

      <Footer />
      <MobileRegistrationBar />
    </div>
  </SeasonProvider>
);

const App: React.FC = () => {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const requestedSeason = searchParams.get('season');

  if (
    location.pathname.startsWith('/teams/') &&
    isSeasonId(requestedSeason) &&
    requestedSeason !== CURRENT_SEASON_ID
  ) {
    return <Navigate to={`/standings?season=${requestedSeason}`} replace />;
  }

  return <Site />;
};

export default App;
