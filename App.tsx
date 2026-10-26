import React, { lazy, Suspense, useEffect, useLayoutEffect } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigationType } from 'react-router-dom';
import Analytics from './components/Analytics';
import AppErrorBoundary from './components/AppErrorBoundary';
import ExperienceEnhancements from './components/ExperienceEnhancements';
import Footer from './components/Footer';
import Header from './components/Header';
import ImageLoadingOptimizer from './components/ImageLoadingOptimizer';
import Seo from './components/Seo';
import { SHOW_REGISTRATION_NAV } from './config/siteConfig';
import { SeasonProvider } from './contexts/SeasonContext';
import HomePage from './pages/HomePage';

const SchedulePage = lazy(() => import('./pages/SchedulePage'));
const StandingsPage = lazy(() => import('./pages/StandingsPage'));
const NewsPage = lazy(() => import('./pages/NewsPage'));
const StatsPage = lazy(() => import('./pages/StatsPage'));
const ArticleDetailPage = lazy(() => import('./pages/ArticleDetailPage'));
const TeamPage = lazy(() => import('./pages/TeamPage'));
const PlayerPage = lazy(() => import('./pages/PlayerPage'));
const MatchPage = lazy(() => import('./pages/MatchPage'));
const RoundPage = lazy(() => import('./pages/RoundPage'));
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
      </div>
      <div className="space-y-4">
        <div className="h-24 rounded-xl bg-neutral-100" />
        <div className="h-24 rounded-xl bg-neutral-100" />
        <div className="h-24 rounded-xl bg-neutral-100" />
      </div>
    </div>
  </div>
);

const PlayerProfileRoute: React.FC = () => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);

  if (searchParams.has('season')) {
    searchParams.delete('season');
    const nextSearch = searchParams.toString();
    return (
      <Navigate
        to={`${location.pathname}${nextSearch ? `?${nextSearch}` : ''}${location.hash}`}
        replace
      />
    );
  }

  return <PlayerPage />;
};

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
      ) return;

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
      window.scrollTo({ top: sectionTop - headerHeight, behavior: preferredScrollBehavior() });
      if (sectionId === 'main-content') section.focus({ preventScroll: true });
    };

    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  return null;
};

interface ScrollAnchorSnapshot {
  ariaLabel: string;
  viewportTop: number;
  anchorId?: string;
  href?: string;
}

const SCROLL_STORAGE_PREFIX = 'dleague:scroll:';
const SCROLL_ANCHOR_STORAGE_PREFIX = 'dleague:scroll-anchor:';
const MAX_SECTION_RESTORE_ATTEMPTS = 30;
const POP_SCROLL_RESTORE_WINDOW_MS = 8000;
const SCROLL_RESTORE_TOLERANCE_PX = 2;

const getScrollStorageKey = (locationKey: string): string =>
  `${SCROLL_STORAGE_PREFIX}${locationKey}`;

const getScrollAnchorStorageKey = (locationKey: string): string =>
  `${SCROLL_ANCHOR_STORAGE_PREFIX}${locationKey}`;

const readScrollPosition = (locationKey: string): number | null => {
  try {
    const raw = window.sessionStorage.getItem(getScrollStorageKey(locationKey));
    if (raw === null) return null;
    const value = Number(raw);
    return Number.isFinite(value) && value >= 0 ? value : null;
  } catch {
    return null;
  }
};

const writeScrollPosition = (locationKey: string, scrollY: number): void => {
  try {
    window.sessionStorage.setItem(getScrollStorageKey(locationKey), String(scrollY));
  } catch {
    // Session storage may be unavailable.
  }
};

const writeScrollAnchor = (locationKey: string, snapshot: ScrollAnchorSnapshot): void => {
  try {
    window.sessionStorage.setItem(getScrollAnchorStorageKey(locationKey), JSON.stringify(snapshot));
  } catch {
    // Session storage may be unavailable.
  }
};

const consumeScrollAnchor = (locationKey: string): ScrollAnchorSnapshot | null => {
  try {
    const storageKey = getScrollAnchorStorageKey(locationKey);
    const raw = window.sessionStorage.getItem(storageKey);
    window.sessionStorage.removeItem(storageKey);
    if (raw === null) return null;

    const value = JSON.parse(raw) as Partial<ScrollAnchorSnapshot>;
    if (
      typeof value.ariaLabel !== 'string' ||
      value.ariaLabel.length === 0 ||
      typeof value.viewportTop !== 'number' ||
      !Number.isFinite(value.viewportTop) ||
      (value.anchorId !== undefined && typeof value.anchorId !== 'string') ||
      (value.href !== undefined && typeof value.href !== 'string')
    ) return null;

    return {
      ariaLabel: value.ariaLabel,
      viewportTop: value.viewportTop,
      ...(value.anchorId ? { anchorId: value.anchorId } : {}),
      ...(value.href ? { href: value.href } : {}),
    };
  } catch {
    return null;
  }
};

