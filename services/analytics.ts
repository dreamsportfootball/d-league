declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID as string | undefined;

export const analyticsEnabled = Boolean(measurementId);

export const initializeAnalytics = (): void => {
  if (!measurementId || window.gtag) return;

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
  if (!measurementId || !window.gtag) return;
  window.gtag('event', 'page_view', {
    page_path: path,
    page_title: title,
  });
};

export const trackEvent = (
  eventName: string,
  parameters: Record<string, string | number | boolean> = {},
): void => {
  if (!measurementId || !window.gtag) return;
  window.gtag('event', eventName, parameters);
};
