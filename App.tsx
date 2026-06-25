import React, { lazy, Suspense, useEffect } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import Analytics from './components/Analytics';
import AppErrorBoundary from './components/AppErrorBoundary';
import Footer from './components/Footer';
import Header from './components/Header';
import MobileRegistrationBar from './components/MobileRegistrationBar';
import Seo from './components/Seo';
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
        const headerHeight = 64;
        const elementPosition = element.getBoundingClientRect().top + window.scrollY;
        window.scrollTo({ top: elementPosition - headerHeight, behavior: 'smooth' });
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

const App: React.FC = () => (
  <SeasonProvider>
    <div className="flex min-h-screen w-full flex-col overflow-x-hidden bg-neutral-50 font-sans text-brand-black">
      <Header />
      <ScrollMemory />
      <Seo />
      <Analytics />

      <main className="w-full flex-grow pt-16">
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

export default App;