const isUsableScrollAnchor = (element: HTMLAnchorElement): boolean => {
  if (!element.isConnected) return false;
  const rect = element.getBoundingClientRect();
  const style = window.getComputedStyle(element);
  return (
    rect.width > 0 &&
    rect.height > 0 &&
    style.display !== 'none' &&
    style.visibility !== 'hidden'
  );
};

const selectClosestScrollAnchor = (
  candidates: HTMLAnchorElement[],
  snapshot: ScrollAnchorSnapshot,
): HTMLAnchorElement | null => {
  const usableCandidates = candidates.filter(isUsableScrollAnchor);
  if (usableCandidates.length === 0) return null;

  return usableCandidates.reduce((closest, candidate) => {
    const closestDelta = Math.abs(closest.getBoundingClientRect().top - snapshot.viewportTop);
    const candidateDelta = Math.abs(candidate.getBoundingClientRect().top - snapshot.viewportTop);
    return candidateDelta < closestDelta ? candidate : closest;
  });
};

const findScrollAnchor = (snapshot: ScrollAnchorSnapshot): HTMLAnchorElement | null => {
  if (snapshot.anchorId) {
    const identifiedAnchors = Array.from(
      document.querySelectorAll<HTMLAnchorElement>('a[data-scroll-anchor-id]'),
    ).filter((element) => element.dataset.scrollAnchorId === snapshot.anchorId);
    const identifiedAnchor = selectClosestScrollAnchor(identifiedAnchors, snapshot);
    if (identifiedAnchor) return identifiedAnchor;
  }

  if (snapshot.href) {
    const hrefAnchors = Array.from(
      document.querySelectorAll<HTMLAnchorElement>('a[href]'),
    ).filter((element) => element.getAttribute('href') === snapshot.href);
    const hrefAnchor = selectClosestScrollAnchor(hrefAnchors, snapshot);
    if (hrefAnchor) return hrefAnchor;
  }

  const labelledAnchors = Array.from(
    document.querySelectorAll<HTMLAnchorElement>('a[aria-label]'),
  ).filter((element) => element.getAttribute('aria-label') === snapshot.ariaLabel);
  return selectClosestScrollAnchor(labelledAnchors, snapshot);
};

const isInsideViewportPinnedContainer = (element: HTMLElement): boolean => {
  let current: HTMLElement | null = element;
  while (current) {
    const position = window.getComputedStyle(current).position;
    if (position === 'fixed' || position === 'sticky') return true;
    current = current.parentElement;
  }
  return false;
};

