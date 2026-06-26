type AnalyticsParameter = string | number | boolean;
type GtagFunction = (...args: unknown[]) => void;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: GtagFunction;
  }
}

const measurementId = (import.meta.env.VITE_GA_MEASUREMENT_ID as string | undefined)?.trim();
const analyticsDisabled = import.meta.env.VITE_ANALYTICS_DISABLED === 'true';
const previewPath = window.location.pathname.includes('/preview/');
const analyticsAllowed = !analyticsDisabled && !previewPath;

export const analyticsEnabled = analyticsAllowed && Boolean(measurementId);

let analyticsInitialized = false;

export const initializeAnalytics = (): void => {
  if (analyticsInitialized || !analyticsEnabled || !measurementId || window.gtag) return;

  analyticsInitialized = true;

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer ?? [];
  window.gtag = (...args: unknown[]) => {
    window.dataLayer?.push(args);
  };
  window.gtag('js', new Date());
  window.gtag('config', measurementId, { send_page_view: false });
};

export const trackPageView = (path: string, title: string): void => {
  if (!analyticsEnabled || !window.gtag) return;

  window.gtag('event', 'page_view', {
    page_path: path,
    page_title: title,
    page_location: window.location.href,
  });
};

export const trackEvent = (
  eventName: string,
  parameters: Record<string, AnalyticsParameter> = {},
): void => {
  if (!analyticsEnabled || !window.gtag) return;
  window.gtag('event', eventName, parameters);
};
