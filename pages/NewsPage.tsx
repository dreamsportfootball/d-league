import React, { useMemo, useState } from 'react';
import { ArrowRight, ChevronDown, Newspaper } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getSeasonConfig } from '../config/seasons';
import { getAllNews } from '../services/seasonDataJson';
import type { NewsArticle } from '../types';
import { formatTaipeiDate } from '../utils/dateFormat';

type NewsFilter = 'ALL' | 'Match Report' | 'Official';

const NEWS_BATCH_SIZE = 9;

const CATEGORY_MAP: Record<NewsArticle['category'], string> = {
  'Match Report': '賽事戰報',
  Official: '官方公告',
};

const TAG_COLOR_MAP: Record<NewsArticle['category'], string> = {
  'Match Report': 'bg-brand-accent text-brand-black',
  Official: 'bg-brand-blue text-white',
};

const getArticleSeasonLabel = (article: NewsArticle): string | null =>
  article.seasonId ? getSeasonConfig(article.seasonId).shortName : null;

const MinimalNewsCard: React.FC<{ article: NewsArticle }> = ({ article }) => {
  const seasonLabel = getArticleSeasonLabel(article);

  return (
    <Link to={`/news/${article.id}`} className="group flex h-full cursor-pointer flex-col">
      <div className="relative mb-5 aspect-[16/10] overflow-hidden rounded-lg bg-neutral-100">
        {article.imageUrl ? (
          <img
            src={article.imageUrl}
            alt={article.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-neutral-100">
            <Newspaper className="h-10 w-10 text-neutral-300" aria-hidden="true" />
          </div>
        )}
        <div className="absolute inset-0 bg-white/0 transition-colors duration-300 group-hover:bg-white/10" />
      </div>

      <div className="flex flex-1 flex-col">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <span
              className={`inline-flex shrink-0 items-center justify-center rounded-sm px-2 py-1 text-[10px] font-bold uppercase leading-none tracking-[0.15em] ${TAG_COLOR_MAP[article.category]}`}
            >
              {CATEGORY_MAP[article.category]}
            </span>
            {seasonLabel && (
              <span className="truncate text-[10px] font-black uppercase tracking-[0.15em] text-brand-blue">
                {seasonLabel}
              </span>
            )}
          </div>
          <span className="shrink-0 font-mono text-[11px] text-neutral-400">
            {formatTaipeiDate(article.timestamp)}
          </span>
        </div>

        <h3 className="mb-2 line-clamp-2 font-display text-lg font-bold leading-snug text-neutral-900 transition-colors group-hover:text-brand-blue">
          {article.title}
        </h3>

        <p className="mb-4 line-clamp-2 text-xs leading-normal text-neutral-500">
          {article.summary}
        </p>

        <div className="group/btn mt-auto flex items-center pt-2 text-xs font-bold uppercase tracking-widest text-brand-blue">
          <span className="mr-2 decoration-2 underline-offset-4 group-hover/btn:underline">查看內容</span>
          <ArrowRight className="h-3 w-3 transition-transform duration-300 group-hover/btn:translate-x-1" />
        </div>
      </div>
    </Link>
  );
};

const NewsPage: React.FC = () => {
  const [activeFilter, setActiveFilter] = useState<NewsFilter>(() => {
    try {
      const saved = window.sessionStorage.getItem('newsActiveFilter');
      return saved === 'ALL' || saved === 'Match Report' || saved === 'Official'
        ? saved
        : 'ALL';
    } catch {
      return 'ALL';
    }
  });
  const [visibleCount, setVisibleCount] = useState(() => {
    try {
      const saved = Number.parseInt(window.sessionStorage.getItem('newsVisibleCount') ?? '', 10);
      return Number.isFinite(saved) && saved >= NEWS_BATCH_SIZE ? saved : NEWS_BATCH_SIZE;
    } catch {
      return NEWS_BATCH_SIZE;
    }
  });

  const sortedNews = useMemo(
    () =>
      getAllNews().sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      ),
    [],
  );

  const filteredNews = useMemo(
    () =>
      activeFilter === 'ALL'
        ? sortedNews
        : sortedNews.filter((article) => article.category === activeFilter),
    [activeFilter, sortedNews],
  );
  const visibleNews = filteredNews.slice(0, visibleCount);
  const hasMoreNews = visibleNews.length < filteredNews.length;

  const updateFilter = (filter: NewsFilter) => {
    setActiveFilter(filter);
    setVisibleCount(NEWS_BATCH_SIZE);
    try {
      window.sessionStorage.setItem('newsActiveFilter', filter);
      window.sessionStorage.setItem('newsVisibleCount', String(NEWS_BATCH_SIZE));
    } catch {
      // Session storage may be unavailable.
    }
  };

  const loadMoreNews = () => {
    const nextCount = Math.min(visibleCount + NEWS_BATCH_SIZE, filteredNews.length);
    setVisibleCount(nextCount);
    try {
      window.sessionStorage.setItem('newsVisibleCount', String(nextCount));
    } catch {
      // Session storage may be unavailable.
    }
  };

  const newsFilters: { key: NewsFilter; label: string }[] = [
    { key: 'ALL', label: '全部消息' },
    { key: 'Match Report', label: '賽事戰報' },
    { key: 'Official', label: '官方公告' },
  ];

  return (
    <div className="min-h-[80vh] bg-white pb-24 pt-6 md:pt-24">
      <div className="container mx-auto max-w-7xl px-4 md:px-12">
        <div className="mb-8 border-b border-neutral-100 pb-8 md:mb-12">
          <h1 className="mb-3 font-display text-4xl font-black uppercase tracking-tight text-brand-black [-webkit-text-stroke:.25px_currentColor] md:text-6xl md:font-extrabold md:[-webkit-text-stroke:0px]">
            最新 <span className="text-brand-blue">消息</span>
          </h1>
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-neutral-400 md:text-base">
            D LEAGUE 賽事戰報與官方公告
          </p>
        </div>

        <div className="mb-10 flex flex-wrap gap-x-6 gap-y-3 border-b border-neutral-100">
          {newsFilters.map((filter) => (
            <button
              key={filter.key}
              type="button"
              onClick={() => updateFilter(filter.key)}
              className={`relative min-h-11 border-b-2 pb-3 text-sm font-bold uppercase tracking-widest transition-all duration-300 ${
                activeFilter === filter.key
                  ? 'border-brand-blue text-brand-black'
                  : 'border-transparent text-neutral-400 hover:text-neutral-600'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {filteredNews.length > 0 ? (
          <>
            <div className="grid grid-cols-1 gap-x-10 gap-y-16 md:grid-cols-2 lg:grid-cols-3" aria-live="polite">
              {visibleNews.map((article) => (
                <MinimalNewsCard key={`${article.seasonId ?? 'global'}-${article.id}`} article={article} />
              ))}
            </div>

            {hasMoreNews && (
              <div className="mt-16 flex justify-center border-t border-neutral-100 pt-8">
                <button
                  type="button"
                  onClick={loadMoreNews}
                  className="inline-flex min-h-12 items-center justify-center border border-neutral-300 bg-white px-7 text-sm font-black tracking-wide text-brand-black transition-colors hover:border-brand-blue hover:text-brand-blue"
                >
                  載入更多消息
                  <ChevronDown className="ml-2 h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="flex min-h-[360px] flex-col items-center justify-center border border-dashed border-neutral-300 bg-neutral-50 px-6 py-16 text-center">
            <Newspaper className="mb-4 h-10 w-10 text-neutral-300" aria-hidden="true" />
            <h2 className="font-display text-2xl font-black uppercase tracking-wide text-brand-black">
              目前尚無相關消息
            </h2>
            <p className="mt-3 text-sm font-medium text-neutral-500">
              最新公告與賽事戰報將於主辦單位公布後更新
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NewsPage;
