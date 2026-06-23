import React, { lazy, Suspense, useEffect } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import Footer from './components/Footer';
import Header from './components/Header';
import { SeasonProvider } from './contexts/SeasonContext';
import HomePage from './pages/HomePage';

const SchedulePage = lazy(() => import('./pages/SchedulePage'));
const StandingsPage = lazy(() => import('./pages/StandingsPage'));
const NewsPage = lazy(() => import('./pages/NewsPage'));
const StatsPage = lazy(() => import('./pages/StatsPage'));
const ArticleDetailPage = lazy(() => import('./pages/ArticleDetailPage'));
const MediaPage = lazy(() => import('./pages/MediaPage'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
const CupPage = lazy(() => import('./pages/CupPage'));
const RegistrationPage = lazy(() => import('./pages/RegistrationPage'));

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

      <main className="w-full flex-grow pt-16">
        <Suspense
          fallback={
            <div className="p-20 text-center text-xl font-bold text-brand-blue">
              正在加載頁面中...
            </div>
          }
        >
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/registration" element={<RegistrationPage />} />
            <Route path="/schedule" element={<SchedulePage />} />
            <Route path="/standings" element={<StandingsPage />} />
            <Route path="/news" element={<NewsPage />} />
            <Route path="/stats" element={<StatsPage />} />
            <Route path="/news/:id" element={<ArticleDetailPage />} />
            <Route path="/media" element={<MediaPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/cup" element={<CupPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </main>

      <Footer />
    </div>
  </SeasonProvider>
);

export default App;
