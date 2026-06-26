import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { initializeAnalytics, trackEvent, trackPageView } from '../services/analytics';

const getAnchor = (element: HTMLElement): HTMLAnchorElement | null =>
  element.closest<HTMLAnchorElement>('a[href]');

const getDestination = (anchor: HTMLAnchorElement | null): string => {
  if (!anchor) return '';

  try {
    const url = new URL(anchor.href, window.location.href);
    return url.origin === window.location.origin
      ? `${url.pathname}${url.search}${url.hash}`
      : `${url.origin}${url.pathname}`;
  } catch {
    return anchor.getAttribute('href') ?? '';
  }
};

const inferPlacement = (element: HTMLElement): string => {
  const explicitPlacement = element.closest<HTMLElement>('[data-analytics-placement]')?.dataset.analyticsPlacement;
  if (explicitPlacement) return explicitPlacement;
  if (element.closest('header')) {
    return window.matchMedia('(min-width: 1280px)').matches ? 'header_desktop' : 'header_mobile';
  }
  if (element.closest('footer')) return 'footer';
  if (element.closest('main')) return 'page_content';
  return 'site';
};

const inferEventName = (element: HTMLElement): string | null => {
  const explicit = element.dataset.analyticsEvent;
  if (explicit) return explicit;

  const anchor = getAnchor(element);
  const href = anchor?.href ?? '';

  if (href.includes('forms.gle') || href.includes('docs.google.com/forms')) return 'registration_click';
  if (href.includes('drive.google.com')) return 'regulations_click';
  if (href.includes('instagram.com')) return 'instagram_click';
  if (href.includes('youtube.com') || href.includes('youtu.be')) return 'youtube_click';
  if (href.includes('/registration')) return 'registration_nav_click';
  if (href.includes('/teams/')) return 'team_view';
  if (href.includes('/news/')) return 'news_read';

  const label = element.textContent?.trim() ?? '';
  if (label.includes('分享比賽')) return 'match_share';
  if (/^20\d{2}\/\d{2}$/.test(label)) return 'season_switch';

  if (anchor && (element.closest('header') || element.closest('footer'))) {
    return 'navigation_click';
  }

  return null;
};

const Analytics: React.FC = () => {
  const location = useLocation();

  useEffect(() => {
    initializeAnalytics();

    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;

      const tracked = target.closest<HTMLElement>('[data-analytics-event], a[href], button');
      if (!tracked) return;

      const eventName = inferEventName(tracked);
      if (!eventName) return;

      const anchor = getAnchor(tracked);
      const label = tracked.dataset.analyticsLabel ?? tracked.textContent?.trim().slice(0, 100) ?? '';

      trackEvent(eventName, {
        page_path: `${location.pathname}${location.search}`,
        page_title: document.title,
        placement: inferPlacement(tracked),
        label,
        destination: getDestination(anchor),
      });
    };

    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [location.pathname, location.search]);

  useEffect(() => {
    trackPageView(`${location.pathname}${location.search}`, document.title);
  }, [location.pathname, location.search]);

  return null;
};

export default Analytics;
