import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { initializeAnalytics, trackEvent, trackPageView } from '../services/analytics';

const inferEventName = (element: HTMLElement): string | null => {
  const explicit = element.dataset.analyticsEvent;
  if (explicit) return explicit;

  const anchor = element.closest<HTMLAnchorElement>('a[href]');
  const href = anchor?.href ?? '';
  if (href.includes('forms.gle')) return 'registration_click';
  if (href.includes('drive.google.com')) return 'regulations_click';
  if (href.includes('instagram.com')) return 'instagram_click';
  if (href.includes('youtube.com') || href.includes('youtu.be')) return 'youtube_click';
  if (href.includes('/teams/')) return 'team_view';
  if (href.includes('/news/')) return 'news_read';

  const label = element.textContent?.trim() ?? '';
  if (label.includes('分享比賽')) return 'match_share';
  if (/^20\d{2}\/\d{2}$/.test(label)) return 'season_switch';

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
      trackEvent(eventName, {
        page_path: `${location.pathname}${location.search}`,
        label: tracked.dataset.analyticsLabel ?? tracked.textContent?.trim().slice(0, 80) ?? '',
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
