import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { initializeAnalytics, trackEvent, trackPageView } from '../services/analytics';

const Analytics: React.FC = () => {
  const location = useLocation();

  useEffect(() => {
    initializeAnalytics();

    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      const tracked = target?.closest<HTMLElement>('[data-analytics-event]');
      if (!tracked) return;

      const eventName = tracked.dataset.analyticsEvent;
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
