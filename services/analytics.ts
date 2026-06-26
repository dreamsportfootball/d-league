type AnalyticsParameter = string | number | boolean;
type GtagFunction = (...args: unknown[]) => void;

type ClarityFunction = {
  (...args: unknown[]): void;
  q?: unknown[][];
};

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: GtagFunction;
    clarity?: ClarityFunction;
  }
}

const gaMeasurementId = (import.meta.env.VITE_GA_MEASUREMENT_ID as string | undefined)?.trim();
const clarityProjectId = (import.meta.env.VITE_CLARITY_PROJECT_ID as string | undefined)?.trim();
const analyticsDisabled = import.meta.env.VITE_ANALYTICS_DISABLED === 'true';
const previewPath = window.location.pathname.includes('/preview/');
const analyticsAllowed = !analyticsDisabled && !previewPath;

export const analyticsEnabled = analyticsAllowed && Boolean(gaMeasurementId || clarityProjectId);

let analyticsInitialized = false;

const initializeGoogleAnalytics = (): void => {
  if (!gaMeasurementId || window.gtag) return;

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(gaMeasurementId)}`;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer ?? [];
  window.gtag = (...args: unknown[]) => {
    window.dataLayer?.push(args);
  };
  window.gtag('js', new Date());
  window.gtag('config', gaMeasurementId, { send_page_view: false });
};

const initializeClarity = (): void => {
  if (!clarityProjectId || window.clarity) return;

  const clarityQueue: ClarityFunction = (...args: unknown[]) => {
    clarityQueue.q = clarityQueue.q ?? [];
    clarityQueue.q.push(args);
  };

  window.clarity = clarityQueue;

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.clarity.ms/tag/${encodeURIComponent(clarityProjectId)}`;
  document.head.appendChild(script);
};

export const initializeAnalytics = (): void => {
  if (analyticsInitialized || !analyticsEnabled) return;

  analyticsInitialized = true;
  initializeGoogleAnalytics();
  initializeClarity();
};

export const trackPageView = (path: string, title: string): void => {
  if (!analyticsEnabled) return;

  if (gaMeasurementId && window.gtag) {
    window.gtag('event', 'page_view', {
      page_path: path,
      page_title: title,
      page_location: window.location.href,
    });
  }

  if (clarityProjectId && window.clarity) {
    window.clarity('set', 'page_path', path);
    window.clarity('set', 'page_title', title);
    window.clarity('event', 'spa_page_view');
  }
};

export const trackEvent = (
  eventName: string,
  parameters: Record<string, AnalyticsParameter> = {},
): void => {
  if (!analyticsEnabled) return;

  if (gaMeasurementId && window.gtag) {
    window.gtag('event', eventName, parameters);
  }

  if (clarityProjectId && window.clarity) {
    window.clarity('event', eventName);
  }
};
