import React, { useEffect, useState } from 'react';

interface SiteMetrics {
  totalViews: number | null;
  updatedAt: string | null;
}

const formatViews = (value: number): string => new Intl.NumberFormat('zh-TW').format(value);

const SiteViewCount: React.FC = () => {
  const [totalViews, setTotalViews] = useState<number | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    const loadMetrics = async (): Promise<void> => {
      try {
        const response = await fetch(`${import.meta.env.BASE_URL}data/site-metrics.json`, {
          cache: 'no-store',
          signal: controller.signal,
        });

        if (!response.ok) return;

        const metrics = (await response.json()) as SiteMetrics;
        if (
          typeof metrics.totalViews === 'number' &&
          Number.isFinite(metrics.totalViews) &&
          metrics.totalViews >= 0
        ) {
          setTotalViews(metrics.totalViews);
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return;
      }
    };

    void loadMetrics();
    return () => controller.abort();
  }, []);

  return (
    <div className="border-y border-neutral-200 bg-white px-4 py-4 text-center md:px-6">
      <p className="text-xs font-medium tracking-wide text-neutral-500">
        累計瀏覽次數
        <span className="ml-2 font-display text-sm font-bold tabular-nums text-brand-black">
          {totalViews === null ? '—' : formatViews(totalViews)}
        </span>
      </p>
    </div>
  );
};

export default SiteViewCount;