const ScrollMemory: React.FC = () => {
  const { pathname, search, hash, key } = useLocation();
  const navigationType = useNavigationType();
  const storageLocationKey = `${key}:${pathname}${search}${hash}`;

  useLayoutEffect(() => {
    const previousRestoration = window.history.scrollRestoration;
    window.history.scrollRestoration = 'manual';
    return () => {
      window.history.scrollRestoration = previousRestoration;
    };
  }, []);

  useLayoutEffect(() => {
    let frameId = 0;

    const persistCurrentPosition = () => {
      frameId = 0;
      writeScrollPosition(storageLocationKey, window.scrollY);
    };

    const handleScroll = () => {
      if (frameId !== 0) return;
      frameId = window.requestAnimationFrame(persistCurrentPosition);
    };

    const handlePageHide = () => {
      if (frameId !== 0) {
        window.cancelAnimationFrame(frameId);
        frameId = 0;
      }
      writeScrollPosition(storageLocationKey, window.scrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('pagehide', handlePageHide);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('pagehide', handlePageHide);
      if (frameId !== 0) window.cancelAnimationFrame(frameId);
      writeScrollPosition(storageLocationKey, window.scrollY);
    };
  }, [storageLocationKey]);

  useEffect(() => {
    const handleTrackedNavigation = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) return;

      const target = event.target;
      const anchor = target instanceof Element
        ? target.closest<HTMLAnchorElement>('a[data-scroll-anchor-id], a[href*="/players/"]')
        : null;
      const href = anchor?.getAttribute('href');
      if (
        !anchor ||
        !href ||
        anchor.target === '_blank' ||
        anchor.hasAttribute('download') ||
        !isUsableScrollAnchor(anchor)
      ) return;

      const ariaLabel = anchor.getAttribute('aria-label') ?? anchor.textContent?.trim() ?? href;
      const anchorId = anchor.dataset.scrollAnchorId;

      // Harden the source history entry synchronously before React Router can change location.
      writeScrollPosition(storageLocationKey, window.scrollY);
      writeScrollAnchor(storageLocationKey, {
        ariaLabel,
        viewportTop: anchor.getBoundingClientRect().top,
        ...(anchorId ? { anchorId } : {}),
        href,
      });
    };

    document.addEventListener('click', handleTrackedNavigation, true);
    return () => document.removeEventListener('click', handleTrackedNavigation, true);
  }, [storageLocationKey]);

  useLayoutEffect(() => {
    let cancelled = false;
    let frameId = 0;
    let attempts = 0;
    let restoreWindowId = 0;
    let restoringSavedPosition = false;
    const savedPosition = navigationType === 'POP' ? readScrollPosition(storageLocationKey) : null;
    const savedAnchor = consumeScrollAnchor(storageLocationKey);
    const sectionId = hash ? decodeURIComponent(hash.slice(1)) : '';

    const stopSavedPositionRestoration = () => {
      if (!restoringSavedPosition) return;
      restoringSavedPosition = false;
      if (frameId !== 0) {
        window.cancelAnimationFrame(frameId);
        frameId = 0;
      }
      if (restoreWindowId !== 0) {
        window.clearTimeout(restoreWindowId);
        restoreWindowId = 0;
      }
      window.removeEventListener('wheel', stopSavedPositionRestoration);
      window.removeEventListener('touchstart', stopSavedPositionRestoration);
      window.removeEventListener('pointerdown', stopSavedPositionRestoration);
      window.removeEventListener('keydown', stopSavedPositionRestoration);
    };

    const maintainSavedPosition = () => {
      if (
        cancelled ||
        !restoringSavedPosition ||
        (savedPosition === null && savedAnchor === null)
      ) return;

      const maxScrollY = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
      const anchorElement = savedAnchor ? findScrollAnchor(savedAnchor) : null;
      const canUseAnchor = Boolean(
        anchorElement &&
        savedAnchor &&
        !isInsideViewportPinnedContainer(anchorElement),
      );

      if (canUseAnchor && anchorElement && savedAnchor) {
        const anchorDelta = anchorElement.getBoundingClientRect().top - savedAnchor.viewportTop;
        if (Math.abs(anchorDelta) > SCROLL_RESTORE_TOLERANCE_PX) {
          const targetScrollY = Math.max(0, Math.min(maxScrollY, window.scrollY + anchorDelta));
          window.scrollTo({ top: targetScrollY, behavior: 'auto' });
        }
      } else if (savedPosition !== null) {
        const targetScrollY = Math.min(savedPosition, maxScrollY);
        if (Math.abs(window.scrollY - targetScrollY) > SCROLL_RESTORE_TOLERANCE_PX) {
          window.scrollTo({ top: targetScrollY, behavior: 'auto' });
        }
      }

      frameId = window.requestAnimationFrame(maintainSavedPosition);
    };

    const startSavedPositionRestoration = () => {
      restoringSavedPosition = true;
      window.addEventListener('wheel', stopSavedPositionRestoration, { passive: true });
      window.addEventListener('touchstart', stopSavedPositionRestoration, { passive: true });
      window.addEventListener('pointerdown', stopSavedPositionRestoration, { passive: true });
      window.addEventListener('keydown', stopSavedPositionRestoration);
      restoreWindowId = window.setTimeout(stopSavedPositionRestoration, POP_SCROLL_RESTORE_WINDOW_MS);
      maintainSavedPosition();
    };

    const restore = () => {
      if (cancelled) return;
      attempts += 1;

      if (savedPosition !== null || savedAnchor !== null) {
        startSavedPositionRestoration();
        return;
      }

      if (sectionId) {
        const element = document.getElementById(sectionId);
        if (!element && attempts < MAX_SECTION_RESTORE_ATTEMPTS) {
          frameId = window.requestAnimationFrame(restore);
          return;
        }
        if (element) {
          const headerHeight = sectionId === 'main-content' ? 0 : 64;
          const elementPosition = element.getBoundingClientRect().top + window.scrollY;
          window.scrollTo({
            top: elementPosition - headerHeight,
            behavior: preferredScrollBehavior(),
          });
          return;
        }
      }

      window.scrollTo({ top: 0, behavior: 'auto' });
    };

    if (
      navigationType !== 'POP' &&
      savedPosition === null &&
      savedAnchor === null &&
      !sectionId
    ) {
      window.scrollTo({ top: 0, behavior: 'auto' });
    } else {
      // Restore during the layout phase whenever the destination DOM is already available.
      // Waiting for the next animation frame can expose an incorrect intermediate scroll position.
      restore();
    }

    return () => {
      cancelled = true;
      stopSavedPositionRestoration();
      if (frameId !== 0) window.cancelAnimationFrame(frameId);
    };
  }, [hash, key, navigationType, pathname, search]);

  return null;
};

const App: React.FC = () => (
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
        <ExperienceEnhancements />
        <AppErrorBoundary>
          <Suspense fallback={<PageSkeleton />}>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route
                path="/registration"
                element={SHOW_REGISTRATION_NAV ? <RegistrationPage /> : <Navigate to="/" replace />}
              />
              <Route path="/schedule" element={<SchedulePage />} />
              <Route path="/standings" element={<StandingsPage />} />
              <Route path="/news" element={<NewsPage />} />
              <Route path="/stats" element={<StatsPage />} />
              <Route path="/news/:id" element={<ArticleDetailPage />} />
              <Route path="/teams/:id" element={<TeamPage />} />
              <Route path="/players/:id" element={<PlayerProfileRoute />} />
              <Route path="/matches/:id" element={<MatchPage />} />
              <Route path="/rounds/:seasonId/:league/:round" element={<RoundPage />} />
              <Route path="/media" element={<MediaPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/cup" element={<CupPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Suspense>
        </AppErrorBoundary>
      </main>

      <Footer />
    </div>
  </SeasonProvider>
);

export default App;